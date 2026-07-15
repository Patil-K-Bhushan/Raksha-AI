import { GoogleGenAI } from "@google/genai";
import { analysisSchema, type ScamAnalysis } from "./scam-analysis";

export type ProviderName = "gemini" | "groq" | "openai";

export interface AnalysisProvider {
  analyze(input: { instructions: string; data: string }): Promise<ScamAnalysis>;
}

class GeminiProvider implements AnalysisProvider {
  private readonly client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async analyze(input: { instructions: string; data: string }): Promise<ScamAnalysis> {
    const response = await this.client.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: [
        { role: "user", parts: [{ text: input.data }] }
      ],
      config: {
        systemInstruction: input.instructions,
        responseMimeType: "application/json",
        responseJsonSchema: analysisSchema
      }
    });

    if (!response.text) {
      throw new Error("The Gemini analysis service returned no result.");
    }

    return JSON.parse(response.text) as ScamAnalysis;
  }
}

export function getAnalysisProvider(): AnalysisProvider {
  const provider = (process.env.LLM_PROVIDER ?? "gemini").toLowerCase();

  if (provider !== "gemini" && provider !== "groq" && provider !== "openai") {
    throw new Error("LLM_PROVIDER must be gemini, groq, or openai.");
  }

  if (provider !== "gemini") {
    throw new Error(`${provider} is not configured. Set LLM_PROVIDER=gemini to use the current runtime.`);
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return new GeminiProvider(process.env.GEMINI_API_KEY);
}
