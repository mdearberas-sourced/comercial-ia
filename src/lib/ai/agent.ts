import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildSystemPrompt } from "./prompts";
import { db } from "@/lib/db";
import { getMarketContext } from "@/services/market";
import { MessageRole } from "@/generated/prisma/client";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

interface AgentResponse {
  content: string;
  tokensUsed: number;
}

export async function processMessage(
  producerPhone: string,
  userMessage: string
): Promise<AgentResponse> {
  // 1. Obtener o crear productor
  let producer = await db.producer.findUnique({
    where: { phone: producerPhone },
    include: {
      inventory: true,
      conversations: {
        where: { status: "ACTIVE" },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      },
    },
  });

  if (!producer) {
    producer = await db.producer.create({
      data: { phone: producerPhone },
      include: {
        inventory: true,
        conversations: {
          where: { status: "ACTIVE" },
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 20,
            },
          },
        },
      },
    });
  }

  // 2. Obtener o crear conversación activa
  let conversation = producer.conversations[0];
  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        producerId: producer.id,
        status: "ACTIVE",
      },
      include: {
        messages: true,
      },
    });
  }

  // 3. Guardar mensaje del usuario
  await db.message.create({
    data: {
      conversationId: conversation.id,
      role: MessageRole.USER,
      content: userMessage,
    },
  });

  // 4. Construir contexto
  const marketContext = await getMarketContext();
  const producerContext = buildProducerContext(producer);
  const conversationHistory = buildConversationHistory(conversation.messages);

  const systemPrompt = buildSystemPrompt(
    marketContext,
    producerContext,
    conversationHistory
  );

  // 5. Llamar a Gemini Flash
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userMessage);
  const response = result.response;
  const assistantMessage = response.text();

  // 6. Guardar respuesta del asistente
  await db.message.create({
    data: {
      conversationId: conversation.id,
      role: MessageRole.ASSISTANT,
      content: assistantMessage,
    },
  });

  // Gemini no devuelve token count en la respuesta básica
  const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

  return {
    content: assistantMessage,
    tokensUsed,
  };
}

function buildProducerContext(producer: {
  name: string | null;
  company: string | null;
  location: string | null;
  hectares: number | null;
  mainCrops: string[];
  inventory: Array<{
    crop: string;
    quantity: number;
    quality: string | null;
    harvest: string | null;
  }>;
}): string {
  const parts: string[] = [];

  if (producer.name) parts.push(`Nombre: ${producer.name}`);
  if (producer.company) parts.push(`Empresa: ${producer.company}`);
  if (producer.location) parts.push(`Ubicación: ${producer.location}`);
  if (producer.hectares) parts.push(`Hectáreas: ${producer.hectares}`);
  if (producer.mainCrops.length > 0) {
    parts.push(`Cultivos principales: ${producer.mainCrops.join(", ")}`);
  }

  if (producer.inventory.length > 0) {
    parts.push("\nInventario actual:");
    for (const inv of producer.inventory) {
      parts.push(
        `- ${inv.crop}: ${inv.quantity} tn${inv.quality ? ` (${inv.quality})` : ""}${inv.harvest ? ` - Campaña ${inv.harvest}` : ""}`
      );
    }
  }

  return parts.length > 0 ? parts.join("\n") : "Sin información registrada";
}

function buildConversationHistory(
  messages: Array<{ role: MessageRole; content: string }>
): string {
  if (messages.length === 0) return "Conversación nueva";

  // Ordenar cronológicamente (estaban en orden desc)
  const sorted = [...messages].reverse();

  return sorted
    .map((m) => `${m.role === "USER" ? "Productor" : "Asistente"}: ${m.content}`)
    .join("\n\n");
}
