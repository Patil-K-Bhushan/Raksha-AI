/** capConfidence is the single source of truth for FIX 1 — used by the API route and every UI surface. */
import { describe, expect, it } from "vitest";
import { CONFIDENCE_HARD_CAP, LIKELY_SAFE_CONFIDENCE_CAP, capConfidence } from "../lib/scam-analysis";

describe("capConfidence", () => {
  it("never allows 100% for any verdict", () => {
    expect(capConfidence(100, "scam")).toBe(95);
    expect(capConfidence(100, "suspicious")).toBe(95);
    expect(capConfidence(100, "likely_safe")).toBe(85);
  });

  it("caps likely_safe at 85 and others at 95", () => {
    expect(capConfidence(99, "likely_safe")).toBe(LIKELY_SAFE_CONFIDENCE_CAP);
    expect(capConfidence(99, "scam")).toBe(CONFIDENCE_HARD_CAP);
  });

  it("passes through values already under the cap", () => {
    expect(capConfidence(80, "scam")).toBe(80);
    expect(capConfidence(60, "likely_safe")).toBe(60);
  });

  it("clamps out-of-range and non-numeric input", () => {
    expect(capConfidence(-10, "scam")).toBe(0);
    expect(capConfidence(Number.NaN, "scam")).toBe(0);
    expect(capConfidence(120, "suspicious")).toBe(95);
  });
});
