import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('deve registrar envio do código de recuperação no console em modo desenvolvimento sem lançar erros', async () => {
    await expect(
      service.sendPasswordResetCode('usuario@teste.com', '123456'),
    ).resolves.toBeUndefined();
  });
});
