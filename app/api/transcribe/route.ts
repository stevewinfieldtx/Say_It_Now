import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { audio, mimeType, language } = await req.json();

  if (!audio) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  // Convert base64 to binary
  const binaryStr = atob(audio);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const ext = mimeType?.includes("webm") ? "webm"
    : mimeType?.includes("ogg") ? "ogg"
    : mimeType?.includes("mp4") ? "mp4"
    : mimeType?.includes("wav") ? "wav"
    : "webm";

  // Build FormData for Whisper via OpenRouter
  const formData = new FormData();
  const blob = new Blob([bytes], { type: mimeType || "audio/webm" });
  formData.append("file", blob, `audio.${ext}`);
  formData.append("model", "openai/whisper-1");
  if (language) {
    formData.append("language", language);
  }

  const response = await fetch("https://openrouter.ai/api/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Whisper error:", err);
    return NextResponse.json({ error: "Transcription failed", detail: err }, { status: 500 });
  }

  const data = await response.json();
  return NextResponse.json({ transcript: data.text });
}
