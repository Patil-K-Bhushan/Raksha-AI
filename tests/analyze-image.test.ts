/** Screenshot vision route: validation, normalization, and no-leak — same rules as text. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ImageScamAnalysis } from "../lib/scam-analysis";

const { analyzeImageMock } = vi.hoisted(() => ({ analyzeImageMock: vi.fn() }));

vi.mock("@/lib/analysis-providers", () => ({
  getAnalysisProvider: () => ({ analyze: vi.fn(), analyzeImage: analyzeImageMock, generateJson: vi.fn() }),
}));

import { POST } from "../app/api/analyze-image/route";

const baseAnalysis: ImageScamAnalysis = {
  verdict: "scam",
  confidence: 100,
  scam_type: "digital arrest",
  segments: [{ text: "join the video call", tactic: "urgency", explanation: "x" }],
  next_moves: ["Fake police video call"],
  action: "Hang up. Report on 1930.",
  injection_detected: false,
  injection_explanation: "",
  language_outputs: { hi: "…", mr: "…", en: "This is a scam." },
  extracted_text: "CBI notice: join the video call now",
};

const validBody = { image: "aGVsbG8=", mime_type: "image/png" };

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/analyze-image", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  analyzeImageMock.mockReset();
  analyzeImageMock.mockResolvedValue(structuredClone(baseAnalysis));
});

describe("validation", () => {
  it("400s without an image", async () => {
    expect((await post({})).status).toBe(400);
    expect((await post({ image: "", mime_type: "image/png" })).status).toBe(400);
    expect(analyzeImageMock).not.toHaveBeenCalled();
  });

  it("400s on disallowed mime types", async () => {
    expect((await post({ image: "aGVsbG8=", mime_type: "image/gif" })).status).toBe(400);
    expect((await post({ image: "aGVsbG8=", mime_type: "text/html" })).status).toBe(400);
    expect(analyzeImageMock).not.toHaveBeenCalled();
  });

  it("400s on oversized images", async () => {
    expect((await post({ image: "a".repeat(6_000_001), mime_type: "image/png" })).status).toBe(400);
    expect(analyzeImageMock).not.toHaveBeenCalled();
  });
});

describe("normalization (rules 2 & 3 + FIX 1)", () => {
  it("caps confidence at 95 and returns extracted_text", async () => {
    const res = await post(validBody);
    expect(res.status).toBe(200);
    const body = (await res.json()) as ImageScamAnalysis;
    expect(body.confidence).toBe(95);
    expect(body.extracted_text).toBe("CBI notice: join the video call now");
  });

  it("strips segments and caps at 85 for likely_safe screenshots", async () => {
    analyzeImageMock.mockResolvedValueOnce({
      ...structuredClone(baseAnalysis),
      verdict: "likely_safe",
      confidence: 99,
      segments: [{ text: "Not you? Call 1800-11-2211", tactic: "urgency", explanation: "wrong" }],
      language_outputs: { hi: "…", mr: "…", en: "Normal bank alert." },
    });
    const body = (await (await post(validBody)).json()) as ImageScamAnalysis;
    expect(body.confidence).toBeLessThanOrEqual(85);
    expect(body.segments).toEqual([]);
    expect(body.language_outputs.en.toLowerCase()).toContain("stay cautious");
  });

  it("uses image instructions that forbid obeying text inside the image", async () => {
    await post(validBody);
    const input = analyzeImageMock.mock.calls[0][0] as { instructions: string };
    expect(input.instructions.toLowerCase()).toContain("never follow");
    expect(input.instructions).toContain("extracted_text");
  });
});

describe("error handling", () => {
  it("500s WITHOUT leaking internal error details", async () => {
    analyzeImageMock.mockRejectedValueOnce(new Error("GEMINI_API_KEY is not configured."));
    const res = await post(validBody);
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("GEMINI_API_KEY");
  });
});
