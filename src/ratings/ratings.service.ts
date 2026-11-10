import {BadRequestException,ConflictException,ForbiddenException,Injectable,NotFoundException,} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingCommentDto } from './dto/create-rating-comment.dto';
import { CreateStoreRatingDto } from './dto/create-store-rating.dto';
import { UpdateRatingCommentDto } from './dto/update-rating-comment.dto';
import { UpdateStoreRatingDto } from './dto/update-store-rating.dto';

@Injectable()
export class RatingsService {
  private readonly publicUserSelect = {
    id: true,
    username: true,
    name: true,
    profilePictureUrl: true,
  } as const;

  private readonly ratingInclude = {
    user: { select: this.publicUserSelect },
    store: { select: { id: true, name: true } },
    comments: {
      orderBy: { createdAt: 'asc' as const },
      include: { user: { select: this.publicUserSelect } },
    },
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  async createStoreRating(
    storeId: number,
    userId: number,
    createStoreRatingDto: CreateStoreRatingDto,
  ) {
    await this.ensureStoreExists(storeId);

    const existingRating = await this.prisma.storeRating.findFirst({
      where: { storeId, userId },
      select: { id: true },
    });

    if (existingRating) {
      throw new ConflictException(
        'Você já avaliou esta loja. Edite sua avaliação existente.',
      );
    }

    return this.prisma.storeRating.create({
      data: {
        storeId,
        userId,
        rating: createStoreRatingDto.rating,
        comment: createStoreRatingDto.comment?.trim() || null,
      },
      include: this.ratingInclude,
    });
  }

  async findStoreRatings(storeId: number) {
    await this.ensureStoreExists(storeId);

    return this.prisma.storeRating.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      include: this.ratingInclude,
    });
  }

  async findStoreRating(storeId: number, ratingId: number) {
    const rating = await this.prisma.storeRating.findFirst({
      where: { id: ratingId, storeId },
      include: this.ratingInclude,
    });

    if (!rating) {
      throw new NotFoundException('Avaliação não encontrada.');
    }

    return rating;
  }

  async updateStoreRating(
    storeId: number,
    ratingId: number,
    userId: number,
    updateStoreRatingDto: UpdateStoreRatingDto,
  ) {
    const rating = await this.findStoreRating(storeId, ratingId);

    if (rating.userId !== userId) {
      throw new ForbiddenException('Você não pode editar esta avaliação.');
    }

    if (
      updateStoreRatingDto.rating === undefined &&
      updateStoreRatingDto.comment === undefined
    ) {
      throw new BadRequestException(
        'Informe pelo menos a nota ou o comentário para atualizar.',
      );
    }

    return this.prisma.storeRating.update({
      where: { id: ratingId },
      data: {
        ...(updateStoreRatingDto.rating !== undefined && {
          rating: updateStoreRatingDto.rating,
        }),
        ...(updateStoreRatingDto.comment !== undefined && {
          comment: updateStoreRatingDto.comment?.trim() || null,
        }),
      },
      include: this.ratingInclude,
    });
  }

  async removeStoreRating(storeId: number, ratingId: number, userId: number) {
    const rating = await this.findStoreRating(storeId, ratingId);

    if (rating.userId !== userId) {
      throw new ForbiddenException('Você não pode excluir esta avaliação.');
    }

    return this.prisma.storeRating.delete({ where: { id: ratingId } });
  }

  async findRatingComments(storeId: number, ratingId: number) {
    await this.findStoreRating(storeId, ratingId);

    return this.prisma.ratingComment.findMany({
      where: { storeRatingId: ratingId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: this.publicUserSelect } },
    });
  }

  async createRatingComment(
    storeId: number,
    ratingId: number,
    userId: number,
    createRatingCommentDto: CreateRatingCommentDto,
  ) {
    await this.findStoreRating(storeId, ratingId);

    return this.prisma.ratingComment.create({
      data: {
        userId,
        storeRatingId: ratingId,
        productRatingId: null,
        content: createRatingCommentDto.content,
      },
      include: { user: { select: this.publicUserSelect } },
    });
  }

  async updateRatingComment(
    storeId: number,
    ratingId: number,
    commentId: number,
    userId: number,
    updateRatingCommentDto: UpdateRatingCommentDto,
  ) {
    await this.findStoreRating(storeId, ratingId);

    const comment = await this.prisma.ratingComment.findFirst({
      where: { id: commentId, storeRatingId: ratingId },
    });

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado.');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('Você não pode editar este comentário.');
    }

    if (!updateRatingCommentDto.content) {
      throw new BadRequestException('Informe o texto do comentário.');
    }

    return this.prisma.ratingComment.update({
      where: { id: commentId },
      data: { content: updateRatingCommentDto.content },
      include: { user: { select: this.publicUserSelect } },
    });
  }

  async removeRatingComment(
    storeId: number,
    ratingId: number,
    commentId: number,
    userId: number,
  ) {
    await this.findStoreRating(storeId, ratingId);

    const comment = await this.prisma.ratingComment.findFirst({
      where: { id: commentId, storeRatingId: ratingId },
      select: { userId: true },
    });

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado.');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('Você não pode excluir este comentário.');
    }

    return this.prisma.ratingComment.delete({ where: { id: commentId } });
  }

  private async ensureStoreExists(storeId: number) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundException('Loja não encontrada.');
    }
  }
}
