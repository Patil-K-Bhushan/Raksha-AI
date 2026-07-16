import { getAnalysisProvider } from "@/lib/analysis-providers";
import { simulateInstructions } from "@/lib/analysis-prompt";
import {
  SIMULATOR_SCAM_TYPES,
  capConfidence,
  simulatedScamSchema,
  type SimulatedScam
} from "@/lib/scam-analysis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function pickScamType(requested: unknown): string | null {
  if (requested === undefined || requested === null || requested === "") {
    return SIMULATOR_SCAM_TYPES[Math.floor(Math.random() * SIMULATOR_SCAM_TYPES.length)];
  }
  if (typeof requested !== "string") return null;
  // Whitelist only — user input never reaches the instruction position.
  const match = SIMULATOR_SCAM_TYPES.find((type) => type === requested);
  return match ?? null;
}

function normalizeSimulated(simulated: SimulatedScam): SimulatedScam {
  return {
    ...simulated,
    analysis: {
      ...simulated.analysis,
      // A simulator output is a scam by construction — never let it read otherwise.
      verdict: "scam",
      confidence: capConfidence(simulated.analysis.confidence, "scam"),
      injection_detected: false,
      injection_explanation: ""
    }
  };
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => ({}));
    const scamType = pickScamType((body as { scam_type?: unknown }).scam_type);

    if (!scamType) {
      return NextResponse.json({ error: "Unknown scam type for the simulator." }, { status: 400 });
    }

    const simulated = await getAnalysisProvider().generateJson<SimulatedScam>({
      instructions: simulateInstructions(scamType),
      data: `Generate one ${scamType} training example now.`,
      schema: simulatedScamSchema
    });

    return NextResponse.json({ ...normalizeSimulated(simulated), scam_type_requested: scamType });
  } catch (error) {
    console.error("Simulation failed", error);
    return NextResponse.json({ error: "Could not generate a practice scam, please try again." }, { status: 500 });
  }
}
