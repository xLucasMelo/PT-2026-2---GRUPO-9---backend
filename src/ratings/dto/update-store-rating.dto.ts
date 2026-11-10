import { PartialType } from '@nestjs/mapped-types';
import { CreateStoreRatingDto } from './create-store-rating.dto';

export class UpdateStoreRatingDto extends PartialType(CreateStoreRatingDto, {
  skipNullProperties: false,
}) {}
