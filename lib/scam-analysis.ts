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
