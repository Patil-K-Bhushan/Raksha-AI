/**
 * Source-level tripwires for UI rules that have no render-test harness here:
 *  - the injection "second wow" banner keeps its exact demo copy
 *  - both the single view and Inbox Scan render it on injection_detected
 *  - no UI surface prints raw (uncapped) confidence
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(join(__dirname, "..", "app", file), "utf8");

describe("injection banner (ADVANCE 2)", () => {
  it("keeps the exact wow-moment copy", () => {
    const source = read("trap-map.tsx");
    expect(source).toContain("AI manipulation attempt");
    expect(source).toContain("This message contains hidden text trying to fool automated scam checkers. Only a scammer does this.");
  });

  it("is rendered on injection_detected in both single view and Inbox Scan", () => {
    expect(read("scam-analyzer.tsx")).toMatch(/injection_detected && <InjectionBanner/);
    expect(read("inbox-scan.tsx")).toMatch(/injection_detected && <InjectionBanner/);
  });
});

describe("confidence display (FIX 1)", () => {
  it("every confidence rendered in the UI goes through capConfidence", () => {
    for (const file of ["scam-analyzer.tsx", "inbox-scan.tsx"]) {
      const source = read(file);
      const rendersConfidence = source.includes("confidence");
      if (rendersConfidence) {
        expect(source, `${file} must render confidence via capConfidence`).toContain("capConfidence(");
      }
    }
  });
});

describe("verdict copy (rule 3)", () => {
  it("likely_safe label never reads as plain 'safe'", () => {
    const source = read("trap-map.tsx");
    expect(source).toContain("Likely safe — stay cautious");
    expect(source).not.toMatch(/label[^"]*"Safe"/);
  });
});
