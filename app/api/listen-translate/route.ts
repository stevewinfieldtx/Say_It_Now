import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { transcript, fromLanguage, fromLanguageName, toLanguage, toLanguageName } = await req.json();

  if (!transcript || !fromLanguage || !toLanguage) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const prompt = `You are a real-time conversation translator helping someone understand what was just said to them.

Someone just said this in ${fromLanguageName}:
"${transcript}"

Translate this into ${toLanguageName} for the person who only speaks ${toLanguageName}.

Return ONLY valid JSON in this exact format:
{
  "translation": "the full translation in ${toLanguageName}",
  "literal": "a word-for-word literal translation if it differs meaningfully from the natural translation, otherwise null",
  "tone": "one of: friendly, formal, neutral, question, urgent",
  "summary": "one short sentence in ${toLanguageName} describing what they want or mean — like a headline. Max 10 words."
}

Rules:
- translation must be natural, fluent ${toLanguageName} — how a native speaker would say it
- literal is only useful if the phrasing is unusual or the meaning differs from literal words
- tone helps the user understand the emotional register
- summary is for quick comprehension at a glance`;

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
      temperature: 0.2,
    }),
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return NextResponse.json({ error: "No response from AI" }, { status: 500 });
  }

  try {
    const parsed = JSON.parse(content);
    return NextResponse.json({ ...parsed, original: transcript });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}
