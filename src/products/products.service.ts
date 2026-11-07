import {ForbiddenException,Injectable,NotFoundException} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, createProductDto: CreateProductDto) {
    await this.ensureStoreOwnedByUser(createProductDto.storeId, userId);
    await this.ensureCategoryExists(createProductDto.categoryId);

    return this.prisma.product.create({
      data: {
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        stock: createProductDto.stock,
        categoryId: createProductDto.categoryId,
        storeId: createProductDto.storeId,
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        category: true,
        store: true,
        images: true,
      },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        store: true,
        images: true,
        ratings: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return product;
  }

  async update(
    id: number,
    userId: number,
    updateProductDto: UpdateProductDto,
  ) {
    const product = await this.findOne(id);
    await this.ensureStoreOwnedByUser(product.storeId, userId);

    if (updateProductDto.storeId !== undefined) {
      await this.ensureStoreOwnedByUser(updateProductDto.storeId, userId);
    }

    if (updateProductDto.categoryId !== undefined) {
      await this.ensureCategoryExists(updateProductDto.categoryId);
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(updateProductDto.name !== undefined && {
          name: updateProductDto.name,
        }),
        ...(updateProductDto.description !== undefined && {
          description: updateProductDto.description,
        }),
        ...(updateProductDto.price !== undefined && {
          price: updateProductDto.price,
        }),
        ...(updateProductDto.stock !== undefined && {
          stock: updateProductDto.stock,
        }),
        ...(updateProductDto.categoryId !== undefined && {
          categoryId: updateProductDto.categoryId,
        }),
        ...(updateProductDto.storeId !== undefined && {
          storeId: updateProductDto.storeId,
        }),
      },
    });
  }

  async remove(id: number, userId: number) {
    const product = await this.findOne(id);
    await this.ensureStoreOwnedByUser(product.storeId, userId);

    return this.prisma.product.delete({
      where: { id },
    });
  }

  private async ensureStoreOwnedByUser(storeId: number, userId: number) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { userId: true },
    });

    if (!store) {
      throw new NotFoundException('Loja não encontrada.');
    }

    if (store.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para esta loja.');
    }
  }

  private async ensureCategoryExists(categoryId: number) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }
  }
}
