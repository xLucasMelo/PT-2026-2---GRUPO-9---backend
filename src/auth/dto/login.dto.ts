import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'joao.silva@exemplo.com',
    description: 'E-mail cadastrado (US07)',
  })
  @IsEmail({}, { message: 'Informe um endereço de e-mail válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string;

  @ApiProperty({
    example: 'SenhaForte123',
    description: 'Senha de acesso (US07)',
  })
  @IsString({ message: 'A senha deve ser um texto' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  password: string;
}
