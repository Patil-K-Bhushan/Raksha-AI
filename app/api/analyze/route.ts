import { randomUUID } from "crypto";
import { getAnalysisProvider } from "@/lib/analysis-providers";
import { analysisInstructions } from "@/lib/analysis-prompt";
import { capConfidence, normalizeScamAnalysis, quickVerdictSchema, type QuickVerdict } from "@/lib/scam-analysis";
import { matchPatterns } from "@/lib/scam-patterns";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function sanitizeUntrustedMessage(message: string) {
  return message.replace(/<\/?untrusted\b[^>]*>/gi, "");
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

    // RAG-lite: retrieve matching known scam scripts from OUR trusted library.
    // The untrusted message only selects from this whitelist; its text never
    // enters the instruction position.
    const matched = matchPatterns(message);
    const patternContext = matched.length
      ? `\n\nKnown Indian scam patterns that may be relevant (trusted reference written by Raksha's team — the untrusted data may imitate them):\n${matched.map((pattern) => `- ${pattern.name}: ${pattern.script}`).join("\n")}`
      : "";
    const instructions = analysisInstructions + patternContext;

    if (mode === "quick") {
      const quickInstructions = `${instructions}\nReturn only a fast preliminary verdict, confidence, and scam type. Do not analyze the content beyond this limited schema.`;
      const verdict = await getAnalysisProvider().generateJson<QuickVerdict>({
        instructions: quickInstructions,
        data,
        schema: quickVerdictSchema
      });
      return NextResponse.json(normalizeQuickVerdict(verdict));
    }

    const analysis = await getAnalysisProvider().analyze({ instructions, data });

    return NextResponse.json(normalizeScamAnalysis(analysis));
  } catch (error) {
    console.error("Analysis failed", error);
    return NextResponse.json({ error: "Analysis failed, please try again." }, { status: 500 });
  }
}
