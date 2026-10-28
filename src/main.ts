import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS
  app.enableCors();

  // Validação global com retorno detalhado de mensagens por campo (US04/US05)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Mapeamento global de exceções do Prisma
  app.useGlobalFilters(new PrismaExceptionFilter());

  // Serialização global (ocultando automaticamente campos marcados com @Exclude)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Documentação interativa via Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API de Estoque e Usuários - Grupo 09')
    .setDescription(
      'Documentação dos endpoints de Autenticação (US01-US09) e gerenciamento de Usuários (CRUD).',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Insira o token JWT gerado no endpoint /auth/login',
        in: 'header',
      },
      'bearer',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Aplicação rodando em: http://localhost:${port}`);
  console.log(`Swagger disponível em: http://localhost:${port}/api/docs`);
}
void bootstrap();
