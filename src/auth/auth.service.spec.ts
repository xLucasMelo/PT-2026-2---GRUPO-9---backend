import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    create: jest.Mock;
    findByEmailWithPassword: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
  };
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    passwordReset: {
      updateMany: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let mailService: {
    sendPasswordResetCode: jest.Mock;
  };

  const mockUser = {
    id: 1,
    name: 'João Silva',
    username: 'joaosilva',
    email: 'joao.silva@exemplo.com',
    passwordHash: '',
    profilePictureUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockUser.passwordHash = await bcrypt.hash('SenhaCorreta123', 10);

    usersService = {
      create: jest.fn(),
      findByEmailWithPassword: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    };

    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      passwordReset: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue([mockUser, {}]),
    };

    mailService = {
      sendPasswordResetCode: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('deve cadastrar um novo usuário e retornar mensagem com perfil (US01, US03, US06)', async () => {
      usersService.create.mockResolvedValue({
        id: 1,
        name: 'João Silva',
        username: 'joaosilva',
        email: 'joao.silva@exemplo.com',
      });

      const result = await service.register({
        name: 'João Silva',
        username: 'joaosilva',
        email: 'joao.silva@exemplo.com',
        password: 'SenhaForte123',
        passwordConfirmation: 'SenhaForte123',
      });

      expect(usersService.create).toHaveBeenCalled();
      expect(result.message).toContain('sucesso');
      expect(result.user.id).toBe(1);
    });
  });

  describe('login', () => {
    it('deve autenticar usuário com credenciais corretas e retornar accessToken (US02, US07)', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'joao.silva@exemplo.com',
        password: 'SenhaCorreta123',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('joao.silva@exemplo.com');
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('deve lançar UnauthorizedException em caso de senha incorreta (US04, US07)', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(mockUser);

      await expect(
        service.login({
          email: 'joao.silva@exemplo.com',
          password: 'SenhaIncorreta123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se o e-mail não existir (US04, US07)', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'inexistente@exemplo.com',
          password: 'SenhaCorreta123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('deve gerar código de recuperação e invocar MailService (US08)', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.passwordReset.create.mockResolvedValue({ id: 1 });

      const result = await service.forgotPassword({
        email: 'joao.silva@exemplo.com',
      });

      expect(prisma.passwordReset.updateMany).toHaveBeenCalled();
      expect(prisma.passwordReset.create).toHaveBeenCalled();
      expect(mailService.sendPasswordResetCode).toHaveBeenCalled();
      expect(result.message).toContain('código de recuperação');
    });
  });

  describe('resetPassword', () => {
    it('deve redefinir senha com sucesso quando o código for válido (US09)', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.passwordReset.findFirst.mockResolvedValue({
        id: 1,
        code: '123456',
        userId: 1,
        used: false,
        expiresAt: new Date(Date.now() + 10000),
      });

      const result = await service.resetPassword({
        email: 'joao.silva@exemplo.com',
        code: '123456',
        newPassword: 'NovaSenhaForte123',
        confirmNewPassword: 'NovaSenhaForte123',
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.message).toContain('sucesso');
    });

    it('deve lançar BadRequestException se o código for inválido ou expirado (US09)', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.passwordReset.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          email: 'joao.silva@exemplo.com',
          code: '000000',
          newPassword: 'NovaSenhaForte123',
          confirmNewPassword: 'NovaSenhaForte123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar NotFoundException se o e-mail não existir ao redefinir (US09)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          email: 'inexistente@exemplo.com',
          code: '123456',
          newPassword: 'NovaSenhaForte123',
          confirmNewPassword: 'NovaSenhaForte123',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
