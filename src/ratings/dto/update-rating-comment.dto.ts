import { PartialType } from '@nestjs/mapped-types';
import { CreateRatingCommentDto } from './create-rating-comment.dto';

export class UpdateRatingCommentDto extends PartialType(
  CreateRatingCommentDto,
  { skipNullProperties: false },
) {}
