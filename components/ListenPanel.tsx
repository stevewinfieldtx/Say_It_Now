"use client";
import { useState, useRef, useEffect } from "react";

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

// BCP-47 locale map for speech recognition (same as speech synthesis)
const SPEECH_LOCALE: Record<string, string> = {
  vi: "vi-VN",
  th: "th-TH",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  es: "es-ES",
  de: "de-DE",
  nl: "nl-NL",
  fr: "fr-FR",
  pt: "pt-BR",
  it: "it-IT",
  ar: "ar-SA",
  hi: "hi-IN",
  uk: "uk-UA",
  ru: "ru-RU",
  en: "en-US",
};

const TONE_EMOJI: Record<string, string> = {
  friendly: "😊",
  formal: "🤝",
  neutral: "😐",
  question: "🤔",
  urgent: "⚡",
};

const TONE_COLOR: Record<string, string> = {
  friendly: "bg-green-50 border-green-200 text-green-900",
  formal: "bg-blue-50 border-blue-200 text-blue-900",
  neutral: "bg-gray-50 border-gray-200 text-gray-900",
  question: "bg-purple-50 border-purple-200 text-purple-900",
  urgent: "bg-red-50 border-red-200 text-red-900",
};

interface ListenResult {
  original: string;
  translation: string;
  literal: string | null;
  tone: string;
  summary: string;
}

interface ListenPanelProps {
  targetLang: string;          // the language THEY are speaking (e.g. "vi")
  targetLangName: string;      // e.g. "Vietnamese"
  targetLangFlag: string;      // e.g. "🇻🇳"
  nativeLang: string;          // the language YOU speak (e.g. "en")
  nativeLangName: string;      // e.g. "English"
  nativeLangFlag: string;      // e.g. "🇺🇸"
  // UI labels — passed in so we stay consistent with uiText system
  listenLabel: string;
  listeningLabel: string;
  stopLabel: string;
  theyHearLabel: string;
  youUnderstandLabel: string;
  literalLabel: string;
  tryAgainLabel: string;
  noSpeechSupportLabel: string;
}

type ListenState = "idle" | "listening" | "processing" | "result" | "error";

export default function ListenPanel({
  targetLang,
  targetLangName,
  targetLangFlag,
  nativeLang,
  nativeLangName,
  nativeLangFlag,
  listenLabel,
  listeningLabel,
  stopLabel,
  theyHearLabel,
  youUnderstandLabel,
  literalLabel,
  tryAgainLabel,
  noSpeechSupportLabel,
}: ListenPanelProps) {
  const [state, setState] = useState<ListenState>("idle");
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [result, setResult] = useState<ListenResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check browser support
  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const startListening = () => {
    if (!isSupported) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = SPEECH_LOCALE[targetLang] || "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;
    setInterimText("");
    setFinalText("");
    setResult(null);
    setErrorMsg("");
    setState("listening");

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          final += res[0].transcript;
        } else {
          interim += res[0].transcript;
        }
      }
      setInterimText(interim);
      if (final) setFinalText(final);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") {
        setErrorMsg("No speech detected. Try again.");
      } else if (event.error === "not-allowed") {
        setErrorMsg("Microphone access denied. Please allow microphone access in your browser.");
      } else {
        setErrorMsg(`Error: ${event.error}`);
      }
      setState("error");
    };

    recognition.onend = () => {
      // If we got a final transcript, send it for translation
      setFinalText((ft) => {
        if (ft.trim()) {
          translateResponse(ft.trim());
        } else {
          setState("idle");
        }
        return ft;
      });
    };

    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const translateResponse = async (transcript: string) => {
    setState("processing");
    setInterimText("");

    try {
      const res = await fetch("/api/listen-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          fromLanguage: targetLang,
          fromLanguageName: targetLangName,
          toLanguage: nativeLang,
          toLanguageName: nativeLangName,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setState("result");
    } catch {
      setErrorMsg("Translation failed. Please try again.");
      setState("error");
    }
  };

  const reset = () => {
    setState("idle");
    setResult(null);
    setInterimText("");
    setFinalText("");
    setErrorMsg("");
  };

  if (!isSupported) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
        <p className="text-sm text-gray-500">🎤 {noSpeechSupportLabel}</p>
      </div>
    );
  }

  const toneColorClass = result ? (TONE_COLOR[result.tone] || TONE_COLOR.neutral) : "";

  return (
    <div className="space-y-3">

      {/* ── IDLE — big invite button ── */}
      {state === "idle" && (
        <button
          onClick={startListening}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400 transition-all group"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">👂</span>
          <div className="text-left">
            <p className="font-bold text-indigo-900 text-sm">{listenLabel}</p>
            <p className="text-xs text-indigo-500">{targetLangFlag} {targetLangName} → {nativeLangFlag} {nativeLangName}</p>
          </div>
        </button>
      )}

      {/* ── LISTENING — animated mic + interim text ── */}
      {state === "listening" && (
        <div className="rounded-2xl border-2 border-indigo-400 bg-indigo-50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Pulsing mic */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-lg">🎤</span>
                </div>
                <div className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-40" />
              </div>
              <div>
                <p className="font-bold text-indigo-900 text-sm">{listeningLabel}</p>
                <p className="text-xs text-indigo-500">{targetLangFlag} {targetLangName}</p>
              </div>
            </div>
            <button
              onClick={stopListening}
              className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition"
            >
              {stopLabel}
            </button>
          </div>
          {/* Interim transcript display */}
          {(interimText || finalText) && (
            <div className="bg-white rounded-xl p-3 border border-indigo-200 min-h-12">
              <p className="text-sm text-gray-700 italic leading-relaxed">
                {finalText || interimText}
                {!finalText && interimText && (
                  <span className="inline-block w-1 h-4 bg-indigo-400 ml-1 animate-pulse align-middle" />
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── PROCESSING ── */}
      {state === "processing" && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" style={{ borderWidth: "3px" }} />
            <p className="text-sm font-semibold text-indigo-900">Translating...</p>
          </div>
          {finalText && (
            <div className="bg-white rounded-xl p-3 border border-indigo-200">
              <p className="text-xs text-gray-400 mb-1">{theyHearLabel}:</p>
              <p className="text-sm text-gray-700 italic">&ldquo;{finalText}&rdquo;</p>
            </div>
          )}
        </div>
      )}

      {/* ── RESULT ── */}
      {state === "result" && result && (
        <div className={`rounded-2xl border-2 p-5 space-y-4 ${toneColorClass}`}>

          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{TONE_EMOJI[result.tone] || "💬"}</span>
              <div>
                <p className="font-extrabold text-base leading-tight">{result.summary}</p>
                <p className="text-xs opacity-60 capitalize">{result.tone} tone · {targetLangFlag} {targetLangName}</p>
              </div>
            </div>
            <button
              onClick={reset}
              className="text-xs font-semibold px-3 py-1.5 bg-white/70 hover:bg-white rounded-lg border border-current/20 transition"
            >
              ✕
            </button>
          </div>

          <div className="border-t border-current/10 pt-3 space-y-3">
            {/* What they said (original) */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">
                {theyHearLabel} ({targetLangFlag} {targetLangName})
              </p>
              <p className="text-sm font-semibold opacity-80 italic">&ldquo;{result.original}&rdquo;</p>
            </div>

            {/* Translation */}
            <div className="bg-white/70 rounded-xl p-4 border border-current/10">
              <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">
                {youUnderstandLabel} ({nativeLangFlag} {nativeLangName})
              </p>
              <p className="text-base font-bold leading-relaxed">{result.translation}</p>
            </div>

            {/* Literal (if different) */}
            {result.literal && (
              <div className="bg-white/40 rounded-xl px-4 py-3 border border-current/10">
                <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">{literalLabel}</p>
                <p className="text-sm opacity-80 italic">&ldquo;{result.literal}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Listen again */}
          <button
            onClick={reset}
            className="w-full py-2.5 bg-white/60 hover:bg-white/90 rounded-xl text-sm font-semibold border border-current/20 transition"
          >
            👂 {tryAgainLabel}
          </button>
        </div>
      )}

      {/* ── ERROR ── */}
      {state === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm text-red-700">⚠️ {errorMsg}</p>
          <button
            onClick={reset}
            className="text-sm font-semibold text-red-700 hover:text-red-900 underline"
          >
            {tryAgainLabel}
          </button>
        </div>
      )}
    </div>
  );
}
