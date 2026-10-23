import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { Match } from '../../common/decorators/match.decorator';

export class UpdatePasswordDto {
  @ApiProperty({ example: 'SenhaAtual123', description: 'Senha atual da conta' })
  @IsString({ message: 'A senha atual deve ser um texto' })
  @IsNotEmpty({ message: 'A senha atual é obrigatória' })
  currentPassword: string;

  @ApiProperty({
    example: 'NovaSenha456',
    description:
      'Nova senha com no mínimo 8 caracteres, contendo maiúscula, minúscula e número',
  })
  @IsString({ message: 'A nova senha deve ser um texto' })
  @IsNotEmpty({ message: 'A nova senha é obrigatória' })
  @Length(8, 100, { message: 'A nova senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'A nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número',
  })
  newPassword: string;

  @ApiProperty({
    example: 'NovaSenha456',
    description: 'Confirmação da nova senha (deve ser idêntica)',
  })
  @IsString({ message: 'A confirmação de senha deve ser um texto' })
  @IsNotEmpty({ message: 'A confirmação de nova senha é obrigatória' })
  @Match('newPassword', {
    message: 'A confirmação de senha deve ser idêntica à nova senha',
  })
  confirmNewPassword: string;
}
