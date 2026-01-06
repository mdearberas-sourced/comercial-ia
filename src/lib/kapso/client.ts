import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

if (!process.env.KAPSO_API_KEY) {
  console.warn("KAPSO_API_KEY not set - WhatsApp client will not work");
}

export const whatsapp = new WhatsAppClient({
  kapsoApiKey: process.env.KAPSO_API_KEY || "",
});

// El phoneNumberId se configura en Kapso dashboard
const PHONE_NUMBER_ID = process.env.KAPSO_PHONE_NUMBER_ID || "";

export async function sendMessage(to: string, text: string) {
  return whatsapp.messages.sendText({
    phoneNumberId: PHONE_NUMBER_ID,
    to,
    body: text,
  });
}

export async function sendInteractiveButtons(
  to: string,
  body: string,
  buttons: Array<{ id: string; title: string }>
) {
  return whatsapp.messages.sendInteractiveButtons({
    phoneNumberId: PHONE_NUMBER_ID,
    to,
    bodyText: body,
    buttons,
  });
}

export async function markAsRead(messageId: string) {
  return whatsapp.messages.markRead({
    phoneNumberId: PHONE_NUMBER_ID,
    messageId,
  });
}
