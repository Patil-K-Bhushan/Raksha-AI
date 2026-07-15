"use client";

import { FormEvent, useState } from "react";

type Segment = { text: string; tactic: string; explanation: string };
type Analysis = {
  verdict: "scam" | "suspicious" | "likely_safe";
  confidence: number;
  scam_type: string;
  segments: Segment[];
  next_moves: string[];
  action: string;
  injection_detected: boolean;
  injection_explanation: string;
  language_outputs: { hi: string; mr: string; en: string };
};

type ResolvedSegment = Segment & { start: number; end: number };

const verdictStyles = {
  scam: "border-red-300 bg-red-50 text-red-950",
  suspicious: "border-amber-300 bg-amber-50 text-amber-950",
  likely_safe: "border-emerald-300 bg-emerald-50 text-emerald-950"
};

function resolveSegments(message: string, segments: Segment[]): ResolvedSegment[] {
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

function TrapMap({ message, segments }: { message: string; segments: Segment[] }) {
  const resolved = resolveSegments(message, segments);
  let cursor = 0;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 leading-8 text-stone-800 shadow-sm">
      {resolved.map((segment) => {
        const before = message.slice(cursor, segment.start);
        cursor = segment.end;
        return (
          <span key={`${segment.start}-${segment.text}`}>
            {before}
            <mark className="mx-0.5 rounded bg-amber-200 px-1.5 py-1 text-stone-900" title={segment.explanation}>
              {segment.text}
              <span className="ml-1 text-xs font-bold uppercase tracking-wide text-amber-900">[{segment.tactic}]</span>
            </mark>
          </span>
        );
      })}
      {message.slice(cursor)}
    </div>
  );
}

export default function ScamAnalyzer() {
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setAnalysis(null);

    if (!message.trim()) {
      setError("Paste a message first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const payload = (await response.json()) as Analysis | { error: string };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Analysis failed.");
      }
      setAnalysis(payload);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f2] px-5 py-10 sm:px-8">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">Raksha</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-tight text-stone-950 sm:text-5xl">Scam autopsy, not scam detection.</h1>
        <p className="mt-4 max-w-xl text-lg text-stone-600">Paste a suspicious message. Raksha shows the traps before they work.</p>

        <form onSubmit={analyze} className="mt-8">
          <label htmlFor="message" className="sr-only">Suspicious message</label>
          <textarea
            id="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Paste an SMS, WhatsApp forward, email, or offer here..."
            className="min-h-56 w-full resize-y rounded-2xl border border-stone-300 bg-white p-5 text-base leading-7 text-stone-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-500">Nothing is stored. No account. Analyzed and discarded.</p>
            <button type="submit" disabled={loading} className="rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70">
              {loading ? "Analyzing…" : "Analyze message"}
            </button>
          </div>
          {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        </form>

        {analysis && (
          <section className="mt-10 space-y-6" aria-live="polite">
            <div className={`rounded-2xl border p-5 ${verdictStyles[analysis.verdict]}`}>
              <p className="text-sm font-bold uppercase tracking-wide">Verdict</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
                <h2 className="text-3xl font-black">{analysis.verdict.replace("_", " ")}</h2>
                <span className="font-semibold">{Math.round(analysis.confidence)}% confidence</span>
              </div>
              <p className="mt-2 text-sm font-medium">{analysis.scam_type}</p>
            </div>

            <div>
              <h2 className="text-xl font-black text-stone-950">Trap Map</h2>
              <p className="mb-3 mt-1 text-sm text-stone-600">Highlighted text is copied directly from the message.</p>
              <TrapMap message={message} segments={analysis.segments} />
            </div>

            {analysis.injection_detected && (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-5 text-red-950">
                <p className="font-black">AI manipulation attempt</p>
                <p className="mt-1 text-sm">{analysis.injection_explanation}</p>
              </div>
            )}

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="font-black text-stone-950">What to do now</h2>
              <p className="mt-2 text-stone-700">{analysis.action}</p>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
