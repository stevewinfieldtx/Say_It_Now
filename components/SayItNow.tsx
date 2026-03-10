"use client";
import { useState, useRef } from "react";

const LANGUAGES = [
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Mandarin Chinese", flag: "🇨🇳" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
];

const TONE_INFO: Record<string, { symbol: string; color: string; label: string; desc: string }> = {
  rising:  { symbol: "↗", color: "#2563eb", label: "Rising",  desc: "Voice goes UP at the end" },
  falling: { symbol: "↘", color: "#dc2626", label: "Falling", desc: "Voice goes DOWN" },
  flat:    { symbol: "→", color: "#6b7280", label: "Flat",    desc: "Keep voice LEVEL" },
  dipping: { symbol: "↓↗", color: "#7c3aed", label: "Dipping", desc: "Dips DOWN then back UP" },
  high:    { symbol: "⬆",  color: "#059669", label: "High",    desc: "Start and stay HIGH" },
  low:     { symbol: "⬇",  color: "#d97706", label: "Low",     desc: "Start and stay LOW" },
  broken:  { symbol: "〜", color: "#be185d", label: "Broken",  desc: "Tight throat, creaky sound" },
};

const QUICK_PHRASES = [
  "hello",
  "thank you",
  "thank you very much",
  "excuse me",
  "goodbye",
  "how much is this?",
  "the bill please",
  "no ice",
  "delicious",
  "where is the bathroom?",
  "i don't understand",
  "i want this",
  "can you speak slower?",
  "do you speak English?",
  "my name is Steve",
  "nice to meet you",
  "cheers!",
  "one more please",
];

interface Syllable {
  word: string;
  phonetic: string;
  meaning: string;
  tone: string;
  tip: string;
}

interface PhraseResult {
  native: string;
  phonetic: string;
  syllables: Syllable[];
  fullTip: string;
  formal: string | null;
}

export default function SayItNow() {
  const [lang, setLang] = useState("vi");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<PhraseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLang = LANGUAGES.find((l) => l.code === lang)!;

  const handleSearch = async (phrase: string) => {
    setInput(phrase);
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phrase,
          targetLanguage: lang,
          languageName: selectedLang.name,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch {
      setError("Something went wrong. Check your API key in .env.local and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) handleSearch(input.trim());
  };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-5 py-4 sticky top-0 z-50">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Say It Now 🌏</h1>
            <p className="text-xs text-gray-500">Speak any phrase. No reading required.</p>
          </div>

          {/* Language picker */}
          <div className="relative">
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-semibold shadow-sm hover:border-gray-400 transition"
            >
              <span className="text-xl">{selectedLang.flag}</span>
              <span className="hidden sm:inline">{selectedLang.name}</span>
              <span className="text-xs text-gray-400">▼</span>
            </button>

            {showLangPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLangPicker(false)} />
                <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50 min-w-52">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setShowLangPicker(false);
                        setResult(null);
                      }}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left hover:bg-slate-50 transition ${
                        l.code === lang ? "bg-slate-100 font-bold" : ""
                      }`}
                    >
                      <span className="text-lg">{l.flag}</span>
                      {l.name}
                      {l.code === lang && <span className="ml-auto text-blue-600">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-xl mx-auto px-5 py-6">

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex bg-white border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-blue-500 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Type any phrase in English...`}
              className="flex-1 px-5 py-4 text-base outline-none bg-transparent text-gray-900 placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-6 bg-slate-900 text-white font-bold text-sm tracking-wide disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
            >
              {loading ? "..." : "SAY IT →"}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-10 h-10 border-4 border-gray-200 border-t-slate-900 rounded-full animate-spin" />
            <p className="mt-3 text-gray-500 text-sm">Breaking it down for you...</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="space-y-4 animate-fade-in">

            {/* Native phrase hero card */}
            <div className="bg-slate-900 text-white rounded-2xl p-6">
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                Say this in {selectedLang.flag} {selectedLang.name}
              </p>
              <p className="text-3xl font-bold mb-2 leading-tight">{result.native}</p>
              <p className="text-xl font-mono text-blue-400 tracking-wide">{result.phonetic}</p>
            </div>

            {/* Syllable breakdown */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Word-by-Word Breakdown
              </p>
              <div className="space-y-3">
                {result.syllables.map((s, i) => {
                  const tone = TONE_INFO[s.tone] || TONE_INFO.flat;
                  return (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-start gap-2 flex-wrap">
                        <div className="flex items-baseline gap-3">
                          <span className="text-2xl font-bold text-gray-900">{s.word}</span>
                          <span
                            className="text-lg font-mono font-semibold"
                            style={{ color: tone.color }}
                          >
                            {s.phonetic}
                          </span>
                        </div>
                        <span
                          className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap"
                          style={{ background: tone.color + "18", color: tone.color }}
                        >
                          {tone.symbol} {tone.label} — {tone.desc}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold text-gray-700">Means:</span> {s.meaning}
                      </p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">
                        💡 {s.tip}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pro tip */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <span className="text-xl flex-shrink-0">🎯</span>
              <div>
                <p className="text-sm font-bold text-amber-900 mb-1">Pro Tip</p>
                <p className="text-sm text-amber-800 leading-relaxed">{result.fullTip}</p>
              </div>
            </div>

            {/* Formal version */}
            {result.formal && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
                <span className="text-xl flex-shrink-0">🎩</span>
                <div>
                  <p className="text-sm font-bold text-green-900 mb-1">Formal / Polite Version</p>
                  <p className="text-sm text-green-800 leading-relaxed">{result.formal}</p>
                </div>
              </div>
            )}

            {/* Back button */}
            <button
              onClick={() => {
                setResult(null);
                setInput("");
                inputRef.current?.focus();
              }}
              className="w-full py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              ← Try another phrase
            </button>
          </div>
        )}

        {/* Quick phrases */}
        {!result && !loading && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Quick Phrases — tap to translate
            </p>
            <div className="grid gap-2">
              {QUICK_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => handleSearch(phrase)}
                  className="flex justify-between items-center px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 hover:border-blue-400 hover:bg-slate-50 transition capitalize text-left"
                >
                  {phrase}
                  <span className="text-gray-400 ml-2 flex-shrink-0">→</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-8 pt-4 text-xs text-gray-400">
        Say It Now — Speak confidently anywhere in the world 🌏
      </div>
    </div>
  );
}
