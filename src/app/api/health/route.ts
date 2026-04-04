import { NextResponse } from "next/server";
import { checkConnection } from "@/lib/hydra";
import { MOCK_MODE } from "@/lib/config";

export async function GET() {
  const hydraOk = await checkConnection();

  return NextResponse.json({
    ok: hydraOk,
    hydra: hydraOk ? "connected" : "error",
    mock: MOCK_MODE,
    timestamp: new Date().toISOString(),
  });
}
