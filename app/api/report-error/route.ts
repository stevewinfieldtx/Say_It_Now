import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  const { phrase, word, targetLang, nativeLang, displayWord, soundsLike, tone } = await req.json();

  if (!phrase || !word) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await client.from("howdoisay_error_reports").insert({
      phrase,
      word,
      target_lang: targetLang || "vi",
      native_lang: nativeLang || "en",
      display_word: displayWord || null,
      sounds_like: soundsLike || null,
      tone: tone || null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error report failed:", err);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}