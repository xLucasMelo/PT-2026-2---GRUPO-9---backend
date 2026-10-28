import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaExceptionFilter } from '../src/common/filters/prisma-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth & Users (e2e)', () => {
  let app: INestApplication;

  const mockUsersDb: any[] = [];
  const mockPasswordResetsDb: any[] = [];
  const mockStoresDb: any[] = [];

  const mockPrismaService = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(async (ops: any[]) => {
      const results = [];
      for (const op of ops) {
        results.push(await op);
      }
      return results;
    }),
    user: {
      findFirst: jest.fn(async ({ where }: any) => {
        if (where.OR) {
          const emailCondition = where.OR.find((c: any) => c.email);
          const usernameCondition = where.OR.find((c: any) => c.username);
          return (
            mockUsersDb.find(
              (u) =>
                (emailCondition &&
                  u.email.toLowerCase() ===
                    emailCondition.email.toLowerCase()) ||
                (usernameCondition && u.username === usernameCondition.username),
            ) || null
          );
        }
        if (where.username && where.NOT) {
          return (
            mockUsersDb.find(
              (u) => u.username === where.username && u.id !== where.NOT.id,
            ) || null
          );
        }
        return null;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.id) {
          return mockUsersDb.find((u) => u.id === where.id) || null;
        }
        if (where.email) {
          return (
            mockUsersDb.find(
              (u) => u.email.toLowerCase() === where.email.toLowerCase(),
            ) || null
          );
        }
        return null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const newUser = {
          id: mockUsersDb.length + 1,
          name: data.name,
          username: data.username,
          email: data.email,
          passwordHash: data.passwordHash,
          profilePictureUrl: data.profilePictureUrl || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockUsersDb.push(newUser);
        return newUser;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const user = mockUsersDb.find((u) => u.id === where.id);
        if (!user) throw new Error('Not found');
        Object.assign(user, data, { updatedAt: new Date() });
        return user;
      }),
      delete: jest.fn(async ({ where }: any) => {
        const index = mockUsersDb.findIndex((u) => u.id === where.id);
        if (index === -1) throw new Error('Not found');
        const [deleted] = mockUsersDb.splice(index, 1);
        return deleted;
      }),
      count: jest.fn(async () => mockUsersDb.length),
      findMany: jest.fn(async () => mockUsersDb),
    },
    store: {
      count: jest.fn(async ({ where }: any) => {
        return mockStoresDb.filter((s) => s.userId === where.userId).length;
      }),
    },
    passwordReset: {
      updateMany: jest.fn(async ({ where, data }: any) => {
        let count = 0;
        for (const reset of mockPasswordResetsDb) {
          if (reset.userId === where.userId && reset.used === where.used) {
            Object.assign(reset, data);
            count++;
          }
        }
        return { count };
      }),
      create: jest.fn(async ({ data }: any) => {
        const newReset = {
          id: mockPasswordResetsDb.length + 1,
          userId: data.userId,
          code: data.code,
          expiresAt: data.expiresAt,
          used: data.used,
          createdAt: new Date(),
        };
        mockPasswordResetsDb.push(newReset);
        return newReset;
      }),
      findFirst: jest.fn(async ({ where }: any) => {
        return (
          mockPasswordResetsDb.find(
            (r) =>
              r.userId === where.userId &&
              r.code === where.code &&
              r.used === where.used &&
              r.expiresAt > new Date(),
          ) || null
        );
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const reset = mockPasswordResetsDb.find((r) => r.id === where.id);
        if (!reset) throw new Error('Not found');
        Object.assign(reset, data);
        return reset;
      }),
    },
  };

  beforeAll(async () => {
    // Seed initial user
    const initialHash = await bcrypt.hash('SenhaInicial123', 10);
    mockUsersDb.push({
      id: 1,
      name: 'Maria Santos',
      username: 'mariasantos',
      email: 'maria@exemplo.com',
      passwordHash: initialHash,
      profilePictureUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new PrismaExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Fluxo de Cadastro (US01, US03, US05, US06)', () => {
    it('deve retornar 400 com lista de erros visuais ao enviar campos vazios (US05)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({})
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message.length).toBeGreaterThan(0);
    });

    it('deve retornar 400 se as senhas não coincidirem (US06)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Carlos Oliveira',
          username: 'carlos_oli',
          email: 'carlos@exemplo.com',
          password: 'SenhaForte123',
          passwordConfirmation: 'SenhaDiferente123',
        })
        .expect(400);

      expect(
        response.body.message.some((msg: string) =>
          msg.includes('idêntica à senha informada'),
        ),
      ).toBe(true);
    });

    it('deve cadastrar um novo usuário com sucesso (US01, US03, US06)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Carlos Oliveira',
          username: 'carlos_oli',
          email: 'carlos@exemplo.com',
          password: 'SenhaForte123',
          passwordConfirmation: 'SenhaForte123',
        })
        .expect(201);

      expect(response.body.message).toContain('sucesso');
      expect(response.body.user.email).toBe('carlos@exemplo.com');
      expect(response.body.user.passwordHash).toBeUndefined();
    });

    it('deve retornar 409 em caso de tentativa com e-mail duplicado', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Outro Carlos',
          username: 'carlos_outro',
          email: 'carlos@exemplo.com',
          password: 'SenhaForte123',
          passwordConfirmation: 'SenhaForte123',
        })
        .expect(409);
    });
  });

  describe('Fluxo de Login (US02, US04, US07)', () => {
    it('deve retornar 401 com mensagem de erro visual para senha incorreta (US04, US07)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'maria@exemplo.com',
          password: 'SenhaErrada123',
        })
        .expect(401);

      expect(response.body.message).toBe('E-mail ou senha incorretos.');
    });

    it('deve autenticar e retornar accessToken com perfil do usuário (US02, US07)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'maria@exemplo.com',
          password: 'SenhaInicial123',
        })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.email).toBe('maria@exemplo.com');
      expect(response.body.user.passwordHash).toBeUndefined();
    });
  });

  describe('Fluxo de Usuários Protegido (/users/me)', () => {
    let token: string;

    beforeAll(async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'maria@exemplo.com',
          password: 'SenhaInicial123',
        });
      token = loginRes.body.accessToken;
    });

    it('deve retornar 401 sem token no /users/me', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('deve retornar dados do perfil logado no /users/me com Bearer token', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(1);
      expect(response.body.username).toBe('mariasantos');
    });

    it('deve atualizar o perfil logado via PATCH /users/me', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Maria Santos Silva' })
        .expect(200);

      expect(response.body.name).toBe('Maria Santos Silva');
    });
  });

  describe('Fluxo de Recuperação de Senha (US08, US09)', () => {
    it('deve solicitar código de recuperação via POST /auth/forgot-password (US08)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'maria@exemplo.com' })
        .expect(200);

      expect(response.body.message).toContain('código de recuperação');
      expect(mockPasswordResetsDb.length).toBeGreaterThan(0);
    });

    it('deve rejeitar código inválido via POST /auth/reset-password (US09)', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          email: 'maria@exemplo.com',
          code: '000000',
          newPassword: 'NovaSenhaForte123',
          confirmNewPassword: 'NovaSenhaForte123',
        })
        .expect(400);
    });

    it('deve redefinir senha com sucesso com código válido (US09)', async () => {
      const validCode = mockPasswordResetsDb[mockPasswordResetsDb.length - 1].code;

      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          email: 'maria@exemplo.com',
          code: validCode,
          newPassword: 'NovaSenhaForte123',
          confirmNewPassword: 'NovaSenhaForte123',
        })
        .expect(200);

      expect(response.body.message).toContain('sucesso');

      // Login com a nova senha deve funcionar
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'maria@exemplo.com',
          password: 'NovaSenhaForte123',
        })
        .expect(200);
    });
  });
});
