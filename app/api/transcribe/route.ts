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

  // Determine file extension from mime type
  const ext = mimeType?.includes("webm") ? "webm"
    : mimeType?.includes("ogg") ? "ogg"
    : mimeType?.includes("mp4") ? "mp4"
    : mimeType?.includes("wav") ? "wav"
    : "webm";

  // Build FormData for Whisper API
  const formData = new FormData();
  const blob = new Blob([bytes], { type: mimeType || "audio/webm" });
  formData.append("file", blob, `audio.${ext}`);
  formData.append("model", "whisper-1");
  if (language) {
    // Pass the ISO-639-1 language hint to Whisper for better accuracy
    formData.append("language", language);
  }

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Whisper error:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }

  const data = await response.json();
  return NextResponse.json({ transcript: data.text });
}
