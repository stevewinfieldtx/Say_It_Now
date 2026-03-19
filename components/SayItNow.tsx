"use client";
import { useState, useRef } from "react";
import UI_TEXT from "./uiText";
import OnboardingModal from "./OnboardingModal";
import ListenPanel from "./ListenPanel";
import ToneWord, { ReferenceWord } from "./ToneWord";
import { hybridLookup } from "../lib/hybridLookup";

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸", nativeNames: { en: "English", vi: "Tiếng Anh", ja: "英語", ko: "영어", zh: "英语", es: "Inglés", de: "Englisch", nl: "Engels", fr: "Anglais", pt: "Inglês", it: "Inglese", ar: "الإنجليزية", hi: "अंग्रेजी", uk: "Англійська", ru: "Английский", th: "ภาษาอังกฤษ" } },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳", nativeNames: { en: "Vietnamese", vi: "Tiếng Việt", ja: "ベトナム語", ko: "베트남어", zh: "越南语", es: "Vietnamita", de: "Vietnamesisch", nl: "Vietnamees", fr: "Vietnamien", pt: "Vietnamita", it: "Vietnamita", ar: "الفيتنامية", hi: "वियतनामी", uk: "В'єтнамська", ru: "Вьетнамский", th: "ภาษาเวียดนาม" } },
  { code: "th", name: "Thai", flag: "🇹🇭", nativeNames: { en: "Thai", vi: "Tiếng Thái", ja: "タイ語", ko: "태국어", zh: "泰语", es: "Tailandés", de: "Thailändisch", nl: "Thais", fr: "Thaï", pt: "Tailandês", it: "Tailandese", ar: "التايلاندية", hi: "थाई", uk: "Тайська", ru: "Тайский", th: "ภาษาไทย" } },
  { code: "ja", name: "Japanese", flag: "🇯🇵", nativeNames: { en: "Japanese", vi: "Tiếng Nhật", ja: "日本語", ko: "일본어", zh: "日语", es: "Japonés", de: "Japanisch", nl: "Japans", fr: "Japonais", pt: "Japonês", it: "Giapponese", ar: "اليابانية", hi: "जापानी", uk: "Японська", ru: "Японский", th: "ภาษาญี่ปุ่น" } },
  { code: "ko", name: "Korean", flag: "🇰🇷", nativeNames: { en: "Korean", vi: "Tiếng Hàn", ja: "韓国語", ko: "한국어", zh: "韩语", es: "Coreano", de: "Koreanisch", nl: "Koreaans", fr: "Coréen", pt: "Coreano", it: "Coreano", ar: "الكورية", hi: "कोरियाई", uk: "Корейська", ru: "Корейский", th: "ภาษาเกาหลี" } },
  { code: "zh", name: "Mandarin Chinese", flag: "🇨🇳", nativeNames: { en: "Mandarin", vi: "Tiếng Trung", ja: "中国語", ko: "중국어", zh: "普通话", es: "Chino mandarín", de: "Mandarin", nl: "Mandarijn", fr: "Mandarin", pt: "Mandarim", it: "Mandarino", ar: "الصينية المندرينية", hi: "मंदारिन", uk: "Мандаринська", ru: "Мандаринский", th: "ภาษาจีนกลาง" } },
  { code: "es", name: "Spanish", flag: "🇪🇸", nativeNames: { en: "Spanish", vi: "Tiếng Tây Ban Nha", ja: "スペイン語", ko: "스페인어", zh: "西班牙语", es: "Español", de: "Spanisch", nl: "Spaans", fr: "Espagnol", pt: "Espanhol", it: "Spagnolo", ar: "الإسبانية", hi: "स्पेनिश", uk: "Іспанська", ru: "Испанский", th: "ภาษาสเปน" } },
  { code: "de", name: "German", flag: "🇩🇪", nativeNames: { en: "German", vi: "Tiếng Đức", ja: "ドイツ語", ko: "독일어", zh: "德语", es: "Alemán", de: "Deutsch", nl: "Duits", fr: "Allemand", pt: "Alemão", it: "Tedesco", ar: "الألمانية", hi: "जर्मन", uk: "Німецька", ru: "Немецкий", th: "ภาษาเยอรมัน" } },
  { code: "nl", name: "Dutch", flag: "🇳🇱", nativeNames: { en: "Dutch", vi: "Tiếng Hà Lan", ja: "オランダ語", ko: "네덜란드어", zh: "荷兰语", es: "Neerlandés", de: "Niederländisch", nl: "Nederlands", fr: "Néerlandais", pt: "Holandês", it: "Olandese", ar: "الهولندية", hi: "डच", uk: "Нідерландська", ru: "Нидерландский", th: "ภาษาดัตช์" } },
  { code: "fr", name: "French", flag: "🇫🇷", nativeNames: { en: "French", vi: "Tiếng Pháp", ja: "フランス語", ko: "프랑스어", zh: "法语", es: "Francés", de: "Französisch", nl: "Frans", fr: "Français", pt: "Francês", it: "Francese", ar: "الفرنسية", hi: "फ्रेंच", uk: "Французька", ru: "Французский", th: "ภาษาฝรั่งเศส" } },
  { code: "pt", name: "Portuguese", flag: "🇵🇹", nativeNames: { en: "Portuguese", vi: "Tiếng Bồ Đào Nha", ja: "ポルトガル語", ko: "포르투갈어", zh: "葡萄牙语", es: "Portugués", de: "Portugiesisch", nl: "Portugees", fr: "Portugais", pt: "Português", it: "Portoghese", ar: "البرتغالية", hi: "पुर्तगाली", uk: "Португальська", ru: "Португальский", th: "ภาษาโปรตุเกส" } },
  { code: "it", name: "Italian", flag: "🇮🇹", nativeNames: { en: "Italian", vi: "Tiếng Ý", ja: "イタリア語", ko: "이탈리아어", zh: "意大利语", es: "Italiano", de: "Italienisch", nl: "Italiaans", fr: "Italien", pt: "Italiano", it: "Italiano", ar: "الإيطالية", hi: "इतालवी", uk: "Італійська", ru: "Итальянский", th: "ภาษาอิตาลี" } },
  { code: "ar", name: "Arabic", flag: "🇸🇦", nativeNames: { en: "Arabic", vi: "Tiếng Ả Rập", ja: "アラビア語", ko: "아랍어", zh: "阿拉伯语", es: "Árabe", de: "Arabisch", nl: "Arabisch", fr: "Arabe", pt: "Árabe", it: "Arabo", ar: "العربية", hi: "अरबी", uk: "Арабська", ru: "Арабский", th: "ภาษาอาหรับ" } },
  { code: "hi", name: "Hindi", flag: "🇮🇳", nativeNames: { en: "Hindi", vi: "Tiếng Hindi", ja: "ヒンディー語", ko: "힌디어", zh: "印地语", es: "Hindi", de: "Hindi", nl: "Hindi", fr: "Hindi", pt: "Hindi", it: "Hindi", ar: "الهندية", hi: "हिंदी", uk: "Гінді", ru: "Хинди", th: "ภาษาฮินดี" } },
  { code: "uk", name: "Ukrainian", flag: "🇺🇦", nativeNames: { en: "Ukrainian", vi: "Tiếng Ukraina", ja: "ウクライナ語", ko: "우크라이나어", zh: "乌克兰语", es: "Ucraniano", de: "Ukrainisch", nl: "Oekraïens", fr: "Ukrainien", pt: "Ucraniano", it: "Ucraino", ar: "الأوكرانية", hi: "यूक्रेनी", uk: "Українська", ru: "Украинский", th: "ภาษายูเครน" } },
  { code: "ru", name: "Russian", flag: "🇷🇺", nativeNames: { en: "Russian", vi: "Tiếng Nga", ja: "ロシア語", ko: "러시아어", zh: "俄语", es: "Ruso", de: "Russisch", nl: "Russisch", fr: "Russe", pt: "Russo", it: "Russo", ar: "الروسية", hi: "रूसी", uk: "Російська", ru: "Русский", th: "ภาษารัสเซีย" } },
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

interface Syllable {
  word: string;
  displayWord: string;
  tone: string;
  referenceWord: string;
  highlightStart: number;
  highlightEnd: number;
  // Legacy fields (may still come from cache, ignored in new UI)
  phonetic?: string;
  soundsLike?: string;
  meaning?: string;
  tip?: string;
}

interface PhraseResult {
  native: string;
  phonetic: string;
  syllables: Syllable[];
  // Legacy fields (may still come from cache, ignored in new UI)
  fullTip?: string;
  formal?: string | null;
}


const PHRASE_CATEGORIES = [
  {
    id: "greetings",
    emoji: "🤝",
    label: "Greetings & Basics",
    phrases: ["hello","goodbye","thank you","thank you very much","please","excuse me","sorry","yes","no","you're welcome","my name is...","nice to meet you","how are you?","i'm fine, thank you","do you speak english?","i don't understand","can you speak slower?","cheers!","good morning","good night"],
  },
  {
    id: "food",
    emoji: "🍽️",
    label: "Food & Dining",
    phrases: ["the bill please","no ice","delicious","one more please","water please","no spicy","i am vegetarian","i am allergic to peanuts","no MSG please","what do you recommend?","a table for two","the menu please","do you have...","well done","medium rare","takeaway please","very delicious","no meat","no dairy","can i have the receipt?"],
  },
  {
    id: "transport",
    emoji: "🚕",
    label: "Getting Around",
    phrases: ["where is the bathroom?","how much is this?","how far is it?","turn left","turn right","go straight","stop here","take me to the airport","how much to the airport?","i want to go to...","where is the train station?","where is the bus stop?","i am lost","can you call a taxi?","wait here please","how long does it take?","is it far?","on the left","on the right","straight ahead"],
  },
  {
    id: "shopping",
    emoji: "🏨",
    label: "Shopping & Hotels",
    phrases: ["how much is this?","too expensive","do you have a discount?","i'll take it","do you have this in another size?","do you have this in another color?","can i try it on?","receipt please","do you accept credit card?","i have a reservation","check in please","check out please","what time is check out?","can i have a room?","is breakfast included?","the wifi password please","my room key please","can you help me?","i want a refund","is there a pharmacy nearby?"],
  },
  {
    id: "emergency",
    emoji: "🆘",
    label: "Emergency & Health",
    phrases: ["help!","call the police","call an ambulance","i need a doctor","i am sick","i have a fever","i have a stomach ache","i am in pain","i am allergic to...","where is the hospital?","where is the pharmacy?","i need medicine","please call this number","i have lost my passport","i have been robbed","i need help","is there a doctor nearby?","this is an emergency","please hurry","i don't feel well"],
  },
];

// Map our language codes to BCP-47 locale codes for speech synthesis
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
};

export default function SayItNow() {
  const [lang, setLang] = useState("vi");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<PhraseResult | null>(null);
  const [currentPhrase, setCurrentPhrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nativeLang, setNativeLang] = useState("en");
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showNativePicker, setShowNativePicker] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speakingWord, setSpeakingWord] = useState<number | null>(null);
  const [wordStepIndex, setWordStepIndex] = useState(0);
  const [reportedWords, setReportedWords] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const reportError = async (syllable: Syllable, index: number) => {
    setReportedWords(prev => new Set(prev).add(index));
    try {
      await fetch('/api/report-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phrase: currentPhrase,
          word: syllable.word,
          targetLang: lang,
          nativeLang: nativeLang,
          displayWord: syllable.displayWord,
          soundsLike: syllable.soundsLike,
          tone: syllable.tone,
        }),
      });
    } catch { /* silent fail */ }
  };

  const selectedLang = LANGUAGES.find((l) => l.code === lang)!;
  const NATIVE_LANGUAGES = LANGUAGES;
  const selectedNativeLang = NATIVE_LANGUAGES.find((l) => l.code === nativeLang)!;
  // Helper: get language name in the user's native language
  const getLangName = (l: typeof NATIVE_LANGUAGES[0]) => (l as any).nativeNames?.[nativeLang] || l.name;
  const t = UI_TEXT[nativeLang] || UI_TEXT["en"];

  const speakText = (text: string, slow: boolean = true, wordIndex?: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = SPEECH_LOCALE[lang] || "en-US"; // English falls back to en-US naturally
    utter.rate = slow ? 0.5 : 0.85;
    utter.pitch = 1;
    utter.volume = 1;
    if (wordIndex !== undefined) {
      setSpeakingWord(wordIndex);
    } else {
      setSpeaking(true);
      setSpeakingWord(null);
    }
    utter.onend = () => { setSpeaking(false); setSpeakingWord(null); };
    utter.onerror = () => { setSpeaking(false); setSpeakingWord(null); };
    window.speechSynthesis.speak(utter);
  };

  const speakPhrase = (text: string, slow: boolean = true) => speakText(text, slow);
  const speakWord = (word: string, index: number) => speakText(word, true, index);

  const handleSearch = async (phrase: string) => {
    setInput(phrase);
    setCurrentPhrase(phrase);
    setError("");
    setWordStepIndex(0);
    setReportedWords(new Set());

    // Hybrid lookup: instant local result + async accurate result
    const { instant, accurate } = hybridLookup({
      phrase,
      targetLanguage: lang,
      languageName: selectedLang.name,
      nativeLanguage: nativeLang,
      nativeLanguageName: selectedNativeLang.name,
    });

    // Layer 1: Show local result immediately (no spinner for supported languages)
    if (instant) {
      setResult(instant);
      setLoading(false);
    } else {
      setResult(null);
      setLoading(true);
    }

    // Layer 2+3: Upgrade with cache/API result when ready
    try {
      const accurateResult = await accurate;
      setResult(accurateResult);
      setWordStepIndex(0);
    } catch {
      // If API fails but we have local result, keep showing it
      if (!instant) {
        setError(t.errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) handleSearch(input.trim());
  };

  const goHome = () => {
    setResult(null);
    setInput("");
    setCurrentPhrase("");
    setError("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };
  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <OnboardingModal nativeLang={nativeLang} onLanguageSelect={(lang) => setNativeLang(lang)} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-5 py-4 sticky top-0 z-50">
        <div className="max-w-xl mx-auto">

          {/* App title */}
          <button onClick={goHome} className="text-left hover:opacity-70 transition mb-3 block">
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">How Do I Say 🌏</h1>
            <p className="text-xs text-gray-500">{t.appTagline}</p>
          </button>

          {/* Two-picker row */}
          <div className="flex items-end gap-3">

            {/* I speak (native) */}
            <div className="relative flex-1">
              <p className="text-xs font-semibold text-gray-400 mb-1">{t.iSpeak}</p>
              <button
                onClick={() => { setShowNativePicker(!showNativePicker); setShowLangPicker(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-gray-200 bg-white text-sm font-semibold hover:border-blue-400 transition"
              >
                <span className="text-lg">{selectedNativeLang.flag}</span>
                <span className="truncate">{getLangName(selectedNativeLang)}</span>
                <span className="text-xs text-gray-400 ml-auto">▼</span>
              </button>
              {showNativePicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNativePicker(false)} />
                  <div className="absolute left-0 top-16 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50 min-w-52 max-h-80 overflow-y-auto">
                    {NATIVE_LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setNativeLang(l.code); setShowNativePicker(false); setResult(null); }}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left hover:bg-slate-50 transition ${l.code === nativeLang ? "bg-slate-100 font-bold" : ""}`}
                      >
                        <span className="text-lg">{l.flag}</span>
                        {(l as any).nativeNames?.[l.code] || l.name}
                        {l.code === nativeLang && <span className="ml-auto text-blue-600">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Arrow between pickers */}
            <div className="text-gray-400 text-xl pb-2">→</div>

            {/* I want to speak (target) */}
            <div className="relative flex-1">
              <p className="text-xs font-semibold text-gray-400 mb-1">{t.iWantToSpeak}</p>
              <button
                onClick={() => { setShowLangPicker(!showLangPicker); setShowNativePicker(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-blue-500 bg-white text-sm font-semibold hover:border-blue-600 transition"
              >
                <span className="text-lg">{selectedLang.flag}</span>
                <span className="truncate">{getLangName(selectedLang)}</span>
                <span className="text-xs text-gray-400 ml-auto">▼</span>
              </button>
              {showLangPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowLangPicker(false)} />
                  <div className="absolute right-0 top-16 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50 min-w-52 max-h-80 overflow-y-auto">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setLang(l.code); setShowLangPicker(false); setResult(null); }}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left hover:bg-slate-50 transition ${l.code === lang ? "bg-slate-100 font-bold" : ""}`}
                      >
                        <span className="text-lg">{l.flag}</span>
                        {getLangName(l)}
                        {l.code === lang && <span className="ml-auto text-blue-600">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-xl mx-auto px-5 py-6">

        {/* Search */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex bg-white border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-blue-500 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              className="flex-1 px-5 py-4 text-base outline-none bg-transparent text-gray-900 placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-6 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-extrabold text-sm tracking-wide rounded-r-2xl disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-lg shadow-blue-600/20 disabled:shadow-none"
            >
              {loading ? "..." : t.sayItButton}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-sm">{error}</div>
        )}

        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-10 h-10 border-4 border-gray-200 border-t-slate-900 rounded-full animate-spin" />
            <p className="mt-3 text-gray-500 text-sm">{t.generating}</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="space-y-4">

            <button onClick={goHome} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
              {t.backToList}
            </button>

            {/* Hero — streamlined */}
            <div className="bg-slate-900 text-white rounded-2xl p-6">

              {/* "Say this in Vietnamese" + the native word ONLY */}
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                {t.sayThisIn} {selectedLang.flag} {getLangName(selectedLang)}
              </p>
              <p className="text-3xl font-bold mb-5 leading-tight">{result.native}</p>

              {/* ── SAY IT LIKE THIS — 2-column word blocks ── */}
              <div className="border-t border-slate-700 pt-4 mb-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-4">say it like this</p>
                <div className="grid grid-cols-2 gap-3">
                  {result.syllables.map((s, i) => {
                    const display = (s.displayWord || s.word)
                      .replace(/[^a-zA-Z]/g, "")
                      .toLowerCase()
                      .slice(0, 6);

                    const refWord = s.referenceWord || display;
                    const hlStart = s.highlightStart ?? 0;
                    const hlEnd = s.highlightEnd ?? refWord.length;

                    return (
                      <div key={i} className="bg-slate-800 rounded-xl p-3 flex flex-col items-center gap-1 relative">
                        {/* Top-right icons: speaker + report */}
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            onClick={() => speakWord(s.word, i)}
                            disabled={speakingWord === i}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-700 hover:bg-blue-600 disabled:bg-blue-800 transition text-xs"
                            aria-label={`Play ${s.word}`}
                          >
                            {speakingWord === i ? "..." : "\uD83D\uDD0A"}
                          </button>
                          <button
                            onClick={() => reportError(s, i)}
                            disabled={reportedWords.has(i)}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-700 hover:bg-red-600 disabled:bg-red-900 disabled:text-red-300 transition text-xs"
                            aria-label="Report error"
                            title="Report pronunciation error"
                          >
                            {reportedWords.has(i) ? "\u2713" : "\u26A0"}
                          </button>
                        </div>
                        {/* Tone curve */}
                        <ToneWord word={display || s.word} tone={s.tone} />
                        {/* Reference word with highlight */}
                        <ReferenceWord
                          referenceWord={refWord}
                          highlightStart={hlStart}
                          highlightEnd={hlEnd}
                          tone={s.tone}
                        />
                        {/* SoundsLike hint */}
                        {s.soundsLike && (
                          <p className="text-xs text-slate-400 text-center leading-snug mt-1 italic">
                            {s.soundsLike}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hear It buttons */}
              <div className="flex gap-3 mt-2 flex-wrap">
                <button
                  onClick={() => {
                    const words = result.syllables.map(s => s.word);
                    const idx = wordStepIndex % words.length;
                    speakWord(words[idx], idx);
                    setWordStepIndex(idx + 1);
                  }}
                  disabled={speakingWord !== null}
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-400 transition text-sm font-bold shadow-lg shadow-blue-900/30"
                >
                  <span className="text-base">{speakingWord !== null ? "⏳" : "🔊"}</span>
                  {speakingWord !== null
                    ? `${result.syllables[speakingWord]?.word}…`
                    : wordStepIndex === 0
                      ? "Word by word"
                      : wordStepIndex >= result.syllables.length
                        ? "↩ Again"
                        : `▶ ${result.syllables[wordStepIndex]?.word}`
                  }
                </button>

                <button
                  onClick={() => { speakPhrase(result.native, false); setWordStepIndex(0); }}
                  disabled={speaking}
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 transition text-sm font-bold"
                >
                  <span className="text-base">▶️</span>
                  {t.naturalSpeed}
                </button>

                {speaking && (
                  <button
                    onClick={() => { window.speechSynthesis.cancel(); setSpeaking(false); }}
                    className="flex items-center gap-2 px-4 py-3 rounded-full bg-red-700 hover:bg-red-600 transition text-sm font-bold"
                  >
                    ⏹ {t.stop}
                  </button>
                )}
              </div>
            </div>

            {/* Listen for Response */}
            <ListenPanel
              targetLang={lang}
              targetLangName={selectedLang.name}
              targetLangFlag={selectedLang.flag}
              nativeLang={nativeLang}
              nativeLangName={selectedNativeLang.name}
              nativeLangFlag={selectedNativeLang.flag}
              listenLabel={t.listenLabel || "Listen for their response"}
              listeningLabel={t.listeningLabel || "Listening..."}
              stopLabel={t.stopLabel || "Done"}
              theyHearLabel={t.theyHearLabel || "They said"}
              youUnderstandLabel={t.youUnderstandLabel || "You understand"}
              literalLabel={t.literalLabel || "Literally"}
              tryAgainLabel={t.tryAgainLabel || "Listen again"}
              noSpeechSupportLabel={t.noSpeechSupportLabel || "Speech recognition not supported in this browser"}
            />

            <button onClick={goHome} className="w-full py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              {t.backToList}
            </button>
          </div>
        )}

        {/* Home — category boxes */}
        {!result && !loading && (
          <div className="space-y-3">

            {PHRASE_CATEGORIES.map((cat) => (
              <div key={cat.id} className="rounded-2xl border border-gray-200 overflow-hidden">
                {/* Category header — tap to expand */}
                <button
                  onClick={() => setOpenCategory(openCategory === cat.id ? null : cat.id)}
                  className="w-full flex items-center justify-between px-4 py-4 bg-white hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.emoji}</span>
                    <div className="text-left">
                      <p className="font-bold text-gray-900 text-sm">{t.categoryLabels?.[cat.id] || cat.label}</p>
                      <p className="text-xs text-gray-400">{cat.phrases.length} {t.phrasesLabel || "phrases"}</p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-lg transition-transform duration-200" style={{ transform: openCategory === cat.id ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
                </button>

                {/* Phrase list — shown when expanded */}
                {openCategory === cat.id && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    {cat.phrases.map((phrase) => (
                      <button
                        key={phrase}
                        onClick={() => handleSearch(phrase)}
                        className="w-full flex justify-between items-center px-5 py-3 text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-900 transition capitalize text-left border-b border-gray-100 last:border-0"
                      >
                        <span>{t.phraseLabels?.[phrase] || phrase}</span>
                        <span className="text-gray-300">›</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Custom phrase — Pro feature */}
            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">✏️ Custom Phrase</p>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && input.trim() && handleSearch(input.trim())}
                  placeholder={t.placeholder}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={() => input.trim() && handleSearch(input.trim())}
                  disabled={!input.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-semibold transition"
                >
                  {t.sayItButton}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">Type anything — any phrase, any situation</p>
            </div>

          </div>
        )}
      </div>

      {/* QR Code Footer */}
      <div className="mt-8 mx-5 mb-8 bg-white border border-gray-200 rounded-2xl p-6 text-center space-y-4">
        <p className="text-sm font-bold text-gray-700">📱 Share This App</p>
        <p className="text-xs text-gray-500">Scan to open on your phone — then tap <strong>&quot;Add to Home Screen&quot;</strong> for an app icon</p>

        {/* QR code rendered via public API — no package needed */}
        <div className="flex justify-center">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://howdoisay.app&bgcolor=ffffff&color=0f172a&qzone=2&format=png`}
            alt="QR code for howdoisay.app"
            width={160}
            height={160}
            className="rounded-xl border border-gray-100"
          />
        </div>

        <p className="text-base font-extrabold text-slate-800 tracking-tight">howdoisay.app</p>

        {/* Install instructions */}
        <div className="bg-slate-50 rounded-xl p-3 text-left space-y-1.5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Install as an app</p>
          <p className="text-xs text-gray-600">📱 <strong>iPhone:</strong> Open in Safari → tap Share → &quot;Add to Home Screen&quot;</p>
          <p className="text-xs text-gray-600">🤖 <strong>Android:</strong> Open in Chrome → tap ⋮ menu → &quot;Add to Home Screen&quot;</p>
        </div>

        <p className="text-xs text-gray-400">Have a suggestion? <a href="mailto:info@nynimpact.com" className="underline">info@nynimpact.com</a></p>
      </div>
    </div>
  );
}
