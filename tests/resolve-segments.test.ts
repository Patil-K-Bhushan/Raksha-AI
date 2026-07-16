/**
 * Unit tests for resolveSegments — the Trap Map offset resolver.
 * Covers LIMITATIONS.md rule 3 (§"The Trap Map's actual hard problem"):
 * exact substrings resolved in JS, duplicates by occurrence index,
 * unresolvable (paraphrased) segments dropped silently, never crash.
 *
 * ACTION FOR CODEX (one word, app/scam-analyzer.tsx):
 *   `function resolveSegments(` → `export function resolveSegments(`
 * Claude owns /tests only and must not edit /app files, so the export
 * has to land from the Codex side. Until then only the first test fails.
 */
import { describe, expect, it } from "vitest";
import * as analyzer from "../app/scam-analyzer";

type Segment = { text: string; tactic: string; explanation: string };
type Resolved = Segment & { start: number; end: number };
type ResolveFn = (message: string, segments: Segment[]) => Resolved[];

const resolveSegments = (analyzer as Record<string, unknown>)
  .resolveSegments as ResolveFn | undefined;

const seg = (text: string, tactic = "urgency"): Segment => ({
  text,
  tactic,
  explanation: "test explanation",
});

it("resolveSegments is exported from app/scam-analyzer.tsx", () => {
  expect(
    resolveSegments,
    "resolveSegments is not exported. Codex: add `export` before `function resolveSegments` in app/scam-analyzer.tsx.",
  ).toBeTypeOf("function");
});

describe.runIf(typeof resolveSegments === "function")("resolveSegments", () => {
  const resolve = resolveSegments as ResolveFn;

  it("resolves an exact substring to correct start/end", () => {
    const message = "Your account will be blocked within 2 hours.";
    const [resolved] = resolve(message, [seg("within 2 hours")]);
    expect(resolved.start).toBe(message.indexOf("within 2 hours"));
    expect(resolved.end).toBe(resolved.start + "within 2 hours".length);
    expect(message.slice(resolved.start, resolved.end)).toBe("within 2 hours");
  });

  it("maps duplicate segment texts to successive occurrences", () => {
    const message = "Please send OTP now, or send OTP to this number later.";
    const first = message.indexOf("send OTP");
    const second = message.indexOf("send OTP", first + 1);

    const resolved = resolve(message, [seg("send OTP"), seg("send OTP")]);

    expect(resolved).toHaveLength(2);
    expect(resolved.map((r) => r.start).sort((a, b) => a - b)).toEqual([first, second]);
  });

  it("drops duplicate claims beyond the actual occurrence count", () => {
    const message = "Share OTP once. Share OTP twice.";
    const resolved = resolve(message, [seg("Share OTP"), seg("Share OTP"), seg("Share OTP")]);
    expect(resolved).toHaveLength(2);
  });

  it("silently drops paraphrased segments (indexOf miss returns null internally)", () => {
    const message = "RBI notice: pay the fine immediately or face arrest.";
    const resolved = resolve(message, [
      seg("you must pay a penalty right away"), // paraphrase — not in message
      seg("face arrest", "fear"), // exact — must survive
    ]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].text).toBe("face arrest");
  });

  it("returns empty array (no throw) when nothing resolves", () => {
    const message = "Hello, lunch at 1pm?";
    expect(resolve(message, [seg("send money now"), seg("")])).toEqual([]);
  });

  it("drops segments with empty text", () => {
    const message = "anything";
    expect(resolve(message, [seg("")])).toEqual([]);
  });

  it("drops overlapping spans, keeping the earlier one", () => {
    const message = "urgent: pay within 2 hours or account blocked";
    const long = "pay within 2 hours or account blocked";
    const inner = "2 hours or account"; // fully inside `long`
    const resolved = resolve(message, [seg(long), seg(inner)]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].text).toBe(long);
  });

  it("drops partially overlapping spans", () => {
    const message = "act within 2 hours or account blocked forever";
    const a = "within 2 hours"; // ends inside b's claim
    const b = "2 hours or account blocked"; // starts inside a
    const resolved = resolve(message, [seg(b), seg(a)]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].text).toBe(a); // earlier start wins after sort
  });

  it("keeps adjacent (non-overlapping) spans and returns them sorted by start", () => {
    const message = "This is Delhi Police. Pay now or be arrested.";
    const resolved = resolve(message, [
      seg("Pay now", "extraction"),
      seg("This is Delhi Police", "fake_authority"),
    ]);
    expect(resolved.map((r) => r.text)).toEqual(["This is Delhi Police", "Pay now"]);
    expect(resolved[0].end).toBeLessThanOrEqual(resolved[1].start);
  });
});
