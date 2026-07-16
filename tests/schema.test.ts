/**
 * Guards on the shared JSON schema (lib/scam-analysis.ts) — LIMITATIONS rules 2 & 3.
 * These are cheap regression tripwires: if anyone reintroduces offsets or a
 * "safe" verdict tier, this fails immediately.
 */
import { describe, expect, it } from "vitest";
import { analysisSchema } from "../lib/scam-analysis";

describe("analysisSchema", () => {
  it("constrains verdict to scam | suspicious | likely_safe — 'safe' is not representable", () => {
    expect(analysisSchema.properties.verdict.enum).toEqual(["scam", "suspicious", "likely_safe"]);
    expect(analysisSchema.properties.verdict.enum as readonly string[]).not.toContain("safe");
  });

  it("asks for exact substrings, never character offsets", () => {
    const flat = JSON.stringify(analysisSchema);
    expect(flat).not.toMatch(/start_index|offset|char_/i);
    expect(analysisSchema.properties.segments.items.required).toEqual(["text", "tactic", "explanation"]);
  });

  it("requires the injection-detection fields (LIMITATIONS rule 1, layer 3)", () => {
    expect(analysisSchema.required).toContain("injection_detected");
    expect(analysisSchema.required).toContain("injection_explanation");
  });

  it("requires all three language outputs for Grandma Mode", () => {
    expect(analysisSchema.properties.language_outputs.required).toEqual(["hi", "mr", "en"]);
  });

  it("bounds confidence to 0–100", () => {
    expect(analysisSchema.properties.confidence.minimum).toBe(0);
    expect(analysisSchema.properties.confidence.maximum).toBe(100);
  });
});
