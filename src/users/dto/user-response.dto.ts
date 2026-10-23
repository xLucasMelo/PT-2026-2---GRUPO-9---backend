import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'ID único do usuário' })
  id: number;

  @ApiProperty({ example: 'joaosilva', description: 'Nome de usuário' })
  username: string;

  @ApiProperty({ example: 'João da Silva', description: 'Nome completo' })
  name: string;

  @ApiProperty({ example: 'joao.silva@exemplo.com', description: 'E-mail cadastrado' })
  email: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/fotos/perfil.jpg',
    description: 'URL da foto de perfil',
    nullable: true,
  })
  profilePictureUrl: string | null;

  @ApiProperty({ example: '2026-10-22T20:00:00.000Z', description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({
    example: '2026-10-22T20:00:00.000Z',
    description: 'Data da última atualização',
  })
  updatedAt: Date;

  @Exclude()
  passwordHash?: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
    delete this.passwordHash;
  }
}
