import { Transform } from 'class-transformer';
import {IsInt,IsNotEmpty,IsNumber,IsOptional,IsPositive,IsString,Max,Min,ValidateIf,} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Transform(({ value }) =>
    value === undefined || value === null ? value : Number(value),
  )
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(999999.99)
  price: number;

  @Transform(({ value }) =>
    value === undefined || value === null ? value : Number(value),
  )
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(0)
  stock?: number;

  @Transform(({ value }) =>
    value === undefined || value === null ? value : Number(value),
  )
  @IsInt()
  @IsPositive()
  categoryId: number;

  @Transform(({ value }) =>
    value === undefined || value === null ? value : Number(value),
  )
  @IsInt()
  @IsPositive()
  storeId: number;
}
