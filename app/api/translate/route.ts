import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { phrase, targetLanguage, languageName } = await req.json();

  if (!phrase || !targetLanguage || !languageName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const prompt = `You are a pronunciation coach helping an American English speaker say phrases in ${languageName}.

Break down this phrase: "${phrase}"

Your most important job is the "soundsLike" field. Every single sound must be anchored to a real, common English word or phrase that an American already knows. Never write letter combinations like "kohng" in isolation — always say WHAT English word it sounds like.

Good examples of soundsLike:
- 'like "Kong" in King Kong'
- 'rhymes with "boy" and "toy"'
- 'like "chow" as in chow down'
- 'like "sin" in sinful'
- 'like "hall" in hallway'
- 'like "ten" — the number'
- 'like "tea" + "en" = teen'
- 'like the musical note "doh" in do-re-mi'

Return ONLY valid JSON in this exact format:
{
  "native": "the phrase in ${languageName} script",
  "phonetic": "full phrase phonetic using English letters only — no IPA",
  "syllables": [
    {
      "word": "each word in native script",
      "phonetic": "phonetic spelling using English letters only",
      "soundsLike": "REQUIRED — anchor to a real English word. Format: 'like X in Y' or 'rhymes with X and Y'",
      "meaning": "English meaning of this word",
      "tone": "one of exactly: rising, falling, flat, dipping, high, low, broken",
      "tip": "1-2 sentence tip that references the English anchor word to explain any differences"
    }
  ],
  "fullTip": "2-3 sentence practical tip. Include regional/dialect notes when relevant.",
  "formal": "More formal version if meaningful — format: 'Native (phonetic) — when to use'. Return null if no real difference."
}

Rules:
- soundsLike is MANDATORY and must reference a real English word every American knows
- Phonetics use ONLY English letters — never IPA symbols
- Tone must be exactly one of the 7 options listed
- For tonal languages, be very precise about tone direction`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://say-it-now.vercel.app",
        "X-Title": "Say It Now",
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

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Translation error:", err);
    return NextResponse.json({ error: "Failed to generate breakdown" }, { status: 500 });
  }
}
