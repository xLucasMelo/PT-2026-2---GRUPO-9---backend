import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  private readonly saltRounds = 10;

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const normalizedEmail = createUserDto.email.trim().toLowerCase();
    const normalizedUsername = createUserDto.username.trim();

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username: normalizedUsername },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === normalizedEmail) {
        throw new ConflictException(
          'Já existe um usuário cadastrado com este e-mail.',
        );
      }
      if (existingUser.username === normalizedUsername) {
        throw new ConflictException(
          'Este nome de usuário já está em uso.',
        );
      }
    }

    const passwordHash = await bcrypt.hash(
      createUserDto.password,
      this.saltRounds,
    );

    const createdUser = await this.prisma.user.create({
      data: {
        name: createUserDto.name.trim(),
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
        profilePictureUrl: createUserDto.profilePictureUrl,
      },
    });

    return new UserResponseDto(createdUser);
  }

  async findById(id: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    return new UserResponseDto(user);
  }

  async findByEmailWithPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    return this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
  }

  async findPublicProfile(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        profilePictureUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    await this.findById(id);

    if (updateUserDto.username) {
      const normalizedUsername = updateUserDto.username.trim();
      const existingUser = await this.prisma.user.findFirst({
        where: {
          username: normalizedUsername,
          NOT: { id },
        },
      });

      if (existingUser) {
        throw new ConflictException('Este nome de usuário já está em uso.');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(updateUserDto.name && { name: updateUserDto.name.trim() }),
        ...(updateUserDto.username && {
          username: updateUserDto.username.trim(),
        }),
        ...(updateUserDto.profilePictureUrl !== undefined && {
          profilePictureUrl: updateUserDto.profilePictureUrl,
        }),
      },
    });

    return new UserResponseDto(updatedUser);
  }

  async updatePassword(
    id: number,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('A senha atual informada está incorreta.');
    }

    const newPasswordHash = await bcrypt.hash(
      updatePasswordDto.newPassword,
      this.saltRounds,
    );

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Senha atualizada com sucesso.' };
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);

    // Validação de integridade referencial: lojas ativas
    const storesCount = await this.prisma.store.count({
      where: { userId: id },
    });

    if (storesCount > 0) {
      throw new BadRequestException(
        `Não é possível excluir a conta pois o usuário possui ${storesCount} loja(s) vinculada(s). Exclua ou transfira suas lojas antes de remover a conta.`,
      );
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

  async findAll(query: QueryUsersDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where = query.search
      ? {
          OR: [
            {
              name: {
                contains: query.search.trim(),
                mode: 'insensitive' as const,
              },
            },
            {
              username: {
                contains: query.search.trim(),
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: users.map((u) => new UserResponseDto(u)),
    };
  }
}
