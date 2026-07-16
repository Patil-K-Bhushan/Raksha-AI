"use client";

import { useState } from "react";
import { demoInbox } from "@/lib/demo-inbox";
import { capConfidence, type QuickVerdict, type ScamAnalysis } from "@/lib/scam-analysis";
import { InjectionBanner, TrapMap, shortVerdictLabels, verdictChipStyles, verdictLabels, type Language } from "./trap-map";

type RowStatus = "pending" | "scanning" | "done" | "error";

type Row = {
  id: string;
  from: string;
  message: string;
  status: RowStatus;
  quick?: QuickVerdict;
  full?: ScamAnalysis;
  fullLoading?: boolean;
  fullError?: string;
};

const MAX_MESSAGES = 20;
const CONCURRENCY = 4;

async function postAnalyze(message: string, mode?: "quick") {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, mode })
  });
  const payload = (await response.json()) as (ScamAnalysis & QuickVerdict) | { error: string };
  if (!response.ok || "error" in payload) throw new Error("error" in payload ? payload.error : "Analysis failed.");
  return payload;
}

function parsePasted(raw: string): Row[] {
  return raw
    .split(/\n\s*\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, MAX_MESSAGES)
    .map((message, index) => ({ id: `pasted-${index}`, from: "Pasted message", message, status: "pending" as RowStatus }));
}

export default function InboxScan({ language }: { language: Language }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [rawText, setRawText] = useState("");
  const [scanning, setScanning] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function patchRow(id: string, patch: Partial<Row>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function scan(initial: Row[]) {
    if (initial.length === 0) {
      setError("Paste at least one message, or load the demo inbox.");
      return;
    }
    setError("");
    setExpandedId(null);
    setRows(initial);
    setScanning(true);

    let index = 0;
    async function worker() {
      while (index < initial.length) {
        const row = initial[index];
        index += 1;
        patchRow(row.id, { status: "scanning" });
        try {
          const quick = (await postAnalyze(row.message, "quick")) as QuickVerdict;
          patchRow(row.id, { status: "done", quick });
        } catch {
          patchRow(row.id, { status: "error" });
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, initial.length) }, worker));
    setScanning(false);
  }

  async function toggleExpand(row: Row) {
    const opening = expandedId !== row.id;
    setExpandedId(opening ? row.id : null);
    if (!opening || row.full || row.fullLoading) return;
    patchRow(row.id, { fullLoading: true, fullError: "" });
    try {
      const full = (await postAnalyze(row.message)) as ScamAnalysis;
      patchRow(row.id, { full, fullLoading: false });
    } catch {
      patchRow(row.id, { fullLoading: false, fullError: "Could not load the full Trap Map. Tap to retry." });
    }
  }

  async function retryRow(row: Row) {
    patchRow(row.id, { status: "scanning" });
    try {
      const quick = (await postAnalyze(row.message, "quick")) as QuickVerdict;
      patchRow(row.id, { status: "done", quick });
    } catch {
      patchRow(row.id, { status: "error" });
    }
  }

  const scanned = rows.filter((row) => row.status === "done").length;

  return (
    <section>
      <p className="max-w-xl text-lg text-stone-600">
        Paste several messages at once — separate them with a blank line — and Raksha triages your whole inbox like a spam folder.
      </p>

      <textarea
        value={rawText}
        onChange={(event) => setRawText(event.target.value)}
        placeholder={"Paste multiple messages here…\n\nSeparate each message with a blank line."}
        className="mt-6 min-h-40 w-full resize-y rounded-2xl border border-stone-300 bg-white p-4 text-base leading-7 text-stone-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 sm:p-5"
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-500">Nothing is stored. No account. Analyzed and discarded.</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={scanning}
            onClick={() => void scan(demoInbox.map((item) => ({ ...item, status: "pending" as RowStatus })))}
            className="rounded-xl border-2 border-emerald-700 px-4 py-2.5 font-bold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60"
          >
            Scan demo inbox (12)
          </button>
          <button
            type="button"
            disabled={scanning}
            onClick={() => void scan(parsePasted(rawText))}
            className="rounded-xl bg-emerald-700 px-5 py-2.5 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
          >
            {scanning ? "Scanning…" : "Scan messages"}
          </button>
        </div>
      </div>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {rows.length === 0 && !error && (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white/60 p-6 text-center text-stone-500">
          <p className="font-semibold">Your triaged inbox will appear here.</p>
          <p className="mt-1 text-sm">Red = scam · Yellow = suspicious · Green = likely safe (stay cautious)</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-8">
          <p className="text-sm font-bold text-stone-700" aria-live="polite">
            {scanning ? `Scanning ${scanned}/${rows.length}…` : `Scanned ${scanned}/${rows.length} messages`}
          </p>
          <ul className="mt-3 space-y-2">
            {rows.map((row) => {
              const expanded = expandedId === row.id;
              return (
                <li key={row.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => (row.status === "error" ? void retryRow(row) : void toggleExpand(row))}
                    className="flex w-full items-start gap-3 p-4 text-left"
                    aria-expanded={expanded}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold uppercase tracking-wide text-stone-500">{row.from}</span>
                      <span className={`mt-1 block text-sm leading-6 text-stone-800 ${expanded ? "" : "line-clamp-2"}`}>{row.message}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      {row.status === "scanning" && <span className="rounded-full border border-stone-300 bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-600">Scanning…</span>}
                      {row.status === "pending" && <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-bold text-stone-400">Queued</span>}
                      {row.status === "error" && <span className="rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">Failed — tap to retry</span>}
                      {row.status === "done" && row.quick && (
                        <>
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${verdictChipStyles[row.quick.verdict]}`}>
                            {shortVerdictLabels[row.quick.verdict]}
                          </span>
                          <span className="text-[11px] font-semibold text-stone-500">
                            {Math.round(capConfidence(row.quick.confidence, row.quick.verdict))}%
                          </span>
                        </>
                      )}
                    </span>
                  </button>

                  {expanded && row.status === "done" && (
                    <div className="space-y-4 border-t border-stone-100 p-4">
                      {row.fullLoading && <p className="text-sm font-semibold text-stone-600">Building the full Trap Map…</p>}
                      {row.fullError && (
                        <button type="button" onClick={() => void toggleExpand({ ...row, full: undefined, fullLoading: false })} className="text-sm font-semibold text-red-700 underline">
                          {row.fullError}
                        </button>
                      )}
                      {row.full && (
                        <>
                          {row.full.injection_detected && <InjectionBanner explanation={row.full.injection_explanation} />}
                          <TrapMap message={row.message} segments={row.full.segments} />
                          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-stone-500">{verdictLabels[row.full.verdict][language]}</p>
                            <p className="mt-2 text-lg font-bold leading-7 text-stone-900">{row.full.language_outputs[language]}</p>
                            {language === "en" && <p className="mt-2 text-sm text-stone-700">{row.full.action}</p>}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
