import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}
  
async getHello(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1 as test`;
      return 'Hello World! Banco de dados conectado com sucesso!';
    } catch (error: unknown) {
      const err = error as Error;
      return `Erro ao conectar com o banco: ${err.message}`;
    }
  }
}
