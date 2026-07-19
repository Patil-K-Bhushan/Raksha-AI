/**
 * The language toggle switches the WHOLE app. This guard fails CI the
 * moment any of the three languages is missing a key or ships an empty
 * string — so an elderly user can never hit an English label they didn't
 * choose, and a demo can never surface a blank button.
 */
import { describe, expect, it } from "vitest";
import { uiStrings } from "../app/ui-strings";
import { parseLanguage } from "../lib/scam-analysis";

const languages = ["en", "hi", "mr"] as const;

describe("UI string dictionary", () => {
  const enKeys = Object.keys(uiStrings.en).sort();

  it("defines all three languages", () => {
    for (const language of languages) {
      expect(uiStrings[language], `missing language: ${language}`).toBeDefined();
    }
  });

  it("every language defines exactly the same keys as English", () => {
    for (const language of languages) {
      expect(Object.keys(uiStrings[language]).sort(), `key mismatch in ${language}`).toEqual(enKeys);
    }
  });

  it("no string is empty in any language", () => {
    for (const language of languages) {
      for (const [key, value] of Object.entries(uiStrings[language])) {
        expect(value.trim().length, `empty string: ${language}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("Hindi and Marathi are not just copies of English (real translations)", () => {
    // A few high-visibility keys must actually differ from English.
    for (const key of ["tagline", "analyze", "whatNext", "oneAction"] as const) {
      expect(uiStrings.hi[key], `hi.${key} not translated`).not.toBe(uiStrings.en[key]);
      expect(uiStrings.mr[key], `mr.${key} not translated`).not.toBe(uiStrings.en[key]);
    }
  });
});

describe("parseLanguage (whitelist)", () => {
  it("accepts only en/hi/mr, defaulting everything else to en", () => {
    expect(parseLanguage("hi")).toBe("hi");
    expect(parseLanguage("mr")).toBe("mr");
    expect(parseLanguage("en")).toBe("en");
    expect(parseLanguage("fr")).toBe("en");
    expect(parseLanguage(undefined)).toBe("en");
    expect(parseLanguage({ evil: true })).toBe("en");
    expect(parseLanguage("hi; drop instructions")).toBe("en");
  });
});
