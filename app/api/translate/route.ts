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

For each syllable/word you must produce these fields that work together as a system:

━━━ FIELD DEFINITIONS ━━━

1. "displayWord" — The SOUND to show in the tone curve graphic
   This is the EXACT syllable the user needs to say, spelled with ${nativeLangLabel} alphabet letters.
   - Must be 1-6 lowercase a-z characters ONLY (no accents, no IPA, no native script, no spaces)
   - This is what gets animated with the tone curve — each letter rises/falls/dips
   - Example: Vietnamese "chào" → displayWord: "chow"

2. "tone" — The pitch shape of this syllable
   Must be exactly one of: rising, falling, flat, dipping, high, low, broken
   This drives the visual animation where each letter of displayWord rises/falls/dips.

3. "referenceWord" — A common ${nativeLangLabel} word that CONTAINS the sound of displayWord
   CRITICAL RULES for referenceWord:
   - Must be a word that a 10-year-old would know (top ~500 most common words)
   - Good examples: boy, cat, dog, sun, go, see, run, hot, cold, rain, song, day, home, now, how, cow, eye, say, too, food, moon, car, door, ball, fish, ten, fun, red, bed, sit, big, man, low, new, old, high, tree, shoe, blue, free, slow, my, no, so, two, you, we, he, she, me, be, key, tea
   - BAD examples: angst, quiche, bourgeois, faux, niche, genre, debris, coup — these are obscure or foreign-origin
   - If the displayWord IS already a common word (like "sin", "go", "new"), then referenceWord = displayWord
   - If the displayWord is NOT a recognizable word, find a common word that contains that sound as a syllable
   
   *** MOST IMPORTANT RULE ***
   The highlighted portion of referenceWord MUST sound EXACTLY like displayWord when spoken aloud.
   TEST: Say the highlighted part out loud. Does it sound like displayWord? If not, pick a different referenceWord.
   
   WRONG: displayWord="vooey", referenceWord="view", highlight="iew" — "iew" does NOT sound like "vooey"
   WRONG: displayWord="noy", referenceWord="annoy", highlight="noy" — close but "noy" alone is ambiguous
   RIGHT: displayWord="vooey", referenceWord="gooey", highlight="ooey" — "ooey" sounds right, user adds V
   RIGHT: displayWord="chow", referenceWord="cow", highlight="cow" — "cow" has the "ow" sound
   RIGHT: displayWord="sin", referenceWord="sin", highlight="sin" — exact match

   When the displayWord starts with a consonant that isn't in the referenceWord, that's OK —
   the user sees the consonant in the displayWord curve above and gets the vowel sound from the reference below.
   Example: displayWord="vooey" with referenceWord="gooey" highlighted as "ooey" — 
   user sees V-O-O-E-Y in the curve, sees "g**ooey**" below, combines V + ooey sound.

4. "highlightStart" and "highlightEnd" — Character positions marking which part of referenceWord matches the sound
   - 0-indexed, inclusive start, exclusive end
   - If referenceWord = displayWord (whole word matches), set highlightStart=0, highlightEnd=length of word
   - The highlighted characters must SOUND like the displayWord (or its vowel core) when read aloud
   - Example: referenceWord "denver", the sound is "den" → highlightStart=0, highlightEnd=3
   - Example: referenceWord "boy", the sound is "oy" → highlightStart=1, highlightEnd=3
   - Example: referenceWord "gooey", the sound is "ooey" → highlightStart=1, highlightEnd=5
   - Example: referenceWord "sin", the whole word matches → highlightStart=0, highlightEnd=3

━━━ HOW IT ALL WORKS TOGETHER ━━━

The user sees:
1. A tone curve graphic animating the letters of displayWord (rising, falling, etc.)
2. Underneath the curve: the referenceWord with characters [highlightStart:highlightEnd] bolded
3. This tells them: "Make the sound of the bold part of this word, with this pitch shape"

━━━ EXAMPLE (English speaker learning Vietnamese "xin chào") ━━━

Syllable 1 — "xin":
{
  "word": "xin",
  "displayWord": "sin",
  "tone": "flat",
  "referenceWord": "sin",
  "highlightStart": 0,
  "highlightEnd": 3
}
→ Curve shows "sin" flat. Underneath: "**sin**" (whole word bolded, because it IS the sound)

Syllable 2 — "chào":
{
  "word": "chào",
  "displayWord": "chow",
  "tone": "falling",
  "referenceWord": "chow",
  "highlightStart": 0,
  "highlightEnd": 4
}
→ Curve shows "chow" falling. Underneath: "**chow**" (whole word bolded)

━━━ EXAMPLE (English speaker learning Vietnamese "vui") ━━━
{
  "word": "vui",
  "displayWord": "vooey",
  "tone": "flat",
  "referenceWord": "gooey",
  "highlightStart": 1,
  "highlightEnd": 5
}
→ Curve shows "vooey" flat. Underneath: "g**ooey**" — user sees the V in the curve, gets the vowel sound from "ooey"

━━━ RESPONSE FORMAT ━━━

Return ONLY valid JSON in this exact format:
{
  "native": "the phrase in ${languageName} script",
  "phonetic": "full phrase phonetic using ${nativeLangLabel} letters only, no IPA",
  "syllables": [
    {
      "word": "each word in native ${languageName} script",
      "displayWord": "the sound in ${nativeLangLabel} letters, 1-6 chars, lowercase a-z only",
      "tone": "one of: rising, falling, flat, dipping, high, low, broken",
      "referenceWord": "a common ${nativeLangLabel} word where the highlighted portion SOUNDS like displayWord",
      "highlightStart": 0,
      "highlightEnd": 3
    }
  ]
}

Strict rules:
- displayWord: ONLY plain a-z letters, no accents, no IPA, no native script, no spaces, 1-6 chars
- referenceWord: MUST be a very common, simple ${nativeLangLabel} word (think elementary school vocabulary)
- The highlighted part of referenceWord must SOUND like displayWord when spoken aloud — this is the #1 rule
- tone: MUST be exactly one of the 7 values listed
- For tonal languages (Vietnamese, Thai, Mandarin): be very precise about tone direction
- highlightStart/highlightEnd: 0-indexed, marks the exact characters in referenceWord that match the sound
- Keep it minimal — no tips, no meanings, no explanations. Just the pronunciation data.`;

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