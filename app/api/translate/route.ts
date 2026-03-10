import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { phrase, targetLanguage, languageName } = await req.json();

  if (!phrase || !targetLanguage || !languageName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const prompt = `You are a pronunciation coach helping an English speaker say phrases in ${languageName}.

Break down this phrase: "${phrase}"

Return ONLY valid JSON in this exact format:
{
  "native": "the phrase in ${languageName} script",
  "phonetic": "full phrase phonetic pronunciation using only English sounds and letters — no IPA symbols",
  "syllables": [
    {
      "word": "each word in native script",
      "phonetic": "English phonetic for this word only (e.g. 'kahm', 'nyee-ew')",
      "meaning": "English meaning of this word",
      "tone": "one of exactly: rising, falling, flat, dipping, high, low, broken",
      "tip": "1-2 sentence pronunciation tip comparing to English words or sounds the learner already knows"
    }
  ],
  "fullTip": "2-3 sentence practical delivery tip. Include regional/dialect notes when relevant (e.g. Da Nang vs Hanoi for Vietnamese, Castilian vs Latin American for Spanish).",
  "formal": "A more formal or polite version if one exists — format: 'Native script (phonetic) — brief explanation of when to use'. Return null if no meaningful difference exists."
}

Rules:
- Phonetics must use ONLY common English letter combinations. Never use IPA.
- Tone must be exactly one of the 7 options: rising, falling, flat, dipping, high, low, broken
- Tips should reference English words the learner already knows (e.g. 'like the word toy', 'rhymes with boy')
- fullTip should be practical and conversational — like advice from a local friend
- For tonal languages (Vietnamese, Thai, Mandarin, etc.) be very precise about tone direction`;

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
