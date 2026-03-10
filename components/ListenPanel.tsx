"use client";
import { useState, useRef, useEffect } from "react";

// ISO-639-1 language codes for Whisper (best accuracy when hinted)
const WHISPER_LANG: Record<string, string> = {
  vi: "vi", th: "th", ja: "ja", ko: "ko", zh: "zh",
  es: "es", de: "de", nl: "nl", fr: "fr", pt: "pt",
  it: "it", ar: "ar", hi: "hi", uk: "uk", ru: "ru", en: "en",
};

const TONE_EMOJI: Record<string, string> = {
  friendly: "😊", formal: "🤝", neutral: "😐", question: "🤔", urgent: "⚡",
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
  targetLang: string;
  targetLangName: string;
  targetLangFlag: string;
  nativeLang: string;
  nativeLangName: string;
  nativeLangFlag: string;
  listenLabel: string;
  listeningLabel: string;
  stopLabel: string;
  theyHearLabel: string;
  youUnderstandLabel: string;
  literalLabel: string;
  tryAgainLabel: string;
  noSpeechSupportLabel: string;
}

type ListenState = "idle" | "recording" | "processing" | "result" | "error";

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
}: ListenPanelProps) {
  const [state, setState] = useState<ListenState>("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<ListenResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [manualText, setManualText] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    setErrorMsg("");
    setTranscript("");
    setResult(null);
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick best supported format
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });
        await transcribeAudio(audioBlob, mimeType || "audio/webm");
      };

      recorder.start(250); // collect chunks every 250ms
      setState("recording");

      // Timer display
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => {
          if (s >= 59) {
            // Auto-stop at 60s
            handleStop();
            return s;
          }
          return s + 1;
        });
      }, 1000);

    } catch (err: unknown) {
      const error = err as Error;
      if (error?.name === "NotAllowedError") {
        setErrorMsg("mic-denied");
      } else {
        setErrorMsg("mic-error");
      }
      setState("error");
    }
  };

  const handleStop = () => {
    stopRecording();
    setState("processing");
  };

  const transcribeAudio = async (blob: Blob, mimeType: string) => {
    setState("processing");

    try {
      // Convert blob to base64
      const arrayBuffer = await blob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      let binary = "";
      uint8.forEach((b) => (binary += String.fromCharCode(b)));
      const base64 = btoa(binary);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: base64,
          mimeType,
          language: WHISPER_LANG[targetLang] || undefined,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.transcript?.trim()) {
        setErrorMsg("no-speech");
        setState("error");
        return;
      }

      setTranscript(data.transcript);
      await translateTranscript(data.transcript);

    } catch {
      setErrorMsg("transcribe-error");
      setState("error");
    }
  };

  const translateTranscript = async (text: string) => {
    try {
      const res = await fetch("/api/listen-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text,
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
      setErrorMsg("translate-error");
      setState("error");
    }
  };

  const reset = () => {
    stopRecording();
    setState("idle");
    setResult(null);
    setTranscript("");
    setErrorMsg("");
    setRecordingSeconds(0);
    setManualText("");
  };

  const toneColorClass = result ? (TONE_COLOR[result.tone] || TONE_COLOR.neutral) : "";

  const formatTime = (s: number) => `0:${s.toString().padStart(2, "0")}`;

  return (
    <div className="space-y-3">

      {/* ── IDLE ── */}
      {state === "idle" && (
        <div className="space-y-2">
          <button
            onClick={startRecording}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400 transition-all group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">👂</span>
            <div className="text-left">
              <p className="font-bold text-indigo-900 text-sm">{listenLabel}</p>
              <p className="text-xs text-indigo-500">{targetLangFlag} {targetLangName} → {nativeLangFlag} {nativeLangName}</p>
            </div>
          </button>

          {/* Manual fallback — always visible as secondary option */}
          <div className="flex gap-2">
            <input
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && manualText.trim() && translateTranscript(manualText.trim())}
              placeholder={`Or type what they said in ${targetLangName}...`}
              className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            />
            <button
              onClick={() => { if (manualText.trim()) { setTranscript(manualText); translateTranscript(manualText.trim()); }}}
              disabled={!manualText.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-bold transition"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* ── RECORDING ── */}
      {state === "recording" && (
        <div className="rounded-2xl border-2 border-red-400 bg-red-50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                  <span className="text-xl">🎤</span>
                </div>
                <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-50" />
              </div>
              <div>
                <p className="font-bold text-red-900 text-sm">{listeningLabel}</p>
                <p className="text-xs text-red-500">{targetLangFlag} {targetLangName} · {formatTime(recordingSeconds)}</p>
              </div>
            </div>
            <button
              onClick={handleStop}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition"
            >
              ⏹ {stopLabel}
            </button>
          </div>
          <div className="bg-white rounded-xl p-3 border border-red-200 text-center">
            <p className="text-xs text-gray-400">Recording — let them speak, then tap Stop</p>
            <div className="flex justify-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-400 rounded-full animate-pulse"
                  style={{
                    height: `${12 + Math.sin(Date.now() / 200 + i) * 8}px`,
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PROCESSING ── */}
      {state === "processing" && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border-[3px] border-indigo-200 border-t-indigo-600 animate-spin flex-shrink-0" />
            <p className="text-sm font-semibold text-indigo-900">
              {transcript ? "Translating..." : "Transcribing with Whisper AI..."}
            </p>
          </div>
          {transcript && (
            <div className="bg-white rounded-xl p-3 border border-indigo-200">
              <p className="text-xs text-gray-400 mb-1">{theyHearLabel}:</p>
              <p className="text-sm text-gray-700 italic">&ldquo;{transcript}&rdquo;</p>
            </div>
          )}
        </div>
      )}

      {/* ── RESULT ── */}
      {state === "result" && result && (
        <div className={`rounded-2xl border-2 p-5 space-y-4 ${toneColorClass}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{TONE_EMOJI[result.tone] || "💬"}</span>
              <div>
                <p className="font-extrabold text-base leading-tight">{result.summary}</p>
                <p className="text-xs opacity-60 capitalize">{result.tone} · {targetLangFlag} {targetLangName}</p>
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
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">
                {theyHearLabel} ({targetLangFlag} {targetLangName})
              </p>
              <p className="text-sm font-semibold opacity-80 italic">&ldquo;{result.original}&rdquo;</p>
            </div>

            <div className="bg-white/70 rounded-xl p-4 border border-current/10">
              <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">
                {youUnderstandLabel} ({nativeLangFlag} {nativeLangName})
              </p>
              <p className="text-base font-bold leading-relaxed">{result.translation}</p>
            </div>

            {result.literal && (
              <div className="bg-white/40 rounded-xl px-4 py-3 border border-current/10">
                <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">{literalLabel}</p>
                <p className="text-sm opacity-80 italic">&ldquo;{result.literal}&rdquo;</p>
              </div>
            )}
          </div>

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
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          {errorMsg === "mic-denied" && (
            <>
              <p className="text-sm font-bold text-amber-800">🎤 Microphone access denied</p>
              <p className="text-sm text-amber-700">Allow microphone access in your browser settings and try again.</p>
            </>
          )}
          {errorMsg === "no-speech" && (
            <p className="text-sm text-amber-700">No speech detected. Try recording again or type what they said below.</p>
          )}
          {(errorMsg === "transcribe-error" || errorMsg === "translate-error" || errorMsg === "mic-error") && (
            <p className="text-sm text-amber-700">Something went wrong. Try again or type what they said below.</p>
          )}

          {/* Manual fallback always shown on error */}
          <div className="flex gap-2">
            <input
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && manualText.trim() && translateTranscript(manualText.trim())}
              placeholder={`Type what they said in ${targetLangName}...`}
              className="flex-1 px-3 py-2 rounded-xl border border-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            />
            <button
              onClick={() => { if (manualText.trim()) { setTranscript(manualText); translateTranscript(manualText.trim()); }}}
              disabled={!manualText.trim()}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-600 disabled:bg-amber-200 text-white rounded-xl text-sm font-bold transition"
            >
              →
            </button>
          </div>

          <button onClick={reset} className="text-sm font-semibold text-amber-800 hover:text-amber-900 underline">
            {tryAgainLabel}
          </button>
        </div>
      )}
    </div>
  );
}
