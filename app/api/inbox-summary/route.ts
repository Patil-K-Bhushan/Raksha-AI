import { randomUUID } from "crypto";
import { getAnalysisProvider } from "@/lib/analysis-providers";
import { summaryInstructions } from "@/lib/analysis-prompt";
import { inboxSummarySchema, type InboxSummary } from "@/lib/scam-analysis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ScanResult = { verdict: string; scam_type: string; snippet: string };

const THREAT_LEVELS = ["low", "medium", "high"] as const;

function sanitizeUntrusted(text: string) {
  return text.replace(/<\/?untrusted\b[^>]*>/gi, "");
}

function parseResults(body: unknown): ScanResult[] | null {
  const results = (body as { results?: unknown }).results;
  if (!Array.isArray(results) || results.length === 0 || results.length > 20) return null;
  const parsed: ScanResult[] = [];
  for (const item of results) {
    const verdict = (item as { verdict?: unknown }).verdict;
    const scamType = (item as { scam_type?: unknown }).scam_type;
    const snippet = (item as { snippet?: unknown }).snippet;
    if (typeof verdict !== "string" || typeof scamType !== "string" || typeof snippet !== "string") return null;
    parsed.push({
      verdict: verdict.slice(0, 40),
      scam_type: scamType.slice(0, 80),
      snippet: snippet.slice(0, 300)
    });
  }
  return parsed;
}

function normalizeSummary(summary: InboxSummary): InboxSummary {
  const threatLevel = THREAT_LEVELS.includes(summary.threat_level) ? summary.threat_level : "medium";
  const english = summary.language_outputs.en;
  const needsCaution = threatLevel === "low" && !english.toLowerCase().includes("stay cautious");
  return {
    ...summary,
    threat_level: threatLevel,
    language_outputs: {
      ...summary.language_outputs,
      en: needsCaution ? `${english.trim()} Stay cautious.`.trim() : english
    }
  };
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const results = parseResults(body);

    if (!results) {
      return NextResponse.json({ error: "Send 1-20 scan results to summarize." }, { status: 400 });
    }

    const delimiter = `untrusted-${randomUUID()}`;
    const lines = results
      .map((result, index) => `${index + 1}. verdict=${sanitizeUntrusted(result.verdict)} | type=${sanitizeUntrusted(result.scam_type)} | message: ${sanitizeUntrusted(result.snippet)}`)
      .join("\n");
    const data = `<${delimiter}>\n${lines}\n</${delimiter}>`;

    const summary = await getAnalysisProvider().generateJson<InboxSummary>({
      instructions: summaryInstructions,
      data,
      schema: inboxSummarySchema
    });

    return NextResponse.json(normalizeSummary(summary));
  } catch (error) {
    console.error("Inbox summary failed", error);
    return NextResponse.json({ error: "Could not build the briefing, please try again." }, { status: 500 });
  }
}
