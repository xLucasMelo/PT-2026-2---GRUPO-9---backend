import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateStoreRatingDto {
  @Transform(({ value }) =>
    value === undefined || value === null ? value : Number(value),
  )
  @IsInt()
  @Min(0)
  @Max(5)
  rating: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  comment?: string | null;
}
