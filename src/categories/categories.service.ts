import {BadRequestException,Injectable,NotFoundException,} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    await this.ensureParentIsValid(createCategoryDto.parentCategoryId);

    return this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        parentCategoryId: createCategoryDto.parentCategoryId,
      },
      include: {
        parentCategory: true,
        subCategories: true,
      },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        parentCategory: true,
        subCategories: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parentCategory: true,
        subCategories: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);

    if (updateCategoryDto.parentCategoryId !== undefined) {
      await this.ensureParentIsValid(updateCategoryDto.parentCategoryId, id);
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(updateCategoryDto.name !== undefined && {
          name: updateCategoryDto.name,
        }),
        ...(updateCategoryDto.parentCategoryId !== undefined && {
          parentCategoryId: updateCategoryDto.parentCategoryId,
        }),
      },
      include: {
        parentCategory: true,
        subCategories: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const [subCategories, stores, products] = await Promise.all([
      this.prisma.category.count({ where: { parentCategoryId: id } }),
      this.prisma.store.count({ where: { categoryId: id } }),
      this.prisma.product.count({ where: { categoryId: id } }),
    ]);

    if (subCategories > 0 || stores > 0 || products > 0) {
      throw new BadRequestException(
        'Não é possível excluir uma categoria que possui subcategorias, lojas ou produtos vinculados.',
      );
    }

    return this.prisma.category.delete({ where: { id } });
  }

  private async ensureParentIsValid(
    parentCategoryId: number | null | undefined,
    categoryId?: number,
  ) {
    if (parentCategoryId === undefined || parentCategoryId === null) {
      return;
    }

    const visited = new Set<number>();
    if (categoryId !== undefined) {
      visited.add(categoryId);
    }

    let currentCategoryId: number | null = parentCategoryId;

    while (currentCategoryId !== null) {
      if (visited.has(currentCategoryId)) {
        throw new BadRequestException(
          'A hierarquia de categorias não pode conter ciclos.',
        );
      }

      visited.add(currentCategoryId);

      const parentCategory: { parentCategoryId: number | null } | null =
        await this.prisma.category.findUnique({
          where: { id: currentCategoryId },
          select: { parentCategoryId: true },
        });

      if (!parentCategory) {
        throw new NotFoundException('Categoria pai não encontrada.');
      }

      currentCategoryId = parentCategory.parentCategoryId;
    }
  }
}
