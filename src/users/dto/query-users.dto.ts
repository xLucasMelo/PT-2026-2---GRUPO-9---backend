import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryUsersDto {
  @ApiPropertyOptional({ example: 1, description: 'Número da página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A página deve ser um número inteiro' })
  @Min(1, { message: 'A página deve ser maior ou igual a 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Itens por página',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O limite deve ser um número inteiro' })
  @Min(1, { message: 'O limite mínimo é 1' })
  @Max(100, { message: 'O limite máximo é 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'silva',
    description: 'Termo de busca por nome ou username',
  })
  @IsOptional()
  @IsString({ message: 'O termo de busca deve ser um texto' })
  search?: string;
}
