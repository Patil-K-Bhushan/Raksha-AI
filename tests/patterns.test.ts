/** RAG-lite retrieval: deterministic, whitelist-only, capped at 3 patterns. */
import { describe, expect, it } from "vitest";
import { matchPatterns, scamPatterns } from "../lib/scam-patterns";

describe("scam pattern library", () => {
  it("has unique ids and non-empty scripts", () => {
    expect(new Set(scamPatterns.map((pattern) => pattern.id)).size).toBe(scamPatterns.length);
    for (const pattern of scamPatterns) {
      expect(pattern.script.length).toBeGreaterThan(40);
      expect(pattern.keywords.length).toBeGreaterThan(2);
    }
  });

  it("covers the Pune gas-bill video-call scam", () => {
    const matched = matchPatterns("Officer on video call about MNGL piped gas bill KYC update");
    expect(matched.map((pattern) => pattern.id)).toContain("utility-video-call");
  });
});

describe("matchPatterns", () => {
  it("retrieves digital arrest for a digital-arrest script", () => {
    const matched = matchPatterns("CBI police: your parcel with Aadhaar is under digital arrest, join video call");
    expect(matched[0]?.id).toBe("digital-arrest");
  });

  it("returns nothing for benign text", () => {
    expect(matchPatterns("Lunch at 1pm tomorrow?")).toEqual([]);
  });

  it("never returns more than 3 patterns", () => {
    const everything = scamPatterns.flatMap((pattern) => pattern.keywords).join(" ");
    expect(matchPatterns(everything).length).toBeLessThanOrEqual(3);
  });

  it("is case-insensitive", () => {
    expect(matchPatterns("YOUR KYC WILL EXPIRE TODAY").length).toBeGreaterThan(0);
  });
});
