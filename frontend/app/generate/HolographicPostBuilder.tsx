"use client";
import { useState, useEffect } from "react";
import { Search, Brain, PenLine, Palette, Hash, Calendar, Rocket } from "lucide-react";

const STATUS_MESSAGES = [
  { Icon: Search, text: "Researching your audience..." },
  { Icon: Brain, text: "Crafting content strategy..." },
  { Icon: PenLine, text: "Writing viral scripts..." },
  { Icon: Palette, text: "Designing visual concepts..." },
  { Icon: Hash, text: "Synthesizing hashtags..." },
  { Icon: Calendar, text: "Building content calendar..." },
  { Icon: Rocket, text: "Polishing final package..." },
];

export default function HolographicPostBuilder() {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentStatus = STATUS_MESSAGES[statusIndex];
  const { Icon } = currentStatus;

  return (
    <div className="preview-canvas animate-float-up" style={{ animationDelay: "300ms", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div className="preview-empty">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <img
            src="/ai-animation-flow-1.svg"
            alt="Generating..."
            style={{ width: 200, height: 200, objectFit: "contain" }}
          />
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 12, textAlign: "center" }}>
            Quiet machines at work
          </div>
          <h3
            className="font-serif"
            style={{
              fontSize: 38,
              margin: 0,
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              textAlign: "center",
            }}
          >
            Crafting your <span style={{ fontStyle: "italic", color: "var(--cf-rust)" }}>story</span>.
          </h3>
        </div>

        {/* ── Status Message ── */}
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "var(--cf-paper-warm)", border: "1px solid var(--cf-line)",
            display: "grid", placeItems: "center", color: "var(--cf-rust)"
          }}>
            <Icon size={18} strokeWidth={1.5} />
          </div>
          <p style={{ margin: 0, fontWeight: 500, color: "var(--cf-ink)" }}>
            {currentStatus.text}
          </p>
        </div>

        {/* ── Progress Bar ── */}
        <div style={{ marginTop: 12, width: "100%", maxWidth: 280 }}>
          <div style={{ height: 3, borderRadius: 999, background: "var(--cf-line-soft)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                background: "var(--cf-rust)",
                width: "100%",
                animation: "shimmer-line 1.5s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
