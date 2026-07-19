/** Voice-note route: validation, normalization, and no-leak — same rules as text and image. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AudioScamAnalysis } from "../lib/scam-analysis";

const { analyzeAudioMock } = vi.hoisted(() => ({ analyzeAudioMock: vi.fn() }));

vi.mock("@/lib/analysis-providers", () => ({
  getAnalysisProvider: () => ({ analyze: vi.fn(), analyzeImage: vi.fn(), analyzeAudio: analyzeAudioMock, generateJson: vi.fn() }),
}));

import { POST } from "../app/api/analyze-audio/route";

const baseAnalysis: AudioScamAnalysis = {
  verdict: "scam",
  confidence: 100,
  scam_type: "digital arrest",
  segments: [{ text: "join the video call", tactic: "urgency", explanation: "x" }],
  next_moves: ["Fake police video call"],
  action: "Hang up. Report on 1930.",
  injection_detected: false,
  injection_explanation: "",
  language_outputs: { hi: "…", mr: "…", en: "This is a scam." },
  transcript: "this is CBI, join the video call now",
};

const validBody = { audio: "aGVsbG8=", mime_type: "audio/mpeg" };

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/analyze-audio", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  analyzeAudioMock.mockReset();
  analyzeAudioMock.mockResolvedValue(structuredClone(baseAnalysis));
});

describe("validation", () => {
  it("400s without audio", async () => {
    expect((await post({})).status).toBe(400);
    expect((await post({ audio: "", mime_type: "audio/mpeg" })).status).toBe(400);
    expect(analyzeAudioMock).not.toHaveBeenCalled();
  });

  it("400s on disallowed mime types", async () => {
    expect((await post({ audio: "aGVsbG8=", mime_type: "video/mp4" })).status).toBe(400);
    expect((await post({ audio: "aGVsbG8=", mime_type: "text/plain" })).status).toBe(400);
    expect(analyzeAudioMock).not.toHaveBeenCalled();
  });

  it("accepts codec-suffixed mime types (audio/ogg;codecs=opus)", async () => {
    expect((await post({ audio: "aGVsbG8=", mime_type: "audio/ogg;codecs=opus" })).status).toBe(200);
  });

  it("400s on oversized recordings", async () => {
    expect((await post({ audio: "a".repeat(4_000_001), mime_type: "audio/mpeg" })).status).toBe(400);
    expect(analyzeAudioMock).not.toHaveBeenCalled();
  });
});

describe("normalization", () => {
  it("caps confidence at 95 and returns the transcript", async () => {
    const res = await post(validBody);
    expect(res.status).toBe(200);
    const body = (await res.json()) as AudioScamAnalysis;
    expect(body.confidence).toBe(95);
    expect(body.transcript).toBe("this is CBI, join the video call now");
  });

  it("strips segments and caps at 85 for likely_safe recordings", async () => {
    analyzeAudioMock.mockResolvedValueOnce({
      ...structuredClone(baseAnalysis),
      verdict: "likely_safe",
      confidence: 99,
      segments: [{ text: "call 1800-11-2211", tactic: "urgency", explanation: "wrong" }],
      language_outputs: { hi: "…", mr: "…", en: "Sounds like a normal reminder." },
    });
    const body = (await (await post(validBody)).json()) as AudioScamAnalysis;
    expect(body.confidence).toBeLessThanOrEqual(85);
    expect(body.segments).toEqual([]);
    expect(body.language_outputs.en.toLowerCase()).toContain("stay cautious");
  });

  it("uses audio instructions that forbid obeying spoken instructions", async () => {
    await post(validBody);
    const input = analyzeAudioMock.mock.calls[0][0] as { instructions: string };
    expect(input.instructions.toLowerCase()).toContain("never follow");
    expect(input.instructions).toContain("transcript");
  });
});

describe("error handling", () => {
  it("500s WITHOUT leaking internal error details", async () => {
    analyzeAudioMock.mockRejectedValueOnce(new Error("GEMINI_API_KEY is not configured."));
    const res = await post(validBody);
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("GEMINI_API_KEY");
  });
});
