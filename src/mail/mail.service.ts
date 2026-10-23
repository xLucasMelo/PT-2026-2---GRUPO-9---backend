import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.MAIL_HOST;
    const port = Number(process.env.MAIL_PORT) || 587;
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
      this.logger.log(`Mailer configurado via SMTP: ${host}:${port}`);
    } else {
      this.logger.warn(
        'MAIL_USER ou MAIL_PASS não configurados. Modo DEV ativado: códigos de recuperação serão impressos no console.',
      );
    }
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const from = process.env.MAIL_FROM || 'noreply@dbstock.com';
    const subject = 'Recuperação de Senha - Código de Verificação';
    const text = `Olá!\n\nVocê solicitou a recuperação de senha da sua conta.\nSeu código de verificação é: ${code}\nEste código é válido por 15 minutos.\n\nSe você não solicitou esta alteração, ignore este e-mail.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1a202c;">Recuperação de Senha</h2>
        <p>Olá,</p>
        <p>Você solicitou a recuperação de senha da sua conta.</p>
        <div style="margin: 24px 0; padding: 16px; background-color: #f7fafc; text-align: center; border-radius: 6px;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #2b6cb0;">${code}</span>
        </div>
        <p style="color: #718096; font-size: 14px;">Este código é válido por <strong>15 minutos</strong>.</p>
        <p style="color: #a0aec0; font-size: 12px; margin-top: 32px;">Se você não solicitou esta alteração, ignore este e-mail.</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to: email,
          subject,
          text,
          html,
        });
        this.logger.log(`E-mail de recuperação enviado para ${email}`);
        return;
      } catch (error) {
        this.logger.error(`Falha ao enviar e-mail para ${email}:`, error);
      }
    }

    // Fallback de desenvolvimento (registra código no console para testes locais ágeis)
    this.logger.log(
      `\n==================================================\n[DEV MAIL] Código de recuperação para ${email}: ${code}\n==================================================\n`,
    );
  }
}
