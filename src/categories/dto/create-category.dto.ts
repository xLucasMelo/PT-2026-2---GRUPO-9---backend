import { Transform } from 'class-transformer';
import {IsInt,IsNotEmpty,IsOptional,IsString,IsPositive,} from 'class-validator';

export class CreateCategoryDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  name: string;

  @Transform(({ value }) =>
    value === undefined || value === null ? value : Number(value),
  )
  @IsOptional()
  @IsInt()
  @IsPositive()
  parentCategoryId?: number | null;
}
