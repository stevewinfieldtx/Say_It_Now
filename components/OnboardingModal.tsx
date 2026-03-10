"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "howdoisay_hide_intro";

// Onboarding copy by native language code
const ONBOARDING: Record<string, {
  headline: string;
  tagline: string;
  notGoogleTranslate: string;
  whatItIs: string;
  howItWorks: string;
  step1: string;
  step2: string;
  step3: string;
  example: string;
  whoItsFor: string;
  dontShowAgain: string;
  getStarted: string;
}> = {
  en: {
    headline: "Welcome to How Do I Say 🌏",
    tagline: "Speak any language — no reading required",
    notGoogleTranslate: "⚠️ This is NOT Google Translate",
    whatItIs: "How Do I Say teaches you how to say something out loud — using sounds from YOUR language. So when you need to speak Vietnamese, Thai, Japanese, or Chinese to someone right in front of you, you actually can.",
    howItWorks: "Here's how it works:",
    step1: "📍 Pick YOUR language in the first box (the one you already speak)",
    step2: "🌏 Pick the language you WANT to speak in the second box",
    step3: "✍️ Type a phrase — or choose from 100 ready-made ones",
    example: "Example: If you speak Vietnamese and need to say something in Chinese, we'll break down the Chinese words into Vietnamese syllables you already know how to say.",
    whoItsFor: "Perfect for travelers, expats, and anyone who needs to speak a few key phrases — right now, in the moment — without a language class.",
    dontShowAgain: "Don't show this again",
    getStarted: "Got it — let's go! →",
  },
  vi: {
    headline: "Chào mừng đến với How Do I Say 🌏",
    tagline: "Nói bất kỳ câu nào — Không cần đọc",
    notGoogleTranslate: "⚠️ Đây KHÔNG phải Google Dịch",
    whatItIs: "How Do I Say dạy bạn cách nói các câu bằng miệng — sử dụng các âm thanh từ NGÔN NGỮ CỦA BẠN. Khi bạn cần nói tiếng Anh, tiếng Thái, tiếng Nhật hoặc tiếng Trung với ai đó ngay trước mặt bạn — bạn thực sự có thể làm được.",
    howItWorks: "Cách sử dụng:",
    step1: "📍 Chọn NGÔN NGỮ CỦA BẠN ở ô đầu tiên (ngôn ngữ bạn đang dùng)",
    step2: "🌏 Chọn ngôn ngữ bạn MUỐN NÓI ở ô thứ hai",
    step3: "✍️ Gõ câu bất kỳ — hoặc chọn từ 100 câu có sẵn",
    example: "Ví dụ: Nếu bạn nói tiếng Việt và cần nói điều gì đó bằng tiếng Trung, chúng tôi sẽ phân tích các từ tiếng Trung thành các âm tiết tiếng Việt mà bạn đã biết cách phát âm.",
    whoItsFor: "Dành cho du khách, người Việt xa xứ, và bất kỳ ai cần nói vài câu quan trọng — ngay lúc này, ngay tại chỗ — mà không cần học ngôn ngữ.",
    dontShowAgain: "Không hiển thị lại",
    getStarted: "Đã hiểu — bắt đầu thôi! →",
  },
  zh: {
    headline: "欢迎使用 How Do I Say 🌏",
    tagline: "用任何语言开口说话 — 无需阅读",
    notGoogleTranslate: "⚠️ 这不是谷歌翻译",
    whatItIs: "How Do I Say 教你如何大声说出某些话 — 使用你自己语言中的发音。当你需要在陌生人面前说越南语、泰语、日语或英语时，你真的可以做到。",
    howItWorks: "使用方法：",
    step1: "📍 在第一个框中选择你的语言（你已经会说的语言）",
    step2: "🌏 在第二个框中选择你想说的语言",
    step3: "✍️ 输入任何短语 — 或从100个现成短语中选择",
    example: "例如：如果你说中文，需要用越南语说些什么，我们会把越南语单词分解成你已经知道如何发音的中文音节。",
    whoItsFor: "非常适合旅行者和需要在关键时刻说几句话的人 — 现在，就在当下 — 无需上语言课。",
    dontShowAgain: "不再显示",
    getStarted: "明白了 — 开始吧！→",
  },
  th: {
    headline: "ยินดีต้อนรับสู่ How Do I Say 🌏",
    tagline: "พูดภาษาใดก็ได้ — ไม่ต้องอ่านออก",
    notGoogleTranslate: "⚠️ นี่ไม่ใช่ Google Translate",
    whatItIs: "How Do I Say สอนให้คุณพูดออกเสียงได้จริง — โดยใช้เสียงจากภาษาของคุณเอง เมื่อคุณต้องพูดภาษาอังกฤษ ภาษาญี่ปุ่น หรือภาษาจีนกับคนตรงหน้า คุณจะทำได้จริงๆ",
    howItWorks: "วิธีใช้งาน:",
    step1: "📍 เลือกภาษาของคุณในช่องแรก (ภาษาที่คุณพูดอยู่แล้ว)",
    step2: "🌏 เลือกภาษาที่คุณอยากพูดในช่องที่สอง",
    step3: "✍️ พิมพ์ประโยคอะไรก็ได้ — หรือเลือกจาก 100 ประโยคสำเร็จรูป",
    example: "ตัวอย่าง: ถ้าคุณพูดภาษาไทย และต้องพูดภาษาจีน เราจะแยกคำภาษาจีนเป็นพยางค์ภาษาไทยที่คุณรู้วิธีออกเสียงอยู่แล้ว",
    whoItsFor: "เหมาะสำหรับนักท่องเที่ยวและทุกคนที่ต้องพูดไม่กี่ประโยคสำคัญ — ตอนนี้เลย ทันทีทันใด — โดยไม่ต้องเรียนภาษา",
    dontShowAgain: "ไม่ต้องแสดงอีก",
    getStarted: "เข้าใจแล้ว — ไปเลย! →",
  },
  ja: {
    headline: "How Do I Say へようこそ 🌏",
    tagline: "どんな言語でも話せる — 読み書きは不要",
    notGoogleTranslate: "⚠️ これはGoogle翻訳ではありません",
    whatItIs: "How Do I Say は、あなた自身の言語の音を使って、声に出して話す方法を教えます。目の前の相手にベトナム語、タイ語、英語、または中国語で話す必要があるとき、本当に話せるようになります。",
    howItWorks: "使い方：",
    step1: "📍 最初のボックスであなたの言語を選んでください（すでに話せる言語）",
    step2: "🌏 2番目のボックスで話したい言語を選んでください",
    step3: "✍️ フレーズを入力するか、100個の定型フレーズから選んでください",
    example: "例：日本語を話していて、ベトナム語で何かを言う必要がある場合、ベトナム語の単語をあなたがすでに発音できる日本語の音節に分解します。",
    whoItsFor: "旅行者や、語学の授業なしに、今すぐ、その場で、重要なフレーズをいくつか話す必要がある方に最適です。",
    dontShowAgain: "次から表示しない",
    getStarted: "わかりました — 始めましょう！→",
  },
  ko: {
    headline: "How Do I Say에 오신 것을 환영합니다 🌏",
    tagline: "어떤 언어든 말할 수 있어요 — 읽기 불필요",
    notGoogleTranslate: "⚠️ 이것은 구글 번역이 아닙니다",
    whatItIs: "How Do I Say는 당신의 언어 소리를 사용하여 소리 내어 말하는 방법을 가르쳐줍니다. 바로 앞에 있는 사람에게 베트남어, 태국어, 영어 또는 중국어로 말해야 할 때, 실제로 할 수 있게 됩니다.",
    howItWorks: "사용 방법:",
    step1: "📍 첫 번째 상자에서 당신의 언어를 선택하세요 (이미 말할 수 있는 언어)",
    step2: "🌏 두 번째 상자에서 말하고 싶은 언어를 선택하세요",
    step3: "✍️ 문구를 입력하거나 100개의 기성 문구에서 선택하세요",
    example: "예: 한국어를 사용하고 베트남어로 무언가를 말해야 한다면, 베트남어 단어를 이미 발음할 수 있는 한국어 음절로 분해해 드립니다.",
    whoItsFor: "여행자와 언어 수업 없이 지금 당장, 그 순간에 몇 가지 중요한 문구를 말해야 하는 모든 분에게 완벽합니다.",
    dontShowAgain: "다시 표시 안 함",
    getStarted: "알겠어요 — 시작하죠! →",
  },
  es: {
    headline: "Bienvenido a How Do I Say 🌏",
    tagline: "Habla cualquier idioma — sin necesidad de leer",
    notGoogleTranslate: "⚠️ Esto NO es Google Translate",
    whatItIs: "How Do I Say te enseña a pronunciar frases en voz alta — usando sonidos de TU propio idioma. Cuando necesites hablar vietnamita, tailandés, japonés o chino con alguien frente a ti, realmente podrás hacerlo.",
    howItWorks: "Cómo funciona:",
    step1: "📍 Elige TU idioma en el primer cuadro (el que ya hablas)",
    step2: "🌏 Elige el idioma que QUIERES hablar en el segundo cuadro",
    step3: "✍️ Escribe cualquier frase — o elige una de las 100 ya preparadas",
    example: "Ejemplo: Si hablas español y necesitas decir algo en chino, desglosaremos las palabras chinas en sílabas en español que ya sabes pronunciar.",
    whoItsFor: "Perfecto para viajeros y cualquiera que necesite decir algunas frases clave — ahora mismo, en el momento — sin clases de idiomas.",
    dontShowAgain: "No mostrar de nuevo",
    getStarted: "Entendido — ¡vamos! →",
  },
  fr: {
    headline: "Bienvenue sur How Do I Say 🌏",
    tagline: "Parlez n'importe quelle langue — sans avoir besoin de lire",
    notGoogleTranslate: "⚠️ Ce N'est PAS Google Traduction",
    whatItIs: "How Do I Say vous apprend à prononcer des phrases à voix haute — en utilisant des sons de VOTRE propre langue. Quand vous avez besoin de parler vietnamien, thaï, japonais ou chinois à quelqu'un en face de vous, vous pouvez vraiment le faire.",
    howItWorks: "Comment ça marche :",
    step1: "📍 Choisissez VOTRE langue dans la première case (celle que vous parlez déjà)",
    step2: "🌏 Choisissez la langue que vous VOULEZ parler dans la deuxième case",
    step3: "✍️ Tapez n'importe quelle phrase — ou choisissez parmi 100 phrases prêtes à l'emploi",
    example: "Exemple : Si vous parlez français et devez dire quelque chose en vietnamien, nous décomposerons les mots vietnamiens en syllabes françaises que vous savez déjà prononcer.",
    whoItsFor: "Parfait pour les voyageurs et toute personne qui doit dire quelques phrases importantes — maintenant, sur le moment — sans cours de langue.",
    dontShowAgain: "Ne plus afficher",
    getStarted: "Compris — c'est parti ! →",
  },
  de: {
    headline: "Willkommen bei How Do I Say 🌏",
    tagline: "Sprich jede Sprache — kein Lesen erforderlich",
    notGoogleTranslate: "⚠️ Das ist NICHT Google Translate",
    whatItIs: "How Do I Say bringt dir bei, Sätze laut auszusprechen — mit Klängen aus DEINER eigenen Sprache. Wenn du Vietnamesisch, Thailändisch, Japanisch oder Chinesisch mit jemandem direkt vor dir sprechen musst, kannst du es wirklich tun.",
    howItWorks: "So funktioniert es:",
    step1: "📍 Wähle DEINE Sprache im ersten Feld (die Sprache, die du schon sprichst)",
    step2: "🌏 Wähle die Sprache, die du SPRECHEN MÖCHTEST, im zweiten Feld",
    step3: "✍️ Tippe einen beliebigen Satz ein — oder wähle aus 100 fertigen Sätzen",
    example: "Beispiel: Wenn du Deutsch sprichst und etwas auf Chinesisch sagen musst, zerlegen wir die chinesischen Wörter in deutsche Silben, die du bereits aussprechen kannst.",
    whoItsFor: "Perfekt für Reisende und alle, die im entscheidenden Moment — jetzt, sofort — ein paar wichtige Sätze sagen müssen, ohne einen Sprachkurs.",
    dontShowAgain: "Nicht mehr anzeigen",
    getStarted: "Verstanden — los geht's! →",
  },
  ru: {
    headline: "Добро пожаловать в How Do I Say 🌏",
    tagline: "Говорите на любом языке — чтение не требуется",
    notGoogleTranslate: "⚠️ Это НЕ Google Переводчик",
    whatItIs: "How Do I Say учит вас произносить фразы вслух — используя звуки ВАШЕГО языка. Когда вам нужно говорить по-вьетнамски, по-тайски, по-японски или по-китайски с человеком прямо перед вами — вы действительно сможете это сделать.",
    howItWorks: "Как это работает:",
    step1: "📍 Выберите ВАШ язык в первом поле (язык, на котором вы уже говорите)",
    step2: "🌏 Выберите язык, на котором ХОТИТЕ говорить, во втором поле",
    step3: "✍️ Введите любую фразу — или выберите из 100 готовых",
    example: "Пример: Если вы говорите по-русски и вам нужно что-то сказать по-китайски, мы разобьём китайские слова на русские слоги, которые вы уже умеете произносить.",
    whoItsFor: "Идеально для путешественников и всех, кому нужно сказать несколько ключевых фраз — прямо сейчас, в нужный момент — без языковых курсов.",
    dontShowAgain: "Больше не показывать",
    getStarted: "Понятно — вперёд! →",
  },
  uk: {
    headline: "Ласкаво просимо до How Do I Say 🌏",
    tagline: "Говоріть будь-якою мовою — читання не потрібне",
    notGoogleTranslate: "⚠️ Це НЕ Google Перекладач",
    whatItIs: "How Do I Say навчить вас вимовляти фрази вголос — використовуючи звуки ВАШОЇ мови. Коли вам потрібно говорити в'єтнамською, тайською, японською або китайською з людиною прямо перед вами — ви зможете це зробити.",
    howItWorks: "Як це працює:",
    step1: "📍 Оберіть ВАШУ мову в першому полі (мова, якою ви вже говорите)",
    step2: "🌏 Оберіть мову, якою ХОЧЕТЕ говорити, у другому полі",
    step3: "✍️ Введіть будь-яку фразу — або оберіть із 100 готових",
    example: "Приклад: Якщо ви говорите українською і вам потрібно щось сказати китайською, ми розіб'ємо китайські слова на українські склади, які ви вже вмієте вимовляти.",
    whoItsFor: "Ідеально для мандрівників і всіх, хто потребує сказати кілька ключових фраз — прямо зараз, у потрібний момент — без мовних курсів.",
    dontShowAgain: "Більше не показувати",
    getStarted: "Зрозуміло — вперед! →",
  },
  ar: {
    headline: "مرحباً بك في How Do I Say 🌏",
    tagline: "تحدث بأي لغة — لا حاجة للقراءة",
    notGoogleTranslate: "⚠️ هذا ليس Google Translate",
    whatItIs: "How Do I Say يعلّمك كيف تنطق العبارات بصوت عالٍ — باستخدام أصوات من لغتك الخاصة. عندما تحتاج إلى التحدث بالفيتنامية أو التايلاندية أو اليابانية أو الصينية مع شخص أمامك مباشرةً، ستستطيع ذلك فعلاً.",
    howItWorks: "كيف يعمل:",
    step1: "📍 اختر لغتك في المربع الأول (اللغة التي تتحدثها بالفعل)",
    step2: "🌏 اختر اللغة التي تريد التحدث بها في المربع الثاني",
    step3: "✍️ اكتب أي عبارة — أو اختر من 100 عبارة جاهزة",
    example: "مثال: إذا كنت تتحدث العربية وتحتاج إلى قول شيء بالصينية، سنقسّم الكلمات الصينية إلى مقاطع عربية تعرف بالفعل كيف تنطقها.",
    whoItsFor: "مثالي للمسافرين وكل من يحتاج إلى قول بعض العبارات المهمة — الآن، في اللحظة — دون حاجة لحصص اللغة.",
    dontShowAgain: "لا تعرض مرة أخرى",
    getStarted: "فهمت — لنبدأ! →",
  },
  hi: {
    headline: "How Do I Say में आपका स्वागत है 🌏",
    tagline: "कोई भी भाषा बोलें — पढ़ने की जरूरत नहीं",
    notGoogleTranslate: "⚠️ यह Google Translate नहीं है",
    whatItIs: "How Do I Say आपको जोर से बोलना सिखाता है — आपकी अपनी भाषा की आवाज़ों का उपयोग करके। जब आपको किसी के सामने वियतनामी, थाई, जापानी या चीनी में बात करनी हो — आप सच में कर पाएंगे।",
    howItWorks: "यह कैसे काम करता है:",
    step1: "📍 पहले बॉक्स में अपनी भाषा चुनें (जो आप पहले से बोलते हैं)",
    step2: "🌏 दूसरे बॉक्स में वह भाषा चुनें जो आप बोलना चाहते हैं",
    step3: "✍️ कोई भी वाक्यांश टाइप करें — या 100 तैयार वाक्यांशों में से चुनें",
    example: "उदाहरण: यदि आप हिंदी बोलते हैं और चीनी में कुछ कहना चाहते हैं, तो हम चीनी शब्दों को उन हिंदी अक्षरों में तोड़ देंगे जिन्हें आप पहले से उच्चारण करना जानते हैं।",
    whoItsFor: "यात्रियों और उन लोगों के लिए एकदम सही जिन्हें कुछ मुख्य वाक्यांश बोलने हैं — अभी, इसी पल — बिना किसी भाषा की कक्षा के।",
    dontShowAgain: "दोबारा न दिखाएं",
    getStarted: "समझ गया — चलते हैं! →",
  },
  pt: {
    headline: "Bem-vindo ao How Do I Say 🌏",
    tagline: "Fale qualquer idioma — sem precisar ler",
    notGoogleTranslate: "⚠️ Isso NÃO é o Google Tradutor",
    whatItIs: "How Do I Say te ensina a falar frases em voz alta — usando sons do SEU próprio idioma. Quando você precisar falar vietnamita, tailandês, japonês ou chinês com alguém na sua frente, você realmente vai conseguir.",
    howItWorks: "Como funciona:",
    step1: "📍 Escolha SEU idioma na primeira caixa (o que você já fala)",
    step2: "🌏 Escolha o idioma que você QUER falar na segunda caixa",
    step3: "✍️ Digite qualquer frase — ou escolha uma das 100 já preparadas",
    example: "Exemplo: Se você fala português e precisa dizer algo em chinês, vamos dividir as palavras chinesas em sílabas portuguesas que você já sabe pronunciar.",
    whoItsFor: "Perfeito para viajantes e qualquer pessoa que precise dizer algumas frases importantes — agora, no momento — sem aulas de idioma.",
    dontShowAgain: "Não mostrar novamente",
    getStarted: "Entendido — vamos lá! →",
  },
  it: {
    headline: "Benvenuto su How Do I Say 🌏",
    tagline: "Parla qualsiasi lingua — senza bisogno di leggere",
    notGoogleTranslate: "⚠️ Questo NON è Google Traduttore",
    whatItIs: "How Do I Say ti insegna a pronunciare frasi ad alta voce — usando i suoni della TUA lingua. Quando hai bisogno di parlare vietnamita, tailandese, giapponese o cinese con qualcuno di fronte a te, puoi davvero farlo.",
    howItWorks: "Come funziona:",
    step1: "📍 Scegli LA TUA lingua nella prima casella (quella che parli già)",
    step2: "🌏 Scegli la lingua che VUOI parlare nella seconda casella",
    step3: "✍️ Digita qualsiasi frase — o scegli tra 100 frasi già pronte",
    example: "Esempio: Se parli italiano e devi dire qualcosa in cinese, analizzeremo le parole cinesi in sillabe italiane che sai già come pronunciare.",
    whoItsFor: "Perfetto per i viaggiatori e chiunque abbia bisogno di dire alcune frasi chiave — adesso, sul momento — senza corsi di lingua.",
    dontShowAgain: "Non mostrare più",
    getStarted: "Capito — andiamo! →",
  },
  nl: {
    headline: "Welkom bij How Do I Say 🌏",
    tagline: "Spreek elke taal — geen lezen vereist",
    notGoogleTranslate: "⚠️ Dit is GEEN Google Translate",
    whatItIs: "How Do I Say leert je hoe je zinnen hardop uitspreekt — met klanken uit JOUW eigen taal. Als je Vietnamees, Thais, Japans of Chinees moet spreken tegen iemand recht voor je, kun je het echt doen.",
    howItWorks: "Zo werkt het:",
    step1: "📍 Kies JOUW taal in het eerste vak (de taal die je al spreekt)",
    step2: "🌏 Kies de taal die je WIL spreken in het tweede vak",
    step3: "✍️ Typ een zin — of kies uit 100 kant-en-klare zinnen",
    example: "Voorbeeld: Als je Nederlands spreekt en iets in het Chinees moet zeggen, splitsen we de Chinese woorden in Nederlandse lettergrepen die je al weet uit te spreken.",
    whoItsFor: "Perfect voor reizigers en iedereen die een paar belangrijke zinnen moet zeggen — nu, op dat moment — zonder taalles.",
    dontShowAgain: "Niet meer tonen",
    getStarted: "Begrepen — laten we gaan! →",
  },
};

// Fallback to English for any unsupported language
const getText = (lang: string) => ONBOARDING[lang] || ONBOARDING["en"];

interface OnboardingModalProps {
  nativeLang: string;
}

export default function OnboardingModal({ nativeLang }: OnboardingModalProps) {
  const [visible, setVisible] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    // Check if user has permanently dismissed it
    const hidden = localStorage.getItem(STORAGE_KEY);
    if (!hidden) {
      setVisible(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShow) {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    setVisible(false);
  };

  if (!visible) return null;

  const t = getText(nativeLang);
  const isRTL = nativeLang === "ar";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Top gradient bar */}
        <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">

          {/* Headline */}
          <div className="text-center">
            <h2 className="text-xl font-extrabold text-gray-900 leading-tight">{t.headline}</h2>
            <p className="text-sm text-gray-500 mt-1">{t.tagline}</p>
          </div>

          {/* Not Google Translate — attention grabber */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm font-bold text-amber-800 mb-2">{t.notGoogleTranslate}</p>
            <p className="text-sm text-amber-900 leading-relaxed">{t.whatItIs}</p>
          </div>

          {/* How it works */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{t.howItWorks}</p>
            <div className="space-y-2">
              {[t.step1, t.step2, t.step3].map((step, i) => (
                <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl px-4 py-3">
                  <p className="text-sm text-gray-700 leading-snug">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Example */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-sm text-blue-900 leading-relaxed">💡 {t.example}</p>
          </div>

          {/* Who it's for */}
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
            <p className="text-sm text-green-900 leading-relaxed">🌍 {t.whoItsFor}</p>
          </div>

          {/* Don't show again checkbox */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="w-4 h-4 rounded accent-slate-800 cursor-pointer"
            />
            <span className="text-sm text-gray-500">{t.dontShowAgain}</span>
          </label>

          {/* CTA button */}
          <button
            onClick={handleClose}
            className="w-full py-4 bg-slate-900 hover:bg-slate-700 text-white font-extrabold text-base rounded-2xl transition shadow-lg"
          >
            {t.getStarted}
          </button>
        </div>
      </div>
    </div>
  );
}
