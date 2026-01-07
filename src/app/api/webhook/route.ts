import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  extractMessage,
  WhatsAppWebhookMessage,
} from "@/lib/kapso/webhook";
import { processMessage } from "@/lib/ai/agent";
import { sendMessage } from "@/lib/kapso/client";

// Verificación del webhook (WhatsApp/Kapso envía GET para verificar)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Verificar que el token coincida con el configurado
  if (mode === "subscribe" && token === process.env.KAPSO_WEBHOOK_SECRET) {
    console.log("Webhook verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Recepción de mensajes
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Verificar firma del webhook (opcional pero recomendado)
    const signature = request.headers.get("x-hub-signature-256");
    if (signature && process.env.KAPSO_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(
        body,
        signature,
        process.env.KAPSO_WEBHOOK_SECRET
      );
      if (!isValid) {
        console.error("Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const webhook: WhatsAppWebhookMessage = JSON.parse(body);

    // Extraer mensaje
    const message = extractMessage(webhook);

    if (!message) {
      // Puede ser un status update (delivered, read) - ignorar
      return NextResponse.json({ status: "ok" });
    }

    console.log(`Message from ${message.from}: ${message.text}`);

    // Procesar con el agente IA
    const response = await processMessage(message.from, message.text);

    // Enviar respuesta por WhatsApp
    await sendMessage(message.from, response.content);

    console.log(`Response sent. Tokens used: ${response.tokensUsed}`);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
