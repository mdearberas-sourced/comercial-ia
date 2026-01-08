import { createHmac } from "crypto";

// Formato de webhook de Kapso (diferente al de Meta)
export interface KapsoWebhookPayload {
  message: {
    from: string;
    id: string;
    timestamp: string;
    type: "text" | "interactive" | "image" | "audio";
    text?: { body: string };
    interactive?: {
      type: string;
      button_reply?: { id: string; title: string };
      list_reply?: { id: string; title: string };
    };
    kapso?: {
      direction: string;
      status: string;
      content: string;
    };
  };
  conversation: {
    id: string;
    contact_name: string;
    phone_number: string;
    phone_number_id: string;
  };
  phone_number_id: string;
  is_new_conversation: boolean;
}

// Formato estándar de Meta (por si también lo recibimos)
export interface WhatsAppWebhookMessage {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: "text" | "interactive" | "image" | "audio";
          text?: { body: string };
          interactive?: {
            type: string;
            button_reply?: { id: string; title: string };
            list_reply?: { id: string; title: string };
          };
        }>;
        statuses?: Array<{
          id: string;
          status: "sent" | "delivered" | "read";
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return `sha256=${expectedSignature}` === signature;
}

export function extractMessage(
  webhook: KapsoWebhookPayload | WhatsAppWebhookMessage
): { from: string; text: string; messageId: string } | null {

  // Formato Kapso
  if ("message" in webhook && webhook.message) {
    const msg = webhook.message;
    let text = "";

    if (msg.type === "text" && msg.text) {
      text = msg.text.body;
    } else if (msg.kapso?.content) {
      text = msg.kapso.content;
    } else if (msg.type === "interactive" && msg.interactive) {
      const reply = msg.interactive.button_reply || msg.interactive.list_reply;
      text = reply?.title || reply?.id || "";
    } else {
      text = "[Mensaje no soportado - por favor enviá texto]";
    }

    return {
      from: msg.from,
      text,
      messageId: msg.id,
    };
  }

  // Formato Meta estándar
  if ("entry" in webhook) {
    const entry = webhook.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) return null;

    let text = "";

    if (message.type === "text" && message.text) {
      text = message.text.body;
    } else if (message.type === "interactive" && message.interactive) {
      const reply =
        message.interactive.button_reply || message.interactive.list_reply;
      text = reply?.title || reply?.id || "";
    } else {
      text = "[Mensaje no soportado - por favor enviá texto]";
    }

    return {
      from: message.from,
      text,
      messageId: message.id,
    };
  }

  return null;
}
