import "server-only";
import nodemailer from "nodemailer";

export function mailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendOtpEmail(to: string, name: string, code: string) {
  const subject = `${code} is your DevVault verification code`;
  const text = `Hi ${name},\n\nYour DevVault verification code is ${code}.\nIt expires in 10 minutes and can be used once.\n\nIf you didn't create a DevVault account, ignore this email.`;
  if (!mailConfigured()) {
    console.log(`\n[devvault] SMTP not configured — verification code for ${to}: ${code}\n`);
    return { delivered: false };
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html: `<div style="font-family:Inter,Arial,sans-serif;color:#1E293B;max-width:480px">
      <p>Hi ${escapeHtml(name)},</p><p>Your DevVault verification code is:</p>
      <p style="font-family:monospace;font-size:28px;font-weight:700;letter-spacing:6px;color:#077264">${code}</p>
      <p style="color:#586577;font-size:13px">It expires in 10 minutes and can be used once. If you didn't create a DevVault account, ignore this email.</p></div>`,
  });
  return { delivered: true };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
