import { Resend } from "resend";
import nodemailer from "nodemailer";

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

function getGmailTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("Gmail credentials not configured");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

interface SendOptions {
  to: string;
  title: string;
  epubBuffer: Buffer;
}

async function sendViaResend({ to, title, epubBuffer }: SendOptions): Promise<void> {
  const senderEmail = process.env.SENDER_EMAIL;
  if (!senderEmail) {
    throw new Error("SENDER_EMAIL is not configured");
  }

  const resend = getResendClient();
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s]/g, "_");

  const { error } = await resend.emails.send({
    from: senderEmail,
    to: to,
    subject: title,
    text: `Your book "${title}" is attached.\n\nSent via KindleCrafter`,
    attachments: [
      {
        filename: `${sanitizedTitle}.epub`,
        content: epubBuffer,
      },
    ],
  });

  if (error) {
    throw new Error(`Email failed: ${error.message}`);
  }
}

async function sendViaGmail({ to, title, epubBuffer }: SendOptions): Promise<void> {
  const transport = getGmailTransport();
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s]/g, "_");

  await transport.sendMail({
    from: process.env.GMAIL_USER,
    to: to,
    subject: title,
    text: `Your book "${title}" is attached.\n\nSent via KindleCrafter`,
    attachments: [
      {
        filename: `${sanitizedTitle}.epub`,
        content: epubBuffer,
      },
    ],
  });
}

export async function sendToKindle(options: SendOptions): Promise<void> {
  // Try Gmail first (easier setup), then Resend
  if (isGmailConfigured()) {
    await sendViaGmail(options);
  } else if (isResendConfigured()) {
    await sendViaResend(options);
  } else {
    throw new Error(
      "Email not configured. Please set either GMAIL_USER + GMAIL_APP_PASSWORD, or RESEND_API_KEY + SENDER_EMAIL in .env.local"
    );
  }
}

export function isGmailConfigured(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export function isResendConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.SENDER_EMAIL);
}

export function isEmailConfigured(): boolean {
  return isGmailConfigured() || isResendConfigured();
}
