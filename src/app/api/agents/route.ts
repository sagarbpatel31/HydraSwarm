import { NextResponse } from "next/server";
import { AGENTS } from "@/lib/agents/registry";

export async function GET() {
  return NextResponse.json({ agents: AGENTS });
}
