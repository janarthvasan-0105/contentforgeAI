import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Compass, PenTool, Image as ImageIcon, Video, Send, Play, Pause, RotateCcw } from "lucide-react";

// ---- Agent data, sourced from the ContentForge crew spec ----
const AGENTS = [
  {
    id: "cato",
    name: "Cato",
    role: "The Researcher",
    icon: Search,
    color: "#4361EE",
    files: ["research_agent.py", "scraper_agent.py", "audience_agent.py"],
    receives: ["Topic, URL, or target audience"],
    sends: ["Brand voice + audience pain points → Vela"],
    logs: [
      "scanning brand tone from source URL",
      "mapping audience pain points",
      "extracting color + typography cues",
    ],
  },
  {
    id: "vela",
    name: "Vela",
    role: "The Strategist",
    icon: Compass,
    color: "#6D4AE8",
    files: ["strategy_agent.py", "idea_agent.py"],
    receives: ["Brand + audience context from Cato"],
    sends: ["Content angle + format blueprint → Orin"],
    logs: [
      "weighing educational vs. contrarian angles",
      "locking format: carousel vs. short-form",
      "handing off campaign blueprint",
    ],
  },
  {
    id: "orin",
    name: "Orin",
    role: "The Copywriter",
    icon: PenTool,
    color: "#8B3DF0",
    files: ["script_agent.py", "caption_agent.py", "hashtag_agent.py"],
    receives: ["Blueprint from Vela", "Brand voice from Cato"],
    sends: ["Scripts, captions, hashtags → Iris + Kade"],
    logs: [
      "drafting hook variants",
      "writing caption + trending hashtags",
      "finalizing script for hand-off",
    ],
  },
  {
    id: "iris",
    name: "Iris",
    role: "The Art Director",
    icon: ImageIcon,
    color: "#A93DE0",
    files: ["image_prompt_agent.py", "image_generation_agent.py", "visual_concept_agent.py"],
    receives: ["Narrative + copy from Orin"],
    sends: ["Keyframes + brand-aligned visuals → Kade"],
    logs: [
      "building cinematic image prompt",
      "rendering assets via Ideogram",
      "checking brand color alignment",
    ],
  },
  {
    id: "kade",
    name: "Kade",
    role: "The Video Producer",
    icon: Video,
    color: "#C230D6",
    files: ["video_prompt_agent.py", "frame_interpolation_agent.py", "video_stitch_agent.py"],
    receives: ["Keyframes from Iris", "Script from Orin"],
    sends: ["Finished MP4 → Nova"],
    logs: [
      "interpolating frames via RIFE",
      "stitching scenes + crossfading audio",
      "encoding final MP4",
    ],
  },
  {
    id: "nova",
    name: "Nova",
    role: "The Distributor",
    icon: Send,
    color: "#DB2894",
    files: ["calendar_agent.py", "twitter_publisher_agent.py"],
    receives: ["Finished assets from Orin, Iris + Kade"],
    sends: ["Scheduled posts → X, LinkedIn"],
    logs: [
      "slotting optimal post times",
      "pushing to platform API",
      "campaign published",
    ],
  },
];

const STAGE_MS = 2200;

export default function ContentForgePipeline() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState(0);
  const [following, setFollowing] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [cycle, setCycle] = useState(0);
  const [logs, setLogs] = useState([]);
  const logIdRef = useRef(0);
  const logEndRef = useRef(null);

  const pushLog = useCallback((agentIndex) => {
    const agent = AGENTS[agentIndex];
    const line = agent.logs[Math.floor(Math.random() * agent.logs.length)];
    logIdRef.current += 1;
    const entry = {
      id: logIdRef.current,
      color: agent.color,
      name: agent.name,
      text: line,
      t: new Date().toLocaleTimeString([], { hour12: false }),
    };
    setLogs((prev) => [...prev.slice(-11), entry]);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % AGENTS.length;
        if (next === 0) setCycle((c) => c + 1);
        pushLog(next);
        if (following) setSelected(next);
        return next;
      });
    }, STAGE_MS);
    return () => clearInterval(interval);
  }, [isPlaying, following, pushLog]);

  useEffect(() => {
    pushLog(0);
  }, [pushLog]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [logs]);

  const handleSelect = (idx) => {
    setSelected(idx);
    setFollowing(idx === activeIndex);
  };

  const resetSim = () => {
    setActiveIndex(0);
    setSelected(0);
    setFollowing(true);
    setLogs([]);
    setCycle(0);
    logIdRef.current = 0;
  };

  const trailPct = ((activeIndex + 1) / AGENTS.length) * 100;
  const activeAgent = AGENTS[selected];
  const Icon = activeAgent.icon;

  return (
    <div
      style={{
        background: "#0A0A0F",
        color: "#EDEBF5",
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', sans-serif",
        minHeight: "100%",
        padding: "28px 20px",
        borderRadius: 16,
      }}
    >
      <style>{`
        @keyframes cf-pulse {
          0%, 100% { box-shadow: 0 0 0 0 var(--pulse-color, rgba(124,58,237,0.5)); }
          50% { box-shadow: 0 0 0 8px rgba(124,58,237,0); }
        }
        @keyframes cf-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .cf-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
        .cf-node-active { animation: cf-pulse 1.8s ease-in-out infinite; }
        .cf-log-dot { animation: cf-blink 1.4s ease-in-out infinite; }
        .cf-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .cf-scroll::-webkit-scrollbar-thumb { background: #2A2A38; border-radius: 4px; }
        .cf-node-btn { transition: transform 0.15s ease, border-color 0.15s ease; }
        .cf-node-btn:hover { transform: translateY(-2px); }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <div
            className="cf-mono"
            style={{
              fontSize: 11,
              letterSpacing: 3,
              color: "#8A8798",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            contentForgeAI · agent crew
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: -0.5,
              background: "linear-gradient(90deg, #4361EE, #8B3DF0, #DB2894)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Live Command Center
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            className="cf-mono"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: isPlaying ? "#4ADE80" : "#8A8798",
              border: "1px solid #232333",
              borderRadius: 999,
              padding: "6px 12px",
              background: "#14141C",
            }}
          >
            <span
              className={isPlaying ? "cf-log-dot" : ""}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: isPlaying ? "#4ADE80" : "#5A5868",
                display: "inline-block",
              }}
            />
            {isPlaying ? "running" : "paused"} · cycle {cycle}
          </div>
          <button
            onClick={() => setIsPlaying((p) => !p)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid #232333",
              background: "#14141C",
              color: "#EDEBF5",
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={resetSim}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid #232333",
              background: "#14141C",
              color: "#8A8798",
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </div>

      {/* Pipeline track */}
      <div style={{ position: "relative", marginBottom: 8, paddingTop: 6 }}>
        <div
          style={{
            position: "absolute",
            top: 27,
            left: "8%",
            right: "8%",
            height: 3,
            borderRadius: 3,
            background: "#1E1E28",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 27,
            left: "8%",
            width: `calc(${trailPct}% * 0.84)`,
            height: 3,
            borderRadius: 3,
            background: "linear-gradient(90deg, #4361EE, #6D4AE8, #8B3DF0, #A93DE0, #C230D6, #DB2894)",
            transition: "width 0.6s ease",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 4,
            flexWrap: "wrap",
          }}
        >
          {AGENTS.map((agent, idx) => {
            const AgentIcon = agent.icon;
            const isActive = idx === activeIndex;
            const isPast = idx < activeIndex || (idx === activeIndex);
            const isSelected = idx === selected;
            return (
              <button
                key={agent.id}
                onClick={() => handleSelect(idx)}
                className="cf-node-btn"
                style={{
                  flex: "1 1 0",
                  minWidth: 84,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: "0 4px",
                }}
              >
                <div
                  className={isActive ? "cf-node-active" : ""}
                  style={{
                    "--pulse-color": `${agent.color}80`,
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isPast ? agent.color : "#14141C",
                    border: `2px solid ${isSelected ? "#fff" : agent.color}`,
                    boxShadow: isSelected ? `0 0 0 3px ${agent.color}33` : "none",
                    transition: "background 0.4s ease",
                  }}
                >
                  <AgentIcon size={20} color={isPast ? "#0A0A0F" : agent.color} />
                </div>
                <div
                  className="cf-mono"
                  style={{
                    fontSize: 9,
                    letterSpacing: 1.5,
                    color: "#5A5868",
                    textTransform: "uppercase",
                  }}
                >
                  0{idx + 1}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? "#fff" : "#EDEBF5" }}>
                  {agent.name}
                </div>
                <div style={{ fontSize: 10.5, color: "#8A8798", textAlign: "center" }}>{agent.role}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail + log panels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 16,
          marginTop: 24,
        }}
      >
        {/* Detail panel */}
        <div
          style={{
            background: "#14141C",
            border: "1px solid #232333",
            borderRadius: 14,
            padding: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `${activeAgent.color}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={18} color={activeAgent.color} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {activeAgent.name} <span style={{ color: "#8A8798", fontWeight: 400 }}>· {activeAgent.role}</span>
              </div>
              {!following && (
                <button
                  onClick={() => {
                    setFollowing(true);
                    setSelected(activeIndex);
                  }}
                  className="cf-mono"
                  style={{
                    fontSize: 10,
                    color: "#6D4AE8",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    marginTop: 2,
                  }}
                >
                  ← back to live
                </button>
              )}
            </div>
          </div>

          <div className="cf-mono" style={{ fontSize: 10.5, color: "#5A5868", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
            backend
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {activeAgent.files.map((f) => (
              <span
                key={f}
                className="cf-mono"
                style={{
                  fontSize: 11,
                  background: "#1E1E28",
                  border: "1px solid #2A2A38",
                  borderRadius: 6,
                  padding: "3px 8px",
                  color: "#B5B2C4",
                }}
              >
                {f}
              </span>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div className="cf-mono" style={{ fontSize: 10.5, color: "#5A5868", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
                receives
              </div>
              {activeAgent.receives.map((r, i) => (
                <div key={i} style={{ fontSize: 12.5, color: "#C9C7D6", marginBottom: 4, paddingLeft: 10, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0 }}>·</span>
                  {r}
                </div>
              ))}
            </div>
            <div>
              <div className="cf-mono" style={{ fontSize: 10.5, color: "#5A5868", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
                sends
              </div>
              {activeAgent.sends.map((s, i) => (
                <div key={i} style={{ fontSize: 12.5, color: activeAgent.color, marginBottom: 4, paddingLeft: 10, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0 }}>→</span>
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Log panel */}
        <div
          style={{
            background: "#0D0D13",
            border: "1px solid #232333",
            borderRadius: 14,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="cf-mono" style={{ fontSize: 10.5, color: "#5A5868", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
            activity feed
          </div>
          <div className="cf-scroll" style={{ overflowY: "auto", maxHeight: 220, flex: 1 }}>
            {logs.map((entry) => (
              <div
                key={entry.id}
                className="cf-mono"
                style={{ fontSize: 11.5, marginBottom: 7, lineHeight: 1.5, color: "#9694A3" }}
              >
                <span style={{ color: "#4A4858" }}>{entry.t}</span>{" "}
                <span style={{ color: entry.color, fontWeight: 600 }}>{entry.name}</span>{" "}
                {entry.text}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
