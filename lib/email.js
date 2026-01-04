import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendClinicEmail({ to, subject, text }) {
  if (!process.env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
  if (!process.env.MAIL_FROM) throw new Error("Missing MAIL_FROM");

  return await resend.emails.send({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
  });
}