"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "howdoisay_hide_intro";

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", name: "ภาษาไทย", flag: "🇹🇭" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिंदी", flag: "🇮🇳" },
  { code: "uk", name: "Українська", flag: "🇺🇦" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
];

interface OnboardingModalProps {
  nativeLang: string;
  onLanguageSelect: (lang: string) => void;
}

export default function OnboardingModal({ nativeLang, onLanguageSelect }: OnboardingModalProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState(nativeLang || "en");

  useEffect(() => {
    const hidden = localStorage.getItem(STORAGE_KEY);
    if (!hidden) setVisible(true);
  }, []);

  const handleLanguageConfirm = () => {
    onLanguageSelect(selected);
    setStep(2);
  };

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  const isRTL = selected === "ar";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        {/* ── STEP 1: Pick your language ── */}
        {step === 1 && (
          <div className="p-5 space-y-4">
            <div className="text-center">
              <p className="text-2xl mb-1">🌏</p>
              <h2 className="text-lg font-extrabold text-gray-900">What language do you speak?</h2>
              <p className="text-xs text-gray-400 mt-1">We&apos;ll explain everything in your language</p>
            </div>

            {/* Language grid */}
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelected(lang.code)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition ${
                    selected === lang.code
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-100 bg-gray-50 hover:border-gray-200"
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className={`text-sm font-semibold truncate ${selected === lang.code ? "text-indigo-900" : "text-gray-700"}`}>
                    {lang.name}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={handleLanguageConfirm}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-700 text-white font-extrabold text-sm rounded-2xl transition"
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── STEP 2: Quick explainer ── */}
        {step === 2 && (
          <div className="p-5 space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-extrabold text-gray-900">⚠️ This is NOT a translator</h2>
              <p className="text-sm text-gray-500 mt-1">Here&apos;s what makes it different</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-sm text-amber-900 leading-relaxed">
                We teach you how to <strong>say it out loud</strong> — using sounds from your own language.
                So you can actually speak Vietnamese, Thai, Japanese, or Chinese to someone right in front of you.
              </p>
            </div>

            <div className="space-y-2">
              {[
                "📍 Pick YOUR language (left box)",
                "🌏 Pick the language you want to SPEAK (right box)",
                "✍️ Type a phrase or pick from 100 ready-made ones",
                "👂 After you speak — listen for their reply",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-700 text-white font-extrabold text-sm rounded-2xl transition"
            >
              Got it — let&apos;s go! →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
