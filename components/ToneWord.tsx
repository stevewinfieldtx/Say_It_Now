interface ToneWordProps {
  word: string;
  tone: string;
}

// Returns 0-1 vertical position for each letter (0=bottom, 1=top)
function getTonePositions(tone: string, count: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    switch (tone) {
      case "rising":  return t;
      case "falling": return 1 - t;
      case "flat":    return 0.5;
      case "high":    return 0.85;
      case "low":     return 0.15;
      case "dipping": return 1 - Math.sin(t * Math.PI);
      case "broken":  return 0.5 + (i % 2 === 0 ? 0.3 : -0.3);
      default:        return 0.5;
    }
  });
}

const TONE_COLOR: Record<string, string> = {
  rising:  "#2563eb",
  falling: "#dc2626",
  flat:    "#6b7280",
  dipping: "#7c3aed",
  high:    "#059669",
  low:     "#d97706",
  broken:  "#be185d",
};

const TONE_SYMBOL: Record<string, string> = {
  rising:  "↗",
  falling: "↘",
  flat:    "→",
  dipping: "↓↗",
  high:    "⬆",
  low:     "⬇",
  broken:  "〜",
};

export default function ToneWord({ word, tone }: ToneWordProps) {
  const letters = word.split("");
  const positions = getTonePositions(tone, letters.length);
  const color = TONE_COLOR[tone] || "#6b7280";
  const symbol = TONE_SYMBOL[tone] || "";
  const MAX_OFFSET = 22;
  const CONTAINER_HEIGHT = MAX_OFFSET + 32;

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span
        className="inline-flex items-end"
        style={{ height: `${CONTAINER_HEIGHT}px` }}
        aria-label={`${word} - ${tone} tone`}
      >
        {letters.map((letter, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              position: "relative",
              bottom: `${positions[i] * MAX_OFFSET}px`,
              color,
              fontWeight: 900,
              fontSize: "1.4rem",
              lineHeight: 1,
              letterSpacing: "0.03em",
            }}
          >
            {letter}
          </span>
        ))}
        <span
          style={{
            display: "inline-block",
            position: "relative",
            bottom: `${positions[letters.length - 1] * MAX_OFFSET}px`,
            color,
            fontSize: "0.9rem",
            marginLeft: "4px",
            opacity: 0.7,
          }}
        >
          {symbol}
        </span>
      </span>
    </span>
  );
}

/**
 * ReferenceWord — shows the English reference word with the relevant syllable highlighted.
 * e.g. referenceWord="denver" highlightStart=0 highlightEnd=3 → "Den" bolded, "ver" dimmed
 * If the whole word IS the sound, the entire word is bolded.
 */
interface ReferenceWordProps {
  referenceWord: string;
  highlightStart: number;
  highlightEnd: number;
  tone: string;
}

export function ReferenceWord({ referenceWord, highlightStart, highlightEnd, tone }: ReferenceWordProps) {
  const color = TONE_COLOR[tone] || "#6b7280";
  const before = referenceWord.slice(0, highlightStart);
  const highlighted = referenceWord.slice(highlightStart, highlightEnd);
  const after = referenceWord.slice(highlightEnd);

  return (
    <span className="text-sm leading-tight">
      {before && (
        <span style={{ color: "#94a3b8", fontWeight: 400 }}>{before}</span>
      )}
      <span style={{ color, fontWeight: 800, textDecoration: "underline", textUnderlineOffset: "2px" }}>
        {highlighted}
      </span>
      {after && (
        <span style={{ color: "#94a3b8", fontWeight: 400 }}>{after}</span>
      )}
    </span>
  );
}