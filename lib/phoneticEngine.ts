/**
 * Local Phonetic Engine for howdoisay.app
 * 
 * Runs 100% client-side, zero latency.
 * Provides approximate pronunciation using rule-based onset/rime mapping.
 * Returns data in the same shape as the LLM response so the UI doesn't care
 * whether the result came from here or from the API.
 * 
 * This is the INSTANT layer — accuracy is "good enough" while we wait
 * for the cached/LLM result to arrive and replace it.
 */

// ─── VIETNAMESE PHONETIC RULES ───────────────────────────────────────────────

interface OnsetRule {
  vi: string;
  eng: string;     // English approximation of the consonant sound
  display: string;  // What to show in displayWord
}

interface RimeRule {
  vi: string;
  eng: string;      // English sound approximation
  referenceWord: string;
  highlightStart: number;
  highlightEnd: number;
}

// Vietnamese consonant onsets → English sound (sorted longest first for matching)
const VI_ONSETS: OnsetRule[] = [
  { vi: "ngh", eng: "ng", display: "ng" },
  { vi: "nh", eng: "ny", display: "ny" },
  { vi: "ng", eng: "ng", display: "ng" },
  { vi: "kh", eng: "k", display: "k" },
  { vi: "ph", eng: "f", display: "f" },
  { vi: "th", eng: "t", display: "t" },
  { vi: "tr", eng: "ch", display: "ch" },
  { vi: "ch", eng: "ch", display: "ch" },
  { vi: "gh", eng: "g", display: "g" },
  { vi: "gi", eng: "z", display: "z" },
  { vi: "qu", eng: "kw", display: "kw" },
  { vi: "đ", eng: "d", display: "d" },
  { vi: "d", eng: "z", display: "z" },    // Southern Vietnamese
  { vi: "x", eng: "s", display: "s" },
  { vi: "r", eng: "r", display: "r" },     // Varies by region
  { vi: "s", eng: "sh", display: "sh" },   // Southern
  { vi: "v", eng: "v", display: "v" },
  { vi: "b", eng: "b", display: "b" },
  { vi: "c", eng: "k", display: "k" },
  { vi: "g", eng: "g", display: "g" },
  { vi: "h", eng: "h", display: "h" },
  { vi: "k", eng: "k", display: "k" },
  { vi: "l", eng: "l", display: "l" },
  { vi: "m", eng: "m", display: "m" },
  { vi: "n", eng: "n", display: "n" },
  { vi: "p", eng: "p", display: "p" },
  { vi: "t", eng: "t", display: "t" },
];

// Vietnamese vowel/rime patterns → English approximations
// Maps the vowel+ending portion to an English reference word
const VI_RIMES: RimeRule[] = [
  // Complex diphthongs/triphthongs first (longest match)
  { vi: "ương", eng: "oong", referenceWord: "moon", highlightStart: 1, highlightEnd: 3 },
  { vi: "ưởng", eng: "oong", referenceWord: "moon", highlightStart: 1, highlightEnd: 3 },
  { vi: "uông", eng: "oong", referenceWord: "moon", highlightStart: 1, highlightEnd: 3 },
  { vi: "iêng", eng: "eeng", referenceWord: "seeing", highlightStart: 1, highlightEnd: 4 },
  { vi: "iêu", eng: "eew", referenceWord: "few", highlightStart: 0, highlightEnd: 3 },
  { vi: "oai", eng: "why", referenceWord: "why", highlightStart: 0, highlightEnd: 3 },
  { vi: "oay", eng: "why", referenceWord: "why", highlightStart: 0, highlightEnd: 3 },
  { vi: "uôi", eng: "ooy", referenceWord: "gooey", highlightStart: 1, highlightEnd: 4 },
  { vi: "ươi", eng: "uey", referenceWord: "gooey", highlightStart: 1, highlightEnd: 5 },
  { vi: "ươn", eng: "oon", referenceWord: "moon", highlightStart: 1, highlightEnd: 4 },
  { vi: "uân", eng: "oon", referenceWord: "moon", highlightStart: 1, highlightEnd: 4 },
  { vi: "uyên", eng: "wen", referenceWord: "when", highlightStart: 0, highlightEnd: 4 },

  // Two-char vowel combos
  { vi: "ai", eng: "eye", referenceWord: "eye", highlightStart: 0, highlightEnd: 3 },
  { vi: "ao", eng: "ow", referenceWord: "cow", highlightStart: 1, highlightEnd: 3 },
  { vi: "au", eng: "ow", referenceWord: "cow", highlightStart: 1, highlightEnd: 3 },
  { vi: "âu", eng: "oh", referenceWord: "go", highlightStart: 0, highlightEnd: 2 },
  { vi: "ay", eng: "ay", referenceWord: "say", highlightStart: 1, highlightEnd: 3 },
  { vi: "ây", eng: "ay", referenceWord: "day", highlightStart: 1, highlightEnd: 3 },
  { vi: "eo", eng: "ow", referenceWord: "meow", highlightStart: 2, highlightEnd: 4 },
  { vi: "êu", eng: "ayw", referenceWord: "day", highlightStart: 1, highlightEnd: 3 },
  { vi: "ia", eng: "eea", referenceWord: "see", highlightStart: 0, highlightEnd: 3 },
  { vi: "iê", eng: "ee", referenceWord: "see", highlightStart: 1, highlightEnd: 3 },
  { vi: "iu", eng: "ew", referenceWord: "few", highlightStart: 1, highlightEnd: 3 },
  { vi: "oa", eng: "wa", referenceWord: "wad", highlightStart: 0, highlightEnd: 2 },
  { vi: "oe", eng: "we", referenceWord: "wet", highlightStart: 0, highlightEnd: 2 },
  { vi: "oi", eng: "oy", referenceWord: "boy", highlightStart: 1, highlightEnd: 3 },
  { vi: "ôi", eng: "oy", referenceWord: "boy", highlightStart: 1, highlightEnd: 3 },
  { vi: "ơi", eng: "oy", referenceWord: "boy", highlightStart: 1, highlightEnd: 3 },
  { vi: "ua", eng: "wa", referenceWord: "wad", highlightStart: 0, highlightEnd: 2 },
  { vi: "uê", eng: "way", referenceWord: "way", highlightStart: 0, highlightEnd: 3 },
  { vi: "ui", eng: "ooey", referenceWord: "gooey", highlightStart: 1, highlightEnd: 5 },
  { vi: "uo", eng: "oo", referenceWord: "too", highlightStart: 1, highlightEnd: 3 },
  { vi: "uô", eng: "oo", referenceWord: "too", highlightStart: 1, highlightEnd: 3 },
  { vi: "ưa", eng: "ua", referenceWord: "tuna", highlightStart: 1, highlightEnd: 3 },
  { vi: "ươ", eng: "oo", referenceWord: "too", highlightStart: 1, highlightEnd: 3 },
  { vi: "ưu", eng: "ew", referenceWord: "few", highlightStart: 1, highlightEnd: 3 },

  // Vowel + consonant endings
  { vi: "anh", eng: "ang", referenceWord: "sang", highlightStart: 1, highlightEnd: 4 },
  { vi: "ành", eng: "ang", referenceWord: "sang", highlightStart: 1, highlightEnd: 4 },
  { vi: "ang", eng: "ahng", referenceWord: "song", highlightStart: 1, highlightEnd: 4 },
  { vi: "ăng", eng: "ahng", referenceWord: "song", highlightStart: 1, highlightEnd: 4 },
  { vi: "âng", eng: "ung", referenceWord: "sung", highlightStart: 1, highlightEnd: 4 },
  { vi: "ong", eng: "ohm", referenceWord: "home", highlightStart: 1, highlightEnd: 4 },
  { vi: "ông", eng: "ohm", referenceWord: "home", highlightStart: 1, highlightEnd: 4 },
  { vi: "ung", eng: "oong", referenceWord: "moon", highlightStart: 1, highlightEnd: 3 },
  { vi: "ung", eng: "oong", referenceWord: "broom", highlightStart: 2, highlightEnd: 4 },
  { vi: "inh", eng: "ing", referenceWord: "sing", highlightStart: 1, highlightEnd: 4 },
  { vi: "ênh", eng: "eng", referenceWord: "ten", highlightStart: 1, highlightEnd: 3 },
  { vi: "an", eng: "ahn", referenceWord: "on", highlightStart: 0, highlightEnd: 2 },
  { vi: "ăn", eng: "an", referenceWord: "man", highlightStart: 1, highlightEnd: 3 },
  { vi: "ân", eng: "un", referenceWord: "sun", highlightStart: 1, highlightEnd: 3 },
  { vi: "en", eng: "en", referenceWord: "ten", highlightStart: 1, highlightEnd: 3 },
  { vi: "ên", eng: "en", referenceWord: "ten", highlightStart: 1, highlightEnd: 3 },
  { vi: "in", eng: "in", referenceWord: "sin", highlightStart: 0, highlightEnd: 3 },
  { vi: "on", eng: "on", referenceWord: "on", highlightStart: 0, highlightEnd: 2 },
  { vi: "ôn", eng: "on", referenceWord: "on", highlightStart: 0, highlightEnd: 2 },
  { vi: "ơn", eng: "un", referenceWord: "sun", highlightStart: 1, highlightEnd: 3 },
  { vi: "un", eng: "oon", referenceWord: "soon", highlightStart: 1, highlightEnd: 4 },
  { vi: "at", eng: "aht", referenceWord: "hot", highlightStart: 0, highlightEnd: 3 },
  { vi: "ăt", eng: "at", referenceWord: "cat", highlightStart: 1, highlightEnd: 3 },
  { vi: "ât", eng: "ut", referenceWord: "cut", highlightStart: 1, highlightEnd: 3 },
  { vi: "et", eng: "et", referenceWord: "bet", highlightStart: 1, highlightEnd: 3 },
  { vi: "êt", eng: "et", referenceWord: "bet", highlightStart: 1, highlightEnd: 3 },
  { vi: "it", eng: "eet", referenceWord: "feet", highlightStart: 1, highlightEnd: 4 },
  { vi: "ot", eng: "aht", referenceWord: "hot", highlightStart: 1, highlightEnd: 3 },
  { vi: "ôt", eng: "oht", referenceWord: "boat", highlightStart: 1, highlightEnd: 4 },
  { vi: "ơt", eng: "ut", referenceWord: "cut", highlightStart: 1, highlightEnd: 3 },
  { vi: "ut", eng: "oot", referenceWord: "boot", highlightStart: 1, highlightEnd: 4 },
  { vi: "ap", eng: "ahp", referenceWord: "cup", highlightStart: 1, highlightEnd: 3 },
  { vi: "ăp", eng: "ap", referenceWord: "cap", highlightStart: 1, highlightEnd: 3 },
  { vi: "âp", eng: "up", referenceWord: "cup", highlightStart: 1, highlightEnd: 3 },
  { vi: "ep", eng: "ep", referenceWord: "step", highlightStart: 2, highlightEnd: 4 },
  { vi: "êp", eng: "ep", referenceWord: "step", highlightStart: 2, highlightEnd: 4 },
  { vi: "ip", eng: "eep", referenceWord: "deep", highlightStart: 1, highlightEnd: 4 },
  { vi: "op", eng: "op", referenceWord: "hop", highlightStart: 1, highlightEnd: 3 },
  { vi: "ôp", eng: "ohp", referenceWord: "hope", highlightStart: 1, highlightEnd: 4 },
  { vi: "up", eng: "oop", referenceWord: "hoop", highlightStart: 1, highlightEnd: 4 },
  { vi: "ac", eng: "ahk", referenceWord: "rock", highlightStart: 1, highlightEnd: 4 },
  { vi: "ăc", eng: "ak", referenceWord: "back", highlightStart: 1, highlightEnd: 4 },
  { vi: "âc", eng: "uk", referenceWord: "duck", highlightStart: 1, highlightEnd: 4 },
  { vi: "uc", eng: "ook", referenceWord: "book", highlightStart: 1, highlightEnd: 4 },
  { vi: "ôc", eng: "ohk", referenceWord: "spoke", highlightStart: 2, highlightEnd: 4 },
  { vi: "am", eng: "ahm", referenceWord: "calm", highlightStart: 1, highlightEnd: 4 },
  { vi: "ăm", eng: "am", referenceWord: "ham", highlightStart: 1, highlightEnd: 3 },
  { vi: "âm", eng: "um", referenceWord: "gum", highlightStart: 1, highlightEnd: 3 },
  { vi: "em", eng: "em", referenceWord: "them", highlightStart: 2, highlightEnd: 4 },
  { vi: "êm", eng: "em", referenceWord: "them", highlightStart: 2, highlightEnd: 4 },
  { vi: "im", eng: "eem", referenceWord: "seem", highlightStart: 1, highlightEnd: 4 },
  { vi: "om", eng: "om", referenceWord: "mom", highlightStart: 1, highlightEnd: 3 },
  { vi: "ôm", eng: "ohm", referenceWord: "home", highlightStart: 1, highlightEnd: 4 },
  { vi: "um", eng: "oom", referenceWord: "room", highlightStart: 1, highlightEnd: 4 },

  // Single vowels (fallback - matched last)
  { vi: "a", eng: "ah", referenceWord: "ah", highlightStart: 0, highlightEnd: 2 },
  { vi: "ă", eng: "a", referenceWord: "cat", highlightStart: 1, highlightEnd: 2 },
  { vi: "â", eng: "uh", referenceWord: "cut", highlightStart: 1, highlightEnd: 2 },
  { vi: "e", eng: "eh", referenceWord: "bed", highlightStart: 1, highlightEnd: 2 },
  { vi: "ê", eng: "ay", referenceWord: "say", highlightStart: 1, highlightEnd: 3 },
  { vi: "i", eng: "ee", referenceWord: "see", highlightStart: 1, highlightEnd: 3 },
  { vi: "o", eng: "aw", referenceWord: "saw", highlightStart: 1, highlightEnd: 3 },
  { vi: "ô", eng: "oh", referenceWord: "go", highlightStart: 0, highlightEnd: 2 },
  { vi: "ơ", eng: "uh", referenceWord: "fun", highlightStart: 1, highlightEnd: 2 },
  { vi: "u", eng: "oo", referenceWord: "too", highlightStart: 1, highlightEnd: 3 },
  { vi: "ư", eng: "ew", referenceWord: "few", highlightStart: 1, highlightEnd: 3 },
  { vi: "y", eng: "ee", referenceWord: "see", highlightStart: 1, highlightEnd: 3 },
];

// Vietnamese tone marks → tone names
// We detect tones from the diacritical marks on vowels
const TONE_MARKS: Record<string, string> = {
  "\u0300": "falling",    // grave: à → huyền (falling)
  "\u0301": "rising",     // acute: á → sắc (rising)  
  "\u0303": "dipping",    // tilde: ã → ngã (dipping/broken rising)
  "\u0309": "dipping",    // hook:  ả → hỏi (dipping)
  "\u0323": "broken",     // dot:   ạ → nặng (broken/heavy)
};

function detectTone(word: string): string {
  const nfd = word.normalize("NFD");
  for (const char of nfd) {
    const code = char.codePointAt(0);
    if (code && code >= 0x0300 && code <= 0x036f) {
      const hex = char;
      if (TONE_MARKS[hex]) return TONE_MARKS[hex];
    }
  }
  return "flat"; // ngang (level tone) - no mark
}

function stripTones(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC");
}

function findOnset(cleanWord: string): { onset: OnsetRule | null; remainder: string } {
  for (const rule of VI_ONSETS) {
    if (cleanWord.startsWith(rule.vi)) {
      return { onset: rule, remainder: cleanWord.slice(rule.vi.length) };
    }
  }
  return { onset: null, remainder: cleanWord };
}

function findRime(remainder: string): RimeRule | null {
  // Try matching from longest patterns first (they're already sorted)
  for (const rule of VI_RIMES) {
    if (remainder === rule.vi || remainder.startsWith(rule.vi)) {
      return rule;
    }
  }
  // Fallback: try matching just the ending
  for (const rule of VI_RIMES) {
    if (remainder.endsWith(rule.vi)) {
      return rule;
    }
  }
  return null;
}

export interface LocalPronunciationResult {
  native: string;
  phonetic: string;
  syllables: {
    word: string;
    displayWord: string;
    tone: string;
    referenceWord: string;
    highlightStart: number;
    highlightEnd: number;
  }[];
  _source: "local"; // Marks this as from local engine
}

/**
 * Generate instant pronunciation for a Vietnamese word/phrase.
 * Returns data in the same shape as the API response.
 */
export function getLocalPronunciation(
  phrase: string,
  targetLang: string,
  _nativeLang: string
): LocalPronunciationResult | null {
  // Currently only supports Vietnamese as target
  if (targetLang !== "vi") return null;

  const words = phrase.trim().split(/\s+/);
  const syllables: LocalPronunciationResult["syllables"] = [];
  const phoneticParts: string[] = [];

  for (const word of words) {
    const tone = detectTone(word);
    const clean = stripTones(word.toLowerCase());
    const { onset, remainder } = findOnset(clean);
    const rime = findRime(remainder);

    // Build displayWord: onset display + rime english sound
    const onsetDisplay = onset ? onset.display : "";
    const rimeDisplay = rime ? rime.eng : remainder;
    let displayWord = (onsetDisplay + rimeDisplay).slice(0, 6);
    if (!displayWord) displayWord = clean.slice(0, 6);

    // Build referenceWord
    let referenceWord = rime ? rime.referenceWord : displayWord;
    let hlStart = rime ? rime.highlightStart : 0;
    let hlEnd = rime ? rime.highlightEnd : referenceWord.length;

    // If onset changes the start, and referenceWord = displayWord, highlight all
    if (referenceWord === displayWord) {
      hlStart = 0;
      hlEnd = referenceWord.length;
    }

    syllables.push({
      word: word,
      displayWord: displayWord.toLowerCase(),
      tone,
      referenceWord,
      highlightStart: hlStart,
      highlightEnd: hlEnd,
    });

    phoneticParts.push(displayWord);
  }

  return {
    native: phrase,
    phonetic: phoneticParts.join(" "),
    syllables,
    _source: "local",
  };
}

/**
 * Quick check: does the local engine support this language pair?
 */
export function isLocalSupported(targetLang: string): boolean {
  return targetLang === "vi";
  // TODO: Add more languages as we build their onset/rime maps
}