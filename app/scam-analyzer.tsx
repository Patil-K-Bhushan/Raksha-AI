"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { exampleFixtures } from "@/lib/example-fixtures";
import { capConfidence, type QuickVerdict, type ScamAnalysis } from "@/lib/scam-analysis";
import InboxScan from "./inbox-scan";
import ScamSimulator from "./scam-simulator";
import { InjectionBanner, TrapMap, verdictLabels, verdictStyles, type Language } from "./trap-map";

// Re-exported so tests and other modules keep a stable import path.
export { resolveSegments } from "./trap-map";

type Analysis = ScamAnalysis;
type Mode = "single" | "inbox" | "simulator";

function VerdictBanner({ verdict, language, analysis }: { verdict: QuickVerdict; language: Language; analysis: Analysis | null }) {
  const languageName = { en: "English", hi: "हिंदी", mr: "मराठी" }[language];
  const confidence = Math.round(capConfidence(verdict.confidence, verdict.verdict));
  return (
    <div className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${verdictStyles[verdict.verdict]}`}>
      <p className="text-sm font-bold uppercase tracking-wide">{analysis ? "Verdict" : "Quick check"}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-2xl font-black sm:text-3xl">{verdictLabels[verdict.verdict][language]}</h2>
        <span className="font-semibold">{confidence}% confidence</span>
      </div>
      <p className="mt-2 text-sm font-bold">{verdict.scam_type}</p>
      {analysis && (
        <p className="mt-4 text-2xl font-black leading-10 sm:text-3xl sm:leading-[2.75rem]">
          {analysis.language_outputs[language]}
        </p>
      )}
      {analysis && <p className="mt-2 text-xs font-semibold uppercase tracking-wide opacity-70">Grandma Mode · {languageName}</p>}
    </div>
  );
}

export default function ScamAnalyzer({ sharedText }: { sharedText?: string }) {
  const [mode, setMode] = useState<Mode>("single");
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [quickVerdict, setQuickVerdict] = useState<QuickVerdict | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [chatError, setChatError] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  async function requestAnalysis(text: string, requestMode?: "quick") {
    const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, mode: requestMode }) });
    const payload = (await response.json()) as Analysis | QuickVerdict | { error: string };
    if (!response.ok || "error" in payload) throw new Error("error" in payload ? payload.error : "Analysis failed.");
    return payload;
  }

  async function analyzeMessage(text: string) {
    setError(""); setAnalysis(null); setQuickVerdict(null); setAnswer("");
    if (!text.trim()) { setError("Paste a message first."); return; }
    setLoading(true);
    void requestAnalysis(text, "quick").then((payload) => setQuickVerdict(payload as QuickVerdict)).catch(() => undefined);
    try { setAnalysis(await requestAnalysis(text) as Analysis); }
    catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "Analysis failed."); }
    finally { setLoading(false); }
  }

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await analyzeMessage(message);
  }

  /** One-tap phone flow: reads the copied SMS via the browser's clipboard permission prompt. */
  async function pasteAndScan() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) { setError("Clipboard is empty — copy the SMS first, then tap again."); return; }
      setMessage(text);
      await analyzeMessage(text);
    } catch {
      setError("Clipboard permission was declined. Long-press the box to paste instead.");
    }
  }

  // Android share-target: an SMS shared into the installed app arrives as sharedText.
  const sharedHandled = useRef(false);
  useEffect(() => {
    if (!sharedText || sharedHandled.current) return;
    sharedHandled.current = true;
    setMessage(sharedText);
    void analyzeMessage(sharedText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedText]);

  function loadExample(id: string) {
    const fixture = exampleFixtures.find((item) => item.id === id);
    if (!fixture) return;
    setMessage(fixture.message); setAnalysis(fixture.analysis); setQuickVerdict(fixture.analysis); setError(""); setAnswer("");
  }

  async function askFollowUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!analysis || !question.trim()) return;
    setChatLoading(true); setChatError(""); setAnswer("");
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, analysis, question }) });
      const payload = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok || !payload.answer) throw new Error(payload.error ?? "Follow-up failed.");
      setAnswer(payload.answer);
    } catch (caughtError) { setChatError(caughtError instanceof Error ? caughtError.message : "Follow-up failed."); }
    finally { setChatLoading(false); }
  }

  const displayedVerdict = analysis ?? quickVerdict;

  return <main className="min-h-screen bg-[#f7f8f2] px-4 py-7 sm:px-8 sm:py-10">
    <section className="mx-auto max-w-3xl">
      <header className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">Raksha</p><h1 className="mt-3 max-w-2xl text-3xl font-black tracking-tight text-stone-950 sm:text-5xl">Scam autopsy, not scam detection.</h1></div>
        <div className="flex shrink-0 rounded-xl border border-stone-300 bg-white p-1" aria-label="Grandma Mode language">
          {(["en", "hi", "mr"] as Language[]).map((item) => <button key={item} type="button" onClick={() => setLanguage(item)} className={`rounded-lg px-2 py-1.5 text-xs font-black ${language === item ? "bg-emerald-700 text-white" : "text-stone-600"}`}>{item.toUpperCase()}</button>)}
        </div>
      </header>

      <div className="mt-6 grid grid-cols-3 gap-1 rounded-xl border border-stone-300 bg-white p-1 sm:inline-flex" role="tablist" aria-label="Analysis mode">
        {([["single", "Single message"], ["inbox", "Inbox scan"], ["simulator", "Test yourself"]] as [Mode, string][]).map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={mode === value} onClick={() => setMode(value)} className={`rounded-lg px-3 py-2 text-sm font-black transition sm:px-4 ${mode === value ? "bg-stone-950 text-white" : "text-stone-600 hover:text-stone-900"}`}>
            {label}
          </button>
        ))}
      </div>

      {mode === "inbox" && <div className="mt-6"><InboxScan language={language} /></div>}
      {mode === "simulator" && <div className="mt-6"><ScamSimulator language={language} /></div>}

      {mode === "single" && <>
      <p className="mt-4 max-w-xl text-lg text-stone-600">Paste a suspicious message. Raksha shows the traps before they work.</p>

      <form onSubmit={analyze} className="mt-8">
        <textarea id="message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Paste an SMS, WhatsApp forward, email, or offer here..." className="min-h-52 w-full resize-y rounded-2xl border border-stone-300 bg-white p-4 text-base leading-7 text-stone-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 sm:p-5" />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-stone-500">Nothing is stored. No account. Analyzed and discarded.</p><div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => void pasteAndScan()} disabled={loading} className="rounded-xl border-2 border-emerald-700 px-5 py-3 font-bold text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-60">📋 Paste &amp; scan</button><button type="submit" disabled={loading} className="rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70">{loading ? "Building your Trap Map…" : "Analyze message"}</button></div></div>
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      </form>

      <div className="mt-6"><p className="text-sm font-bold text-stone-700">Or try an instant example</p><div className="mt-2 flex flex-wrap gap-2">{exampleFixtures.map((fixture) => <button type="button" key={fixture.id} onClick={() => loadExample(fixture.id)} className="rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:border-emerald-600 hover:text-emerald-800">{fixture.label}</button>)}</div></div>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-600 shadow-sm">
        <p className="font-bold text-stone-800">📱 On your phone</p>
        <p className="mt-1">Install Raksha from your browser menu (&ldquo;Add to Home Screen&rdquo;). Then in any SMS or WhatsApp message tap Share → Raksha and the scan starts instantly. Or copy a message and tap &ldquo;Paste &amp; scan&rdquo; — your phone asks once for clipboard permission.</p>
      </div>

      {loading && !displayedVerdict && <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 text-stone-600 shadow-sm">Checking the message and mapping its tactics…</div>}
      {displayedVerdict && <section className="mt-10 space-y-6" aria-live="polite">
        <VerdictBanner verdict={displayedVerdict} language={language} analysis={analysis} />
        {loading && !analysis && <p className="rounded-xl bg-white p-4 text-sm font-semibold text-stone-600 shadow-sm">Verdict is ready. The detailed Trap Map is still loading…</p>}
        {analysis && <>
          {analysis.injection_detected && <InjectionBanner explanation={analysis.injection_explanation} />}
          <div><h2 className="text-xl font-black text-stone-950">Trap Map</h2><p className="mb-3 mt-1 text-sm text-stone-600">Tap a highlighted phrase to see how it manipulates you.</p><TrapMap message={message} segments={analysis.segments} /></div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-black text-stone-950">What happens next</h2><ol className="mt-4 space-y-4">{analysis.next_moves.map((move, index) => <li key={move} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-950 text-sm font-black text-white">{index + 1}</span><p className="pt-0.5 text-stone-700">{move}</p></li>)}</ol></div>
          <div className="rounded-2xl border-2 border-emerald-700 bg-emerald-50 p-5 shadow-sm"><p className="text-sm font-black uppercase tracking-wide text-emerald-800">One clear action</p><p className="mt-2 text-xl font-black leading-8 text-emerald-950">{language === "en" ? analysis.action : analysis.language_outputs[language]}</p></div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-black text-stone-950">Ask about this message</h2><p className="mt-1 text-sm text-stone-600">For example: “Why is this fake? The number looked real.”</p><form onSubmit={askFollowUp} className="mt-4"><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a follow-up…" className="min-h-24 w-full rounded-xl border border-stone-300 p-3 outline-none focus:border-emerald-600" /><div className="mt-3 flex items-center gap-3"><button disabled={chatLoading} className="rounded-xl bg-stone-950 px-4 py-2.5 font-bold text-white disabled:opacity-60">{chatLoading ? "Thinking…" : "Ask Raksha"}</button>{chatError && <p className="text-sm text-red-700">{chatError}</p>}</div></form>{answer && <p className="mt-4 rounded-xl bg-stone-100 p-4 leading-7 text-stone-800">{answer}</p>}</div>
        </>}
      </section>}
      </>}
    </section>
  </main>;
}
