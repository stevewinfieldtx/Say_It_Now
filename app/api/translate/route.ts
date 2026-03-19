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

━━━ YOUR PROCESS (for each syllable) ━━━

Step 1: LISTEN — How does a native speaker actually pronounce this? Ignore spelling. Focus on SOUND.

Step 2: FIND THE CLOSEST ${nativeLangLabel.toUpperCase()} WORD — Then describe the modification.
   Be SPECIFIC about what changes — always say what REPLACES what:
   GOOD: "like 'home' but N instead of M"
   GOOD: "like 'deep' but T instead of D"
   GOOD: "'toy'" (exact match)
   GOOD: "like 'guy' but Y at the start"
   GOOD: "like 'la' in 'latte'"
   BAD: "like 'home' without the M" (vague — what replaces it?)
   BAD: "la but voice drops down" (NEVER describe the tone — the curve shows that)
   BAD: "'kwa' but rising tone" (NEVER mention tone in soundsLike)

Step 3: SPELL THE SOUND — ${nativeLangLabel} letters only (a-z, 1-6 chars) = displayWord.
   Spell the SOUND, not the ${languageName} spelling.
   ${languageName === "Vietnamese" ? `Vietnamese letter-to-sound rules:
   "th" → "t" (hard T, NOT English "th")   |   "ph" → "f"   |   "đ" → "d"
   "x" → "s"   |   "d" → "y" (like Y in "yes")   |   "gi" → "y"
   "c/k" → "k"   |   "nh" → "ny"   |   "ng/ngh" → "ng"   |   "tr" → "ch"
   Vowels: ô → "oh", ơ → "uh", ê → "ay", ă → short "a", â → "uh", ư → "ew"
   u → "oo" as in "go" (shorter/rounder, NOT like "goo")` : ""}

Step 4: REFERENCE WORD — Common word where highlighted part sounds like displayWord.

Step 5: TONE — Look at the ACTUAL tone mark. NEVER default to flat.
   ${languageName === "Vietnamese" ? `No mark → "flat" | á → "rising" | à → "falling" | ả → "dipping" | ã → "dipping" | ạ → "broken"
   Check EVERY syllable. à≠á≠ả≠ã≠ạ are ALL different tones.` : ""}

━━━ OUTPUT ━━━

Return ONLY valid JSON:
{
  "native": "phrase in ${languageName} script",
  "phonetic": "phonetic in ${nativeLangLabel} letters",
  "syllables": [
    {
      "word": "native script",
      "displayWord": "SOUND in a-z, 1-6 chars",
      "tone": "rising|falling|flat|dipping|high|low|broken",
      "referenceWord": "common word with the sound",
      "highlightStart": 0,
      "highlightEnd": 3,
      "soundsLike": "SOUND ONLY hint — NEVER mention tone/pitch/voice direction"
    }
  ]
}

━━━ CRITICAL RULES FOR soundsLike ━━━
- ONLY describe the mouth sound, NEVER the pitch/tone/voice direction
- The tone curve graphic already shows pitch — soundsLike must NOT duplicate that
- WRONG: "la but voice drops" / "kwa with rising tone" / "short and choppy"
- RIGHT: "like 'la' in 'latte'" / "'kwa'" / "like 'moat' but shorter"
- When a sound exactly matches a common word, just write the word in quotes: "'toy'" or "'sin'"
- Keep under 10 words`;

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