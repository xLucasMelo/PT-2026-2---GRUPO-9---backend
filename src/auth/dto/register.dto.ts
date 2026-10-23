import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';
import { Match } from '../../common/decorators/match.decorator';

export class RegisterDto {
  @ApiProperty({
    example: 'João da Silva',
    description: 'Nome completo do usuário (US06)',
  })
  @IsString({ message: 'O nome completo deve ser um texto' })
  @IsNotEmpty({ message: 'O nome completo é obrigatório' })
  @Length(2, 100, { message: 'O nome deve ter entre 2 e 100 caracteres' })
  name: string;

  @ApiProperty({
    example: 'joaosilva',
    description: 'Nome de usuário único no sistema (US06)',
  })
  @IsString({ message: 'O nome de usuário deve ser um texto' })
  @IsNotEmpty({ message: 'O nome de usuário é obrigatório' })
  @Matches(/^[a-zA-Z0-9_-]{3,30}$/, {
    message:
      'O nome de usuário deve conter de 3 a 30 caracteres alfanuméricos, hífen ou underline',
  })
  username: string;

  @ApiProperty({
    example: 'joao.silva@exemplo.com',
    description: 'Endereço de e-mail (US06)',
  })
  @IsEmail({}, { message: 'Informe um endereço de e-mail válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string;

  @ApiProperty({
    example: 'SenhaForte123',
    description:
      'Senha com no mínimo 8 caracteres, contendo maiúscula, minúscula e número (US06)',
  })
  @IsString({ message: 'A senha deve ser um texto' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @Length(8, 100, { message: 'A senha deve conter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número',
  })
  password: string;

  @ApiProperty({
    example: 'SenhaForte123',
    description: 'Confirmação idêntica da senha (US06)',
  })
  @IsString({ message: 'A confirmação de senha deve ser um texto' })
  @IsNotEmpty({ message: 'A confirmação de senha é obrigatória' })
  @Match('password', {
    message: 'A confirmação de senha deve ser idêntica à senha informada',
  })
  passwordConfirmation: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/fotos/perfil.jpg',
    description: 'URL opcional da foto de perfil',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A foto de perfil deve ser uma URL válida' })
  profilePictureUrl?: string;
}
