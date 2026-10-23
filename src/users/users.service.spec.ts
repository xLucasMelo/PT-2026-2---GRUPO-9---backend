import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    store: {
      count: jest.Mock;
    };
  };

  const mockUser = {
    id: 1,
    name: 'João Silva',
    username: 'joaosilva',
    email: 'joao.silva@exemplo.com',
    passwordHash: '$2b$10$hashedpassword',
    profilePictureUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      store: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar um novo usuário com senha hasheada', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.create({
        name: 'João Silva',
        username: 'joaosilva',
        email: 'joao.silva@exemplo.com',
        password: 'Password123',
      });

      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.id).toBe(1);
      expect(result.email).toBe('joao.silva@exemplo.com');
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('deve lançar ConflictException se o e-mail já existir', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);

      await expect(
        service.create({
          name: 'João Silva',
          username: 'outro_user',
          email: 'joao.silva@exemplo.com',
          password: 'Password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('deve lançar ConflictException se o username já existir', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);

      await expect(
        service.create({
          name: 'Outro Nome',
          username: 'joaosilva',
          email: 'outro@exemplo.com',
          password: 'Password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('deve retornar o usuário quando existir', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById(1);
      expect(result.id).toBe(1);
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('deve lançar NotFoundException quando o usuário não existir', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePassword', () => {
    it('deve alterar a senha quando a senha atual estiver correta', async () => {
      const realHash = await bcrypt.hash('SenhaAntiga123', 10);
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: realHash,
      });
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.updatePassword(1, {
        currentPassword: 'SenhaAntiga123',
        newPassword: 'NovaSenha123',
        confirmNewPassword: 'NovaSenha123',
      });

      expect(result.message).toContain('sucesso');
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException quando a senha atual for inválida', async () => {
      const realHash = await bcrypt.hash('SenhaAntiga123', 10);
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: realHash,
      });

      await expect(
        service.updatePassword(1, {
          currentPassword: 'SenhaIncorreta123',
          newPassword: 'NovaSenha123',
          confirmNewPassword: 'NovaSenha123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('delete', () => {
    it('deve bloquear exclusão com BadRequestException se o usuário tiver lojas ativas', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.store.count.mockResolvedValue(2);

      await expect(service.delete(1)).rejects.toThrow(BadRequestException);
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('deve excluir o usuário com sucesso se não tiver lojas vinculadas', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.store.count.mockResolvedValue(0);
      prisma.user.delete.mockResolvedValue(mockUser);

      await service.delete(1);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
