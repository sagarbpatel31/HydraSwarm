import { NextResponse } from "next/server";
import { runSeed } from "@/lib/seed";

export async function POST() {
  try {
    const result = await runSeed();
    return NextResponse.json(result, { status: result.success ? 200 : 207 });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Seed failed",
      },
      { status: 500 }
    );
  }
}
