"use client";

import { useEffect, useRef, useState } from "react";
import type { QuickVerdict, ScamAnalysis } from "@/lib/scam-analysis";
import type { Language } from "./trap-map";

/**
 * Call Guard: put the suspicious call on speaker, tap one button, and the
 * phone's built-in speech engine transcribes locally while Raksha's AI
 * watches the rolling transcript. No audio ever leaves the phone — only text.
 */

type RecognitionLike = {
  start(): void;
  stop(): void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
};
type SpeechEventLike = {
  resultIndex: number;
  results: { length: number; [index: number]: { isFinal: boolean; 0: { transcript: string } } };
};

declare global {
  interface Window {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  }
}

const speechLang: Record<Language, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };

const copy: Record<Language, { start: string; stop: string; hint: string; idle: string; listening: string; ok: string; sus: string; danger: string; dangerAction: string }> = {
  en: {
    start: "🎙️ Start listening",
    stop: "⏹ Stop listening",
    hint: "Put the call on speaker. Raksha listens and warns you. The voice never leaves your phone — only text is checked.",
    idle: "Tap the button when a call feels wrong.",
    listening: "Listening… let them talk.",
    ok: "Sounds okay so far. Stay on guard.",
    sus: "Careful. This call sounds suspicious.",
    danger: "DANGER — this is a scam call.",
    dangerAction: "Hang up now. Share no OTP, no PIN, no money."
  },
  hi: {
    start: "🎙️ सुनना शुरू करें",
    stop: "⏹ बंद करें",
    hint: "Call को speaker पर रखें। Raksha सुनकर आपको चेतावनी देगा। आवाज़ phone से बाहर नहीं जाती।",
    idle: "Call अजीब लगे तो button दबाएं।",
    listening: "सुन रहा हूं… उन्हें बोलने दें।",
    ok: "अभी तक ठीक लग रहा है। सतर्क रहें।",
    sus: "सावधान। यह call संदिग्ध लग रही है।",
    danger: "खतरा — यह scam call है।",
    dangerAction: "अभी call काटें। OTP, PIN, पैसे — कुछ मत दें।"
  },
  mr: {
    start: "🎙️ ऐकायला सुरुवात करा",
    stop: "⏹ थांबवा",
    hint: "Call speaker वर ठेवा. Raksha ऐकून तुम्हाला सावध करेल. आवाज phone बाहेर जात नाही.",
    idle: "Call विचित्र वाटला तर button दाबा.",
    listening: "ऐकतो आहे… त्यांना बोलू द्या.",
    ok: "आत्तापर्यंत ठीक वाटते. सावध रहा.",
    sus: "सावधान. हा call संशयास्पद वाटतो.",
    danger: "धोका — हा scam call आहे.",
    dangerAction: "आत्ताच call कट करा. OTP, PIN, पैसे — काहीही देऊ नका."
  }
};

export default function CallGuard({ language }: { language: Language }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [active, setActive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [verdict, setVerdict] = useState<QuickVerdict | null>(null);
  const [danger, setDanger] = useState<ScamAnalysis | null>(null);
  const [error, setError] = useState("");

  const recognitionRef = useRef<RecognitionLike | null>(null);
  const activeRef = useRef(false);
  const transcriptRef = useRef("");
  const analyzingRef = useRef(false);
  const lastLenRef = useRef(0);
  const dangerRef = useRef(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition));
  }, []);

  useEffect(() => () => {
    activeRef.current = false;
    recognitionRef.current?.stop();
  }, []);

  async function maybeAnalyze() {
    const text = transcriptRef.current;
    if (analyzingRef.current || text.trim().length < 20) return;
    if (text.length - lastLenRef.current < 40 && verdict !== null) return;
    analyzingRef.current = true;
    lastLenRef.current = text.length;
    try {
      const tail = text.slice(-1500);
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: tail, mode: "quick" })
      });
      const payload = (await response.json()) as QuickVerdict | { error: string };
      if (response.ok && !("error" in payload)) {
        setVerdict(payload);
        if (payload.verdict === "scam" && !dangerRef.current) {
          dangerRef.current = true;
          navigator.vibrate?.([300, 100, 300]);
          const fullResponse = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: tail })
          });
          const full = (await fullResponse.json()) as ScamAnalysis | { error: string };
          if (fullResponse.ok && !("error" in full)) setDanger(full);
        }
      }
    } catch {
      // Keep listening; the next chunk retries.
    } finally {
      analyzingRef.current = false;
    }
  }

  function start() {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) return;
    setError("");
    setTranscript("");
    setVerdict(null);
    setDanger(null);
    transcriptRef.current = "";
    lastLenRef.current = 0;
    dangerRef.current = false;

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = speechLang[language];
    recognition.onresult = (event) => {
      let added = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) added += `${result[0].transcript} `;
      }
      if (added) {
        transcriptRef.current += added;
        setTranscript(transcriptRef.current);
        void maybeAnalyze();
      }
    };
    recognition.onend = () => {
      // Chrome stops on silence — restart while the guard is on.
      if (activeRef.current) {
        try { recognition.start(); } catch { /* already restarting */ }
      }
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone permission was declined. Allow it to use Call Guard.");
        stop();
      }
    };

    recognitionRef.current = recognition;
    activeRef.current = true;
    setActive(true);
    recognition.start();
  }

  function stop() {
    activeRef.current = false;
    setActive(false);
    recognitionRef.current?.stop();
  }

  const text = copy[language];
  const status = !active
    ? { style: "border-stone-300 bg-white text-stone-700", label: text.idle }
    : danger || verdict?.verdict === "scam"
      ? { style: "border-red-500 bg-red-50 text-red-950", label: text.danger }
      : verdict?.verdict === "suspicious"
        ? { style: "border-amber-500 bg-amber-50 text-amber-950", label: text.sus }
        : verdict?.verdict === "likely_safe"
          ? { style: "border-emerald-600 bg-emerald-50 text-emerald-950", label: text.ok }
          : { style: "border-stone-300 bg-white text-stone-700", label: text.listening };

  if (supported === false) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white p-6 text-stone-600 shadow-sm">
        <p className="font-bold text-stone-800">Call Guard needs Chrome</p>
        <p className="mt-2 leading-7">This phone&apos;s browser cannot listen to calls. Open Raksha in Chrome on Android, or use Inbox Scan to paste what the caller said.</p>
      </section>
    );
  }

  return (
    <section>
      <p className="max-w-xl text-lg text-stone-600">{text.hint}</p>

      <button
        type="button"
        onClick={() => (active ? stop() : start())}
        className={`mt-6 w-full rounded-2xl px-6 py-6 text-2xl font-black text-white shadow-lg transition sm:text-3xl ${active ? "bg-red-600 hover:bg-red-700" : "bg-emerald-700 hover:bg-emerald-800"}`}
      >
        {active ? text.stop : text.start}
      </button>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <div className={`mt-6 rounded-2xl border-2 p-6 shadow-sm ${status.style}`} role="status" aria-live="assertive">
        <p className="text-2xl font-black leading-9 sm:text-3xl sm:leading-[2.75rem]">{status.label}</p>
        {(danger || verdict?.verdict === "scam") && (
          <p className="mt-3 text-xl font-black leading-8">{text.dangerAction}</p>
        )}
        {danger && (
          <p className="mt-3 text-lg font-bold leading-8">{danger.language_outputs[language]}</p>
        )}
        {danger && danger.next_moves.length > 0 && language === "en" && (
          <ul className="mt-4 space-y-1 text-sm font-semibold">
            {danger.next_moves.slice(0, 3).map((move) => <li key={move}>→ {move}</li>)}
          </ul>
        )}
      </div>

      {active && transcript && (
        <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-500">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-400">What Raksha heard (stays on this phone)</p>
          <p className="mt-1">…{transcript.slice(-300)}</p>
        </div>
      )}
    </section>
  );
}
