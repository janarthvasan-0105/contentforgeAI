"import {
  FileText,
  Smartphone,
  Globe,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Sparkles,
  GraduationCap,
  Smile,
  Briefcase,
  BookOpen,
  Flame,
  Wand2,
} from \"lucide-react\";

const PURPOSES = [
  { id: \"general\", label: \"General Content\", Icon: FileText },
  { id: \"app\", label: \"App Marketing\", Icon: Smartphone },
  { id: \"website\", label: \"Website Marketing\", Icon: Globe },
];

const PLATFORMS = [
  { id: \"instagram\", label: \"Instagram\", Icon: Instagram },
  { id: \"youtube\", label: \"YouTube\", Icon: Youtube },
  { id: \"linkedin\", label: \"LinkedIn\", Icon: Linkedin },
  { id: \"twitter\", label: \"Twitter\", Icon: Twitter },
];

const TONES = [
  { id: \"educational\", label: \"Educational\", Icon: GraduationCap },
  { id: \"funny\", label: \"Witty\", Icon: Smile },
  { id: \"professional\", label: \"Professional\", Icon: Briefcase },
  { id: \"storytelling\", label: \"Storytelling\", Icon: BookOpen },
  { id: \"motivational\", label: \"Motivational\", Icon: Flame },
];

const BRAND_COLORS = [
  \"#B8482B\",
  \"#1C1917\",
  \"#0F766E\",
  \"#1D4ED8\",
  \"#7C3AED\",
  \"#B45309\",
];

export default function ContentBriefForm({ form, setForm, onSubmit, loading }) {
  const update = (patch) => setForm({ ...form, ...patch });

  return (
    <form className=\"brief-panel animate-float-up\" onSubmit={onSubmit} data-testid=\"content-brief-form\" style={{ animationDelay: \"150ms\" }}>
      {/* Eyebrow header */}
      <div style={{ display: \"flex\", alignItems: \"center\", gap: 10, marginBottom: 6 }}>
        <Wand2 size={14} color=\"var(--cf-rust)\" strokeWidth={2} />
        <span className=\"eyebrow\">Content brief</span>
      </div>
      <h2 className=\"font-serif\" style={{ fontSize: 32, margin: \"0 0 4px\", letterSpacing: \"-0.02em\", fontWeight: 400 }}>
        Tell us your <span style={{ fontStyle: \"italic\", color: \"var(--cf-rust)\" }}>story</span>.
      </h2>
      <p style={{ color: \"var(--cf-muted)\", fontSize: 14, margin: \"0 0 28px\", lineHeight: 1.5 }}>
        We'll shape it into a complete content package.
      </p>

      {/* Purpose */}
      <div className=\"brief-section\">
        <label className=\"cf-label\">01 — Purpose</label>
        <div style={{ display: \"grid\", gridTemplateColumns: \"1fr 1fr 1fr\", gap: 8 }}>
          {PURPOSES.map(({ id, label, Icon }) => (
            <button
              type=\"button\"
              key={id}
              data-testid={`purpose-${id}`}
              onClick={() => update({ purpose: id })}
              className={`cf-pill ${form.purpose === id ? \"cf-pill-active\" : \"\"}`}
              style={{ flexDirection: \"column\", gap: 6, padding: \"14px 6px\" }}
            >
              <Icon size={16} strokeWidth={1.75} />
              <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Platform */}
      <div className=\"brief-section\">
        <label className=\"cf-label\">02 — Platform</label>
        <div style={{ display: \"grid\", gridTemplateColumns: \"repeat(4, 1fr)\", gap: 8 }}>
          {PLATFORMS.map(({ id, label, Icon }) => (
            <button
              type=\"button\"
              key={id}
              data-testid={`platform-${id}`}
              onClick={() => update({ platform: id })}
              className={`cf-pill ${form.platform === id ? \"cf-pill-active\" : \"\"}`}
              style={{ flexDirection: \"column\", gap: 6, padding: \"12px 4px\" }}
            >
              <Icon size={16} strokeWidth={1.75} />
              <span style={{ fontSize: 10.5, fontWeight: 500 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Topic */}
      <div className=\"brief-section\">
        <label className=\"cf-label\">03 — Topic</label>
        <input
          type=\"text\"
          className=\"cf-input\"
          data-testid=\"topic-input\"
          value={form.topic}
          onChange={(e) => update({ topic: e.target.value })}
          placeholder=\"e.g. The art of AI-assisted writing\"
          required
        />
      </div>

      {/* Audience */}
      <div className=\"brief-section\">
        <label className=\"cf-label\">04 — Target audience</label>
        <input
          type=\"text\"
          className=\"cf-input\"
          data-testid=\"audience-input\"
          value={form.audience}
          onChange={(e) => update({ audience: e.target.value })}
          placeholder=\"e.g. Indie creators & founders\"
          required
        />
      </div>

      {/* Tone */}
      <div className=\"brief-section\">
        <label className=\"cf-label\">05 — Tone</label>
        <button
          type=\"button\"
          data-testid=\"tone-auto\"
          onClick={() => update({ tone: \"\" })}
          className={`cf-pill ${form.tone === \"\" ? \"cf-pill-accent\" : \"\"}`}
          style={{ width: \"100%\", justifyContent: \"center\", padding: \"11px\", marginBottom: 8 }}
        >
          <Sparkles size={14} strokeWidth={2} />
          <span>Auto-select based on audience</span>
        </button>
        <div style={{ display: \"grid\", gridTemplateColumns: \"1fr 1fr 1fr\", gap: 8 }}>
          {TONES.map(({ id, label, Icon }) => (
            <button
              type=\"button\"
              key={id}
              data-testid={`tone-${id}`}
              onClick={() => update({ tone: id })}
              className={`cf-pill ${form.tone === id ? \"cf-pill-active\" : \"\"}`}
              style={{ padding: \"10px 6px\", gap: 6 }}
            >
              <Icon size={14} strokeWidth={1.75} />
              <span style={{ fontSize: 11.5 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Brand details */}
      <div className=\"brief-section\">
        <label className=\"cf-label\">06 — Brand & post details</label>
        <div style={{ display: \"grid\", gap: 12 }}>
          <input
            type=\"text\"
            className=\"cf-input\"
            data-testid=\"brand-name-input\"
            value={form.brand_name}
            onChange={(e) => update({ brand_name: e.target.value })}
            placeholder=\"Brand name — e.g. Atelier Studio\"
            required
          />

          <div>
            <div style={{ fontSize: 12, color: \"var(--cf-muted)\", marginBottom: 8, fontFamily: \"Inter Tight\" }}>
              Brand color
            </div>
            <div style={{ display: \"flex\", gap: 10 }}>
              {BRAND_COLORS.map((c) => (
                <button
                  type=\"button\"
                  key={c}
                  data-testid={`color-${c.slice(1)}`}
                  onClick={() => update({ brand_primary_color: c })}
                  className={`color-swatch ${form.brand_primary_color === c ? \"is-selected\" : \"\"}`}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          <div style={{ display: \"grid\", gridTemplateColumns: \"1fr 1fr\", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: \"var(--cf-muted)\", marginBottom: 6 }}>Post type</div>
              <select
                className=\"cf-input\"
                data-testid=\"post-type\"
                value={form.post_type}
                onChange={(e) => update({ post_type: e.target.value })}
              >
                <option value=\"single_post\">Single post</option>
                <option value=\"carousel\">Carousel</option>
                <option value=\"reel\">Reel</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: \"var(--cf-muted)\", marginBottom: 6 }}>Image style</div>
              <select
                className=\"cf-input\"
                data-testid=\"image-style\"
                value={form.image_style}
                onChange={(e) => update({ image_style: e.target.value })}
              >
                <option value=\"realistic\">Realistic</option>
                <option value=\"illustration\">Illustration</option>
                <option value=\"3d\">3D Render</option>
                <option value=\"minimal\">Minimal</option>
                <option value=\"editorial\">Editorial</option>
              </select>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: \"var(--cf-muted)\", marginBottom: 6 }}>CTA goal</div>
            <input
              type=\"text\"
              className=\"cf-input\"
              data-testid=\"cta-goal\"
              value={form.cta_goal}
              onChange={(e) => update({ cta_goal: e.target.value })}
              placeholder=\"e.g. downloads, sign-ups, demo calls\"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type=\"submit\"
        className=\"cf-btn-primary\"
        data-testid=\"generate-btn\"
        disabled={loading}
        style={{ width: \"100%\", marginTop: 8, padding: \"15px 22px\", fontSize: 14 }}
      >
        {loading ? (
          <>
            <span className=\"status-dot\" /> Generating your package…
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
        color: \"var(--cf-muted-soft)\",
        margin: \"14px 0 0\",
        textAlign: \"center\",
        fontFamily: \"JetBrains Mono\",
        letterSpacing: \"0.04em\",
      }}>
        Powered by multi-agent AI · ~30s to craft
      </p>
    </form>
  );
}
"