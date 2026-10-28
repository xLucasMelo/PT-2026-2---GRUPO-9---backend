import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Match } from '../../common/decorators/match.decorator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'joao.silva@exemplo.com',
    description: 'E-mail do usuário solicitante (US09)',
  })
  @IsEmail({}, { message: 'Informe um endereço de e-mail válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Código de verificação de 6 dígitos recebido (US09)',
  })
  @IsString({ message: 'O código de verificação deve ser um texto' })
  @IsNotEmpty({ message: 'O código de verificação é obrigatório' })
  @Length(6, 6, { message: 'O código de verificação deve conter exatamente 6 dígitos' })
  code: string;

  @ApiProperty({
    example: 'NovaSenhaForte123',
    description: 'Nova senha com maiúscula, minúscula, número e mín. 8 caracteres (US09)',
  })
  @IsString({ message: 'A nova senha deve ser um texto' })
  @IsNotEmpty({ message: 'A nova senha é obrigatória' })
  @Length(8, 100, { message: 'A nova senha deve conter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'A nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número',
  })
  newPassword: string;

  @ApiProperty({
    example: 'NovaSenhaForte123',
    description: 'Confirmação da nova senha (deve ser idêntica) (US09)',
  })
  @IsString({ message: 'A confirmação de senha deve ser um texto' })
  @IsNotEmpty({ message: 'A confirmação da nova senha é obrigatória' })
  @Match('newPassword', {
    message: 'A confirmação deve ser idêntica à nova senha',
  })
  confirmNewPassword: string;
}
