import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rkaejxquqkvrzfiunrqt.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export async function POST(req: NextRequest) {
  const { phrase, targetLanguage, languageName, nativeLanguage, nativeLanguageName } = await req.json();

  if (!phrase || !targetLanguage || !languageName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const nativeLang = nativeLanguage || "en";
  const nativeLangLabel = nativeLanguageName || "English";
  const phraseKey = phrase.toLowerCase().trim();

  // ── 1. Check Supabase cache first ──────────────────────────────────────────
  try {
    const readClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data } = await readClient
      .from("howdoisay_phrase_cache")
      .select("result")
      .eq("phrase", phraseKey)
      .eq("target_lang", targetLanguage)
      .eq("native_lang", nativeLang)
      .single();

    if (data?.result) {
      return NextResponse.json(data.result);
    }
  } catch {
    // Cache miss or error — fall through to AI
  }

  // ── 2. Generate with OpenRouter ────────────────────────────────────────────
  const prompt = `You are a pronunciation coach helping a ${nativeLangLabel} speaker say phrases in ${languageName}.

Break down this phrase: "${phrase}"

Your most important job is the "soundsLike" field. Every single sound must be anchored to a real, common ${nativeLangLabel} word or phrase that a native ${nativeLangLabel} speaker already knows. Never write phonetic letter combinations in isolation — always say WHAT ${nativeLangLabel} word it sounds like.

For example, if the native language is Vietnamese, anchor sounds to Vietnamese words they already know.
If the native language is Spanish, anchor sounds to Spanish words they already know.
If the native language is English, anchor sounds to English words they already know.

Good format examples (adapt the reference words to ${nativeLangLabel}):
- 'sounds like [common ${nativeLangLabel} word]'
- 'rhymes with [common ${nativeLangLabel} word]'
- 'like the word [X] in ${nativeLangLabel}'

Return ONLY valid JSON in this exact format:
{
  "native": "the phrase in ${languageName} script",
  "phonetic": "full phrase phonetic — spell it out using letters from the ${nativeLangLabel} alphabet only, no IPA",
  "syllables": [
    {
      "word": "each word in native ${languageName} script",
      "phonetic": "phonetic spelling using ${nativeLangLabel} letters only",
      "soundsLike": "REQUIRED — anchor to a real ${nativeLangLabel} word the speaker already knows",
      "meaning": "meaning of this word translated to ${nativeLangLabel}",
      "tone": "one of exactly: rising, falling, flat, dipping, high, low, broken",
      "tip": "1-2 sentence tip in ${nativeLangLabel} referencing the anchor word to explain any differences"
    }
  ],
  "fullTip": "2-3 sentence practical delivery tip written in ${nativeLangLabel}. Include regional/dialect notes when relevant.",
  "formal": "More formal version if meaningful, explanation written in ${nativeLangLabel}. Return null if no real difference."
}

Rules:
- ALL text in soundsLike, meaning, tip, fullTip, and formal fields must be written in ${nativeLangLabel}
- soundsLike is MANDATORY and must reference a real word a ${nativeLangLabel} speaker knows
- Phonetics use ONLY ${nativeLangLabel} letters — never IPA symbols
- Tone must be exactly one of the 7 options listed
- For tonal languages, be very precise about tone direction`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://howdoisay.app",
      "X-Title": "How Do I Say",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL_ID || "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return NextResponse.json({ error: "No response from AI" }, { status: 500 });
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  // ── 3. Write back to Supabase cache (fire and forget) ──────────────────────
  try {
    const writeClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    await writeClient
      .from("howdoisay_phrase_cache")
      .upsert({
        phrase: phraseKey,
        target_lang: targetLanguage,
        native_lang: nativeLang,
        result: parsed,
      }, { onConflict: "phrase,target_lang,native_lang" });
  } catch (err) {
    console.error("Cache write error (non-fatal):", err);
  }

  return NextResponse.json(parsed);
}
