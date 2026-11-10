import {Body,Controller,Delete,Get,Param,ParseIntPipe,Patch,Post,UseGuards,} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateRatingCommentDto } from './dto/create-rating-comment.dto';
import { CreateStoreRatingDto } from './dto/create-store-rating.dto';
import { UpdateRatingCommentDto } from './dto/update-rating-comment.dto';
import { UpdateStoreRatingDto } from './dto/update-store-rating.dto';
import { RatingsService } from './ratings.service';

@ApiTags('store-ratings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stores/:storeId/ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  createStoreRating(
    @Param('storeId', ParseIntPipe) storeId: number,
    @CurrentUser('id') userId: number,
    @Body() createStoreRatingDto: CreateStoreRatingDto,
  ) {
    return this.ratingsService.createStoreRating(
      storeId,
      userId,
      createStoreRatingDto,
    );
  }

  @Get()
  findStoreRatings(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.ratingsService.findStoreRatings(storeId);
  }

  @Get(':ratingId')
  findStoreRating(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('ratingId', ParseIntPipe) ratingId: number,
  ) {
    return this.ratingsService.findStoreRating(storeId, ratingId);
  }

  @Patch(':ratingId')
  updateStoreRating(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('ratingId', ParseIntPipe) ratingId: number,
    @CurrentUser('id') userId: number,
    @Body() updateStoreRatingDto: UpdateStoreRatingDto,
  ) {
    return this.ratingsService.updateStoreRating(
      storeId,
      ratingId,
      userId,
      updateStoreRatingDto,
    );
  }

  @Delete(':ratingId')
  removeStoreRating(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('ratingId', ParseIntPipe) ratingId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.ratingsService.removeStoreRating(storeId, ratingId, userId);
  }

  @Get(':ratingId/comments')
  findRatingComments(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('ratingId', ParseIntPipe) ratingId: number,
  ) {
    return this.ratingsService.findRatingComments(storeId, ratingId);
  }

  @Post(':ratingId/comments')
  createRatingComment(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('ratingId', ParseIntPipe) ratingId: number,
    @CurrentUser('id') userId: number,
    @Body() createRatingCommentDto: CreateRatingCommentDto,
  ) {
    return this.ratingsService.createRatingComment(
      storeId,
      ratingId,
      userId,
      createRatingCommentDto,
    );
  }

  @Patch(':ratingId/comments/:commentId')
  updateRatingComment(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('ratingId', ParseIntPipe) ratingId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @CurrentUser('id') userId: number,
    @Body() updateRatingCommentDto: UpdateRatingCommentDto,
  ) {
    return this.ratingsService.updateRatingComment(
      storeId,
      ratingId,
      commentId,
      userId,
      updateRatingCommentDto,
    );
  }

  @Delete(':ratingId/comments/:commentId')
  removeRatingComment(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('ratingId', ParseIntPipe) ratingId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.ratingsService.removeRatingComment(
      storeId,
      ratingId,
      commentId,
      userId,
    );
  }
}
