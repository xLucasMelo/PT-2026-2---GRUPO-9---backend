import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Length, Matches } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'João Pedro da Silva', description: 'Nome completo' })
  @IsOptional()
  @IsString({ message: 'O nome deve ser um texto' })
  @Length(2, 100, { message: 'O nome deve ter entre 2 e 100 caracteres' })
  name?: string;

  @ApiPropertyOptional({ example: 'joaopedro', description: 'Novo nome de usuário' })
  @IsOptional()
  @IsString({ message: 'O nome de usuário deve ser um texto' })
  @Matches(/^[a-zA-Z0-9_-]{3,30}$/, {
    message:
      'O nome de usuário deve conter de 3 a 30 caracteres alfanuméricos, hífen ou underline',
  })
  username?: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/fotos/perfil-novo.jpg',
    description: 'URL da nova foto de perfil',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A foto de perfil deve ser uma URL válida' })
  profilePictureUrl?: string;
}
