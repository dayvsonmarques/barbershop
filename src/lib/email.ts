import { Resend } from "resend";
import nodemailer from "nodemailer";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

async function sendViaResend({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    throw new Error("Resend API key not configured");
  }

  const from = process.env.EMAIL_FROM || "ED Barbearia <no-reply@yourdomain.com>";
  
  await resend.emails.send({
    from,
    to,
    subject,
    html,
  });
}

async function sendViaSMTP({ to, subject, html }: SendEmailParams) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: parseInt(process.env.SMTP_PORT || "1025"),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });

  const from = process.env.SMTP_FROM || "ED Barbearia <no-reply@localhost>";

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
}

export async function sendEmail(params: SendEmailParams) {
  const provider = process.env.EMAIL_PROVIDER || "smtp";

  try {
    if (provider === "resend") {
      await sendViaResend(params);
    } else {
      await sendViaSMTP(params);
    }
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

export function generatePasswordResetEmail(resetUrl: string, userName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin: 20px 0; }
    .button { 
      display: inline-block; 
      padding: 12px 24px; 
      background-color: #d4af37; 
      color: white; 
      text-decoration: none; 
      border-radius: 5px;
      font-weight: bold;
    }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ED Barbearia</h1>
    </div>
    <div class="content">
      <h2>Recuperação de Senha</h2>
      <p>Olá, ${userName}!</p>
      <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" class="button">Redefinir Senha</a>
      </p>
      <p>Ou copie e cole este link no seu navegador:</p>
      <p style="word-break: break-all; color: #666;">${resetUrl}</p>
      <p><strong>Este link expira em 1 hora.</strong></p>
      <p>Se você não solicitou a redefinição de senha, ignore este e-mail.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ED Barbearia. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
