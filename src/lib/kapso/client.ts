const KAPSO_API_KEY = process.env.KAPSO_API_KEY || "";
const PHONE_NUMBER_ID = process.env.KAPSO_PHONE_NUMBER_ID || "";

interface KapsoSendResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

interface KapsoErrorResponse {
  error: string;
}

export async function sendMessage(to: string, text: string): Promise<KapsoSendResponse> {
  const url = `https://api.kapso.ai/meta/whatsapp/${PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${KAPSO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Kapso API error:", data);
    throw new Error((data as KapsoErrorResponse).error || `Kapso error: ${response.status}`);
  }

  return data as KapsoSendResponse;
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
      "Authorization": `Bearer ${KAPSO_API_KEY}`,
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

  const data = await response.json();

  if (!response.ok) {
    console.error("Kapso API error:", data);
    throw new Error((data as KapsoErrorResponse).error || `Kapso error: ${response.status}`);
  }

  return data as KapsoSendResponse;
}

export async function markAsRead(messageId: string): Promise<void> {
  const url = `https://api.kapso.ai/meta/whatsapp/${PHONE_NUMBER_ID}/messages`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${KAPSO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  });
}
