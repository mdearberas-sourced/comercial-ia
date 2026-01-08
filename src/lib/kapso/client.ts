const KAPSO_API_KEY = process.env.KAPSO_API_KEY || "";
const PHONE_NUMBER_ID = process.env.KAPSO_PHONE_NUMBER_ID || "";

interface KapsoSendResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export async function sendMessage(to: string, text: string): Promise<KapsoSendResponse> {
  // Kapso proxy to Meta Graph API
  const url = `https://api.kapso.ai/meta/whatsapp/v21.0/${PHONE_NUMBER_ID}/messages`;

  console.log("Kapso URL:", url);
  console.log("Phone Number ID:", PHONE_NUMBER_ID);
  console.log("API Key (first 10 chars):", KAPSO_API_KEY.substring(0, 10));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-kapso-api-key": KAPSO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  const responseText = await response.text();
  console.log("Kapso response status:", response.status);
  console.log("Kapso response:", responseText.substring(0, 500));

  if (!response.ok) {
    throw new Error(`Kapso error: ${response.status} - ${responseText.substring(0, 200)}`);
  }

  return JSON.parse(responseText) as KapsoSendResponse;
}

export async function sendInteractiveButtons(
  to: string,
  body: string,
  buttons: Array<{ id: string; title: string }>
): Promise<KapsoSendResponse> {
  const url = `https://api.kapso.ai/meta/whatsapp/${PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-kapso-api-key": KAPSO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: body },
        action: {
          buttons: buttons.map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Kapso error: ${response.status} - ${responseText.substring(0, 200)}`);
  }

  return JSON.parse(responseText) as KapsoSendResponse;
}

export async function markAsRead(messageId: string): Promise<void> {
  const url = `https://api.kapso.ai/meta/whatsapp/${PHONE_NUMBER_ID}/messages`;

  await fetch(url, {
    method: "POST",
    headers: {
      "x-kapso-api-key": KAPSO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  });
}
