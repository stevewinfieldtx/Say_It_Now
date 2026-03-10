"use client";
import { useState, useRef } from "react";

const LANGUAGES = [
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Mandarin Chinese", flag: "🇨🇳" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
];

const TONE_INFO: Record<string, { symbol: string; color: string; label: string; desc: string }> = {
  rising:  { symbol: "↗", color: "#2563eb", label: "Rising",  desc: "Voice goes UP at the end" },
  falling: { symbol: "↘", color: "#dc2626", label: "Falling", desc: "Voice goes DOWN" },
  flat:    { symbol: "→", color: "#6b7280", label: "Flat",    desc: "Keep voice LEVEL" },
  dipping: { symbol: "↓↗", color: "#7c3aed", label: "Dipping", desc: "Dips DOWN then back UP" },
  high:    { symbol: "⬆",  color: "#059669", label: "High",    desc: "Start and stay HIGH" },
  low:     { symbol: "⬇",  color: "#d97706", label: "Low",     desc: "Start and stay LOW" },
  broken:  { symbol: "〜", color: "#be185d", label: "Broken",  desc: "Tight throat, creaky sound" },
};

interface Syllable {
  word: string;
  phonetic: string;
  soundsLike: string;   // The KEY new field — "like X in King Kong"
  meaning: string;
  tone: string;
  tip: string;
}

interface PhraseResult {
  native: string;
  phonetic: string;
  syllables: Syllable[];
  fullTip: string;
  formal: string | null;
}

type CacheMap = Record<string, Record<string, PhraseResult>>;

// ─────────────────────────────────────────────────────────────
// RULE: Every "soundsLike" must reference a real, common English
// word or phrase that an American already knows how to say.
// Format: 'like "Kong" in King Kong' or 'rhymes with "toy"'
// ─────────────────────────────────────────────────────────────
const PHRASE_CACHE: CacheMap = {
  vi: {
    "hello": {
      native: "Xin chào",
      phonetic: "sin chow",
      syllables: [
        {
          word: "Xin",
          phonetic: "sin",
          soundsLike: 'like "sin" in sinful',
          meaning: "please / polite opener",
          tone: "flat",
          tip: "The H in Vietnamese Xin is silent. Just say the English word 'sin' — that's it. Flat and short.",
        },
        {
          word: "chào",
          phonetic: "chow",
          soundsLike: 'like "chow" as in chow down',
          meaning: "greet",
          tone: "rising",
          tip: "Say 'chow' like you're talking about food, but let your voice lift up at the end — like you're asking a question.",
        },
      ],
      fullTip: "Put it together: 'sin-CHOW?' — the second word rises like a question. In Da Nang, locals say this fast and warm. You'll hear it dozens of times a day.",
      formal: "Xin chào anh/chị (sin chow AHN / sin chow CHEE) — add 'older brother' or 'older sister' for extra politeness",
    },
    "thank you": {
      native: "Cảm ơn",
      phonetic: "kahm uhn",
      syllables: [
        {
          word: "Cảm",
          phonetic: "kahm",
          soundsLike: 'like "calm" — but cut it short',
          meaning: "feel / sense",
          tone: "dipping",
          tip: "Start like you're saying 'calm', but cut it off fast. Your voice dips down then bounces slightly back up — like you're nodding while you say it.",
        },
        {
          word: "ơn",
          phonetic: "uhn",
          soundsLike: 'like the "un" in under',
          meaning: "grace / favor",
          tone: "flat",
          tip: "Just a short flat 'uhn'. Don't stretch it. Think of it like a quick nod of acknowledgment.",
        },
      ],
      fullTip: "Say it as almost one quick word: 'KAHM-uhn'. Vietnamese people say this fast — drawing it out sounds unnatural. In Da Nang you'll use this constantly.",
      formal: "Cảm ơn bạn (kahm uhn BAHN) — adds 'you', like saying 'thank YOU' with extra warmth",
    },
    "thank you very much": {
      native: "Cảm ơn rất nhiều",
      phonetic: "kahm uhn zuht nyee-ew",
      syllables: [
        {
          word: "Cảm",
          phonetic: "kahm",
          soundsLike: 'like "calm" cut short',
          meaning: "feel",
          tone: "dipping",
          tip: "Same as regular thank you — dips then bounces.",
        },
        {
          word: "ơn",
          phonetic: "uhn",
          soundsLike: 'like "un" in under',
          meaning: "grace",
          tone: "flat",
          tip: "Short flat 'uhn'.",
        },
        {
          word: "rất",
          phonetic: "zuht",
          soundsLike: 'like "zut" — rhymes with "but"',
          meaning: "very",
          tone: "falling",
          tip: "In Da Nang and Southern Vietnam, the R sounds like a Z. Say 'zuht' with a sharp drop — like you're agreeing firmly with someone.",
        },
        {
          word: "nhiều",
          phonetic: "nyee-ew",
          soundsLike: 'start with "ny" like in "new York", glide to "ew"',
          meaning: "much / a lot",
          tone: "rising",
          tip: "Think 'nyew' — start with the NY sound from New York, then let your voice lift up at the end.",
        },
      ],
      fullTip: "This phrase carries real weight. Use it when someone goes out of their way for you. In Da Nang: 'KAHM-uhn ZUHT nyee-EW' — the last word rises like you mean it.",
      formal: null,
    },
    "excuse me": {
      native: "Xin lỗi",
      phonetic: "sin loy",
      syllables: [
        {
          word: "Xin",
          phonetic: "sin",
          soundsLike: 'like "sin" in sinful',
          meaning: "please",
          tone: "flat",
          tip: "Same flat 'sin' as in hello (xin chào).",
        },
        {
          word: "lỗi",
          phonetic: "loy",
          soundsLike: 'rhymes with "boy" or "toy"',
          meaning: "mistake",
          tone: "dipping",
          tip: "Say 'loy' like it rhymes with boy, but let your voice dip down then come back up slightly — like you're genuinely a little sorry.",
        },
      ],
      fullTip: "Works for both 'excuse me' (getting attention) AND 'sorry' (apologizing). One phrase, two uses. Very handy in markets and restaurants.",
      formal: null,
    },
    "goodbye": {
      native: "Tạm biệt",
      phonetic: "tahm bee-et",
      syllables: [
        {
          word: "Tạm",
          phonetic: "tahm",
          soundsLike: 'like "Tom" but say it with an "ah" — TAHm',
          meaning: "temporary",
          tone: "falling",
          tip: "Say 'Tom' but open your mouth wider for an 'ah' sound. Your voice drops sharply — like you're ending a sentence.",
        },
        {
          word: "biệt",
          phonetic: "bee-et",
          soundsLike: 'like "beat" but with a tiny "et" at the end — bee-ET',
          meaning: "separate",
          tone: "falling",
          tip: "Like 'beat' but add a small 'et' at the end. Voice falls on both syllables.",
        },
      ],
      fullTip: "Formal farewell. In casual Da Nang life, many Vietnamese (especially younger people) just wave and say 'bye bye' in English — and that's totally fine too.",
      formal: null,
    },
    "how much is this?": {
      native: "Cái này bao nhiêu tiền?",
      phonetic: "kai nai bow nyee-ew tee-en",
      syllables: [
        {
          word: "Cái",
          phonetic: "kai",
          soundsLike: 'like "kai" in karate or "Thai" with a K',
          meaning: "classifier for objects",
          tone: "falling",
          tip: "'Kai' with a sharp drop. Like answering 'KAI!' firmly.",
        },
        {
          word: "này",
          phonetic: "nai",
          soundsLike: 'like "nigh" — rhymes with "high" and "buy"',
          meaning: "this",
          tone: "rising",
          tip: "Say 'nigh' and let your voice rise — like you're pointing at something and asking 'this one?'",
        },
        {
          word: "bao",
          phonetic: "bow",
          soundsLike: 'like "bow" as in take a bow on stage',
          meaning: "how much",
          tone: "flat",
          tip: "Flat 'bow' — like an actor bowing. Level tone, no rise or fall.",
        },
        {
          word: "nhiêu",
          phonetic: "nyee-ew",
          soundsLike: 'like "new" but start with "ny" — New York style',
          meaning: "much",
          tone: "flat",
          tip: "Flat 'nyew'. Think of the NY in New York — that NY sound, then 'ew'. Keep it level.",
        },
        {
          word: "tiền",
          phonetic: "tee-en",
          soundsLike: 'like "teen" with your voice rising — TEE-en?',
          meaning: "money",
          tone: "rising",
          tip: "This is the key word — vendors hear 'tiền' and instantly know you're asking price. Say 'teen' and let it rise like a question.",
        },
      ],
      fullTip: "Point at the item and say it with a smile. The full phrase works great, but even just 'bao nhiêu tiền?' (bow nyew teen?) gets the job done in any Da Nang market.",
      formal: null,
    },
    "the bill please": {
      native: "Tính tiền",
      phonetic: "ting tee-en",
      syllables: [
        {
          word: "Tính",
          phonetic: "ting",
          soundsLike: 'like "ting" — the sound a bell makes',
          meaning: "calculate / add up",
          tone: "falling",
          tip: "Like a bell going 'ting!' — but let your voice fall at the end instead of ringing up.",
        },
        {
          word: "tiền",
          phonetic: "tee-en",
          soundsLike: 'like "teen" with a rising lilt',
          meaning: "money",
          tone: "rising",
          tip: "Same money word as above. Voice rises — you're asking them to tally up your bill.",
        },
      ],
      fullTip: "Make a writing gesture in the air while saying 'ting-TEE-en?' — the universal check-please move. Works every single time in Da Nang restaurants.",
      formal: null,
    },
    "no ice": {
      native: "Không đá",
      phonetic: "kohng dah",
      syllables: [
        {
          word: "Không",
          phonetic: "kohng",
          soundsLike: 'like "Kong" in King Kong',
          meaning: "no / without",
          tone: "flat",
          tip: "Say 'Kong' like King Kong — but start with a slightly breathy K. Flat tone, no rise or fall. KONG.",
        },
        {
          word: "đá",
          phonetic: "dah",
          soundsLike: 'like "dah" — the first note in do-re-mi',
          meaning: "ice",
          tone: "falling",
          tip: "Like a conductor saying 'DAH!' — sharp and falling. Short.",
        },
      ],
      fullTip: "Say it when ordering: 'KONG-dah'. Essential for coffee and drinks in Vietnam — ice here is often made from tap water. Locals hear this from expats constantly.",
      formal: null,
    },
    "delicious": {
      native: "Ngon",
      phonetic: "ngon",
      syllables: [
        {
          word: "Ngon",
          phonetic: "ngon",
          soundsLike: 'like the END of "sing" + "on" — siNG + ON = ngon',
          meaning: "delicious / tasty",
          tone: "flat",
          tip: "This is the trickiest sound in Vietnamese for Americans. You can't start a word with 'ng' in English — but you END words with it: siNG, riNG, kiNG. Practice: say 'sing', stop before the vowel, and just say that final 'ng' sound. Then add 'on'. NgON.",
        },
      ],
      fullTip: "One word that will make you instant friends in Vietnam. Say it right after eating: 'Ngon!' For more: 'Ngon lắm!' (ngon LAHM) = so delicious! or 'Ngon quá!' (ngon KWAH) = amazingly good!",
      formal: "Ngon lắm (ngon LAHM) — 'Very delicious'. LAHM rhymes with 'mom'.",
    },
    "where is the bathroom?": {
      native: "Nhà vệ sinh ở đâu?",
      phonetic: "nyah vey sing uh doh",
      syllables: [
        {
          word: "Nhà",
          phonetic: "nyah",
          soundsLike: 'like "nya" in lasagna — la-ZA-nya',
          meaning: "house / room",
          tone: "rising",
          tip: "That 'nya' sound at the end of lasagna — say that, and let your voice rise. NYA?",
        },
        {
          word: "vệ",
          phonetic: "vey",
          soundsLike: 'like "vay" in "oy vey"',
          meaning: "hygiene",
          tone: "falling",
          tip: "Like the Yiddish expression 'oy vey' — just the 'vey' part. Voice falls.",
        },
        {
          word: "sinh",
          phonetic: "sing",
          soundsLike: 'like "sing" — what you do in the shower',
          meaning: "life",
          tone: "flat",
          tip: "Exactly the English word 'sing'. Flat tone.",
        },
        {
          word: "ở",
          phonetic: "uh",
          soundsLike: 'like "uh" — the hesitation sound',
          meaning: "located at",
          tone: "dipping",
          tip: "Like when you pause mid-sentence and say 'uh'. But with a slight dip-rise in tone.",
        },
        {
          word: "đâu",
          phonetic: "doh",
          soundsLike: 'like "doh" — the musical note (do-re-mi)',
          meaning: "where",
          tone: "flat",
          tip: "Like Julie Andrews singing 'DOH, a deer'. Flat and level.",
        },
      ],
      fullTip: "Shortcut that always works: 'toilet uh DOH?' — everyone recognizes the word 'toilet' and the 'where?' at the end makes it clear. Saves memorizing the whole thing.",
      formal: null,
    },
    "i don't understand": {
      native: "Tôi không hiểu",
      phonetic: "toy kohng hee-ew",
      syllables: [
        {
          word: "Tôi",
          phonetic: "toy",
          soundsLike: 'like "toy" — exactly the English word',
          meaning: "I / me",
          tone: "flat",
          tip: "Literally the English word 'toy'. Flat tone. Easy.",
        },
        {
          word: "không",
          phonetic: "kohng",
          soundsLike: 'like "Kong" in King Kong',
          meaning: "not / no",
          tone: "flat",
          tip: "King Kong again — flat KONG. This word means 'not' or 'no'. Flat tone.",
        },
        {
          word: "hiểu",
          phonetic: "hee-ew",
          soundsLike: 'like "hew" as in hewing wood — but start with "hee"',
          meaning: "understand",
          tone: "dipping",
          tip: "Start with 'hee' then glide to 'ew'. Like saying 'heew' — voice dips down then comes back up.",
        },
      ],
      fullTip: "Say it, smile, and shrug. Vietnamese people are patient — they'll slow down, repeat, or use gestures. Very common phrase for expats in Da Nang.",
      formal: null,
    },
    "i want this": {
      native: "Tôi muốn cái này",
      phonetic: "toy moo-un kai nai",
      syllables: [
        {
          word: "Tôi",
          phonetic: "toy",
          soundsLike: 'like "toy" — the English word',
          meaning: "I",
          tone: "flat",
          tip: "The English word 'toy'. Flat.",
        },
        {
          word: "muốn",
          phonetic: "moo-un",
          soundsLike: 'like "moon" but cut short — MOO-un',
          meaning: "want",
          tone: "falling",
          tip: "Like 'moon' but don't hold the N — let it drop fast. MOO-un with a falling tone.",
        },
        {
          word: "cái",
          phonetic: "kai",
          soundsLike: 'like "kai" in karate',
          meaning: "this thing",
          tone: "falling",
          tip: "'Kai' — falls sharply.",
        },
        {
          word: "này",
          phonetic: "nai",
          soundsLike: 'rhymes with "high", "buy", "fly"',
          meaning: "this",
          tone: "rising",
          tip: "Rhymes with 'high'. Voice rises — like you're pointing and saying 'THIS one!'",
        },
      ],
      fullTip: "Point directly at what you want while saying it. In a pinch, just point and say 'KAI-nai?' (this one?) — vendors understand instantly.",
      formal: null,
    },
    "can you speak slower?": {
      native: "Bạn có thể nói chậm hơn không?",
      phonetic: "bahn koh teh noy chum hun kohng",
      syllables: [
        {
          word: "Bạn",
          phonetic: "bahn",
          soundsLike: 'like "bahn" in bahn mi sandwich',
          meaning: "you (friend)",
          tone: "falling",
          tip: "Like the Vietnamese sandwich 'bánh mì' — just the first word 'bahn'. Falls.",
        },
        {
          word: "có thể",
          phonetic: "koh teh",
          soundsLike: '"koh" like "co" in co-worker, "teh" like "teh" in kettle',
          meaning: "can / able to",
          tone: "rising",
          tip: "'Koh-teh' together means 'can'. Short and light.",
        },
        {
          word: "nói",
          phonetic: "noy",
          soundsLike: 'rhymes with "boy" and "toy" — NOY',
          meaning: "speak",
          tone: "rising",
          tip: "Like 'boy' or 'toy' but with an N. Voice rises.",
        },
        {
          word: "chậm",
          phonetic: "chum",
          soundsLike: 'like "chum" — what you call a buddy',
          meaning: "slow",
          tone: "falling",
          tip: "Like calling someone 'chum' (old-fashioned for friend). Falls sharply.",
        },
        {
          word: "hơn",
          phonetic: "hun",
          soundsLike: 'like "hun" — what you call your honey',
          meaning: "more",
          tone: "flat",
          tip: "Like calling someone 'hun' (short for honey). Flat and quick.",
        },
        {
          word: "không",
          phonetic: "kohng",
          soundsLike: 'like "Kong" in King Kong — rises here as a question',
          meaning: "right? / or not?",
          tone: "rising",
          tip: "At the end of a question, King Kong rises — like adding '...okay?' or '...right?' in English.",
        },
      ],
      fullTip: "Long phrase — shortcut: hold up your hand slowly and just say 'CHUM HUN?' (slower?) with a questioning look. Locals get it every time.",
      formal: null,
    },
    "do you speak english?": {
      native: "Bạn có nói tiếng Anh không?",
      phonetic: "bahn koh noy tee-eng ahng kohng",
      syllables: [
        {
          word: "Bạn",
          phonetic: "bahn",
          soundsLike: 'like "bahn" in bahn mi',
          meaning: "you",
          tone: "falling",
          tip: "Bahn mi sandwich — just the first word. Falls.",
        },
        {
          word: "có",
          phonetic: "koh",
          soundsLike: 'like "co" in co-worker',
          meaning: "have / do",
          tone: "rising",
          tip: "Short rising 'koh'.",
        },
        {
          word: "nói",
          phonetic: "noy",
          soundsLike: 'rhymes with "boy"',
          meaning: "speak",
          tone: "rising",
          tip: "Rhymes with boy. Rises.",
        },
        {
          word: "tiếng",
          phonetic: "tee-eng",
          soundsLike: 'like "teeng" — "teen" with a soft G at the end',
          meaning: "language",
          tone: "rising",
          tip: "Like 'teen' but add a soft 'ng' at the end (like siNG). Rises.",
        },
        {
          word: "Anh",
          phonetic: "ahng",
          soundsLike: 'like "ahng" — rhymes with "song" but starts with AH',
          meaning: "English (language)",
          tone: "flat",
          tip: "Flat 'ahng'. Rhymes with 'song' but with an 'ah' at the start.",
        },
        {
          word: "không",
          phonetic: "kohng",
          soundsLike: 'like "Kong" in King Kong',
          meaning: "or not? (question ender)",
          tone: "rising",
          tip: "Question-ender — rises like 'right?'",
        },
      ],
      fullTip: "Asking this in Vietnamese first earns you instant goodwill. In Da Nang, younger people in tourist areas often speak some English. In local neighborhoods, less so — but they'll appreciate the effort.",
      formal: null,
    },
    "my name is steve": {
      native: "Tên tôi là Steve",
      phonetic: "ten toy lah Steve",
      syllables: [
        {
          word: "Tên",
          phonetic: "ten",
          soundsLike: 'like "ten" — the number 10',
          meaning: "name",
          tone: "rising",
          tip: "The number ten. But let your voice rise — like you're introducing a topic.",
        },
        {
          word: "tôi",
          phonetic: "toy",
          soundsLike: 'like "toy" — the English word',
          meaning: "my / I",
          tone: "flat",
          tip: "Toy. Flat.",
        },
        {
          word: "là",
          phonetic: "lah",
          soundsLike: 'like "lah" — the musical note (do-re-mi-fa-sol-LA)',
          meaning: "is",
          tone: "flat",
          tip: "Like the musical note LA. Flat and clear.",
        },
        {
          word: "Steve",
          phonetic: "Steve",
          soundsLike: "your name — say it exactly as you normally do",
          meaning: "(your name)",
          tone: "flat",
          tip: "Vietnamese people recognize Western names easily. You may get nicknamed 'Anh Steve' (Older Brother Steve) — that's a sign of warmth.",
        },
      ],
      fullTip: "Simple and memorable: 'TEN toy LAH Steve.' Vietnamese people often give expats a nickname — don't be surprised if you become 'Anh Steve' around Da Nang.",
      formal: null,
    },
    "nice to meet you": {
      native: "Rất vui được gặp bạn",
      phonetic: "zuht voo-ee duh-uk gup bahn",
      syllables: [
        {
          word: "Rất",
          phonetic: "zuht",
          soundsLike: 'like "zut" — rhymes with "but" and "cut"',
          meaning: "very",
          tone: "falling",
          tip: "In Da Nang the R is a Z sound. 'Zuht' — rhymes with 'but'. Sharp fall.",
        },
        {
          word: "vui",
          phonetic: "voo-ee",
          soundsLike: 'like "we" but start with a V — VOO-ee',
          meaning: "happy / joyful",
          tone: "flat",
          tip: "Like 'we' but with a V in front. 'Voo-ee'. Flat glide.",
        },
        {
          word: "được",
          phonetic: "duh-uk",
          soundsLike: 'like "duh" + "ook" said fast — duh-OOK',
          meaning: "get to / able to",
          tone: "falling",
          tip: "Two short sounds: 'duh' then 'uk'. Said fast together. Falls.",
        },
        {
          word: "gặp",
          phonetic: "gup",
          soundsLike: 'like "gup" — rhymes with "cup" and "pup"',
          meaning: "meet",
          tone: "falling",
          tip: "Rhymes with cup. Short and sharp. Falls.",
        },
        {
          word: "bạn",
          phonetic: "bahn",
          soundsLike: 'like "bahn" in bahn mi',
          meaning: "you / friend",
          tone: "falling",
          tip: "Bahn mi. Falls.",
        },
      ],
      fullTip: "Warm full phrase. Shortcut if it's too much: just 'Vui gặp bạn' (VOO-ee gup BAHN) — 'Happy to meet you' — works perfectly and is easier to remember.",
      formal: null,
    },
    "cheers!": {
      native: "Chúc sức khỏe!",
      phonetic: "chook suk kweh",
      syllables: [
        {
          word: "Chúc",
          phonetic: "chook",
          soundsLike: 'like "chook" — rhymes with "book" and "cook"',
          meaning: "wish / toast",
          tone: "rising",
          tip: "Rhymes with 'cook'. Let your voice rise — you're making a toast!",
        },
        {
          word: "sức",
          phonetic: "suk",
          soundsLike: 'like "suck" — rhymes with "duck" and "luck"',
          meaning: "strength / health",
          tone: "falling",
          tip: "Rhymes with luck. Falls quickly.",
        },
        {
          word: "khỏe",
          phonetic: "kweh",
          soundsLike: 'like "kweh" — rhymes with "way" but start with KW',
          meaning: "healthy / well",
          tone: "dipping",
          tip: "Like 'way' but with a KW in front. Voice dips then rises — like the exclamation point on the toast.",
        },
      ],
      fullTip: "Literally 'Wishing you good health' — beautiful. You'll also hear locals shout 'Một, hai, ba, dzô!' (moht, hai, bah, zoh!) — One, two, three, cheers! Join in and you'll be everyone's favorite.",
      formal: null,
    },
    "one more please": {
      native: "Thêm một cái nữa",
      phonetic: "tem moht kai noo-ah",
      syllables: [
        {
          word: "Thêm",
          phonetic: "tem",
          soundsLike: 'like "them" — the English word, but without the H sound',
          meaning: "add / more",
          tone: "flat",
          tip: "Like the English word 'them' but drop the H. 'TEM'. Flat.",
        },
        {
          word: "một",
          phonetic: "moht",
          soundsLike: 'like "moat" — the water around a castle',
          meaning: "one",
          tone: "falling",
          tip: "Like the castle moat. 'MOHT' with a sharp fall.",
        },
        {
          word: "cái",
          phonetic: "kai",
          soundsLike: 'like "kai" in karate',
          meaning: "one (counter word)",
          tone: "falling",
          tip: "Karate KAI. Falls.",
        },
        {
          word: "nữa",
          phonetic: "noo-ah",
          soundsLike: 'like "noo-ah" — rhymes with "boa" (the snake)',
          meaning: "more / again",
          tone: "dipping",
          tip: "Like a boa constrictor — 'noo-ah'. Dips then rises.",
        },
      ],
      fullTip: "Hold up one finger while saying it — crystal clear in any café or restaurant in Da Nang. Works for drinks, dishes, anything.",
      formal: null,
    },
  },

  es: {
    "hello": {
      native: "Hola",
      phonetic: "oh-lah",
      syllables: [
        {
          word: "Ho",
          phonetic: "oh",
          soundsLike: 'like "oh" — the exclamation',
          meaning: "(first syllable — H is silent in Spanish)",
          tone: "flat",
          tip: "The H is ALWAYS silent in Spanish. Don't say 'hoh'. Just 'oh'. Like you just realized something: 'Oh!'",
        },
        {
          word: "la",
          phonetic: "lah",
          soundsLike: 'like "lah" — the musical note',
          meaning: "(together: hello)",
          tone: "falling",
          tip: "The musical note LA. Slight natural fall at the end.",
        },
      ],
      fullTip: "Put it together: 'OH-lah'. If you say the H you'll instantly sound foreign. Drop it completely. Works in every Spanish-speaking country on Earth.",
      formal: "Buenos días (BWEH-nos DEE-as) — 'Good morning', use with strangers or in formal settings",
    },
    "thank you": {
      native: "Gracias",
      phonetic: "grah-see-as",
      syllables: [
        {
          word: "Gra",
          phonetic: "grah",
          soundsLike: 'like "gra" in grab or grass',
          meaning: "(first syllable)",
          tone: "flat",
          tip: "Like the start of 'grab'. Flat. This is the stressed syllable — say it slightly stronger.",
        },
        {
          word: "cias",
          phonetic: "see-as",
          soundsLike: 'like "see-us" — as in "I see us"',
          meaning: "(together: thank you)",
          tone: "falling",
          tip: "In all of Latin America (and most of the world): 'see-as'. In Spain only: 'thee-as' with a lisp. Since you're traveling internationally, 'see-as' is your safe default.",
        },
      ],
      fullTip: "Stress the first syllable: GRA-see-as. Don't stress the last part. For more: 'Muchas gracias' (MOO-chas GRA-see-as) = many thanks.",
      formal: "Muchas gracias (MOO-chas GRA-see-as) — 'Many thanks', warm and enthusiastic",
    },
    "how much is this?": {
      native: "¿Cuánto cuesta esto?",
      phonetic: "kwahn-toh kwes-tah es-toh",
      syllables: [
        {
          word: "Cuánto",
          phonetic: "kwahn-toh",
          soundsLike: 'like "want-oh" but start with a KW sound — KWAHN-toh',
          meaning: "how much",
          tone: "rising",
          tip: "Like 'want' with a KW start. Rises — it's a question word.",
        },
        {
          word: "cuesta",
          phonetic: "kwes-tah",
          soundsLike: 'like "quest-ah" — like you\'re on a quest',
          meaning: "costs",
          tone: "flat",
          tip: "Like 'quest' + 'ah'. Flat.",
        },
        {
          word: "esto",
          phonetic: "es-toh",
          soundsLike: 'like "ess-toe" — the letter S + your toe',
          meaning: "this",
          tone: "falling",
          tip: "The letter S, then your toe: 'ess-TOE'. Natural fall at the end.",
        },
      ],
      fullTip: "Just 'KWAHN-toh?' while pointing at something works everywhere. Vendors know exactly what you're asking. The full phrase is more polished but the one word gets the job done.",
      formal: null,
    },
    "thank you very much": {
      native: "Muchas gracias",
      phonetic: "moo-chas grah-see-as",
      syllables: [
        {
          word: "Muchas",
          phonetic: "moo-chas",
          soundsLike: 'like "moo" (cow sound) + "chas" rhyming with "jazz"',
          meaning: "many / much",
          tone: "flat",
          tip: "MOO like a cow, then CHAS like jazz. 'MOO-chas'. Stress the first syllable.",
        },
        {
          word: "gracias",
          phonetic: "grah-see-as",
          soundsLike: 'like "gra" in grab + "see-us"',
          meaning: "thanks",
          tone: "falling",
          tip: "Same as regular gracias — GRA-see-as.",
        },
      ],
      fullTip: "The go-to for genuine gratitude throughout Latin America and Spain. 'MOO-chas GRA-see-as' — stress on MOO and GRA.",
      formal: null,
    },
    "hello": {
      native: "Hola",
      phonetic: "oh-lah",
      syllables: [
        { word: "Hola", phonetic: "oh-lah", soundsLike: 'like "oh-lah" — H is silent, always', meaning: "hello", tone: "flat", tip: "Silent H. Just OH-lah." },
      ],
      fullTip: "Universal Spanish greeting. H is always silent in Spanish.",
      formal: "Buenos días (BWEH-nos DEE-as) — Good morning",
    },
  },

  nl: {
    "hello": {
      native: "Hallo",
      phonetic: "hah-loh",
      syllables: [
        {
          word: "Hal",
          phonetic: "hahl",
          soundsLike: 'like "hall" in hallway — HAHl',
          meaning: "(first syllable)",
          tone: "flat",
          tip: "Like the hallway in your house. HAHl — the H is pronounced in Dutch, unlike Spanish.",
        },
        {
          word: "lo",
          phonetic: "loh",
          soundsLike: 'like "lo" in low or below',
          meaning: "(together: hello)",
          tone: "falling",
          tip: "Like the word 'low'. Natural fall.",
        },
      ],
      fullTip: "Dutch 'Hallo' sounds nearly identical to English 'Hello' — just say it! Dutch people almost universally speak excellent English, but starting in Dutch is a warm gesture they appreciate.",
      formal: "Goedendag (KHOO-den-dakh) — formal 'Good day', with a throaty KH sound",
    },
    "thank you": {
      native: "Dank je wel",
      phonetic: "dahnk yuh vel",
      syllables: [
        {
          word: "Dank",
          phonetic: "dahnk",
          soundsLike: 'like "donk" in donkey but say "dahnk" — DAHNK',
          meaning: "thanks",
          tone: "flat",
          tip: "Like 'dank' — rhymes with 'bank' but with an AH sound. DAHNK. Flat.",
        },
        {
          word: "je",
          phonetic: "yuh",
          soundsLike: 'like "yuh" — a casual "yeah"',
          meaning: "you (informal)",
          tone: "flat",
          tip: "In Dutch, 'j' is always a Y sound. 'Je' = 'yuh'. Like a quick, casual 'yeah'.",
        },
        {
          word: "wel",
          phonetic: "vel",
          soundsLike: 'like "vel" — rhymes with "bell" and "fell"',
          meaning: "indeed / well",
          tone: "falling",
          tip: "Rhymes with bell. The W in Dutch sounds like an English V. 'Vel'. Falls.",
        },
      ],
      fullTip: "The casual version. For formal: 'Dank u wel' (DAHNK oo vel) — swap 'je' for 'u'. Dutch W = English V, so 'wel' sounds like 'vel'. Don't say it like the English word 'well'.",
      formal: "Dank u wel (DAHNK oo vel) — formal version, swap 'je' for 'u'",
    },
    "thank you very much": {
      native: "Hartelijk dank",
      phonetic: "har-tuh-lik dahnk",
      syllables: [
        {
          word: "Hartelijk",
          phonetic: "har-tuh-lik",
          soundsLike: 'like "heart-uh-lick" — from your heart',
          meaning: "heartfelt / cordial",
          tone: "flat",
          tip: "HAR like 'heart', TUH like 'the', LIK like 'lick'. HAR-tuh-lik. Literally means heartfelt.",
        },
        {
          word: "dank",
          phonetic: "dahnk",
          soundsLike: 'like "dahnk" — rhymes with "bank"',
          meaning: "thanks",
          tone: "falling",
          tip: "Same 'dank' as before. Falls at the end.",
        },
      ],
      fullTip: "'Hartelijk dank' is warm and genuine — you'll use it in emails and formal situations. Pronounced: HAR-tuh-lik DAHNK. Dutch people will be genuinely impressed.",
      formal: null,
    },
    "how much is this?": {
      native: "Hoeveel kost dit?",
      phonetic: "hoo-vayl kost dit",
      syllables: [
        {
          word: "Hoeveel",
          phonetic: "hoo-vayl",
          soundsLike: 'like "who" + "vale" — HOO-vayl',
          meaning: "how much / how many",
          tone: "rising",
          tip: "HOO like 'who', VAYL like 'vale' (a valley). HOO-vayl. Rises — it's a question.",
        },
        {
          word: "kost",
          phonetic: "kost",
          soundsLike: 'like "cost" — exactly the English word',
          meaning: "costs",
          tone: "flat",
          tip: "Literally the English word 'cost'. Flat.",
        },
        {
          word: "dit",
          phonetic: "dit",
          soundsLike: 'like "dit" — rhymes with "sit" and "bit"',
          meaning: "this",
          tone: "falling",
          tip: "Rhymes with sit. Short and falling.",
        },
      ],
      fullTip: "Point at the item and say 'HOO-vayl kost DIT?' Dutch people appreciate the effort, though most will answer in English. Still makes a great impression.",
      formal: null,
    },
    "excuse me": {
      native: "Excuseer me",
      phonetic: "ex-koo-zayr muh",
      syllables: [
        {
          word: "Excuseer",
          phonetic: "ex-koo-zayr",
          soundsLike: 'like "excuse" + "air" — ex-koo-ZAYR',
          meaning: "excuse (me)",
          tone: "rising",
          tip: "Like the English word 'excuse' but end it with 'air' — ex-koo-ZAYR. Rises.",
        },
        {
          word: "me",
          phonetic: "muh",
          soundsLike: 'like "muh" — a soft unstressed "me"',
          meaning: "me",
          tone: "falling",
          tip: "Soft and unstressed. Falls.",
        },
      ],
      fullTip: "You can also use 'Pardon' (par-DON) — same as in English/French, and widely understood in the Netherlands.",
      formal: "Neemt u mij niet kwalijk (naymt oo may neet kwah-lik) — very formal 'excuse me', used in official contexts",
    },
    "goodbye": {
      native: "Tot ziens",
      phonetic: "tot zeens",
      syllables: [
        {
          word: "Tot",
          phonetic: "tot",
          soundsLike: 'like "tot" — a toddler, a small child',
          meaning: "until",
          tone: "flat",
          tip: "Exactly like 'tot' (small kid). Flat.",
        },
        {
          word: "ziens",
          phonetic: "zeens",
          soundsLike: 'like "zeens" — rhymes with "beans" and "jeans"',
          meaning: "seeing (until we see each other)",
          tone: "falling",
          tip: "Rhymes with beans. The Z is a regular Z sound. Falls.",
        },
      ],
      fullTip: "'Tot ziens' literally means 'until seeing' — 'see you later'. Very common Dutch farewell. Casual version: 'Dag' (dakh) — like 'bye', said with a soft throaty G.",
      formal: null,
    },
    "delicious": {
      native: "Heerlijk",
      phonetic: "hayr-lik",
      syllables: [
        {
          word: "Heer",
          phonetic: "hayr",
          soundsLike: 'like "hair" — what\'s on your head',
          meaning: "heavenly / wonderful",
          tone: "flat",
          tip: "Like the hair on your head. HAYr. The EE in Dutch often sounds like English 'ay'.",
        },
        {
          word: "lijk",
          phonetic: "lik",
          soundsLike: 'like "lick" — what you do to an ice cream cone',
          meaning: "(suffix: -ly / makes it an adjective)",
          tone: "falling",
          tip: "Like 'lick'. Falls.",
        },
      ],
      fullTip: "'Heerlijk!' (HAYR-lik) means heavenly/delicious/wonderful — one of the most satisfying Dutch words to say. Say it after eating and Dutch people will love you for it.",
      formal: null,
    },
    "cheers!": {
      native: "Proost!",
      phonetic: "prohst",
      syllables: [
        {
          word: "Proost",
          phonetic: "prohst",
          soundsLike: 'like "proost" — rhymes with "roost" (where chickens sleep)',
          meaning: "cheers! (toast)",
          tone: "rising",
          tip: "Rhymes with 'roost'. One syllable, voice rises with enthusiasm — you're making a toast!",
        },
      ],
      fullTip: "'Proost!' is the standard Dutch toast — same root as German 'Prost'. Make eye contact while clinking glasses. Dutch drinking culture considers it bad luck NOT to make eye contact.",
      formal: null,
    },
    "no ice": {
      native: "Zonder ijs",
      phonetic: "zon-der ays",
      syllables: [
        {
          word: "Zonder",
          phonetic: "zon-der",
          soundsLike: 'like "sonder" — rhymes with "wonder" and "yonder"',
          meaning: "without",
          tone: "flat",
          tip: "Rhymes with wonder. ZON-der. Flat.",
        },
        {
          word: "ijs",
          phonetic: "ays",
          soundsLike: 'like "eyes" — what you see with',
          meaning: "ice",
          tone: "falling",
          tip: "Rhymes with eyes. In Dutch, 'ij' makes an AY sound. 'Ays'. Falls.",
        },
      ],
      fullTip: "'ZON-der AYS' — without ice. In the Netherlands, drinks are often served with limited ice anyway, but good to know.",
      formal: null,
    },
    "where is the bathroom?": {
      native: "Waar is het toilet?",
      phonetic: "vaar is het toy-let",
      syllables: [
        {
          word: "Waar",
          phonetic: "vaar",
          soundsLike: 'like "var" — rhymes with "car" and "bar" but start with V',
          meaning: "where",
          tone: "rising",
          tip: "Dutch W = English V sound. 'Waar' = 'vaar'. Rhymes with car. Rises — it's a question.",
        },
        {
          word: "is",
          phonetic: "is",
          soundsLike: 'like "is" — exactly the English word',
          meaning: "is",
          tone: "flat",
          tip: "Exactly 'is'. Flat.",
        },
        {
          word: "het",
          phonetic: "het",
          soundsLike: 'like "het" — rhymes with "bet" and "get"',
          meaning: "the",
          tone: "flat",
          tip: "Rhymes with 'bet'. Flat and unstressed.",
        },
        {
          word: "toilet",
          phonetic: "toy-let",
          soundsLike: 'like "toilet" — the English word',
          meaning: "toilet / bathroom",
          tone: "falling",
          tip: "Same word as English. Falls.",
        },
      ],
      fullTip: "Shortcut: just 'Het toilet?' (het TOY-let?) works everywhere. Or even just 'Toilet?' — universal word, everyone understands.",
      formal: null,
    },
    "one more please": {
      native: "Nog één, alsjeblieft",
      phonetic: "nokh ayn als-yuh-bleeft",
      syllables: [
        {
          word: "Nog",
          phonetic: "nokh",
          soundsLike: 'like "nock" + a throaty H — NOKh (like clearing your throat slightly)',
          meaning: "still / another / more",
          tone: "flat",
          tip: "The G at the end of Dutch words is a throaty sound — like lightly clearing your throat. NOKh. Flat.",
        },
        {
          word: "één",
          phonetic: "ayn",
          soundsLike: 'like "ane" — rhymes with "lane" and "rain"',
          meaning: "one",
          tone: "flat",
          tip: "Rhymes with lane. AYN. Flat.",
        },
        {
          word: "alsjeblieft",
          phonetic: "als-yuh-bleeft",
          soundsLike: 'like "als-yuh-bleeft" — the "je" is a quick "yuh"',
          meaning: "please",
          tone: "falling",
          tip: "Looks scary but break it down: ALS (like 'else') + YUH + BLEEFT (like 'bleft'). Falls.",
        },
      ],
      fullTip: "Dutch 'alsjeblieft' is the magic word — it means please when asking AND you're welcome when giving. One word, two uses. Shortcut: just 'Nog één?' (NOKh AYN?) works in any bar.",
      formal: null,
    },
  },

  de: {
    "hello": {
      native: "Hallo",
      phonetic: "hah-loh",
      syllables: [
        {
          word: "Hal",
          phonetic: "hahl",
          soundsLike: 'like "hall" in hallway',
          meaning: "(first syllable)",
          tone: "flat",
          tip: "Like the hallway. HAHl. German H is always pronounced — unlike Spanish.",
        },
        {
          word: "lo",
          phonetic: "loh",
          soundsLike: 'like "lo" in low or below',
          meaning: "(together: hello)",
          tone: "falling",
          tip: "Like 'low'. Falls naturally.",
        },
      ],
      fullTip: "Nearly identical to English 'Hello'. 'Guten Tag' (GOO-ten TAHG) is the formal daytime greeting. 'Guten Morgen' (GOO-ten MOR-gen) = good morning.",
      formal: "Guten Tag (GOO-ten TAHG) — 'Good day', standard formal greeting",
    },
    "thank you": {
      native: "Danke",
      phonetic: "dahn-keh",
      syllables: [
        {
          word: "Dan",
          phonetic: "dahn",
          soundsLike: 'like "don" in donate — but say DAHN with an AH',
          meaning: "(first syllable)",
          tone: "flat",
          tip: "Like 'don' in donate but open the vowel wider: DAHN. Stressed syllable.",
        },
        {
          word: "ke",
          phonetic: "keh",
          soundsLike: 'like "keh" — the German E always says "EH", never "EE"',
          meaning: "(together: thank you)",
          tone: "falling",
          tip: "German E = 'EH' not 'EE'. Say 'keh' not 'key'. Natural fall.",
        },
      ],
      fullTip: "DAHN-keh. Stress on DAHN. For more: 'Danke schön' (DAHN-keh SHURN) = thank you kindly. The ö in schön sounds like 'ur' in 'burn'.",
      formal: "Vielen Dank (FEE-len DAHNK) — 'Many thanks', more formal written/spoken",
    },
    "cheers!": {
      native: "Prost!",
      phonetic: "prohst",
      syllables: [
        {
          word: "Prost",
          phonetic: "prohst",
          soundsLike: 'like "proast" — rhymes with "toast" and "roast"',
          meaning: "cheers! (toast)",
          tone: "rising",
          tip: "Rhymes with toast. PROHST. One syllable, voice rises with enthusiasm!",
        },
      ],
      fullTip: "The classic German beer toast. Always make eye contact — in Germany, breaking eye contact during 'Prost' is considered bad luck. Say it loud and mean it.",
      formal: null,
    },
  },

  fr: {
    "hello": {
      native: "Bonjour",
      phonetic: "bon-zhoor",
      syllables: [
        {
          word: "Bon",
          phonetic: "bon",
          soundsLike: 'like "bon" in bonbon candy',
          meaning: "good",
          tone: "flat",
          tip: "Like the candy bonbon — just the first 'bon'. Flat.",
        },
        {
          word: "jour",
          phonetic: "zhoor",
          soundsLike: 'like "zhoor" — the J sounds like the S in "measure" or "vision"',
          meaning: "day",
          tone: "rising",
          tip: "The French J = the S sound in 'measure', 'vision', 'treasure'. ZHOOR. Voice lifts slightly.",
        },
      ],
      fullTip: "Always say 'Bonjour' first when entering a shop in France — skipping it is considered rude. In the evening: 'Bonsoir' (bon-SWAHR). French people warm up significantly when you try.",
      formal: null,
    },
    "thank you": {
      native: "Merci",
      phonetic: "mehr-see",
      syllables: [
        {
          word: "Mer",
          phonetic: "mehr",
          soundsLike: 'like "mare" — a female horse, but shorter: MEHR',
          meaning: "(first syllable)",
          tone: "flat",
          tip: "Like a mare (female horse) but cut it short: MEHR not MARE. The French R is guttural — made at the BACK of the throat, not the tongue tip. Like a soft gargle.",
        },
        {
          word: "ci",
          phonetic: "see",
          soundsLike: 'like "see" — the English word',
          meaning: "(together: thank you)",
          tone: "rising",
          tip: "Like 'see'. Slight upward lilt — French ends many words this way.",
        },
      ],
      fullTip: "MEHR-see. The R is the hardest part — it's at the back of your throat like a soft gargle. Even approximating it is fine. French people deeply appreciate any effort.",
      formal: "Merci beaucoup (mehr-see BOH-koo) — 'Thank you very much'. BOH like 'bow', KOO like 'coo' (pigeon sound).",
    },
  },

  ja: {
    "hello": {
      native: "こんにちは",
      phonetic: "kon-nee-chee-wah",
      syllables: [
        {
          word: "こん",
          phonetic: "kon",
          soundsLike: 'like "con" in con man or convict',
          meaning: "this (day)",
          tone: "flat",
          tip: "Like 'con'. Flat. Equal stress on each syllable in Japanese.",
        },
        {
          word: "にち",
          phonetic: "nee-chee",
          soundsLike: 'like "knee-chee" — your knee, then "chee"',
          meaning: "day",
          tone: "flat",
          tip: "Your knee (NEE) + CHEE. Equal and flat.",
        },
        {
          word: "は",
          phonetic: "wah",
          soundsLike: 'like "wah" — a baby crying or a jazz scat sound',
          meaning: "(topic marker — said 'wa' in this phrase)",
          tone: "falling",
          tip: "This character is normally 'ha' but in this phrase it's always said 'wah'. Like a baby going 'wah!'",
        },
      ],
      fullTip: "Use from about 10am–6pm. Japanese has no musical tones — just say each syllable equally: kon-NEE-chee-WAH. Japanese people deeply appreciate any attempt at their language.",
      formal: null,
    },
    "thank you": {
      native: "ありがとう",
      phonetic: "ah-ree-gah-toh",
      syllables: [
        {
          word: "あり",
          phonetic: "ah-ree",
          soundsLike: '"ah" like a doctor checking your throat + "ree" like "ree" in reef',
          meaning: "(first two syllables)",
          tone: "flat",
          tip: "AH like the doctor says, REE like reef. Two equal flat syllables.",
        },
        {
          word: "がとう",
          phonetic: "gah-toh",
          soundsLike: '"gah" like "ga" in garage + "toh" like "toe"',
          meaning: "(together: thank you)",
          tone: "flat",
          tip: "GAH like garage, TOH like your toe. Equal and flat.",
        },
      ],
      fullTip: "Stress each syllable equally: ah-REE-gah-TOH. For formal situations: 'Arigatou gozaimasu' (ah-ree-gah-toh go-ZAI-mas) — the extra words make it polished and professional.",
      formal: "ありがとうございます (ah-ree-gah-toh go-ZAI-mas) — formal version, always safe",
    },
  },

  ko: {
    "hello": {
      native: "안녕하세요",
      phonetic: "an-nyong-ha-seh-yo",
      syllables: [
        {
          word: "안녕",
          phonetic: "an-nyong",
          soundsLike: '"an" like "on" + "nyong" like "nyong" — rhymes with "song" with NY in front',
          meaning: "peace / well-being",
          tone: "flat",
          tip: "AN like 'on', NYONG like 'song' but with 'ny' in front. Both flat and even.",
        },
        {
          word: "하세요",
          phonetic: "ha-seh-yo",
          soundsLike: '"ha" like a laugh + "seh" like "say" + "yo" like "yo!" (greeting)',
          meaning: "(polite verb ending)",
          tone: "rising",
          tip: "HA + SEH + YO. The YO at the end rises slightly — like a polite lift.",
        },
      ],
      fullTip: "The standard polite greeting for any adult. A slight bow while saying it goes a long way. Koreans genuinely appreciate when foreigners try their language.",
      formal: null,
    },
    "thank you": {
      native: "감사합니다",
      phonetic: "gam-sa-ham-ni-da",
      syllables: [
        {
          word: "감사",
          phonetic: "gam-sa",
          soundsLike: '"gam" like "gum" + "sa" like "sah" (as in a musical solfège)',
          meaning: "gratitude",
          tone: "flat",
          tip: "GUM + SAH. Both flat and even.",
        },
        {
          word: "합니다",
          phonetic: "ham-ni-da",
          soundsLike: '"ham" like the meat + "ni" like "knee" + "da" like "dah"',
          meaning: "(formal verb ending — 'it is')",
          tone: "falling",
          tip: "HAM (the meat) + KNEE + DAH. Falls naturally at the end — the formal speech marker.",
        },
      ],
      fullTip: "Always safe with anyone you don't know. Casual version with friends: '고마워' (go-MA-wuh). Korean has strict politeness levels — gamsahamnida covers all formal situations.",
      formal: null,
    },
  },

  zh: {
    "hello": {
      native: "你好",
      phonetic: "nee-how",
      syllables: [
        {
          word: "你",
          phonetic: "nee",
          soundsLike: 'like "knee" — your knee',
          meaning: "you",
          tone: "dipping",
          tip: "Your knee — NEE. This is 3rd tone: voice dips DOWN then comes back UP. Like saying 'nee' with a slight dip.",
        },
        {
          word: "好",
          phonetic: "how",
          soundsLike: 'like "how" — as in "how are you?"',
          meaning: "good",
          tone: "dipping",
          tip: "Like 'how'. Also 3rd tone — dips then rises. When two 3rd tones appear together, the first naturally becomes rising. Don't overthink: just say 'nee-HOW' and you're right.",
        },
      ],
      fullTip: "Two 3rd tones together: in practice the first (你) automatically lightens to a rising tone. Just say 'NEE-how' naturally and it comes out correct. One of the world's most recognized phrases.",
      formal: "您好 (nín hǎo / nin-HOW) — uses respectful 'you', appropriate for elders or formal settings",
    },
    "thank you": {
      native: "谢谢",
      phonetic: "shyeh-shyeh",
      syllables: [
        {
          word: "谢",
          phonetic: "shyeh",
          soundsLike: 'like "shyeh" — starts with SH, ends like "yeah" with a Y',
          meaning: "thank (repeated for emphasis)",
          tone: "falling",
          tip: "SH + yeah with a Y: 'shyeh'. Sharp 4th tone — falls hard like you're making a firm statement. Both syllables are the same word repeated.",
        },
        {
          word: "谢",
          phonetic: "shyeh",
          soundsLike: 'same — "shyeh" again',
          meaning: "(repetition intensifies the thanks)",
          tone: "falling",
          tip: "Repeat the same falling 'shyeh'. The repetition is how Chinese expresses thanks — like saying 'thanks thanks'.",
        },
      ],
      fullTip: "Both syllables fall sharply — 4th tone. Don't let your voice drift up. 'SHYEH-shyeh' — firm and clear. Very easy to remember once you hear it.",
      formal: "非常感谢 (fēi cháng gǎn xiè / fay-CHAHNG-gan-SHYEH) — 'Thank you very much', formal contexts",
    },
  },

  pt: {
    "hello": {
      native: "Olá",
      phonetic: "oh-LAH",
      syllables: [
        {
          word: "O",
          phonetic: "oh",
          soundsLike: 'like "oh" — the exclamation',
          meaning: "(first syllable)",
          tone: "flat",
          tip: "Like 'oh!' Flat.",
        },
        {
          word: "lá",
          phonetic: "LAH",
          soundsLike: 'like "lah" — the musical note, stressed',
          meaning: "(together: hello)",
          tone: "rising",
          tip: "The stressed syllable — LAH louder than the oh. Rises slightly.",
        },
      ],
      fullTip: "Stress on the second syllable: oh-LAH. Brazilian Portuguese sounds warmer and more musical than European Portuguese. Either works worldwide.",
      formal: "Bom dia (bom JEE-ah) — 'Good morning' (Brazilian) or (bom DEE-ah) in European Portuguese",
    },
    "thank you": {
      native: "Obrigado / Obrigada",
      phonetic: "oh-bree-GAH-doh / oh-bree-GAH-dah",
      syllables: [
        {
          word: "Obri",
          phonetic: "oh-bree",
          soundsLike: '"oh" + "bree" like the cheese — oh-BREE',
          meaning: "(first part)",
          tone: "flat",
          tip: "OH like the exclamation, BREE like Brie cheese. oh-BREE.",
        },
        {
          word: "ga",
          phonetic: "GAH",
          soundsLike: 'like "gah" — the stressed syllable',
          meaning: "(stressed syllable)",
          tone: "rising",
          tip: "This is the stressed syllable — say it strongest: GAH.",
        },
        {
          word: "do/da",
          phonetic: "doh / dah",
          soundsLike: 'men say "doh" (musical note), women say "dah"',
          meaning: "(ending — changes by speaker gender)",
          tone: "falling",
          tip: "Men say -DO (doh like do-re-mi). Women say -DA (dah). YOUR gender changes the word — not the person you're thanking.",
        },
      ],
      fullTip: "If you're a man: obrigaDO. If you're a woman: obrigaDA. This is one of the rare Portuguese words where your own gender affects pronunciation.",
      formal: "Muito obrigado/a (MWEE-toh oh-bree-GAH-doh/dah) — 'Thank you very much'",
    },
  },

  it: {
    "hello": {
      native: "Ciao",
      phonetic: "chow",
      syllables: [
        {
          word: "Ciao",
          phonetic: "chow",
          soundsLike: 'like "chow" — exactly as in chow down',
          meaning: "hello / goodbye (casual)",
          tone: "flat",
          tip: "The English food slang 'chow' — that's it. Flat and easy. Ciao is used for BOTH hello and goodbye in Italian.",
        },
      ],
      fullTip: "'Ciao' (chow) is casual. For formal situations: 'Buongiorno' (bwon-JOR-no) = Good day. 'Ciao' works with friends, shopkeepers in tourist areas, and anyone younger.",
      formal: "Buongiorno (bwon-JOR-no) — 'Good day', formal greeting",
    },
    "thank you": {
      native: "Grazie",
      phonetic: "grah-tsee-eh",
      syllables: [
        {
          word: "Gra",
          phonetic: "grah",
          soundsLike: 'like "gra" in grab',
          meaning: "(first syllable — stressed)",
          tone: "flat",
          tip: "Like 'grab' minus the B. GRA — this is the stressed syllable.",
        },
        {
          word: "zie",
          phonetic: "tsee-eh",
          soundsLike: 'like "tsee-eh" — the Z sounds like the TS in pizza',
          meaning: "(together: thank you)",
          tone: "falling",
          tip: "The Z in Italian = 'TS' like in piZZa or rigatZoni. TSEE-eh. This trips up most English speakers. Falls naturally.",
        },
      ],
      fullTip: "GRA-tsee-eh — stress on GRA. The Z = TS sound (pizza!). For more warmth: 'Grazie mille' (GRA-tsee-eh MEE-leh) = a thousand thanks.",
      formal: "Grazie mille (GRA-tsee-eh MEE-leh) — 'A thousand thanks', warm and enthusiastic",
    },
  },

  ar: {
    "hello": {
      native: "مرحبا",
      phonetic: "mar-ha-bah",
      syllables: [
        {
          word: "مر",
          phonetic: "mar",
          soundsLike: 'like "mar" in March or Mars',
          meaning: "(first syllable)",
          tone: "flat",
          tip: "Like the month March. MAR. Flat.",
        },
        {
          word: "ح",
          phonetic: "ha",
          soundsLike: 'like "ha" — a breathy H, like breathing on cold glass',
          meaning: "(second syllable — the Arabic H is breathy)",
          tone: "flat",
          tip: "The Arabic ح is a strong breathy H — like you're fogging up a mirror. Not the soft English H. HA with breath.",
        },
        {
          word: "با",
          phonetic: "bah",
          soundsLike: 'like "bah" — like a sheep says',
          meaning: "(together: hello / welcome)",
          tone: "falling",
          tip: "Like a sheep: BAH. Falls.",
        },
      ],
      fullTip: "'Marhaba' is the warm, universal Arabic hello understood across all Arabic-speaking countries. The response is 'Marhab-tayn' (MAR-hab-tayn) = double welcome back.",
      formal: "As-salamu alaykum (as-SAH-lah-moo ah-LAY-koom) — 'Peace be upon you', traditional Islamic greeting",
    },
    "thank you": {
      native: "شكراً",
      phonetic: "shuk-ran",
      syllables: [
        {
          word: "شك",
          phonetic: "shuk",
          soundsLike: 'like "shuck" — as in shucking oysters or corn',
          meaning: "(first syllable)",
          tone: "flat",
          tip: "Like shucking oysters — SHUK. Flat.",
        },
        {
          word: "راً",
          phonetic: "ran",
          soundsLike: 'like "ran" — past tense of run',
          meaning: "(together: thank you)",
          tone: "falling",
          tip: "Like 'I ran'. RAN. Falls naturally.",
        },
      ],
      fullTip: "Arabic has no musical tones — flat/falling here shows natural speech rhythm only. 'Shukran' is understood throughout all Arabic-speaking countries. Reply to thanks: 'Afwan' (AF-wan) = you're welcome.",
      formal: "Shukran jazeelan (SHUK-ran ja-ZEE-lan) — 'Thank you very much'",
    },
  },

  hi: {
    "hello": {
      native: "नमस्ते",
      phonetic: "nuh-muh-stay",
      syllables: [
        {
          word: "नम",
          phonetic: "nuh-muh",
          soundsLike: '"nuh" like a hesitation + "muh" like another hesitation — NUH-MUH',
          meaning: "bow / salutation",
          tone: "flat",
          tip: "Two unstressed syllables: NUH + MUH. Like two hesitation sounds. Flat and even.",
        },
        {
          word: "स्ते",
          phonetic: "stay",
          soundsLike: 'like "stay" — what you tell a dog',
          meaning: "(together: I bow to you)",
          tone: "falling",
          tip: "Exactly the English word 'stay'. Falls naturally.",
        },
      ],
      fullTip: "Namaste means 'I bow to the divine in you' — beautiful. Press palms together and bow slightly while saying it. Works as both hello AND goodbye. Universally understood across India and the global Hindu community.",
      formal: null,
    },
    "thank you": {
      native: "धन्यवाद",
      phonetic: "dhun-yuh-vahd",
      syllables: [
        {
          word: "धन्य",
          phonetic: "dhun-yuh",
          soundsLike: '"dhun" like "done" with a puff of air + "yuh" like a quick "yeah"',
          meaning: "blessed / grateful",
          tone: "flat",
          tip: "The DH is an aspirated D — say 'done' but with a little puff of air right after. DHUN + YUH. Flat.",
        },
        {
          word: "वाद",
          phonetic: "vahd",
          soundsLike: 'like "vod" — rhymes with "odd" and "pod"',
          meaning: "speech / expression",
          tone: "falling",
          tip: "Rhymes with 'odd'. VAHD. Falls.",
        },
      ],
      fullTip: "Formal Hindi thanks. In everyday India, English 'thank you' is extremely common. 'Shukriya' (SHOO-kree-yah) is the Urdu-influenced casual alternative you'll also hear everywhere.",
      formal: null,
    },
  },

  th: {
    "hello": {
      native: "สวัสดี",
      phonetic: "sah-wah-dee",
      syllables: [
        {
          word: "สวัส",
          phonetic: "sah-waht",
          soundsLike: '"sah" like "sah" in safari + "waht" like "what" with an AH',
          meaning: "well-being",
          tone: "flat",
          tip: "SAH like safari. WAHT like 'what' said with an AH. Two flat syllables.",
        },
        {
          word: "ดี",
          phonetic: "dee",
          soundsLike: 'like "dee" in deed or indeed',
          meaning: "good",
          tone: "flat",
          tip: "Like 'deed' — just the DEE. Flat.",
        },
      ],
      fullTip: "Always add 'khrap' if you're a man (krap) or 'kha' if a woman (kah): 'Sah-wah-dee KRAP' / 'Sah-wah-dee KAH'. The politeness particle is essential in Thai culture. Also accompany with a wai — palms pressed together with a slight bow.",
      formal: null,
    },
    "thank you": {
      native: "ขอบคุณ",
      phonetic: "kawp-kun",
      syllables: [
        {
          word: "ขอบ",
          phonetic: "kawp",
          soundsLike: 'like "cop" — a police officer, but say KAWP with an AW',
          meaning: "(first syllable: together = thank)",
          tone: "low",
          tip: "Like a police cop but open the vowel: KAWP. Low falling tone — keep your voice low.",
        },
        {
          word: "คุณ",
          phonetic: "kun",
          soundsLike: 'like "kun" in kung fu',
          meaning: "you / virtue",
          tone: "flat",
          tip: "Kung fu — just the KUN. Mid flat tone.",
        },
      ],
      fullTip: "Men: 'Kawp-kun KRAP'. Women: 'Kawp-kun KAH'. The politeness particle at the end is NOT optional in Thai — always add it based on your gender. Thai people notice and appreciate it.",
      formal: "ขอบคุณมาก (kawp-kun MAHK) — 'Thank you very much'. MAHK rhymes with 'mock'.",
    },
  },
};

const QUICK_PHRASES = [
  "hello",
  "thank you",
  "thank you very much",
  "excuse me",
  "goodbye",
  "how much is this?",
  "the bill please",
  "no ice",
  "delicious",
  "where is the bathroom?",
  "i don't understand",
  "i want this",
  "can you speak slower?",
  "do you speak english?",
  "my name is steve",
  "nice to meet you",
  "cheers!",
  "one more please",
];

export default function SayItNow() {
  const [lang, setLang] = useState("vi");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<PhraseResult | null>(null);
  const [currentPhrase, setCurrentPhrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLang = LANGUAGES.find((l) => l.code === lang)!;

  const getCached = (phrase: string, langCode: string): PhraseResult | null => {
    const langCache = PHRASE_CACHE[langCode];
    if (!langCache) return null;
    return langCache[phrase.toLowerCase().trim()] || null;
  };

  const handleSearch = async (phrase: string) => {
    const normalized = phrase.toLowerCase().trim();
    setInput(phrase);
    setCurrentPhrase(phrase);
    setError("");

    const cached = getCached(normalized, lang);
    if (cached) {
      setResult(cached);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrase, targetLanguage: lang, languageName: selectedLang.name }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) handleSearch(input.trim());
  };

  const goHome = () => {
    setResult(null);
    setInput("");
    setCurrentPhrase("");
    setError("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const isCached = (phrase: string) => !!getCached(phrase.toLowerCase(), lang);

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-5 py-4 sticky top-0 z-50">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <button onClick={goHome} className="text-left hover:opacity-70 transition">
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Say It Now 🌏</h1>
            <p className="text-xs text-gray-500">Speak any phrase. No reading required.</p>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-semibold shadow-sm hover:border-gray-400 transition"
            >
              <span className="text-xl">{selectedLang.flag}</span>
              <span className="hidden sm:inline">{selectedLang.name}</span>
              <span className="text-xs text-gray-400">▼</span>
            </button>

            {showLangPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLangPicker(false)} />
                <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50 min-w-52 max-h-96 overflow-y-auto">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setShowLangPicker(false); setResult(null); }}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left hover:bg-slate-50 transition ${l.code === lang ? "bg-slate-100 font-bold" : ""}`}
                    >
                      <span className="text-lg">{l.flag}</span>
                      {l.name}
                      {l.code === lang && <span className="ml-auto text-blue-600">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-xl mx-auto px-5 py-6">

        {/* Search */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex bg-white border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-blue-500 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type any phrase in English..."
              className="flex-1 px-5 py-4 text-base outline-none bg-transparent text-gray-900 placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-6 bg-slate-900 text-white font-bold text-sm tracking-wide disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
            >
              {loading ? "..." : "SAY IT →"}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-sm">{error}</div>
        )}

        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-10 h-10 border-4 border-gray-200 border-t-slate-900 rounded-full animate-spin" />
            <p className="mt-3 text-gray-500 text-sm">Generating breakdown for &quot;{currentPhrase}&quot;...</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="space-y-4">

            <button onClick={goHome} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
              <span className="text-lg">←</span> Back to phrase list
            </button>

            {/* Hero */}
            <div className="bg-slate-900 text-white rounded-2xl p-6">
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                Say this in {selectedLang.flag} {selectedLang.name}
              </p>
              <p className="text-3xl font-bold mb-2 leading-tight">{result.native}</p>
              <p className="text-xl font-mono text-blue-400 tracking-wide">{result.phonetic}</p>
            </div>

            {/* Syllables */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Word-by-Word Breakdown</p>
              <div className="space-y-3">
                {result.syllables.map((s, i) => {
                  const tone = TONE_INFO[s.tone] || TONE_INFO.flat;
                  return (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-start gap-2 flex-wrap">
                        <div className="flex items-baseline gap-3">
                          <span className="text-2xl font-bold text-gray-900">{s.word}</span>
                          <span className="text-lg font-mono font-semibold" style={{ color: tone.color }}>{s.phonetic}</span>
                        </div>
                        <span className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap" style={{ background: tone.color + "18", color: tone.color }}>
                          {tone.symbol} {tone.label} — {tone.desc}
                        </span>
                      </div>

                      {/* THE KEY NEW ELEMENT — Sounds Like */}
                      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                        <span className="text-base">🔊</span>
                        <span className="text-sm font-semibold text-blue-900">Sounds like: </span>
                        <span className="text-sm text-blue-800">{s.soundsLike}</span>
                      </div>

                      <p className="text-sm text-gray-500"><span className="font-semibold text-gray-700">Means:</span> {s.meaning}</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">💡 {s.tip}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pro tip */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <span className="text-xl flex-shrink-0">🎯</span>
              <div>
                <p className="text-sm font-bold text-amber-900 mb-1">Pro Tip</p>
                <p className="text-sm text-amber-800 leading-relaxed">{result.fullTip}</p>
              </div>
            </div>

            {result.formal && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
                <span className="text-xl flex-shrink-0">🎩</span>
                <div>
                  <p className="text-sm font-bold text-green-900 mb-1">Formal / Polite Version</p>
                  <p className="text-sm text-green-800 leading-relaxed">{result.formal}</p>
                </div>
              </div>
            )}

            <button onClick={goHome} className="w-full py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              ← Back to phrase list
            </button>
          </div>
        )}

        {/* Home — phrase list */}
        {!result && !loading && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Quick Phrases — tap for instant breakdown
            </p>
            <div className="grid gap-2">
              {QUICK_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => handleSearch(phrase)}
                  className="flex justify-between items-center px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 hover:border-blue-400 hover:bg-slate-50 transition capitalize text-left"
                >
                  <span>{phrase}</span>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {isCached(phrase) && (
                      <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">instant</span>
                    )}
                    <span className="text-gray-400">→</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">
              Custom phrases typed above are AI-generated on the fly
            </p>
          </div>
        )}
      </div>

      <div className="text-center pb-8 pt-4 text-xs text-gray-400">
        Say It Now — Speak confidently anywhere in the world 🌏
      </div>
    </div>
  );
}
