import { getAnalysisProvider } from "@/lib/analysis-providers";
import { audioInstructions, languageDirective } from "@/lib/analysis-prompt";
import { normalizeScamAnalysis, parseLanguage, type AudioScamAnalysis } from "@/lib/scam-analysis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/ogg",
  "audio/webm",
  "audio/wav",
  "audio/aac",
  "audio/amr",
  "audio/3gpp"
];
const MAX_BASE64_LENGTH = 4_000_000; // ~3 MB binary — plenty for voice notes

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const audio = (body as { audio?: unknown }).audio;
    const mimeType = (body as { mime_type?: unknown }).mime_type;

    if (typeof audio !== "string" || audio.length === 0) {
      return NextResponse.json({ error: "Attach a voice note or recording to analyze." }, { status: 400 });
    }
    if (typeof mimeType !== "string" || !ALLOWED_MIME_TYPES.includes(mimeType.split(";")[0])) {
      return NextResponse.json({ error: "Please use a common audio format (MP3, M4A, OGG, WAV, AMR)." }, { status: 400 });
    }
    if (audio.length > MAX_BASE64_LENGTH) {
      return NextResponse.json({ error: "Please keep the recording under 3 MB (about 3-4 minutes)." }, { status: 400 });
    }

    const language = parseLanguage((body as { language?: unknown }).language);
    const analysis = await getAnalysisProvider().analyzeAudio({
      instructions: audioInstructions + languageDirective(language, "analysis"),
      audioBase64: audio,
      mimeType: mimeType.split(";")[0]
    });

    const normalized: AudioScamAnalysis = {
      ...normalizeScamAnalysis(analysis),
      transcript: (analysis.transcript ?? "").slice(0, 12_000)
    };

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Audio analysis failed", error);
    return NextResponse.json({ error: "Could not analyze that recording, please try again." }, { status: 500 });
  }
}
