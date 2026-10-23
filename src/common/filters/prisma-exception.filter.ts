import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception.code === 'P2002') {
      const target = (exception.meta?.target as string[]) || [];
      const field = target.length > 0 ? target.join(', ') : 'campo único';
      const status = HttpStatus.CONFLICT;

      return response.status(status).json({
        statusCode: status,
        message: `Já existe um registro com este ${field}.`,
        error: 'Conflict',
      });
    }

    if (exception.code === 'P2025') {
      const status = HttpStatus.NOT_FOUND;
      return response.status(status).json({
        statusCode: status,
        message: 'Registro solicitado não foi encontrado.',
        error: 'Not Found',
      });
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    return response.status(status).json({
      statusCode: status,
      message: 'Erro interno ao processar operação no banco de dados.',
      error: 'Internal Server Error',
    });
  }
}
