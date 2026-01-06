import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Verificar conexión a la base de datos
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        kapso: process.env.KAPSO_API_KEY ? "configured" : "missing",
        anthropic: process.env.ANTHROPIC_API_KEY ? "configured" : "missing",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
