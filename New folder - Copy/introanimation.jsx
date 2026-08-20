"import { useEffect, useState } from \"react\";

/**
 * Stripe-inspired entrance animation.
 * - Particle constellation forming a \"C\" mark
 * - Connecting arcs draw in with terracotta gradient
 * - Wordmark fades in serif
 * - Auto-dismisses after ~3s
 */
export default function IntroAnimation({ onDone }) {
  const [exit, setExit] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setExit(true), 2700);
    const t2 = setTimeout(() => onDone && onDone(), 3400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  // Generate particle ring (forming a circle/C-shape)
  const dots = [];
  const dotCount = 56;
  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2;
    const radius = 78 + (i % 3) * 3;
    const x = 110 + Math.cos(angle) * radius;
    const y = 110 + Math.sin(angle) * radius;
    const delay = 200 + (i * 18);
    dots.push(
      <circle
        key={i}
        cx={x}
        cy={y}
        r={1.8}
        fill={i % 5 === 0 ? \"#B8482B\" : \"#1C1917\"}
        opacity=\"0\"
        style={{
          animation: `dot-bloom 600ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms forwards`,
          transformOrigin: `${x}px ${y}px`,
        }}
      />
    );
  }

  return (
    <div
      className=\"intro-stage\"
      data-testid=\"intro-animation\"
      style={exit ? { opacity: 0, transition: \"opacity 600ms ease\" } : {}}
    >
      <div style={{ display: \"flex\", flexDirection: \"column\", alignItems: \"center\", gap: 36 }}>
        {/* Particle constellation */}
        <div style={{ position: \"relative\", width: 220, height: 220 }}>
          <svg width=\"220\" height=\"220\" viewBox=\"0 0 220 220\" style={{ overflow: \"visible\" }}>
            <defs>
              <linearGradient id=\"arcGrad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">
                <stop offset=\"0%\" stopColor=\"#B8482B\" stopOpacity=\"0\" />
                <stop offset=\"50%\" stopColor=\"#B8482B\" stopOpacity=\"1\" />
                <stop offset=\"100%\" stopColor=\"#B45309\" stopOpacity=\"0\" />
              </linearGradient>
              <linearGradient id=\"arcGrad2\" x1=\"0%\" y1=\"100%\" x2=\"100%\" y2=\"0%\">
                <stop offset=\"0%\" stopColor=\"#1C1917\" stopOpacity=\"0\" />
                <stop offset=\"50%\" stopColor=\"#1C1917\" stopOpacity=\"0.6\" />
                <stop offset=\"100%\" stopColor=\"#1C1917\" stopOpacity=\"0\" />
              </linearGradient>
            </defs>

            {/* Connecting arcs */}
            <path
              d=\"M 32 110 A 78 78 0 0 1 188 110\"
              fill=\"none\"
              stroke=\"url(#arcGrad)\"
              strokeWidth=\"1.4\"
              strokeDasharray=\"300\"
              strokeDashoffset=\"300\"
              style={{ animation: \"arc-draw 1400ms cubic-bezier(0.65, 0, 0.35, 1) 800ms forwards\" }}
            />
            <path
              d=\"M 188 110 A 78 78 0 0 1 32 110\"
              fill=\"none\"
              stroke=\"url(#arcGrad2)\"
              strokeWidth=\"1\"
              strokeDasharray=\"300\"
              strokeDashoffset=\"300\"
              style={{ animation: \"arc-draw 1400ms cubic-bezier(0.65, 0, 0.35, 1) 1100ms forwards\" }}
            />
            <path
              d=\"M 60 50 Q 110 110 60 170\"
              fill=\"none\"
              stroke=\"url(#arcGrad)\"
              strokeWidth=\"0.8\"
              strokeDasharray=\"220\"
              strokeDashoffset=\"220\"
              opacity=\"0.7\"
              style={{ animation: \"arc-draw 1600ms cubic-bezier(0.65, 0, 0.35, 1) 1300ms forwards\" }}
            />

            {/* Particle dots */}
            {dots}

            {/* Center mark */}
            <g style={{ animation: \"scale-in 700ms cubic-bezier(0.16, 1, 0.3, 1) 1400ms backwards\" }}>
              <circle cx=\"110\" cy=\"110\" r=\"22\" fill=\"#1C1917\" />
              <text
                x=\"110\"
                y=\"118\"
                textAnchor=\"middle\"
                fontSize=\"22\"
                fontWeight=\"400\"
                fill=\"#FAF7F2\"
                fontStyle=\"italic\"
                fontFamily=\"Instrument Serif, serif\"
              >
                C
              </text>
            </g>
          </svg>
        </div>

        {/* Wordmark */}
        <div style={{ textAlign: \"center\" }}>
          <div
            className=\"font-serif animate-word-reveal\"
            style={{
              fontSize: 44,
              lineHeight: 1,
              color: \"#1C1917\",
              animationDelay: \"1600ms\",
            }}
          >
            Content<span style={{ color: \"#B8482B\", fontStyle: \"italic\" }}>Forge</span>
          </div>
          <div
            className=\"eyebrow animate-word-reveal\"
            style={{
              marginTop: 14,
              animationDelay: \"1900ms\",
            }}
          >
            Crafted content, effortlessly
          </div>
        </div>

        {/* Shimmer underline */}
        <div
          style={{
            width: 200,
            height: 1,
            background: \"linear-gradient(90deg, transparent, #1C1917, transparent)\",
            opacity: 0,
            animation: \"fade-in 800ms ease 2100ms forwards\",
            position: \"relative\",
            overflow: \"hidden\",
          }}
        >
          <div
            style={{
              position: \"absolute\",
              inset: 0,
              background: \"linear-gradient(90deg, transparent, #B8482B, transparent)\",
              animation: \"shimmer-line 1.4s ease-in-out 2200ms infinite\",
            }}
          />
        </div>
      </div>
    </div>
  );
}
"