/**
 * Hybrid Lookup System for howdoisay.app
 * 
 * Three-layer pronunciation lookup:
 * 1. LOCAL ENGINE (~50ms) — Rule-based phonetic approximation, instant
 * 2. SUPABASE CACHE (~100-200ms) — Pre-seeded accurate data
 * 3. LLM API (2-4s) — Generate fresh, accurate data and cache it
 * 
 * The UI calls `hybridLookup()` which returns the local result immediately,
 * then fires the cache/API lookup in the background and calls `onUpgrade`
 * when better data arrives.
 */

import { getLocalPronunciation, isLocalSupported } from "./phoneticEngine";

export interface PronunciationResult {
  native: string;
  phonetic: string;
  syllables: {
    word: string;
    displayWord: string;
    tone: string;
    referenceWord: string;
    highlightStart: number;
    highlightEnd: number;
    // Legacy fields
    phonetic?: string;
    soundsLike?: string;
    meaning?: string;
    tip?: string;
  }[];
  fullTip?: string;
  formal?: string | null;
  _source?: "local" | "cache" | "api";
}

interface HybridLookupOptions {
  phrase: string;
  targetLanguage: string;
  languageName: string;
  nativeLanguage: string;
  nativeLanguageName: string;
}

interface HybridResult {
  /** The instant local result (may be null if language not supported locally) */
  instant: PronunciationResult | null;
  /** Promise that resolves with the accurate cache/API result */
  accurate: Promise<PronunciationResult>;
}

/**
 * Main hybrid lookup function.
 * 
 * Returns an object with:
 * - `instant`: The local phonetic engine result (available immediately, may be null)
 * - `accurate`: A promise that resolves with the cache or API result
 * 
 * Usage in React:
 *   const { instant, accurate } = hybridLookup(opts);
 *   setResult(instant);  // Show immediately
 *   accurate.then(r => setResult(r));  // Upgrade when ready
 */
export function hybridLookup(opts: HybridLookupOptions): HybridResult {
  // Layer 1: Local engine (synchronous, instant)
  let instant: PronunciationResult | null = null;
  if (isLocalSupported(opts.targetLanguage)) {
    const localResult = getLocalPronunciation(
      opts.phrase,
      opts.targetLanguage,
      opts.nativeLanguage
    );
    if (localResult) {
      instant = { ...localResult, _source: "local" };
    }
  }

  // Layer 2+3: Cache then API (async)
  const accurate = fetchAccurate(opts);

  return { instant, accurate };
}

/**
 * Fetches the accurate result from cache or API.
 * This is the same /api/translate call the app already uses,
 * which checks Supabase cache first, then falls back to OpenRouter.
 */
async function fetchAccurate(opts: HybridLookupOptions): Promise<PronunciationResult> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phrase: opts.phrase,
      targetLanguage: opts.targetLanguage,
      languageName: opts.languageName,
      nativeLanguage: opts.nativeLanguage,
      nativeLanguageName: opts.nativeLanguageName,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  return { ...data, _source: "cache" as const };
}