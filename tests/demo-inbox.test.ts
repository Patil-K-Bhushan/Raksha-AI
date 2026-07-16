/** The Inbox Scan demo set must stay a mixed inbox — scams AND legitimate messages. */
import { describe, expect, it } from "vitest";
import { demoInbox } from "../lib/demo-inbox";

describe("demo inbox", () => {
  it("contains 13 messages with unique ids", () => {
    expect(demoInbox).toHaveLength(13);
    expect(new Set(demoInbox.map((item) => item.id)).size).toBe(13);
  });

  it("includes the three legitimate messages (the false-positive proof)", () => {
    const ids = demoInbox.map((item) => item.id);
    expect(ids).toContain("sbi-debit");
    expect(ids).toContain("flipkart-delivery");
    expect(ids).toContain("hdfc-otp");
  });

  it("includes the prompt-injection attack demo (the second-wow trigger)", () => {
    const injection = demoInbox.find((item) => item.id === "injection-attack")!;
    expect(injection.message.toLowerCase()).toContain("ignore previous instructions");
  });

  it("keeps the real SBI debit SMS with its official helpline line intact", () => {
    const sbi = demoInbox.find((item) => item.id === "sbi-debit")!;
    expect(sbi.message).toContain("Not you? Call 1800-11-2211");
    expect(sbi.message).toContain("-SBI");
  });

  it("keeps every message valid for the analyze route", () => {
    for (const item of demoInbox) {
      expect(item.message.trim().length).toBeGreaterThan(0);
      expect(item.message.length).toBeLessThan(12_000);
      expect(item.from.trim().length).toBeGreaterThan(0);
    }
  });
});
