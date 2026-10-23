import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    message: string;
    user: UserResponseDto;
  }> {
    const user = await this.usersService.create({
      name: registerDto.name,
      username: registerDto.username,
      email: registerDto.email,
      password: registerDto.password,
      profilePictureUrl: registerDto.profilePictureUrl,
    });

    return {
      message:
        'Cadastro realizado com sucesso. Redirecionando para a tela de login.',
      user,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const normalizedEmail = loginDto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmailWithPassword(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: new UserResponseDto(user),
    };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const normalizedEmail = forgotPasswordDto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Para evitar enumeração de e-mails em produção, retorna mensagem genérica
      return {
        message:
          'Se o e-mail informado estiver cadastrado, o código de recuperação foi enviado.',
      };
    }

    // Código numérico de 6 dígitos criptograficamente seguro
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Invalida solicitações anteriores pendentes
    await this.prisma.passwordReset.updateMany({
      where: {
        userId: user.id,
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Salva o novo código
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
        used: false,
      },
    });

    // Envia o e-mail ou exibe no console em dev
    await this.mailService.sendPasswordResetCode(user.email, code);

    return {
      message:
        'Se o e-mail informado estiver cadastrado, o código de recuperação foi enviado.',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const normalizedEmail = resetPasswordDto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const resetRecord = await this.prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
        code: resetPasswordDto.code.trim(),
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!resetRecord) {
      throw new BadRequestException(
        'Código de recuperação inválido ou expirado.',
      );
    }

    const newPasswordHash = await bcrypt.hash(
      resetPasswordDto.newPassword,
      this.saltRounds,
    );

    // Atualiza a senha e marca o código como utilizado
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
    ]);

    return {
      message:
        'Senha redefinida com sucesso. Faça login com suas novas credenciais.',
    };
  }
}
