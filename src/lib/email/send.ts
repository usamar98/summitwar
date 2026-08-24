import "server-only";

import { Resend } from "resend";

type EmailInput = { to: string; subject: string; text: string };

export async function sendTransactionalEmail(input: EmailInput) {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        JSON.stringify({
          event: "email.development_preview",
          subject: input.subject,
        }),
      );
    }
    return { id: "development-preview" };
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "SummitWar <climbs@summitwar.lol>",
    to: input.to,
    subject: input.subject,
    text: input.text,
  });
  if (error) throw new Error(`Resend failed: ${error.message}`);
  return data;
}
