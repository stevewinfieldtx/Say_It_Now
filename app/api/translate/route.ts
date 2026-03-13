import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

For each syllable/word you must produce THREE tightly related fields: "soundsLike", "displayWord", and "tone".
These three fields work together as a system — they are the heart of the whole app.

━━━ HOW THE THREE FIELDS WORK TOGETHER ━━━

1. "soundsLike" — The human explanation (text the user reads)
   Use a familiar ${nativeLangLabel} word as the anchor, then describe the modification.
   Format: "like '[anchor]' but [modification]" or "rhymes with '[anchor]'"
   Examples:
   - "like 'song' but start with a V"
   - "rhymes with 'now'"
   - "like 'king' but cut off the 'ki', just say 'ng'"
   - "like 'see' but shorter and clipped"
   NEVER just say the anchor word alone — always include the modification if there is one.

2. "displayWord" — The visual pronunciation (letters the user will SEE animated with tone shape)
   This is NOT the native script. This is NOT the anchor word.
   This is the ACTUAL SOUND spelled out using ${nativeLangLabel} alphabet letters.
   Build it by taking the anchor word and applying the modification to it.
   Examples:
   - soundsLike "like 'song' but start with a V" → displayWord: "vong"
   - soundsLike "rhymes with 'now'" → displayWord: "now"
   - soundsLike "like 'king' but just the 'ng' sound" → displayWord: "ng"
   - soundsLike "like 'see' but shorter" → displayWord: "see"
   - soundsLike "like 'fun' but with an 'oo' sound" → displayWord: "foon"
   Rules for displayWord:
   - Use ONLY ${nativeLangLabel} alphabet letters (a-z, no accents, no IPA, no native script)
   - Must be 1-6 characters — short enough to display letter by letter
   - Must represent the ACTUAL sound to produce, not the anchor
   - If the anchor IS the right sound with no modification, displayWord = anchor word

3. "tone" — The pitch shape of this syllable
   Must be exactly one of: rising, falling, flat, dipping, high, low, broken
   This drives the visual animation where each letter of displayWord rises/falls/dips.

━━━ EXAMPLE (English speaker learning Vietnamese "vọng") ━━━
{
  "word": "vọng",
  "soundsLike": "like 'song' but start with a V",
  "displayWord": "vong",
  "tone": "dipping"
}
Result: the letters V-O-N-G animate in a dipping curve so the user sees 'vong' and knows the pitch shape.

Return ONLY valid JSON in this exact format:
{
  "native": "the phrase in ${languageName} script",
  "phonetic": "full phrase phonetic — spell it out using ${nativeLangLabel} letters only, no IPA",
  "syllables": [
    {
      "word": "each word in native ${languageName} script",
      "phonetic": "phonetic spelling using ${nativeLangLabel} letters only",
      "soundsLike": "like '[${nativeLangLabel} anchor word]' but [modification, if any]",
      "displayWord": "the actual sound in ${nativeLangLabel} letters — 1 to 6 chars, no accents",
      "meaning": "what this word means, written in ${nativeLangLabel}",
      "tone": "one of exactly: rising, falling, flat, dipping, high, low, broken",
      "tip": "1-2 sentence tip in ${nativeLangLabel} helping nail the difference from the anchor word"
    }
  ],
  "fullTip": "2-3 sentence practical delivery tip in ${nativeLangLabel}. Include regional/dialect notes if relevant.",
  "formal": "Formal version explanation in ${nativeLangLabel}, or null if no meaningful difference."
}

Strict rules:
- ALL explanation text (soundsLike, meaning, tip, fullTip, formal) must be written in ${nativeLangLabel}
- displayWord must use ONLY plain ${nativeLangLabel} a-z letters — no accents, no IPA, no native script, no spaces
- displayWord must be the ACTUAL sound to produce — not just the anchor word unless the anchor is already correct
- tone must be exactly one of the 7 values listed
- For tonal languages (Vietnamese, Thai, Mandarin, Cantonese): be very precise about tone direction`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://howdoisay.app",
      "X-Title": "How Do I Say",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL_ID,
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
