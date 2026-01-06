import { NextRequest, NextResponse } from "next/server";
import { processMessage } from "@/lib/ai/agent";

// Endpoint para probar el agente sin WhatsApp
// POST /api/test con { "phone": "+5491112345678", "message": "Hola, precio de soja?" }
export async function POST(request: NextRequest) {

  try {
    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json(
        { error: "phone and message are required" },
        { status: 400 }
      );
    }

    const response = await processMessage(phone, message);

    return NextResponse.json({
      response: response.content,
      tokensUsed: response.tokensUsed,
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
