import { randomUUID } from "crypto";
import { getAnalysisProvider } from "@/lib/analysis-providers";
import { analysisInstructions } from "@/lib/analysis-prompt";
import { capConfidence, quickVerdictSchema, type QuickVerdict, type ScamAnalysis } from "@/lib/scam-analysis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function sanitizeUntrustedMessage(message: string) {
  return message.replace(/<\/?untrusted\b[^>]*>/gi, "");
}

function normalizeAnalysis(analysis: ScamAnalysis): ScamAnalysis {
  const likelySafe = analysis.verdict === "likely_safe";
  const english = analysis.language_outputs.en;
  const englishOutput = likelySafe && !english.toLowerCase().includes("stay cautious")
    ? `${english.trim()} Stay cautious.`.trim()
    : english;

  return {
    ...analysis,
    confidence: capConfidence(analysis.confidence, analysis.verdict),
    // A likely_safe message must never carry tactic highlights: legitimate
    // lines (e.g. a bank's own helpline) are not manipulation.
    segments: likelySafe ? [] : analysis.segments,
    language_outputs: { ...analysis.language_outputs, en: englishOutput }
  };
}

function normalizeQuickVerdict(verdict: QuickVerdict): QuickVerdict {
  return { ...verdict, confidence: capConfidence(verdict.confidence, verdict.verdict) };
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const message = typeof (body as { message?: unknown }).message === "string"
      ? (body as { message: string }).message.trim()
      : "";
    const mode = (body as { mode?: unknown }).mode;

    if (!message) {
      return NextResponse.json({ error: "Paste a message to analyze." }, { status: 400 });
    }

    if (message.length > 12_000) {
      return NextResponse.json({ error: "Please keep the message under 12,000 characters." }, { status: 400 });
    }

    const delimiter = `untrusted-${randomUUID()}`;
    const data = `<${delimiter}>\n${sanitizeUntrustedMessage(message)}\n</${delimiter}>`;

    if (mode === "quick") {
      const quickInstructions = `${analysisInstructions}\nReturn only a fast preliminary verdict, confidence, and scam type. Do not analyze the content beyond this limited schema.`;
      const verdict = await getAnalysisProvider().generateJson<QuickVerdict>({
        instructions: quickInstructions,
        data,
        schema: quickVerdictSchema
      });
      return NextResponse.json(normalizeQuickVerdict(verdict));
    }

    const analysis = await getAnalysisProvider().analyze({ instructions: analysisInstructions, data });

    return NextResponse.json(normalizeAnalysis(analysis));
  } catch (error) {
    console.error("Analysis failed", error);
    return NextResponse.json({ error: "Analysis failed, please try again." }, { status: 500 });
  }
}
