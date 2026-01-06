import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

let _whatsapp: WhatsAppClient | null = null;

function getWhatsAppClient(): WhatsAppClient {
  if (!_whatsapp) {
    if (!process.env.KAPSO_API_KEY) {
      throw new Error("KAPSO_API_KEY is not configured");
    }
    _whatsapp = new WhatsAppClient({
      kapsoApiKey: process.env.KAPSO_API_KEY,
    });
  }
  return _whatsapp;
}

const PHONE_NUMBER_ID = process.env.KAPSO_PHONE_NUMBER_ID || "";

export async function sendMessage(to: string, text: string) {
  const client = getWhatsAppClient();
  return client.messages.sendText({
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
  const client = getWhatsAppClient();
  return client.messages.sendInteractiveButtons({
    phoneNumberId: PHONE_NUMBER_ID,
    to,
    bodyText: body,
    buttons,
  });
}

export async function markAsRead(messageId: string) {
  const client = getWhatsAppClient();
  return client.messages.markRead({
    phoneNumberId: PHONE_NUMBER_ID,
    messageId,
  });
}
