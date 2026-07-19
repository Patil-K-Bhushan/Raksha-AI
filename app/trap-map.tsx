"use client";

import { useState } from "react";
import type { Verdict } from "@/lib/scam-analysis";

export type Segment = { text: string; tactic: string; explanation: string };
export type ResolvedSegment = Segment & { start: number; end: number };
export type Language = "en" | "hi" | "mr";

export const verdictStyles: Record<Verdict, string> = {
  scam: "border-red-300 bg-red-50 text-red-950",
  suspicious: "border-amber-300 bg-amber-50 text-amber-950",
  likely_safe: "border-emerald-300 bg-emerald-50 text-emerald-950"
};

export const verdictChipStyles: Record<Verdict, string> = {
  scam: "border-red-300 bg-red-100 text-red-900",
  suspicious: "border-amber-300 bg-amber-100 text-amber-900",
  likely_safe: "border-emerald-300 bg-emerald-100 text-emerald-900"
};

/** Never the word "safe" alone — LIMITATIONS.md rule 3. */
export const verdictLabels: Record<Verdict, Record<Language, string>> = {
  scam: { en: "Scam", hi: "धोखा — Scam", mr: "फसवणूक — Scam" },
  suspicious: { en: "Suspicious", hi: "संदिग्ध — सावधान", mr: "संशयास्पद — सावध" },
  likely_safe: { en: "Likely safe — stay cautious", hi: "शायद ठीक — सतर्क रहें", mr: "बहुधा ठीक — सावध रहा" }
};

export const shortVerdictLabels: Record<Verdict, string> = {
  scam: "Scam",
  suspicious: "Suspicious",
  likely_safe: "Likely safe"
};

const tactics = {
  "fake authority": { label: "Fake authority", style: "border-red-300 bg-red-100 text-red-950" },
  urgency: { label: "Urgency", style: "border-orange-300 bg-orange-100 text-orange-950" },
  "fear/threat": { label: "Fear / threat", style: "border-amber-300 bg-amber-100 text-amber-950" },
  fearmongering: { label: "Fear / threat", style: "border-amber-300 bg-amber-100 text-amber-950" },
  greed: { label: "Greed hook", style: "border-violet-300 bg-violet-100 text-violet-950" },
  extraction: { label: "Extraction point", style: "border-sky-300 bg-sky-100 text-sky-950" }
} as const;

export function tacticStyle(tactic: string) {
  const normalized = tactic.toLowerCase();
  if (normalized.includes("extract") || normalized.includes("otp") || normalized.includes("payment")) return tactics.extraction;
  if (normalized.includes("greed") || normalized.includes("reward") || normalized.includes("hook")) return tactics.greed;
  if (normalized.includes("fear") || normalized.includes("threat")) return tactics["fear/threat"];
  if (normalized.includes("urgency") || normalized.includes("pressure")) return tactics.urgency;
  if (normalized.includes("authority") || normalized.includes("impersonat")) return tactics["fake authority"];
  return tactics[normalized as keyof typeof tactics] ?? { label: tactic, style: "border-stone-300 bg-stone-100 text-stone-950" };
}

export function resolveSegments(message: string, segments: Segment[]): ResolvedSegment[] {
  const occurrences = new Map<string, number>();
  return segments
    .map((segment) => {
      if (!segment.text) return null;
      const seen = occurrences.get(segment.text) ?? 0;
      let start = -1;
      let from = 0;
      for (let index = 0; index <= seen; index += 1) {
        start = message.indexOf(segment.text, from);
        if (start === -1) return null;
        from = start + segment.text.length;
      }
      occurrences.set(segment.text, seen + 1);
      return { ...segment, start, end: start + segment.text.length };
    })
    .filter((segment): segment is ResolvedSegment => segment !== null)
    .sort((first, second) => first.start - second.start)
    .filter((segment, index, all) => index === 0 || segment.start >= all[index - 1].end);
}

export function TrapMap({ message, segments }: { message: string; segments: Segment[] }) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const resolved = resolveSegments(message, segments);
  let cursor = 0;

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-2" aria-label="Trap Map legend">
        {Object.entries(tactics).filter(([key]) => !["fearmongering"].includes(key)).map(([key, value]) => (
          <span key={key} className={`rounded-full border px-2.5 py-1 text-xs font-bold ${value.style}`}>{value.label}</span>
        ))}
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-4 text-base leading-8 text-stone-800 shadow-sm sm:p-5">
        {resolved.map((segment) => {
          const before = message.slice(cursor, segment.start);
          cursor = segment.end;
          const key = `${segment.start}-${segment.text}`;
          const style = tacticStyle(segment.tactic);
          const isOpen = activeTooltip === key;
          return (
            <span key={key}>
              {before}
              <span className="relative mx-0.5 inline-block">
                <button type="button" onClick={() => setActiveTooltip(isOpen ? null : key)} onBlur={() => setActiveTooltip(null)} className={`rounded border px-1.5 py-1 font-medium underline decoration-dotted underline-offset-4 ${style.style}`} title={segment.explanation} aria-expanded={isOpen}>
                  {segment.text}<span className="ml-1 text-[10px] font-black uppercase tracking-wide">[{style.label}]</span>
                </button>
                {isOpen && <span role="tooltip" className="absolute z-10 left-0 top-full mt-2 w-60 rounded-xl bg-stone-950 p-3 text-sm leading-5 text-white shadow-xl">{segment.explanation}</span>}
              </span>
            </span>
          );
        })}
        {message.slice(cursor)}
        {resolved.length === 0 && segments.length === 0 && (
          <p className="mt-3 border-t border-stone-100 pt-3 text-sm text-stone-500">No manipulation tactics highlighted in this message.</p>
        )}
      </div>
    </>
  );
}

const goldenHourCopy: Record<Language, { title: string; steps: string[] }> = {
  en: {
    title: "Already paid or shared an OTP? Act in the golden hour",
    steps: [
      "Call 1930 now — the national cybercrime helpline.",
      "Tell your bank to freeze the transaction immediately.",
      "File at cybercrime.gov.in with the transaction details.",
      "Reported fast, money is often frozen and returned."
    ]
  },
  hi: {
    title: "पैसे चले गए या OTP दे दिया? पहला घंटा सबसे ज़रूरी है",
    steps: [
      "अभी 1930 पर call करें।",
      "Bank को बोलें transaction रोकें।",
      "cybercrime.gov.in पर report करें।",
      "जल्दी report करने पर पैसे अक्सर वापस मिलते हैं।"
    ]
  },
  mr: {
    title: "पैसे गेले किंवा OTP दिला? पहिला तास महत्त्वाचा",
    steps: [
      "आत्ता 1930 वर call करा.",
      "Bank ला transaction थांबवायला सांगा.",
      "cybercrime.gov.in वर report करा.",
      "लवकर report केल्यास पैसे अनेकदा परत मिळतात."
    ]
  }
};

/** The Pune ₹35,000 recovery playbook: fast reporting gets money frozen and returned. */
export function GoldenHourCard({ language }: { language: Language }) {
  const content = goldenHourCopy[language];
  return (
    <div className="rounded-2xl border-2 border-red-600 bg-white p-5 shadow-sm" role="note">
      <p className="text-lg font-black leading-7 text-red-700">⏱ {content.title}</p>
      <ol className="mt-3 space-y-2">
        {content.steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-base font-bold leading-7 text-stone-800">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-black text-white">{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** ADVANCE 2 — the "second wow": an injection attempt is itself evidence of fraud. */
export function InjectionBanner({ explanation }: { explanation: string }) {
  return (
    <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-4 text-red-950 shadow-sm sm:p-5" role="alert">
      <p className="font-black">🚨 AI manipulation attempt</p>
      <p className="mt-1 font-bold">This message contains hidden text trying to fool automated scam checkers. Only a scammer does this.</p>
      {explanation && <p className="mt-3 text-sm">{explanation}</p>}
    </div>
  );
}
