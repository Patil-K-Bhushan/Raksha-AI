/** Provider selection is env-driven; keys must be present, and OpenAI strict schemas must not carry min/max. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAnalysisProvider, stripUnsupportedSchemaKeys } from "../lib/analysis-providers";
import { analysisSchema } from "../lib/scam-analysis";

const ENV_KEYS = ["LLM_PROVIDER", "GEMINI_API_KEY", "OPENAI_API_KEY", "GROQ_API_KEY"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("getAnalysisProvider", () => {
  it("defaults to gemini and requires its key", () => {
    expect(() => getAnalysisProvider()).toThrow(/GEMINI_API_KEY/);
    process.env.GEMINI_API_KEY = "test";
    const provider = getAnalysisProvider();
    expect(provider.analyze).toBeTypeOf("function");
    expect(provider.generateJson).toBeTypeOf("function");
  });

  it("selects openai with its key", () => {
    process.env.LLM_PROVIDER = "openai";
    expect(() => getAnalysisProvider()).toThrow(/OPENAI_API_KEY/);
    process.env.OPENAI_API_KEY = "test";
    expect(getAnalysisProvider().generateJson).toBeTypeOf("function");
  });

  it("selects groq with its key", () => {
    process.env.LLM_PROVIDER = "groq";
    expect(() => getAnalysisProvider()).toThrow(/GROQ_API_KEY/);
    process.env.GROQ_API_KEY = "test";
    expect(getAnalysisProvider().analyze).toBeTypeOf("function");
  });

  it("rejects unknown providers", () => {
    process.env.LLM_PROVIDER = "llama-at-home";
    expect(() => getAnalysisProvider()).toThrow(/must be gemini, groq, or openai/);
  });
});

describe("stripUnsupportedSchemaKeys", () => {
  it("removes minimum/maximum recursively (OpenAI strict mode rejects them)", () => {
    const stripped = JSON.stringify(stripUnsupportedSchemaKeys(analysisSchema));
    expect(stripped).not.toContain('"minimum"');
    expect(stripped).not.toContain('"maximum"');
  });

  it("preserves everything else, including the verdict enum", () => {
    const stripped = stripUnsupportedSchemaKeys(analysisSchema) as typeof analysisSchema;
    expect(stripped.properties.verdict.enum).toEqual(["scam", "suspicious", "likely_safe"]);
    expect(stripped.required).toEqual(analysisSchema.required);
  });
});
