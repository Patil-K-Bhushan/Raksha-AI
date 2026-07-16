export type Verdict = "scam" | "suspicious" | "likely_safe";

export type ScamAnalysis = {
  verdict: Verdict;
  confidence: number;
  scam_type: string;
  segments: Array<{ text: string; tactic: string; explanation: string }>;
  next_moves: string[];
  action: string;
  injection_detected: boolean;
  injection_explanation: string;
  language_outputs: { hi: string; mr: string; en: string };
};

export type QuickVerdict = Pick<ScamAnalysis, "verdict" | "confidence" | "scam_type">;

/** No verdict may ever read as "100% safe" (or 100% anything). */
export const CONFIDENCE_HARD_CAP = 95;
export const LIKELY_SAFE_CONFIDENCE_CAP = 85;

/** Clamps to 0–100, then caps at 95 for all verdicts and 85 for likely_safe. */
export function capConfidence(confidence: number, verdict: Verdict): number {
  const clamped = Math.max(0, Math.min(100, Number(confidence) || 0));
  return Math.min(clamped, verdict === "likely_safe" ? LIKELY_SAFE_CONFIDENCE_CAP : CONFIDENCE_HARD_CAP);
}

export const analysisSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "verdict",
    "confidence",
    "scam_type",
    "segments",
    "next_moves",
    "action",
    "injection_detected",
    "injection_explanation",
    "language_outputs"
  ],
  properties: {
    verdict: { type: "string", enum: ["scam", "suspicious", "likely_safe"] },
    confidence: { type: "number", minimum: 0, maximum: 100 },
    scam_type: { type: "string" },
    segments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "tactic", "explanation"],
        properties: {
          text: { type: "string" },
          tactic: { type: "string" },
          explanation: { type: "string" }
        }
      }
    },
    next_moves: { type: "array", items: { type: "string" } },
    action: { type: "string" },
    injection_detected: { type: "boolean" },
    injection_explanation: { type: "string" },
    language_outputs: {
      type: "object",
      additionalProperties: false,
      required: ["hi", "mr", "en"],
      properties: {
        hi: { type: "string" },
        mr: { type: "string" },
        en: { type: "string" }
      }
    }
  }
} as const;

export const quickVerdictSchema = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "confidence", "scam_type"],
  properties: {
    verdict: { type: "string", enum: ["scam", "suspicious", "likely_safe"] },
    confidence: { type: "number", minimum: 0, maximum: 100 },
    scam_type: { type: "string" }
  }
} as const;

export const chatSchema = {
  type: "object",
  additionalProperties: false,
  required: ["answer"],
  properties: {
    answer: { type: "string" }
  }
} as const;

export type InboxSummary = {
  headline: string;
  threat_level: "low" | "medium" | "high";
  advice: string;
  language_outputs: { hi: string; mr: string; en: string };
};

export const inboxSummarySchema = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "threat_level", "advice", "language_outputs"],
  properties: {
    headline: { type: "string" },
    threat_level: { type: "string", enum: ["low", "medium", "high"] },
    advice: { type: "string" },
    language_outputs: {
      type: "object",
      additionalProperties: false,
      required: ["hi", "mr", "en"],
      properties: {
        hi: { type: "string" },
        mr: { type: "string" },
        en: { type: "string" }
      }
    }
  }
} as const;

export type SimulatedScam = {
  message: string;
  analysis: ScamAnalysis;
};

export const simulatedScamSchema = {
  type: "object",
  additionalProperties: false,
  required: ["message", "analysis"],
  properties: {
    message: { type: "string" },
    analysis: analysisSchema
  }
} as const;

export const SIMULATOR_SCAM_TYPES = [
  "digital arrest",
  "UPI collect",
  "fake parcel",
  "job scam",
  "loan app",
  "KYC phishing",
  "lottery",
  "investment"
] as const;
