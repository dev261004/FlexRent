import nodemailer from "nodemailer";
import { env } from "../config/env";

type PasswordResetEmailInput = {
  to: string;
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
};

const createTransporter = () => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error("SMTP configuration is incomplete");
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
};

export const sendPasswordResetEmail = async ({
  to,
  name,
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailInput): Promise<void> => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: "Reset your FlexRent password",
    text: [
      `Hi ${name},`,
      "",
      "We received a request to reset your FlexRent password.",
      `Open this link to create a new password: ${resetUrl}`,
      "",
      `This link expires in ${expiresInMinutes} minutes.`,
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <p>Hi ${name},</p>
      <p>We received a request to reset your FlexRent password.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link expires in ${expiresInMinutes} minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });
};
