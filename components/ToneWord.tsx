interface ToneWordProps {
  word: string;
  tone: string;
}

// Returns 0-1 vertical position for each letter (0=bottom, 1=top)
function getTonePositions(tone: string, count: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    switch (tone) {
      case "rising":  return t;                          // S(low)→N→A→P(high)
      case "falling": return 1 - t;                     // S(high)→N→A→P(low)
      case "flat":    return 0.5;                        // all middle
      case "high":    return 0.85;                       // all near top
      case "low":     return 0.15;                       // all near bottom
      case "dipping": return 1 - Math.sin(t * Math.PI); // high→dips→high (U shape)
      case "broken":  return 0.5 + (i % 2 === 0 ? 0.3 : -0.3); // jagged
      default:        return 0.5;
    }
  });
}

const TONE_COLOR: Record<string, string> = {
  rising:  "#2563eb", // blue
  falling: "#dc2626", // red
  flat:    "#6b7280", // gray
  dipping: "#7c3aed", // purple
  high:    "#059669", // green
  low:     "#d97706", // amber
  broken:  "#be185d", // pink
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
  const MAX_OFFSET = 22; // px range bottom to top
  const CONTAINER_HEIGHT = MAX_OFFSET + 32;

  return (
    <span className="inline-flex flex-col items-start gap-1">
      {/* The animated word */}
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
        {/* Tone symbol after the word */}
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
