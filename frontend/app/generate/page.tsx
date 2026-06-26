"use client";
import { useState, useEffect } from "react";
import { generateContent } from "@/lib/api";
import HolographicPostBuilder from "./HolographicPostBuilder";
import PublishPanel from "./PublishPanel";
import {
  FileText, Smartphone, Globe,
  Camera, Video, MessageSquare,
  Sparkles, GraduationCap, Smile, Briefcase, BookOpen, Flame,
  Wand2, Search, Image as ImageIcon, Film, Calendar, Hash, PenLine, Lightbulb,
  Copy, Check, Download,
} from "lucide-react";

const PLATFORMS = ["instagram", "youtube", "linkedin", "twitter"];
const TONES = [
  "educational",
  "funny",
  "professional",
  "storytelling",
  "motivational",
];

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Camera,
  youtube: Video,
  linkedin: Briefcase,
  twitter: MessageSquare,
};

const TONE_ICONS: Record<string, any> = {
  educational: GraduationCap,
  funny: Smile,
  professional: Briefcase,
  storytelling: BookOpen,
  motivational: Flame,
};

const PURPOSE_ICONS: Record<string, any> = {
  general: FileText,
  app: Smartphone,
  website: Globe,
};

const safeText = (val: any): string => {
  if (typeof val === "string") return val;
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  return String(val);
};

const forceDownload = async (url: string, defaultFilename: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    // Extract filename from URL if possible
    const parts = url.split("/");
    const nameFromUrl = parts.pop()?.split("?")[0] || defaultFilename;
    link.download = nameFromUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("Download failed:", error);
    // Fallback: open in new tab
    window.open(url, "_blank");
  }
};

const getCalendarDayLabel = (day: any): string => {
  if (!day) return "";
  if (typeof day.day === "object" && day.day !== null) {
    return safeText(day.day.day);
  }
  if (day.day !== undefined) {
    return safeText(day.day);
  }
  const keys = Object.keys(day);
  if (keys.length > 0 && typeof day[keys[0]] === "object") {
    return safeText(keys[0]);
  }
  return "";
};

const getCalendarContentType = (day: any): string => {
  if (!day) return "";
  if (typeof day.day === "object" && day.day !== null) {
    return safeText(day.day.content_type || day.content_type);
  }
  if (day.content_type !== undefined) {
    return safeText(day.content_type);
  }
  const keys = Object.keys(day);
  if (keys.length > 0 && typeof day[keys[0]] === "object") {
    return safeText(day[keys[0]].content_type);
  }
  return "";
};

const getCalendarContentIdea = (day: any): string => {
  if (!day) return "";
  if (typeof day.day === "object" && day.day !== null) {
    return safeText(day.day.content_idea || day.content_idea);
  }
  if (day.content_idea !== undefined) {
    return safeText(day.content_idea);
  }
  const keys = Object.keys(day);
  if (keys.length > 0 && typeof day[keys[0]] === "object") {
    return safeText(day[keys[0]].content_idea);
  }
  return "";
};

const getCalendarPostingTime = (day: any): string => {
  if (!day) return "";
  if (typeof day.day === "object" && day.day !== null) {
    return safeText(day.day.posting_time || day.posting_time);
  }
  if (day.posting_time !== undefined) {
    return safeText(day.posting_time);
  }
  const keys = Object.keys(day);
  if (keys.length > 0 && typeof day[keys[0]] === "object") {
    return safeText(day[keys[0]].posting_time);
  }
  return "";
};

const getCalendarWeekContentPlan = (week: any): string[] => {
  if (!week) return [];
  const plan = week.content_plan;
  if (!plan) return [];
  
  if (Array.isArray(plan)) {
    return plan.map((item) => safeText(item)).filter((x) => x.trim() !== "");
  }
  
  if (typeof plan === "string") {
    return plan
      .split(/\r?\n/)
      .map((line) => line.replace(/^[\s-•*#\d.]+/, "").trim())
      .filter((line) => line.length > 0);
  }
  
  if (typeof plan === "object") {
    return Object.entries(plan)
      .map(([key, val]) => `${key}: ${safeText(val)}`)
      .filter((x) => x.trim() !== "");
  }
  
  return [safeText(plan)];
};

export default function GeneratePage() {
  const [form, setForm] = useState({
    purpose: "general",
    topic: "",
    platform: "instagram",
    audience: "",
    tone: "",
    brand_name: "",
    brand_primary_color: "#B8482B",
    brand_secondary_color: "#0F172A",
    visual_style: "modern",
    post_type: "single_post",
    cta_goal: "downloads",
    image_style: "realistic",
    app_context_url: "",
    app_context_file_content: "",
    user_suggestion: "",
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("scripts");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [showPublishPanel, setShowPublishPanel] = useState(false);
  const [twitterStatus, setTwitterStatus] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("cf_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.sub) {
          import("@/lib/api").then(({ getTwitterStatus }) => {
            getTwitterStatus(payload.sub).then(setTwitterStatus).catch(console.error);
          });
        }
      } catch (e) {}
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setShowPublishPanel(false);
    try {
      const payload = { ...form };
      if (payload.tone === "") {
        delete (payload as any).tone;
      }
      const finalPayload = payload;

      const data = await generateContent(finalPayload);
      setResult(data);
      setActiveTab("posts");
    } catch (err: any) {
      let message = err?.message || "Generation failed.";
      if (err?.response?.data?.detail) {
        if (typeof err.response.data.detail === "string") {
          message = err.response.data.detail;
        } else {
          message = JSON.stringify(err.response.data.detail, null, 2);
        }
      }
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(""), 2000);
  }

  const tabs = [
    { id: "posts", label: "Visuals", Icon: ImageIcon },
    { id: "videos", label: "Videos", Icon: Film },
    { id: "scripts", label: "Scripts", Icon: PenLine },
    { id: "ideas", label: "Ideas", Icon: Lightbulb },
    { id: "captions", label: "Captions", Icon: PenLine },
    { id: "hashtags", label: "Hashtags", Icon: Hash },
    { id: "calendar", label: "Calendar", Icon: Calendar },
  ];

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 32px 80px" }}>
      {/* Header */}
      {!showPublishPanel && (
        <div className="animate-float-up" style={{ marginBottom: 40 }}>
          <h1 className="font-serif" style={{ fontSize: "clamp(48px, 7vw, 72px)", lineHeight: 0.96, letterSpacing: "-0.03em", color: "var(--cf-ink)", fontWeight: 400 }}>
            Generate a{" "}
            <span style={{ fontStyle: "italic", color: "var(--cf-rust)" }}>content package</span>,
            <br />
            crafted by quiet machines.
          </h1>
          <p className="lead" style={{ marginTop: 16 }}>
            Fill in the brief. We'll shape it into scripts, visuals, captions, hashtags and a calendar.
          </p>
        </div>
      )}

      {twitterStatus?.connected && twitterStatus?.status !== "active" && (
        <div style={{ padding: 16, background: twitterStatus.status === "expiring_soon" ? "var(--cf-rust-soft)" : "#FECACA", color: twitterStatus.status === "expiring_soon" ? "#fff" : "#000", borderRadius: 12, marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start", border: "1px solid var(--cf-border)" }}>
          <span style={{ fontSize: 24 }}>{twitterStatus.status === "expiring_soon" ? "⚠️" : "❌"}</span>
          <div>
            <p style={{ margin: 0, fontWeight: "bold" }}>
              {twitterStatus.status === "expiring_soon"
                ? `Twitter tokens expiring in ${twitterStatus.days_left} days`
                : "Twitter tokens expired — auto-publish disabled"}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 14 }}>
              Go to <a href="/settings/twitter" style={{ textDecoration: "underline", color: "inherit" }}>Settings → Twitter</a> to refresh your tokens.
            </p>
          </div>
        </div>
      )}

      <div className={showPublishPanel ? "" : "workspace-grid"} style={showPublishPanel ? { maxWidth: 580, margin: "0 auto" } : undefined}>
        {/* Form */}
        {!showPublishPanel && (
          <form className="brief-panel animate-float-up" onSubmit={handleSubmit} style={{ animationDelay: "150ms" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Wand2 size={14} color="var(--cf-rust)" strokeWidth={2} />
              <span className="eyebrow">Content brief</span>
            </div>
            <h2 className="font-serif" style={{ fontSize: 32, margin: "0 0 4px", letterSpacing: "-0.02em", fontWeight: 400 }}>
              Tell us your <span style={{ fontStyle: "italic", color: "var(--cf-rust)" }}>story</span>.
            </h2>
            <p style={{ color: "var(--cf-muted)", fontSize: 14, margin: "0 0 28px", lineHeight: 1.5 }}>
              We'll shape it into a complete content package.
            </p>

              {/* 1. Purpose */}
              <div className="brief-section">
                <label className="cf-label"><span className="cf-label-num">01</span>Purpose</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { id: "general", label: "General Content" },
                    { id: "app", label: "App Marketing" },
                    { id: "website", label: "Website Marketing" },
                  ].map((p) => {
                    const Icon = PURPOSE_ICONS[p.id];
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setForm({ ...form, purpose: p.id })}
                        className={`cf-pill ${form.purpose === p.id ? "cf-pill-active" : ""}`}
                        style={{ flexDirection: "column", gap: 6, padding: "14px 6px" }}
                      >
                        <Icon size={16} strokeWidth={1.75} />
                        <span style={{ fontSize: 11, fontWeight: 500 }}>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Platform */}
              <div className="brief-section">
                <label className="cf-label"><span className="cf-label-num">02</span>Platform</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {PLATFORMS.map((p) => {
                    return (
                      <button
                        key={safeText(p)}
                        type="button"
                        onClick={() => setForm({ ...form, platform: p })}
                        className={`cf-pill ${form.platform === p ? "cf-pill-active" : ""}`}
                        style={{ flexDirection: "column", gap: 6, padding: "10px 4px", minHeight: 82, justifyContent: "center" }}
                      >
                        <div style={{ height: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {p === "instagram" && <img src="/instagram.svg" alt="Instagram" style={{ width: 28, height: 28, objectFit: "contain" }} />}
                          {p === "youtube" && <img src="/youtube.svg" alt="YouTube" style={{ width: 28, height: 28, objectFit: "contain" }} />}
                          {p === "linkedin" && <img src="/linkedin.svg" alt="LinkedIn" style={{ width: 28, height: 28, objectFit: "contain" }} />}
                          {p === "twitter" && (
                            <svg viewBox="284.28 60.6 1100 1100" style={{ width: 38, height: 38, fill: "currentColor" }}>
                              <circle cx="834.28" cy="610.6" r="481.33" stroke="currentColor" strokeWidth="90" fill="none" />
                              <path d="M485.39,356.79l230.07,307.62L483.94,914.52h52.11l202.7-218.98l163.77,218.98h177.32 L836.82,589.6l215.5-232.81h-52.11L813.54,558.46L662.71,356.79H485.39z M562.02,395.17h81.46l359.72,480.97h-81.46L562.02,395.17 z" transform="translate(52.39 -25.059)" />
                            </svg>
                          )}
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 500, textTransform: "capitalize" }}>{safeText(p)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>



              {/* 3. Topic */}
              <div className="brief-section">
                <label className="cf-label"><span className="cf-label-num">03</span>Topic</label>
                <input
                  id="form-topic"
                  className="cf-input"
                  placeholder="e.g. The art of AI-assisted writing"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  required
                />
              </div>

              {/* 4. Audience */}
              <div className="brief-section">
                <label className="cf-label"><span className="cf-label-num">04</span>Target audience</label>
                <input
                  id="form-audience"
                  className="cf-input"
                  placeholder="e.g. Indie creators & founders"
                  value={form.audience}
                  onChange={(e) =>
                    setForm({ ...form, audience: e.target.value })
                  }
                  required
                />
              </div>

              {/* 5. Suggestions */}
              <div className="brief-section">
                <label className="cf-label"><span className="cf-label-num">05</span>Generation suggestions</label>
                <textarea
                  id="form-suggestions"
                  className="cf-input"
                  style={{ minHeight: 92 }}
                  placeholder="e.g. Use dark aesthetic with purple accent, or mention the 30% discount specifically..."
                  value={form.user_suggestion}
                  onChange={(e) =>
                    setForm({ ...form, user_suggestion: e.target.value })
                  }
                />
              </div>

              {/* 7. App Context (Conditional) */}
              {form.purpose !== "general" && (
                <div className="brief-section animate-fade-in">
                  <label className="cf-label"><span className="cf-label-num">07</span>Context scraper</label>
                  <div style={{ display: "grid", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--cf-muted)", marginBottom: 6 }}>
                        {form.purpose === "app" ? "App Store / Play Store URL" : "Website URL"}
                      </div>
                      <input
                        className="cf-input"
                        placeholder="https://..."
                        value={form.app_context_url}
                        onChange={(e) =>
                          setForm({ ...form, app_context_url: e.target.value })
                        }
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1, height: 1, background: "var(--cf-line)" }} />
                      <span style={{ fontSize: 11, color: "var(--cf-muted-soft)", fontFamily: "JetBrains Mono" }}>OR</span>
                      <div style={{ flex: 1, height: 1, background: "var(--cf-line)" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--cf-muted)", marginBottom: 6 }}>
                        Paste marketing document
                      </div>
                      <textarea
                        className="cf-input"
                        style={{ minHeight: 92 }}
                        placeholder="Paste feature lists, app descriptions, or release notes..."
                        value={form.app_context_file_content}
                        onChange={(e) =>
                          setForm({ ...form, app_context_file_content: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                id="form-submit"
                type="submit"
                className="cf-btn-primary"
                disabled={loading}
                style={{ width: "100%", marginTop: 8, padding: "15px 22px", fontSize: 14 }}
              >
                {loading ? (
                  <>
                    <span className="status-dot" /> Generating your package…
                  </>
                ) : (
                  <>
                    <Sparkles size={15} strokeWidth={2} />
                    Generate content package
                  </>
                )}
              </button>

              <p style={{
                fontSize: 11.5,
                color: "var(--cf-muted-soft)",
                margin: "14px 0 0",
                textAlign: "center",
                fontFamily: "JetBrains Mono",
                letterSpacing: "0.04em",
              }}>
                Powered by multi-agent AI · ~30s to craft
              </p>
          </form>
        )}

        {/* Results */}
        <div className="animate-float-up" style={{ animationDelay: "300ms" }}>
          {loading ? (
            <HolographicPostBuilder />
          ) : !result ? (
            <div className="preview-canvas animate-float-up" style={{ animationDelay: "300ms" }}>
              <div className="preview-empty">
                <div className="preview-medallion">
                  <PenLine size={42} color="var(--cf-rust)" strokeWidth={1.4} />
                </div>

                <div>
                  <div className="eyebrow" style={{ marginBottom: 12, textAlign: "center" }}>
                    Awaiting brief
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
                    Your content package
                    <br />
                    will <span style={{ fontStyle: "italic", color: "var(--cf-rust)" }}>appear here</span>.
                  </h3>
                  <p
                    style={{
                      maxWidth: 380,
                      margin: "16px auto 0",
                      color: "var(--cf-muted)",
                      fontSize: 14,
                      lineHeight: 1.55,
                      textAlign: "center",
                    }}
                  >
                    Fill in the brief on the left. We'll generate scripts, captions, visuals,
                    hashtags and a calendar — tailored to your audience.
                  </p>
                </div>

                <div className="feature-grid">
                  {[
                    { Icon: Search, label: "AI Research" },
                    { Icon: ImageIcon, label: "Visual Posts" },
                    { Icon: Film, label: "Video Scripts" },
                    { Icon: Calendar, label: "Content Calendar" },
                  ].map(({ Icon, label }, i) => (
                    <div
                      key={label}
                      className="feature-chip animate-float-up"
                      style={{ animationDelay: `${600 + i * 100}ms` }}
                    >
                      <div className="feature-chip-icon">
                        <Icon size={17} strokeWidth={1.6} />
                      </div>
                      <div className="feature-chip-label">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : showPublishPanel ? (
            <PublishPanel result={result} platform={form.platform} onBack={() => setShowPublishPanel(false)} />
          ) : (
            <div style={{ position: "relative", paddingBottom: 80 }}>
              {/* Copy feedback toast */}
              {copyFeedback && (
                <div className="animate-fade-in" style={{
                  position: "fixed", bottom: 24, right: 24, zIndex: 50,
                  background: "var(--cf-ink)", color: "var(--cf-paper)",
                  padding: "10px 18px", borderRadius: 999,
                  fontSize: 13, fontWeight: 500,
                  boxShadow: "var(--cf-shadow-lg)",
                }}>
                  ✓ {copyFeedback} copied!
                </div>
              )}

              {/* Research Summary */}
              <div className="result-card animate-float-up" style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Search size={15} color="var(--cf-rust)" strokeWidth={2} />
                  <span className="eyebrow">Research Insights</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-[var(--cf-muted)] uppercase tracking-wider mb-3">
                      Trends Discovered
                    </p>
                    <ul className="space-y-2">
                      {result.trends?.slice(0, 5).map((t: string, i: number) => (
                        <li
                          key={i}
                          className="text-sm text-[var(--cf-ink-soft)] flex items-start gap-2"
                        >
                          <span className="text-[var(--cf-rust)] mt-0.5">▸</span>
                          {safeText(t)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--cf-muted)] uppercase tracking-wider mb-3">
                      Audience Pain Points
                    </p>
                    <ul className="space-y-2">
                      {result.pain_points
                        ?.slice(0, 5)
                        .map((p: string, i: number) => (
                          <li
                            key={i}
                            className="text-sm text-[var(--cf-ink-soft)] flex items-start gap-2"
                          >
                            <span className="text-[var(--cf-gold)] mt-0.5">⚠</span>
                            {safeText(p)}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="preview-canvas animate-float-up" style={{ animationDelay: "100ms", minHeight: "auto", padding: 0 }}>
                <div className="result-tabs" style={{ margin: 16, marginBottom: 0 }}>
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      id={`tab-${tab.id}`}
                      onClick={() => setActiveTab(tab.id)}
                      className={`result-tab ${activeTab === tab.id ? "is-active" : ""}`}
                    >
                      <tab.Icon size={13} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                <div style={{ padding: 24 }}>
                  {/* Posts Tab — AI Visual Posts */}
                  {activeTab === "posts" && (
                    <div className="space-y-4">
                      {result?.selected_format && (
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xs text-gray-400">Post Format:</span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-teal-900/40 text-teal-300 border border-teal-700">
                            {result.format_metadata?.name || result.selected_format}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            ({result.detected_field?.replace('_', ' ')})
                          </span>
                        </div>
                      )}
                      <p className="text-xs font-semibold text-[var(--cf-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span>🖼️</span> AI-Generated Posters
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!result.rendered_post_urls || result.rendered_post_urls.length === 0 ? (
                          <p className="text-[var(--cf-muted)] text-sm">No posters generated.</p>
                        ) : (
                          result.rendered_post_urls
                             .filter((url: string) => url)
                             .map((url: string, i: number) => (
                              <div key={i} className="space-y-2">
                                <img
                                  src={url}
                                  alt={`Generated poster ${i + 1}`}
                                  className="rounded-xl border border-[var(--cf-line)] w-full object-cover aspect-square shadow-sm"
                                />
                                <a
                                  href={url}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    forceDownload(url, `generated-image-${i + 1}.png`);
                                  }}
                                  className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-[var(--cf-rust)] hover:text-[var(--cf-rust-deep)] transition-colors font-medium"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  Download PNG
                                </a>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Videos Tab */}
                  {activeTab === "videos" && (
                    <div className="space-y-6">
                      <p className="text-xs font-semibold text-[var(--cf-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span>🎥</span> Generated Video
                      </p>

                      {/* ── New generated_video (Flash + Ideogram + moviepy) ── */}
                      {result.generated_video && result.generated_video.url ? (
                        <div className="bg-[var(--cf-paper)] border border-[var(--cf-line)] rounded-2xl overflow-hidden shadow-sm">
                          <div className="bg-[var(--cf-paper-warm)] px-5 py-3 border-b border-[var(--cf-line)] flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🎬</span>
                              <div>
                                <span className="text-sm font-bold text-[var(--cf-ink)] capitalize">
                                  {(form.platform || "instagram").toUpperCase()} Ad Video
                                </span>
                                <p className="text-xs text-[var(--cf-muted)]">
                                  {result.generated_video.num_frames || 0} frames · AI-generated
                                </p>
                              </div>
                            </div>
                            <a
                              href={result.generated_video.url}
                              onClick={(e) => {
                                e.preventDefault();
                                forceDownload(result.generated_video.url, "generated-video.mp4");
                              }}
                              className="cursor-pointer text-xs bg-[var(--cf-rust)] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[var(--cf-rust-deep)] transition-colors"
                            >
                              ⬇ Download MP4
                            </a>
                          </div>
                          <video
                            src={result.generated_video.url}
                            controls
                            autoPlay={false}
                            className="w-full max-h-[480px] object-contain bg-black"
                          />
                          <div className="px-5 py-3 bg-[var(--cf-paper)] border-t border-[var(--cf-line)]">
                            <p className="text-xs text-[var(--cf-muted)] italic">
                              Generated via Gemini Flash · Ideogram frames · moviepy stitched
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* ── Legacy language_videos (old Runway output) ── */
                        !result.language_videos || Object.keys(result.language_videos).length === 0 ? (
                          <div className="bg-[var(--cf-paper)] border border-[var(--cf-line)] rounded-2xl p-8 text-center space-y-3">
                            <span className="text-4xl">🎞️</span>
                            <p className="text-[var(--cf-muted)] text-sm font-medium">No video was generated.</p>
                            <p className="text-xs text-[var(--cf-muted)]">
                              Make sure <code className="bg-[var(--cf-line)] px-1 rounded">GEMINI_API_KEY</code> and <code className="bg-[var(--cf-line)] px-1 rounded">IDEOGRAM_API_KEY</code> are set in your <code>.env</code>.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(result.language_videos).map(([lang, path]: [string, any]) => (
                              <div key={lang} className="bg-[var(--cf-paper)] border border-[var(--cf-line)] rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-[var(--cf-paper-warm)] px-4 py-2 border-b border-[var(--cf-line)] flex justify-between items-center">
                                  <span className="text-sm font-semibold text-[var(--cf-ink)] capitalize">{lang} Overlay</span>
                                  <a
                                    href={`http://localhost:8000/${path}`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      forceDownload(`http://localhost:8000/${path}`, `generated-video-${lang}.mp4`);
                                    }}
                                    className="cursor-pointer text-xs text-[var(--cf-rust)] hover:text-[var(--cf-rust-deep)] font-medium"
                                  >
                                    Download MP4
                                  </a>
                                </div>
                                <video
                                  src={`http://localhost:8000/${path}`}
                                  controls
                                  className="w-full aspect-video object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  )}


                  {/* Scripts Tab */}
                  {activeTab === "scripts" && (
                    <div className="space-y-8 animate-fade-in">
                      {form.platform === "twitter" && result.twitter_scripts ? (
                        <>
                          <div className="bg-[var(--cf-paper)] border border-[var(--cf-line)] rounded-2xl p-6 space-y-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--cf-line)] pb-5">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl text-[var(--cf-ink)]">𝕏</span>
                                <div>
                                  <h3 className="text-lg font-bold text-[var(--cf-ink)]">TWITTER/X SCRIPTS</h3>
                                  <p className="text-xs text-[var(--cf-muted)]">Twitter • 280 chars • Conversation-focused</p>
                                </div>
                              </div>
                            </div>

                            {/* TYPE 1 */}
                            {result.twitter_scripts.type1_line_break && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold text-[var(--cf-rust)] uppercase tracking-wider">Type 1 — Line-Break Post</h4>
                                  <button
                                    onClick={() => copyToClipboard(result.twitter_scripts.type1_line_break.text.replace(/\\n/g, '\n'), "twitter_t1")}
                                    className="text-xs bg-[var(--cf-cream)] hover:bg-[var(--cf-hover)] text-[var(--cf-ink-soft)] px-3 py-1.5 rounded-lg border border-[var(--cf-line)] transition-all duration-300 flex items-center gap-1.5"
                                  >
                                    📋 {copyFeedback === "twitter_t1" ? "Copied!" : "Copy Tweet"}
                                  </button>
                                </div>
                                <div className="bg-[var(--cf-paper-warm)] border border-[var(--cf-line)] rounded-xl p-5">
                                  <p className="text-sm text-[var(--cf-ink-soft)] whitespace-pre-wrap leading-relaxed font-sans">
                                    {result.twitter_scripts.type1_line_break.text.replace(/\\n/g, '\n')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${result.twitter_scripts.type1_line_break.char_count > 280 ? "text-red-700 bg-red-50" :
                                      result.twitter_scripts.type1_line_break.char_count > 240 ? "text-amber-700 bg-amber-50" :
                                        "text-emerald-700 bg-emerald-50"
                                    }`}>
                                    {result.twitter_scripts.type1_line_break.char_count} / 280 chars
                                  </span>
                                </div>

                                {result.image_prompts?.[0] && (
                                  <div className="pt-3 border-t border-[var(--cf-line)] mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold text-[var(--cf-muted)] flex items-center gap-1.5">
                                        📋 Single Image Prompt
                                      </span>
                                      <button
                                        onClick={() => copyToClipboard(result.image_prompts[0], "twitter_img")}
                                        className="text-[10px] bg-[var(--cf-cream)] hover:bg-[var(--cf-hover)] text-[var(--cf-ink-soft)] border border-[var(--cf-line)] px-2 py-0.5 rounded transition-all duration-300"
                                      >
                                        {copyFeedback === "twitter_img" ? "Copied!" : "Copy Prompt"}
                                      </button>
                                    </div>
                                    <div className="bg-[var(--cf-cream)] border border-[var(--cf-line)] rounded-lg p-3">
                                      <pre className="font-mono text-[10px] text-[var(--cf-muted)] whitespace-pre-wrap leading-relaxed">
                                        {safeText(result.image_prompts[0])}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* TYPE 2 */}
                            {result.twitter_scripts.type2_grid && (
                              <div className="space-y-3 pt-6 border-t border-[var(--cf-line)]">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold text-[var(--cf-rust)] uppercase tracking-wider">Type 2 — Grid Post (4 Images)</h4>
                                  <button
                                    onClick={() => copyToClipboard(result.twitter_scripts.type2_grid.text, "twitter_t2")}
                                    className="text-xs bg-[var(--cf-cream)] hover:bg-[var(--cf-hover)] text-[var(--cf-ink-soft)] px-3 py-1.5 rounded-lg border border-[var(--cf-line)] transition-all duration-300 flex items-center gap-1.5"
                                  >
                                    📋 {copyFeedback === "twitter_t2" ? "Copied!" : "Copy Tweet"}
                                  </button>
                                </div>
                                <div className="bg-[var(--cf-paper-warm)] border border-[var(--cf-line)] rounded-xl p-5">
                                  <p className="text-sm text-[var(--cf-ink-soft)] whitespace-pre-wrap leading-relaxed font-sans">
                                    {result.twitter_scripts.type2_grid.text.split(' ').map((word: string, i: number) =>
                                      word.startsWith('#') ? <span key={i} className="text-[var(--cf-rust)]">{word} </span> : word + ' '
                                    )}
                                  </p>
                                </div>

                                {result.twitter_grid_prompts && result.twitter_grid_prompts.length > 0 && (
                                  <div className="pt-3 border-t border-[var(--cf-line)] mt-4">
                                    <div className="text-xs font-semibold text-[var(--cf-muted)] mb-2">📋 Grid Image Prompts</div>
                                    <div className="flex gap-2 mb-3">
                                      {result.twitter_grid_prompts.map((_: any, idx: number) => (
                                        <button
                                          key={idx}
                                          onClick={(e) => {
                                            const tabs = Array.from(document.querySelectorAll('.grid-prompt-content'));
                                            const buttons = Array.from(document.querySelectorAll('.grid-prompt-tab'));
                                            tabs.forEach(t => t.classList.add('hidden'));
                                            buttons.forEach(b => {
                                              b.classList.remove('bg-[var(--cf-rust-bg)]', 'text-[var(--cf-rust-deep)]', 'border-[var(--cf-rust-soft)]');
                                              b.classList.add('bg-[var(--cf-cream)]', 'text-[var(--cf-muted)]', 'border-transparent');
                                            });
                                            tabs[idx].classList.remove('hidden');
                                            e.currentTarget.classList.remove('bg-[var(--cf-cream)]', 'text-[var(--cf-muted)]', 'border-transparent');
                                            e.currentTarget.classList.add('bg-[var(--cf-rust-bg)]', 'text-[var(--cf-rust-deep)]', 'border-[var(--cf-rust-soft)]');
                                          }}
                                          className={`grid-prompt-tab text-[10px] px-3 py-1 rounded-md border ${idx === 0 ? 'bg-[var(--cf-rust-bg)] text-[var(--cf-rust-deep)] border-[var(--cf-rust-soft)]' : 'bg-[var(--cf-cream)] text-[var(--cf-muted)] border-transparent'} transition-all`}
                                        >
                                          Image {idx + 1}
                                        </button>
                                      ))}
                                    </div>
                                    {result.twitter_grid_prompts.map((prompt: string, idx: number) => (
                                      <div key={idx} className={`grid-prompt-content ${idx !== 0 ? 'hidden' : ''}`}>
                                        <div className="flex items-center justify-end mb-2">
                                          <button
                                            onClick={() => copyToClipboard(prompt, `twitter_grid_${idx}`)}
                                            className="text-[10px] bg-[var(--cf-cream)] hover:bg-[var(--cf-hover)] text-[var(--cf-ink-soft)] px-2 py-0.5 rounded border border-[var(--cf-line)] transition-all duration-300"
                                          >
                                            {copyFeedback === `twitter_grid_${idx}` ? "Copied!" : "Copy Prompt"}
                                          </button>
                                        </div>
                                        <div className="bg-[var(--cf-cream)] border border-[var(--cf-line)] rounded-lg p-3">
                                          <pre className="font-mono text-[10px] text-[var(--cf-muted)] whitespace-pre-wrap leading-relaxed">
                                            {safeText(prompt)}
                                          </pre>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* TYPE 3 */}
                            {result.twitter_scripts.type3_thread && (
                              <div className="space-y-3 pt-6 border-t border-[var(--cf-line)]">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold text-[var(--cf-rust)] uppercase tracking-wider">Type 3 — Thread</h4>
                                  <button
                                    onClick={() => {
                                      const text = [
                                        result.twitter_scripts.type3_thread.hook,
                                        ...result.twitter_scripts.type3_thread.tweets.map((t: any) => `${t.number}/ ${t.text}`)
                                      ].join('\n---\n');
                                      copyToClipboard(text, "twitter_t3_all");
                                    }}
                                    className="text-xs bg-[var(--cf-rust-bg)] hover:bg-[var(--cf-rust-glow)] text-[var(--cf-rust-deep)] px-3 py-1.5 rounded-lg border border-[var(--cf-rust-soft)] transition-all duration-300 flex items-center gap-1.5"
                                  >
                                    📋 {copyFeedback === "twitter_t3_all" ? "Copied All!" : "Copy All"}
                                  </button>
                                </div>

                                <div className="bg-[var(--cf-paper-warm)] border border-[var(--cf-line)] rounded-xl p-4 flex flex-col gap-2">
                                  <div className="flex justify-between items-start border-b border-[var(--cf-line)] pb-3 mb-2">
                                    <div className="flex-1">
                                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded uppercase mb-1 inline-block">Hook Tweet</span>
                                      <p className="text-sm text-[var(--cf-ink-soft)]">{result.twitter_scripts.type3_thread.hook}</p>
                                    </div>
                                    <button
                                      onClick={() => copyToClipboard(result.twitter_scripts.type3_thread.hook, "twitter_t3_hook")}
                                      className="text-[10px] text-[var(--cf-muted)] hover:text-[var(--cf-ink)] transition-colors ml-2"
                                    >
                                      [Copy]
                                    </button>
                                  </div>

                                  {result.twitter_scripts.type3_thread.tweets.map((tweet: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-start py-2 border-b border-[var(--cf-line)]/50 last:border-0">
                                      <div className="flex-1">
                                        <p className="text-sm text-[var(--cf-ink-soft)]">
                                          <span className="text-[var(--cf-rust)] font-mono mr-1">{tweet.number}/</span>
                                          {safeText(tweet.text)}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => copyToClipboard(`${tweet.number}/ ${safeText(tweet.text)}`, `twitter_t3_${idx}`)}
                                        className="text-[10px] text-[var(--cf-muted)] hover:text-[var(--cf-ink)] transition-colors ml-2"
                                      >
                                        [Copy]
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Monospace prompt box for Video Generation Prompt */}
                            {result.video_prompt && (
                              <div className="space-y-3 pt-6 border-t border-[var(--cf-line)]">
                                <details className="group">
                                  <summary className="text-xs font-semibold text-[var(--cf-rust)] hover:text-[var(--cf-rust-deep)] cursor-pointer list-none flex items-center justify-between focus:outline-none">
                                    <div className="flex items-center gap-1.5">
                                      <span className="transition-transform group-open:rotate-90">▶</span>
                                      <span>View Video Generation Prompt</span>
                                    </div>
                                  </summary>
                                  <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-xs font-semibold text-[var(--cf-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                        <span>📋</span> Prompt Details
                                      </h4>
                                      <button
                                        onClick={() => copyToClipboard(result.video_prompt, "video_prompt_twitter")}
                                        className="text-xs bg-[var(--cf-cream)] hover:bg-[var(--cf-hover)] text-[var(--cf-ink-soft)] px-3 py-1.5 rounded-lg border border-[var(--cf-line)] transition-all duration-300 flex items-center gap-1.5"
                                      >
                                        📋 {copyFeedback === "video_prompt_twitter" ? "Copied!" : "Copy"}
                                      </button>
                                    </div>
                                    <div className="bg-[var(--cf-cream)] border border-[var(--cf-line)] rounded-xl p-4 overflow-x-auto max-h-80 overflow-y-auto">
                                      <pre className="font-mono text-xs text-[var(--cf-muted)] whitespace-pre leading-relaxed">
                                        {safeText(result.video_prompt)}
                                      </pre>
                                    </div>
                                  </div>
                                </details>
                              </div>
                            )}

                          </div>
                        </>
                      ) : (
                        <>
                          {/* 🎬 VIDEO SCRIPT */}
                          <div className="bg-[var(--cf-paper)] border border-[var(--cf-line)] rounded-2xl p-6 space-y-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--cf-line)] pb-5">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">🎬</span>
                                <div>
                                  <h3 className="text-lg font-bold text-[var(--cf-ink)]">Video Script</h3>
                                  <p className="text-xs text-[var(--cf-muted)]">Cinematic video generation package</p>
                                </div>
                              </div>
                              <div>
                                <span className="inline-flex items-center gap-1.5 bg-[var(--cf-rust-bg)] border border-[var(--cf-rust-soft)] text-[var(--cf-rust-deep)] text-xs font-semibold px-3.5 py-2 rounded-xl">
                                  {form.platform === "instagram" && "Instagram • 15–90s • 9:16 Vertical"}
                                  {form.platform === "youtube" && "YouTube • 3–10 min • 16:9 Landscape"}
                                  {form.platform === "linkedin" && "LinkedIn • 30–60s • 16:9 Landscape"}
                                  {form.platform !== "instagram" && form.platform !== "youtube" && form.platform !== "linkedin" && `${form.platform.toUpperCase()} • Video script`}
                                </span>
                              </div>
                            </div>

                            {/* Hook, Value, CTA columns */}
                            {result.video_script && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-[var(--cf-paper-warm)] border border-[var(--cf-line)] rounded-xl p-4 space-y-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">Hook</span>
                                  <p className="text-sm text-[var(--cf-ink-soft)] leading-relaxed">{result.video_script.hook}</p>
                                </div>
                                <div className="bg-[var(--cf-paper-warm)] border border-[var(--cf-line)] rounded-xl p-4 space-y-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Value</span>
                                  <p className="text-sm text-[var(--cf-ink-soft)] leading-relaxed">{result.video_script.value}</p>
                                </div>
                                <div className="bg-[var(--cf-paper-warm)] border border-[var(--cf-line)] rounded-xl p-4 space-y-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">CTA</span>
                                  <p className="text-sm text-[var(--cf-ink-soft)] leading-relaxed">{result.video_script.cta}</p>
                                </div>
                              </div>
                            )}

                            {/* Full Script Text Block */}
                            {result.video_script?.full_script && (
                              <div className="space-y-2.5">
                                <h4 className="text-xs font-semibold text-[var(--cf-muted)] uppercase tracking-wider">Full Script</h4>
                                <div className="bg-[var(--cf-paper-warm)] border border-[var(--cf-line)] rounded-xl p-4">
                                  <p className="text-sm text-[var(--cf-ink-soft)] whitespace-pre-wrap leading-relaxed font-sans">
                                    {result.video_script.full_script}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Monospace prompt box for Video Generation Prompt */}
                            {result.video_prompt && (
                              <div className="space-y-3 pt-2 border-t border-[var(--cf-line)]">
                                <details className="group">
                                  <summary className="text-xs font-semibold text-[var(--cf-rust)] hover:text-[var(--cf-rust-deep)] cursor-pointer list-none flex items-center justify-between focus:outline-none">
                                    <div className="flex items-center gap-1.5">
                                      <span className="transition-transform group-open:rotate-90">▶</span>
                                      <span>View Video Generation Prompt</span>
                                    </div>
                                  </summary>
                                  <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-xs font-semibold text-[var(--cf-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                        <span>📋</span> Prompt Details
                                      </h4>
                                      <button
                                        onClick={() => copyToClipboard(result.video_prompt, "video_prompt")}
                                        className="text-xs bg-[var(--cf-cream)] hover:bg-[var(--cf-hover)] text-[var(--cf-ink-soft)] px-3 py-1.5 rounded-lg border border-[var(--cf-line)] transition-all duration-300 flex items-center gap-1.5"
                                      >
                                        📋 {copyFeedback === "video_prompt" ? "Copied!" : "Copy"}
                                      </button>
                                    </div>
                                    <div className="bg-[var(--cf-cream)] border border-[var(--cf-line)] rounded-xl p-4 overflow-x-auto max-h-80 overflow-y-auto">
                                      <pre className="font-mono text-xs text-[var(--cf-muted)] whitespace-pre leading-relaxed">
                                        {safeText(result.video_prompt)}
                                      </pre>
                                    </div>
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>

                          {/* 🖼️ POST SCRIPT */}
                          <div className="bg-[var(--cf-paper)] border border-[var(--cf-line)] rounded-2xl p-6 space-y-6 shadow-sm">
                            <div className="flex items-center gap-3 border-b border-[var(--cf-line)] pb-5">
                              <span className="text-2xl">🖼️</span>
                              <div>
                                <h3 className="text-lg font-bold text-[var(--cf-ink)]">Post Script</h3>
                                <p className="text-xs text-[var(--cf-muted)]">Social media poster advertisement copy</p>
                              </div>
                            </div>

                            {/* IF single_post */}
                            {form.post_type === "single_post" && (
                              <div className="space-y-6">
                                {result.post_scripts?.[0] && (
                                  <div className="grid grid-cols-1 gap-4 bg-[var(--cf-paper-warm)] border border-[var(--cf-line)] rounded-xl p-5 space-y-3">
                                    <div>
                                      <span className="text-[10px] font-bold text-[var(--cf-muted)] uppercase tracking-wider">Headline</span>
                                      <h4 className="text-base font-bold text-[var(--cf-ink)] mt-1">{result.post_scripts[0].headline}</h4>
                                    </div>
                                    <div className="border-t border-[var(--cf-line)] pt-3">
                                      <span className="text-[10px] font-bold text-[var(--cf-muted)] uppercase tracking-wider">Body Copy</span>
                                      <p className="text-sm text-[var(--cf-ink-soft)] mt-1 leading-relaxed">{result.post_scripts[0].body}</p>
                                    </div>
                                    <div className="border-t border-[var(--cf-line)] pt-3">
                                      <span className="text-[10px] font-bold text-[var(--cf-muted)] uppercase tracking-wider">Call to Action</span>
                                      <p className="text-sm text-[var(--cf-rust)] font-semibold mt-1">{result.post_scripts[0].cta}</p>
                                    </div>
                                    {result.post_scripts[0].image_prompt && (
                                      <div className="border-t border-[var(--cf-line)] pt-3">
                                        <span className="text-[10px] font-bold text-[var(--cf-muted)] uppercase tracking-wider">Prompt Note</span>
                                        <p className="text-sm text-[var(--cf-muted)] italic mt-1 leading-relaxed">{result.post_scripts[0].image_prompt}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {result.image_prompts?.[0] && (
                                  <div className="space-y-3 pt-4 border-t border-[var(--cf-line)]">
                                    <details className="group">
                                      <summary className="text-xs font-semibold text-[var(--cf-rust)] hover:text-[var(--cf-rust-deep)] cursor-pointer list-none flex items-center justify-between focus:outline-none">
                                        <div className="flex items-center gap-1.5">
                                          <span className="transition-transform group-open:rotate-90">▶</span>
                                          <span>View Image Generation Prompt</span>
                                        </div>
                                      </summary>
                                      <div className="mt-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                          <h4 className="text-xs font-semibold text-[var(--cf-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                            <span>📋</span> Prompt Details
                                          </h4>
                                          <button
                                            onClick={() => copyToClipboard(result.image_prompts[0], "image_prompt")}
                                            className="text-xs bg-[var(--cf-cream)] hover:bg-[var(--cf-hover)] text-[var(--cf-ink-soft)] px-3 py-1.5 rounded-lg border border-[var(--cf-line)] transition-all duration-300 flex items-center gap-1.5"
                                          >
                                            📋 {copyFeedback === "image_prompt" ? "Copied!" : "Copy"}
                                          </button>
                                        </div>
                                        <div className="bg-[var(--cf-cream)] border border-[var(--cf-line)] rounded-xl p-4 overflow-x-auto max-h-80 overflow-y-auto">
                                          <pre className="font-mono text-xs text-[var(--cf-muted)] whitespace-pre leading-relaxed">
                                            {safeText(result.image_prompts[0])}
                                          </pre>
                                        </div>
                                      </div>
                                    </details>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* IF carousel */}
                            {form.post_type === "carousel" && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  {result.post_scripts?.map((slide: any, index: number) => (
                                    <div
                                      key={index}
                                      className="bg-[var(--cf-paper-warm)] border border-[var(--cf-line)] rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-[var(--cf-rust-soft)] transition-all duration-300 shadow-sm"
                                    >
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-bold text-[var(--cf-muted)] font-mono">Slide {slide.slide_number}</span>
                                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${slide.role === "hook" ? "text-teal-700 bg-teal-50" :
                                              slide.role === "value" ? "text-emerald-700 bg-emerald-50" :
                                                "text-purple-700 bg-purple-50"
                                            }`}>
                                            {slide.role}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] font-bold text-[var(--cf-muted)] uppercase tracking-wider">Headline</span>
                                          <h4 className="text-sm font-bold text-[var(--cf-ink)] mt-1">{safeText(slide.headline)}</h4>
                                        </div>
                                        <div className="border-t border-[var(--cf-line)] pt-2.5">
                                          <span className="text-[10px] font-bold text-[var(--cf-muted)] uppercase tracking-wider">Body</span>
                                          <p className="text-xs text-[var(--cf-ink-soft)] mt-1 leading-relaxed">{safeText(slide.body)}</p>
                                        </div>
                                        {slide.cta && (
                                          <div className="border-t border-[var(--cf-line)] pt-2.5">
                                            <span className="text-[10px] font-bold text-[var(--cf-muted)] uppercase tracking-wider">CTA</span>
                                            <p className="text-xs text-[var(--cf-rust)] font-semibold mt-1">{safeText(slide.cta)}</p>
                                          </div>
                                        )}
                                      </div>

                                      {result.carousel_image_prompts?.[index] && (
                                        <div className="space-y-2 pt-2 border-t border-[var(--cf-line)]">
                                          <details className="group">
                                            <summary className="text-[10px] font-semibold text-[var(--cf-rust)] hover:text-[var(--cf-rust-deep)] cursor-pointer list-none flex items-center justify-between focus:outline-none">
                                              <div className="flex items-center gap-1">
                                                <span className="transition-transform group-open:rotate-90">▶</span>
                                                <span>View Generation Prompt</span>
                                              </div>
                                            </summary>
                                            <div className="mt-3 space-y-2">
                                              <div className="flex items-center justify-end">
                                                <button
                                                  onClick={() => copyToClipboard(result.carousel_image_prompts[index], `carousel_prompt_${index}`)}
                                                  className="text-[10px] bg-[var(--cf-cream)] hover:bg-[var(--cf-hover)] text-[var(--cf-ink-soft)] px-2 py-0.5 rounded border border-[var(--cf-line)] transition-all duration-300"
                                                >
                                                  {copyFeedback === `carousel_prompt_${index}` ? "Copied" : "Copy"}
                                                </button>
                                              </div>
                                              <div className="bg-[var(--cf-cream)] border border-[var(--cf-line)] rounded-lg p-2 max-h-32 overflow-y-auto">
                                                <pre className="font-mono text-[10px] text-[var(--cf-muted)] whitespace-pre-wrap leading-relaxed">
                                                  {result.carousel_image_prompts[index]}
                                                </pre>
                                              </div>
                                            </div>
                                          </details>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 🎓 TUTORIAL SCRIPT (only if YouTube + App/Website) */}
                          {form.platform === "youtube" && result.tutorial_script && Object.keys(result.tutorial_script).length > 0 && (
                            <div className="bg-[var(--cf-paper)] border border-[var(--cf-line)] rounded-2xl p-6 space-y-6 shadow-sm">
                              <div className="flex items-center gap-3 border-b border-[var(--cf-line)] pb-5">
                                <span className="text-2xl">🎓</span>
                                <div>
                                  <h3 className="text-lg font-bold text-[var(--cf-ink)]">Tutorial Script</h3>
                                  <p className="text-xs text-[var(--cf-muted)]">Step-by-step YouTube tutorial walkthrough</p>
                                </div>
                              </div>

                              <div className="bg-[var(--cf-paper-warm)] border border-[var(--cf-line)] rounded-xl p-5 space-y-4">
                                <div>
                                  <span className="text-[10px] font-bold text-[var(--cf-muted)] uppercase tracking-wider">Video Title</span>
                                  <h4 className="text-base font-bold text-[var(--cf-ink)] mt-1">{result.tutorial_script.title}</h4>
                                </div>

                                {result.tutorial_script.hook && (
                                  <div className="border-t border-[var(--cf-line)] pt-3">
                                    <span className="text-[10px] font-bold text-[var(--cf-muted)] uppercase tracking-wider">Hook Segment</span>
                                    <p className="text-sm text-[var(--cf-ink-soft)] mt-1 leading-relaxed font-sans">{result.tutorial_script.hook}</p>
                                  </div>
                                )}

                                {result.tutorial_script.sections && result.tutorial_script.sections.length > 0 && (
                                  <div className="border-t border-[var(--cf-line)] pt-4 space-y-3">
                                    <span className="text-[10px] font-bold text-[var(--cf-muted)] uppercase tracking-wider block">Tutorial Timeline</span>
                                    <div className="space-y-3">
                                      {result.tutorial_script.sections.map((sec: any, sIdx: number) => (
                                        <div key={sIdx} className="bg-[var(--cf-cream)] border border-[var(--cf-line)] rounded-lg p-3.5 space-y-1.5">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-[var(--cf-rust-deep)] bg-[var(--cf-rust-bg)] px-2 py-0.5 rounded">
                                              ⏱️ {sec.timestamp}
                                            </span>
                                            <span className="text-xs font-semibold text-[var(--cf-ink)]">{sec.title}</span>
                                          </div>
                                          <p className="text-xs text-[var(--cf-ink-soft)] leading-relaxed font-sans">{sec.script}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {result.tutorial_script.full_script && (
                                  <div className="border-t border-[var(--cf-line)] pt-4">
                                    <details className="group space-y-2">
                                      <summary className="text-xs font-semibold text-[var(--cf-rust)] hover:text-[var(--cf-rust-deep)] cursor-pointer list-none flex items-center gap-1.5 focus:outline-none">
                                        <span className="transition-transform group-open:rotate-90">▶</span>
                                        <span>View Full Tutorial Script</span>
                                      </summary>
                                      <div className="bg-[var(--cf-cream)] border border-[var(--cf-line)] rounded-xl p-4 mt-2">
                                        <p className="text-sm text-[var(--cf-ink-soft)] whitespace-pre-wrap leading-relaxed font-sans">
                                          {result.tutorial_script.full_script}
                                        </p>
                                      </div>
                                    </details>
                                  </div>
                                                     )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                  {/* Ideas Tab */}
                  {activeTab === "ideas" && (
                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-semibold text-[var(--cf-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span>🎬</span> Reel Ideas
                        </p>
                        <ul className="space-y-2">
                          {result.reel_ideas?.map(
                            (idea: string, i: number) => (
                              <li
                                key={i}
                                className="flex gap-3 text-sm bg-[var(--cf-paper)] p-3 rounded-xl border border-[var(--cf-line)] hover:border-[var(--cf-rust-soft)] transition-all shadow-sm"
                              >
                                <span className="text-[var(--cf-rust)] font-semibold min-w-[24px]">
                                  {i + 1}.
                                </span>
                                <span className="text-[var(--cf-ink-soft)]">{safeText(idea)}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--cf-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span>📱</span> Carousel Ideas
                        </p>
                        <ul className="space-y-2">
                          {result.carousel_ideas?.map(
                            (idea: string, i: number) => (
                              <li
                                key={i}
                                className="flex gap-3 text-sm bg-[var(--cf-paper)] p-3 rounded-xl border border-[var(--cf-line)] hover:border-[var(--cf-rust-soft)] transition-all shadow-sm"
                              >
                                <span className="text-[var(--cf-gold)] font-semibold min-w-[24px]">
                                  {i + 1}.
                                </span>
                                <span className="text-[var(--cf-ink-soft)]">{safeText(idea)}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--cf-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span>📝</span> Post Ideas
                        </p>
                        <ul className="space-y-2">
                          {result.post_ideas?.map(
                            (idea: string, i: number) => (
                              <li
                                key={i}
                                className="flex gap-3 text-sm bg-[var(--cf-paper)] p-3 rounded-xl border border-[var(--cf-line)] hover:border-[var(--cf-rust-soft)] transition-all shadow-sm"
                              >
                                <span className="text-[var(--cf-rust-soft)] font-semibold min-w-[24px]">
                                  {i + 1}.
                                </span>
                                <span className="text-[var(--cf-ink-soft)]">{safeText(idea)}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Captions Tab */}
                  {activeTab === "captions" && (
                    <div className="space-y-4">
                      {Object.entries(result.captions || {}).map(
                        ([tone, text]: [string, any]) => (
                          <div
                            key={tone}
                            className="bg-[var(--cf-paper)] border border-[var(--cf-line)] rounded-xl p-5 hover:border-[var(--cf-rust-soft)] transition-all duration-300 shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="inline-flex items-center gap-1.5 bg-[var(--cf-cream)] text-[var(--cf-ink-soft)] text-xs font-semibold px-3 py-1.5 rounded-lg capitalize border border-[var(--cf-line)]">
                                {(() => {
                                  const Icon = TONE_ICONS[tone];
                                  return Icon ? <Icon size={14} /> : "✍️";
                                })()} {tone}
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(text, `${tone} caption`)
                                }
                                className="text-xs text-[var(--cf-muted)] hover:text-[var(--cf-rust)] transition-colors flex items-center gap-1"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                                Copy
                              </button>
                            </div>
                            <p className="text-sm text-[var(--cf-ink-soft)] leading-relaxed whitespace-pre-line">
                              {safeText(text)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Hashtags Tab */}
                  {activeTab === "hashtags" && (
                    <div className="space-y-6">
                      <div className="bg-[var(--cf-rust-bg)] border border-[var(--cf-rust-soft)] rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-[var(--cf-rust-deep)] uppercase tracking-wider">
                            📋 Copy-Paste Ready Mix
                          </p>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                result.hashtags?.recommended_mix || "",
                                "Hashtags"
                              )
                            }
                            className="text-xs text-[var(--cf-rust)] hover:text-[var(--cf-rust-deep)] transition-colors flex items-center gap-1 font-medium"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            Copy All
                          </button>
                        </div>
                        <p className="text-sm text-[var(--cf-rust-deep)] font-medium leading-relaxed font-mono">
                          {result.hashtags?.recommended_mix}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(["broad", "medium", "niche"] as const).map((type) => (
                          <div
                            key={type}
                            className="bg-[var(--cf-paper)] border border-[var(--cf-line)] rounded-xl p-4 shadow-sm"
                          >
                            <p className="text-xs font-semibold text-[var(--cf-muted)] uppercase tracking-wider mb-3 capitalize">
                              {type === "broad"
                                ? "🌍"
                                : type === "medium"
                                  ? "🎯"
                                  : "🔬"}{" "}
                              {type}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {result.hashtags?.[type]?.map(
                                (h: string, i: number) => (
                                  <span
                                    key={i}
                                    className="bg-[var(--cf-rust-bg)] text-[var(--cf-rust-deep)] text-xs px-2.5 py-1 rounded-full border border-[var(--cf-rust-soft)] hover:bg-[var(--cf-hover)] transition-colors cursor-pointer"
                                    onClick={() =>
                                      copyToClipboard(h, "Hashtag")
                                    }
                                  >
                                    {h}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Calendar Tab */}
                  {activeTab === "calendar" && (
                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-semibold text-[var(--cf-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
                          <span>📅</span> 7-Day Plan
                        </p>
                        <div className="space-y-2">
                          {result.calendar_7day?.map(
                            (day: any, i: number) => (
                              <div
                                key={i}
                                className="flex items-center gap-4 p-3.5 bg-[var(--cf-paper)] border border-[var(--cf-line)] rounded-xl hover:border-[var(--cf-rust-soft)] transition-all duration-300 group shadow-sm"
                              >
                                <span className="font-semibold text-sm w-24 text-[var(--cf-ink-soft)] group-hover:text-[var(--cf-ink)] transition-colors">
                                  {getCalendarDayLabel(day)}
                                </span>
                                <span className="text-xs bg-[var(--cf-rust-bg)] text-[var(--cf-rust-deep)] px-3 py-1.5 rounded-lg font-medium w-24 text-center border border-[var(--cf-rust-soft)]">
                                  {getCalendarContentType(day)}
                                </span>
                                <span className="text-sm text-[var(--cf-muted)] flex-1 group-hover:text-[var(--cf-ink-soft)] transition-colors">
                                  {getCalendarContentIdea(day)}
                                </span>
                                <span className="text-xs text-[var(--cf-muted)] font-mono">
                                  {getCalendarPostingTime(day)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {result.calendar_30day &&
                        result.calendar_30day.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-[var(--cf-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
                              <span>📆</span> 30-Day Strategy
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {result.calendar_30day?.map(
                                (week: any, i: number) => (
                                  <div
                                    key={i}
                                    className="bg-[var(--cf-paper)] border border-[var(--cf-line)] rounded-xl p-4 hover:border-[var(--cf-rust-soft)] transition-all duration-300 shadow-sm"
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs bg-[var(--cf-rust-bg)] text-[var(--cf-rust-deep)] px-2 py-1 rounded-lg font-semibold border border-[var(--cf-rust-soft)]">
                                        Week {week.week}
                                      </span>
                                      <span className="text-sm font-semibold text-[var(--cf-ink)]">
                                        {safeText(week.theme)}
                                      </span>
                                    </div>
                                    <p className="text-xs text-[var(--cf-muted)] mb-2">
                                      🎯 {week.goal}
                                    </p>
                                    <ul className="space-y-1">
                                      {getCalendarWeekContentPlan(week).map(
                                        (item: string, j: number) => (
                                          <li
                                            key={j}
                                            className="text-xs text-[var(--cf-ink-soft)]"
                                          >
                                            • {item}
                                          </li>
                                        )
                                      )}

                                      {/* Monospace prompt box for Video Generation Prompt */}
                                      {result.video_prompt && (
                                        <div className="space-y-3 pt-6 border-t border-[var(--cf-line)]">
                                          <details className="group">
                                            <summary className="text-xs font-semibold text-[var(--cf-rust)] hover:text-[var(--cf-rust-deep)] cursor-pointer list-none flex items-center justify-between focus:outline-none">
                                              <div className="flex items-center gap-1.5">
                                                <span className="transition-transform group-open:rotate-90">▶</span>
                                                <span>View Video Generation Prompt</span>
                                              </div>
                                            </summary>
                                            <div className="mt-4 space-y-3">
                                              <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-semibold text-[var(--cf-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                                  <span>📋</span> Prompt Details
                                                </h4>
                                                <button
                                                  onClick={() => copyToClipboard(result.video_prompt, "video_prompt_tutorial")}
                                                  className="text-xs bg-[var(--cf-cream)] hover:bg-[var(--cf-hover)] text-[var(--cf-ink-soft)] px-3 py-1.5 rounded-lg border border-[var(--cf-line)] transition-all duration-300 flex items-center gap-1.5"
                                                >
                                                  📋 {copyFeedback === "video_prompt_tutorial" ? "Copied!" : "Copy"}
                                                </button>
                                              </div>
                                              <div className="bg-[var(--cf-cream)] border border-[var(--cf-line)] rounded-xl p-4 overflow-x-auto max-h-80 overflow-y-auto">
                                                <pre className="font-mono text-xs text-[var(--cf-muted)] whitespace-pre leading-relaxed">
                                                  {safeText(result.video_prompt)}
                                                </pre>
                                              </div>
                                            </div>
                                          </details>
                                        </div>
                                      )}
                                    </ul>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                </div>
              </div>

              {/* Floating Paperplane Publish Button */}
              <div className="fixed bottom-10 right-10 z-50 animate-float-up" style={{ animationDelay: "800ms" }}>
                <button
                  onClick={() => setShowPublishPanel(true)}
                  className="group flex flex-col items-center hover:scale-105 transition-transform duration-300"
                  style={{ filter: "drop-shadow(0 20px 40px rgba(184, 72, 43, 0.2))" }}
                  title="Review & Publish"
                >
                  <img
                    src="/paperplane-loading.svg"
                    alt="Publish"
                    className="w-40 h-40 sm:w-48 sm:h-48 object-contain group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-400"
                  />
                  <span
                    className="font-serif italic"
                    style={{
                      marginTop: -38,
                      background: "linear-gradient(135deg, var(--cf-rust-deep), var(--cf-rust))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      fontSize: 20,
                      fontWeight: 600,
                      letterSpacing: "-0.01em"
                    }}
                  >
                    Review & Publish
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
