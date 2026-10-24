import { MUBIT_BASE_URL, MUBIT_MODEL, mubitConfigured } from "@/lib/config";
import { saplingHealth } from "@/lib/sapling/client";

export async function GET() {
  const sapling = await saplingHealth();
  return Response.json({
    mubit: {
      configured: mubitConfigured(),
      baseUrl: MUBIT_BASE_URL,
      model: MUBIT_MODEL,
      mockMode: !mubitConfigured(),
    },
    sapling,
    note: "API keys are never returned. Mock mode is labelled when the Mubit key is missing.",
  });
}
