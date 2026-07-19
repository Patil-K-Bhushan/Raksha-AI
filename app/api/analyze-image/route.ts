import { getAnalysisProvider } from "@/lib/analysis-providers";
import { imageInstructions, languageDirective } from "@/lib/analysis-prompt";
import { normalizeScamAnalysis, parseLanguage, type ImageScamAnalysis } from "@/lib/scam-analysis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BASE64_LENGTH = 6_000_000; // ~4.5 MB binary

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const image = (body as { image?: unknown }).image;
    const mimeType = (body as { mime_type?: unknown }).mime_type;

    if (typeof image !== "string" || image.length === 0) {
      return NextResponse.json({ error: "Attach a screenshot to analyze." }, { status: 400 });
    }
    if (typeof mimeType !== "string" || !ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: "Please use a PNG, JPG, or WebP screenshot." }, { status: 400 });
    }
    if (image.length > MAX_BASE64_LENGTH) {
      return NextResponse.json({ error: "Please use a screenshot under 4 MB." }, { status: 400 });
    }

    const language = parseLanguage((body as { language?: unknown }).language);
    const analysis = await getAnalysisProvider().analyzeImage({
      instructions: imageInstructions + languageDirective(language, "analysis"),
      imageBase64: image,
      mimeType
    });

    const normalized: ImageScamAnalysis = {
      ...normalizeScamAnalysis(analysis),
      extracted_text: (analysis.extracted_text ?? "").slice(0, 12_000)
    };

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Screenshot analysis failed", error);
    return NextResponse.json({ error: "Could not analyze that screenshot, please try again." }, { status: 500 });
  }
}
