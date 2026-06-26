"use client";
import { useState } from "react";
import { publishContent } from "@/lib/api";
import { Sparkles, Check, CheckCircle2, ArrowLeft, Image as ImageIcon, Film } from "lucide-react";

const PLATFORM_CONFIG: Record<string, { icon: string; label: string; available: boolean }> = {
  twitter: { icon: "𝕏", label: "Twitter / X", available: true },
  instagram: { icon: "📸", label: "Instagram", available: false },
  youtube: { icon: "▶️", label: "YouTube", available: false },
  linkedin: { icon: "💼", label: "LinkedIn", available: false },
};

interface PublishPanelProps {
  result: any;
  platform: string;
  onBack?: () => void;
}

export default function PublishPanel({ result, platform, onBack }: PublishPanelProps) {
  // Extract script text based on platform
  const getDefaultText = () => {
    if (platform === "twitter") {
      const t1 = result?.twitter_scripts?.type1_line_break;
      if (t1?.text) return t1.text.replace(/\\n/g, "\n");
    }
    const scripts = result?.post_scripts;
    if (scripts?.[0]?.body) return scripts[0].body;
    const captions = result?.captions;
    if (captions?.[0]) return captions[0];
    return "";
  };

  // Extract hashtags
  const getDefaultHashtags = () => {
    const h = result?.hashtags;
    if (!h) return "";
    if (h.recommended_mix) {
      const valid = h.recommended_mix.split(" ").filter((w: string) => w.startsWith("#"));
      return valid.slice(0, 4).join(" ");
    }
    const all = [...(h.broad || []), ...(h.medium || [])].slice(0, 4);
    return all.join(" ");
  };

  // Get generated poster URLs
  const generatedPosters: string[] = (result?.rendered_post_urls || []).filter((u: string) => u);

  const [text, setText] = useState(getDefaultText());
  const [hashtags, setHashtags] = useState(getDefaultHashtags());
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [selectedPoster, setSelectedPoster] = useState<string | null>(generatedPosters[0] || null);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customVideoFile, setCustomVideoFile] = useState<File | null>(null);
  const [mediaMode, setMediaMode] = useState<"generated" | "upload">(generatedPosters.length > 0 ? "generated" : "upload");
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ status: string; url?: string; error?: string } | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState(platform);

  const charCount = text.length + (includeHashtags && hashtags ? hashtags.length + 2 : 0);
  const isTwitter = selectedPlatform === "twitter";
  const charLimit = isTwitter ? 280 : 2200;
  const isOverLimit = charCount > charLimit;

  async function handlePublish() {
    const config = PLATFORM_CONFIG[selectedPlatform];
    if (!config?.available) return;

    setPublishing(true);
    setPublishResult(null);
    try {
      const fd = new FormData();
      fd.append("platform", selectedPlatform);
      fd.append("text", text);
      if (includeHashtags && hashtags) fd.append("hashtags", hashtags);

      if (mediaMode === "generated" && selectedPoster) {
        fd.append("posterUrl", selectedPoster);
      } else if (mediaMode === "upload") {
        if (customFile) fd.append("posterFile", customFile);
        if (customVideoFile) fd.append("videoFile", customVideoFile);
      }

      const res = await publishContent(fd);
      setPublishResult(res);
    } catch (err: any) {
      setPublishResult({
        status: "failed",
        error: err?.response?.data?.detail || err?.message || "Publishing failed",
      });
    } finally {
      setPublishing(false);
    }
  }

  // Publishing loading state — paperplane animation
  if (publishing) {
    return (
      <div className="preview-canvas animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative" }}>
          <img
            src="/paperplane-loading.svg"
            alt="Publishing..."
            style={{ width: 160, height: 160, position: "relative", zIndex: 10 }}
          />
        </div>
        <p className="font-serif" style={{ fontSize: 24, marginTop: 24, letterSpacing: "-0.01em", color: "var(--cf-ink)" }}>
          Publishing to {PLATFORM_CONFIG[selectedPlatform]?.label}...
        </p>
        <p style={{ color: "var(--cf-muted)", fontSize: 14, marginTop: 8 }}>
          Your content is taking flight ✨
        </p>
        <div style={{ marginTop: 24, width: 192, height: 4, borderRadius: 999, background: "var(--cf-line)", overflow: "hidden" }}>
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
    );
  }

  // Success / Error result
  if (publishResult) {
    const isSuccess = publishResult.status === "success";
    const isComingSoon = publishResult.status === "coming_soon";
    return (
      <div className="preview-canvas animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: 150, height: 150, borderRadius: 32, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24,
            background: isSuccess ? "#F0FDF4" : isComingSoon ? "#FFFBEB" : "#FEF2F2",
            border: `1px solid ${isSuccess ? "#BBF7D0" : isComingSoon ? "#FEF08A" : "#FECACA"}`,
            overflow: "hidden"
          }}
        >
          {isSuccess ? (
            <img src="/checkmark.svg" alt="Success" style={{ width: 380, height: 380, objectFit: "contain", flexShrink: 0 }} />
          ) : (
            <span style={{ fontSize: 72 }}>{isComingSoon ? "🚧" : "❌"}</span>
          )}
        </div>
        <h3 className="font-serif" style={{ fontSize: 28, color: "var(--cf-ink)", marginBottom: 8 }}>
          {isSuccess ? "Published Successfully!" : isComingSoon ? "Coming Soon!" : "Publishing Failed"}
        </h3>
        <p style={{ color: "var(--cf-muted)", fontSize: 14, textAlign: "center", maxWidth: 380, marginBottom: 24 }}>
          {isSuccess
            ? "Your content is live and ready to engage your audience."
            : isComingSoon
            ? publishResult.error
            : publishResult.error || "Something went wrong. Please try again."}
        </p>
        {isSuccess && publishResult.url && (
          <a
            href={publishResult.url}
            target="_blank"
            rel="noopener noreferrer"
            className="cf-btn-primary"
          >
            View Live Post
          </a>
        )}
        <button
          onClick={() => setPublishResult(null)}
          className="cf-btn-ghost"
          style={{ marginTop: 16 }}
        >
          <ArrowLeft size={14} /> Back to Review
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ position: "relative" }}>
      {/* ── Header Actions ── */}
      {onBack && (
        <button
          onClick={onBack}
          className="cf-btn-ghost"
          style={{ marginBottom: 16 }}
        >
          <ArrowLeft size={14} /> Back to Results
        </button>
      )}

      {/* ── Platform Animation ── */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        {Object.entries(PLATFORM_CONFIG)
          .filter(([key]) => key === platform)
          .map(([key]) => (
            <div
              key={key}
              style={{
                width: "100%",
                height: "180px",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "var(--cf-shadow-md)",
                background: "#FFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <video
                src={`/${key}.mp4`}
                autoPlay
                loop
                muted
                playsInline
                style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
              />
            </div>
          ))}
      </div>

      {/* ── Preview Card ── */}
      <div className="surface-elevated" style={{ padding: 32, marginBottom: 24 }}>
        {/* Card Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px dashed var(--cf-line)", paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>{PLATFORM_CONFIG[selectedPlatform]?.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--cf-ink)" }}>
              Post Preview
            </span>
          </div>
          <span
            style={{
              fontSize: 12, fontWeight: 600, fontFamily: "JetBrains Mono",
              color: isOverLimit ? "#DC2626" : charCount > charLimit * 0.85 ? "#D97706" : "var(--cf-muted)",
              background: isOverLimit ? "#FEE2E2" : charCount > charLimit * 0.85 ? "#FEF3C7" : "transparent",
              padding: "2px 8px", borderRadius: 6
            }}
          >
            {charCount} / {charLimit}
          </span>
        </div>

        {/* Media Section */}
        <div style={{ display: "grid", gap: 24 }}>
          {/* Media Mode Toggle */}
          <div>
            <label className="cf-label">Media Attachment</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button
                onClick={() => setMediaMode("generated")}
                className={`cf-pill ${mediaMode === "generated" ? "cf-pill-active" : ""}`}
              >
                <ImageIcon size={14} /> From Visuals
              </button>
              <button
                onClick={() => setMediaMode("upload")}
                className={`cf-pill ${mediaMode === "upload" ? "cf-pill-active" : ""}`}
              >
                📤 Upload File
              </button>
            </div>

            {mediaMode === "generated" ? (
              generatedPosters.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {generatedPosters.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPoster(url)}
                      style={{
                        position: "relative", borderRadius: 12, overflow: "hidden",
                        border: selectedPoster === url ? "2px solid var(--cf-rust)" : "1px solid var(--cf-line)",
                        transition: "all 200ms ease", transform: selectedPoster === url ? "scale(1.02)" : "scale(1)"
                      }}
                    >
                      <img src={url} alt={`Poster ${i + 1}`} style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
                      {selectedPoster === url && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(184, 72, 43, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 32, height: 32, background: "var(--cf-rust)", color: "white", borderRadius: "50%", display: "grid", placeItems: "center" }}>
                            <Check size={18} strokeWidth={3} />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--cf-muted)", fontSize: 13, fontStyle: "italic" }}>No generated visuals available. Switch to Upload.</p>
              )
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--cf-muted)", marginBottom: 6 }}>Image</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="cf-input"
                    onChange={(e) => setCustomFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--cf-muted)", marginBottom: 6 }}>Video</label>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    className="cf-input"
                    onChange={(e) => setCustomVideoFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Selected Image Preview */}
          {mediaMode === "generated" && selectedPoster && (
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--cf-line)" }}>
              <img src={selectedPoster} alt="Selected poster" style={{ width: "100%", maxHeight: 300, objectFit: "cover", display: "block" }} />
            </div>
          )}

          {/* Editable Text */}
          <div>
            <label className="cf-label">Post Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="cf-input"
              placeholder="Write your post content..."
            />
          </div>

          {/* Hashtags */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label className="cf-label" style={{ marginBottom: 0 }}>Hashtags</label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={includeHashtags}
                  onChange={(e) => setIncludeHashtags(e.target.checked)}
                  style={{ accentColor: "var(--cf-rust)" }}
                />
                <span style={{ fontSize: 12, color: "var(--cf-muted)" }}>Include</span>
              </label>
            </div>
            <input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="cf-input"
              style={{ opacity: !includeHashtags ? 0.5 : 1 }}
              disabled={!includeHashtags}
              placeholder="#hashtag1 #hashtag2"
            />
          </div>
        </div>
      </div>

      {/* ── Publish Button ── */}
      <button
        onClick={handlePublish}
        disabled={isOverLimit || !text.trim()}
        className="cf-btn-primary"
        style={{ width: "100%", padding: "16px", fontSize: 15 }}
      >
        {PLATFORM_CONFIG[selectedPlatform]?.available ? (
          <>
            <Sparkles size={16} /> Publish to {PLATFORM_CONFIG[selectedPlatform]?.label}
          </>
        ) : (
          <>
            🚧 {PLATFORM_CONFIG[selectedPlatform]?.label} — Coming Soon
          </>
        )}
      </button>
    </div>
  );
}
