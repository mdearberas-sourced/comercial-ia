import { db } from "@/lib/db";

// Datos de mercado mock hasta tener acceso a CMA
const MOCK_MARKET_DATA = {
  soja: {
    rosario: { spot: 295, unit: "USD/tn" },
    chicago: { may25: 378, jul25: 382, unit: "USD/tn" },
    matba: { may25: 290, jul25: 295, unit: "USD/tn" },
  },
  maiz: {
    rosario: { spot: 175, unit: "USD/tn" },
    chicago: { may25: 188, jul25: 192, unit: "USD/tn" },
    matba: { may25: 172, jul25: 178, unit: "USD/tn" },
  },
  trigo: {
    rosario: { spot: 210, unit: "USD/tn" },
    chicago: { may25: 225, jul25: 228, unit: "USD/tn" },
    matba: { may25: 208, jul25: 215, unit: "USD/tn" },
  },
};

export async function getMarketContext(): Promise<string> {
  // Intentar obtener datos reales de la DB
  const recentData = await db.marketData.findMany({
    where: {
      date: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24hs
      },
    },
    orderBy: { date: "desc" },
  });

  if (recentData.length > 0) {
    return formatRealMarketData(recentData);
  }

  // Fallback a datos mock
  return formatMockMarketData();
}

function formatRealMarketData(
  data: Array<{
    crop: string;
    market: string;
    type: string;
    position: string | null;
    price: number;
    currency: string;
    date: Date;
  }>
): string {
  const grouped: Record<string, string[]> = {};

  for (const d of data) {
    const key = d.crop.toUpperCase();
    if (!grouped[key]) grouped[key] = [];

    const posInfo = d.position ? ` ${d.position}` : "";
    grouped[key].push(
      `${d.market}${posInfo}: ${d.price} ${d.currency}/tn`
    );
  }

  const lines = Object.entries(grouped).map(
    ([crop, prices]) => `${crop}:\n${prices.map((p) => `  - ${p}`).join("\n")}`
  );

  return `Precios actualizados (${new Date().toLocaleDateString("es-AR")}):\n\n${lines.join("\n\n")}`;
}

function formatMockMarketData(): string {
  return `Precios de referencia (datos indicativos, consultar para valores actualizados):

SOJA:
  - Rosario disponible: ~295 USD/tn
  - MATBA May25: ~290 USD/tn
  - Chicago May25: ~378 USD/tn

MAÍZ:
  - Rosario disponible: ~175 USD/tn
  - MATBA May25: ~172 USD/tn
  - Chicago May25: ~188 USD/tn

TRIGO:
  - Rosario disponible: ~210 USD/tn
  - MATBA May25: ~208 USD/tn
  - Chicago May25: ~225 USD/tn

Nota: Estos son valores de referencia. Los precios reales se actualizarán cuando se integre la API de CMA.`;
}

// Para futura integración con CMA
export async function syncMarketDataFromCMA(): Promise<void> {
  // TODO: Implementar cuando tengamos acceso a la API de CMA
  // const cmaData = await fetchCMAData();
  // await db.marketData.createMany({ data: cmaData });
  console.log("CMA sync not implemented yet");
}
