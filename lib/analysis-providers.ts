import { randomUUID } from "crypto";
import { GoogleGenAI } from "@google/genai";
import {
  analysisSchema,
  audioAnalysisSchema,
  imageAnalysisSchema,
  type AudioScamAnalysis,
  type ImageScamAnalysis,
  type ScamAnalysis
} from "./scam-analysis";

export type ProviderName = "gemini" | "groq" | "openai";

export type ImageInput = { instructions: string; imageBase64: string; mimeType: string };
export type AudioInput = { instructions: string; audioBase64: string; mimeType: string };

export interface AnalysisProvider {
  analyze(input: { instructions: string; data: string }): Promise<ScamAnalysis>;
  analyzeImage(input: ImageInput): Promise<ImageScamAnalysis>;
  analyzeAudio(input: AudioInput): Promise<AudioScamAnalysis>;
  generateJson<T>(input: { instructions: string; data: string; schema: object }): Promise<T>;
}

class GeminiProvider implements AnalysisProvider {
  private readonly client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async analyze(input: { instructions: string; data: string }): Promise<ScamAnalysis> {
    return this.generateJson<ScamAnalysis>({ ...input, schema: analysisSchema });
  }

  async analyzeAudio(input: AudioInput): Promise<AudioScamAnalysis> {
    const response = await this.client.models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: input.mimeType, data: input.audioBase64 } },
            { text: "Transcribe and analyze this recording now." }
          ]
        }
      ],
      config: {
        systemInstruction: input.instructions,
        responseMimeType: "application/json",
        responseJsonSchema: audioAnalysisSchema
      }
    });

    if (!response.text) {
      throw new Error("The Gemini analysis service returned no result.");
    }

    return JSON.parse(response.text) as AudioScamAnalysis;
  }

  async analyzeImage(input: ImageInput): Promise<ImageScamAnalysis> {
    const response = await this.client.models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: input.mimeType, data: input.imageBase64 } },
            { text: "Analyze the screenshot now." }
          ]
        }
      ],
      config: {
        systemInstruction: input.instructions,
        responseMimeType: "application/json",
        responseJsonSchema: imageAnalysisSchema
      }
    });

    if (!response.text) {
      throw new Error("The Gemini analysis service returned no result.");
    }

    return JSON.parse(response.text) as ImageScamAnalysis;
  }

  async generateJson<T>(input: { instructions: string; data: string; schema: object }): Promise<T> {
    const response = await this.client.models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest",
      contents: [
        { role: "user", parts: [{ text: input.data }] }
      ],
      config: {
        systemInstruction: input.instructions,
        responseMimeType: "application/json",
        responseJsonSchema: input.schema
      }
    });

    if (!response.text) {
      throw new Error("The Gemini analysis service returned no result.");
    }

    return JSON.parse(response.text) as T;
  }
}

/**
 * OpenAI strict structured outputs reject `minimum`/`maximum` keywords.
 * Bounds are enforced server-side anyway (capConfidence), so strip them.
 */
export function stripUnsupportedSchemaKeys(schema: unknown): object {
  if (Array.isArray(schema)) return schema.map(stripUnsupportedSchemaKeys) as unknown as object;
  if (schema === null || typeof schema !== "object") return schema as unknown as object;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
    if (key === "minimum" || key === "maximum") continue;
    result[key] = typeof value === "object" && value !== null ? stripUnsupportedSchemaKeys(value) : value;
  }
  return result;
}

/** OpenAI and Groq share the /chat/completions structured-output shape. */
class OpenAICompatibleProvider implements AnalysisProvider {
  constructor(private readonly config: { apiKey: string; baseUrl: string; model: string; label: string; transcriptionModel: string }) {}

  async analyze(input: { instructions: string; data: string }): Promise<ScamAnalysis> {
    return this.generateJson<ScamAnalysis>({ ...input, schema: analysisSchema });
  }

  /** Whisper-style transcription, then the standard delimiter-wrapped text pipeline. */
  async analyzeAudio(input: AudioInput): Promise<AudioScamAnalysis> {
    const form = new FormData();
    form.append("file", new Blob([Buffer.from(input.audioBase64, "base64")], { type: input.mimeType }), "recording.webm");
    form.append("model", this.config.transcriptionModel);

    const transcriptionResponse = await fetch(`${this.config.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
      body: form
    });
    if (!transcriptionResponse.ok) {
      throw new Error(`The ${this.config.label} transcription request failed (${transcriptionResponse.status}).`);
    }
    const transcript = ((await transcriptionResponse.json()) as { text?: string }).text ?? "";
    if (!transcript.trim()) {
      throw new Error(`The ${this.config.label} transcription returned no speech.`);
    }

    const delimiter = `untrusted-${randomUUID()}`;
    const sanitized = transcript.replace(/<\/?untrusted\b[^>]*>/gi, "");
    const analysis = await this.generateJson<AudioScamAnalysis>({
      instructions: `${input.instructions}\nThe recording was already transcribed; the transcript is supplied as the untrusted data inside the random delimiter. Copy it into the transcript field exactly.`,
      data: `<${delimiter}>\n${sanitized}\n</${delimiter}>`,
      schema: audioAnalysisSchema
    });
    return { ...analysis, transcript: analysis.transcript || sanitized };
  }

  async analyzeImage(input: ImageInput): Promise<ImageScamAnalysis> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: "system", content: input.instructions },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze the screenshot now." },
              { type: "image_url", image_url: { url: `data:${input.mimeType};base64,${input.imageBase64}` } }
            ]
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "raksha_image_output", strict: true, schema: stripUnsupportedSchemaKeys(imageAnalysisSchema) }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`The ${this.config.label} analysis service request failed (${response.status}).`);
    }

    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = payload.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error(`The ${this.config.label} analysis service returned no result.`);
    }

    return JSON.parse(text) as ImageScamAnalysis;
  }

  async generateJson<T>(input: { instructions: string; data: string; schema: object }): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: "system", content: input.instructions },
          { role: "user", content: input.data }
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "raksha_output", strict: true, schema: stripUnsupportedSchemaKeys(input.schema) }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`The ${this.config.label} analysis service request failed (${response.status}).`);
    }

    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = payload.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error(`The ${this.config.label} analysis service returned no result.`);
    }

    return JSON.parse(text) as T;
  }
}

export function getAnalysisProvider(): AnalysisProvider {
  const provider = (process.env.LLM_PROVIDER ?? "gemini").toLowerCase();

  if (provider === "gemini") {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured.");
    return new GeminiProvider(process.env.GEMINI_API_KEY);
  }

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured.");
    return new OpenAICompatibleProvider({
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      label: "OpenAI",
      transcriptionModel: process.env.OPENAI_TRANSCRIPTION_MODEL ?? "whisper-1"
    });
  }

  if (provider === "groq") {
    if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured.");
    return new OpenAICompatibleProvider({
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      label: "Groq",
      transcriptionModel: process.env.GROQ_TRANSCRIPTION_MODEL ?? "whisper-large-v3"
    });
  }

  throw new Error("LLM_PROVIDER must be gemini, groq, or openai.");
}
