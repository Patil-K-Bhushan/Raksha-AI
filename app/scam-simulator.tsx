"use client";

import { useState } from "react";
import { SIMULATOR_SCAM_TYPES, capConfidence, type SimulatedScam } from "@/lib/scam-analysis";
import { InjectionBanner, TrapMap, verdictLabels, verdictStyles, type Language } from "./trap-map";
import { getStrings } from "./ui-strings";

type SimulatorState = SimulatedScam & { scam_type_requested?: string };

export default function ScamSimulator({ language }: { language: Language }) {
  const [simulated, setSimulated] = useState<SimulatorState | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scamType, setScamType] = useState<string>("");
  const t = getStrings(language);

  async function generate() {
    setLoading(true);
    setError("");
    setRevealed(false);
    setSimulated(null);
    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scam_type: scamType || undefined, language })
      });
      const payload = (await response.json()) as SimulatorState | { error: string };
      if (!response.ok || "error" in payload) throw new Error("error" in payload ? payload.error : "Simulation failed.");
      setSimulated(payload);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Simulation failed.");
    } finally {
      setLoading(false);
    }
  }

  const analysis = simulated?.analysis ?? null;

  return (
    <section>
      <p className="max-w-xl text-lg text-stone-600">
        {t.simIntro}
      </p>
      <p className="mt-2 text-sm text-stone-500">{t.simNote}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={scamType}
          onChange={(event) => setScamType(event.target.value)}
          className="rounded-xl border border-stone-300 bg-white px-4 py-3 font-semibold text-stone-700 outline-none focus:border-emerald-600"
          aria-label="Scam type to practice"
        >
          <option value="">{t.surpriseMe}</option>
          {SIMULATOR_SCAM_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={loading}
          className="rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? t.generating : simulated ? t.generateAgain : t.generate}
        </button>
      </div>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {!simulated && !loading && !error && (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white/60 p-6 text-center text-stone-500">
          <p className="font-semibold">{t.simEmptyTitle}</p>
          <p className="mt-1 text-sm">{t.simEmptySub}</p>
        </div>
      )}

      {simulated && (
        <div className="mt-8 space-y-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{t.practiceLabel} · {simulated.scam_type_requested}</p>
            <p className="mt-3 text-base leading-8 text-stone-800">{simulated.message}</p>
          </div>

          {!revealed && (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="w-full rounded-xl border-2 border-stone-950 bg-white px-6 py-3 font-black text-stone-950 transition hover:bg-stone-950 hover:text-white sm:w-auto"
            >
              {t.reveal}
            </button>
          )}

          {revealed && analysis && (
            <div className="space-y-5" aria-live="polite">
              <div className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${verdictStyles[analysis.verdict]}`}>
                <p className="text-sm font-bold uppercase tracking-wide">{t.verdictLabel}</p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
                  <h2 className="text-2xl font-black sm:text-3xl">{verdictLabels[analysis.verdict][language]}</h2>
                  <span className="font-semibold">{Math.round(capConfidence(analysis.confidence, analysis.verdict))}{t.confidence}</span>
                </div>
                <p className="mt-2 text-sm font-bold">{analysis.scam_type}</p>
                <p className="mt-4 text-xl font-black leading-9 sm:text-2xl">{analysis.language_outputs[language]}</p>
              </div>
              {analysis.injection_detected && <InjectionBanner explanation={analysis.injection_explanation} />}
              <TrapMap message={simulated.message} segments={analysis.segments} />
              <div className="rounded-2xl border-2 border-emerald-700 bg-emerald-50 p-5 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-emerald-800">{t.oneAction}</p>
                <p className="mt-2 text-xl font-black leading-8 text-emerald-950">{language === "en" ? analysis.action : analysis.language_outputs[language]}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
