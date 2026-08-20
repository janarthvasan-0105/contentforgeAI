"import { useEffect, useState } from \"react\";
import {
  Search,
  Image as ImageIcon,
  Film,
  Calendar,
  Hash,
  PenLine,
  Lightbulb,
  Copy,
  Check,
} from \"lucide-react\";

const STATUS_MESSAGES = [
  { Icon: Search, text: \"Researching your audience\" },
  { Icon: Lightbulb, text: \"Crafting content strategy\" },
  { Icon: PenLine, text: \"Writing scripts that resonate\" },
  { Icon: ImageIcon, text: \"Designing visual concepts\" },
  { Icon: Hash, text: \"Synthesizing hashtags\" },
  { Icon: Calendar, text: \"Building content calendar\" },
];

const FEATURE_CHIPS = [
  { Icon: Search, label: \"AI Research\" },
  { Icon: ImageIcon, label: \"Visual Posts\" },
  { Icon: Film, label: \"Video Scripts\" },
  { Icon: Calendar, label: \"Content Calendar\" },
];

// Demo \"result\" data shown when user clicks generate
const DEMO_RESULT = {
  scripts: [
    {
      title: \"Hook — Open Strong\",
      body: \"Most creators chase trends. The smart ones build systems. Here's the 3-part framework that turned my account around in 60 days.\",
      tag: \"Hook\",
    },
    {
      title: \"Body — The Story\",
      body: \"When I started, I posted daily and burned out in two weeks. Then I switched to a 'pillar + repurpose' model. One deep idea per week, broken into seven different formats.\",
      tag: \"Narrative\",
    },
    {
      title: \"CTA — The Close\",
      body: \"Save this for your next content session. Then tell me — which pillar are you building this month?\",
      tag: \"Close\",
    },
  ],
  hashtags: [\"#contentstrategy\", \"#creatoreconomy\", \"#socialmedia\", \"#marketing\", \"#growth\"],
  captions: [
    \"The hardest part of content isn't ideas. It's the courage to publish the ordinary ones consistently.\",
    \"Three years ago I had 200 followers. Today I have a framework I wish someone had given me. Saving this.\",
  ],
};

export default function PreviewCanvas({ loading, result, form }) {
  const [statusIdx, setStatusIdx] = useState(0);
  const [activeTab, setActiveTab] = useState(\"scripts\");
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    if (!loading) return;
    const i = setInterval(() => {
      setStatusIdx((p) => (p + 1) % STATUS_MESSAGES.length);
    }, 1800);
    return () => clearInterval(i);
  }, [loading]);

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  // -------- LOADING STATE --------
  if (loading) {
    const Current = STATUS_MESSAGES[statusIdx];
    return (
      <div className=\"preview-canvas animate-float-up\" data-testid=\"preview-loading\" style={{ animationDelay: \"300ms\" }}>
        <div className=\"preview-empty\">
          <div className=\"preview-medallion\">
            <Current.Icon size={42} color=\"var(--cf-rust)\" strokeWidth={1.5} />
          </div>
          <div style={{ textAlign: \"center\" }}>
            <div className=\"eyebrow\" style={{ marginBottom: 10 }}>In progress</div>
            <div
              className=\"font-serif\"
              style={{ fontSize: 32, lineHeight: 1.15, color: \"var(--cf-ink)\" }}
            >
              {Current.text}
              <span style={{ color: \"var(--cf-rust)\", fontStyle: \"italic\" }}>…</span>
            </div>
          </div>
          <div style={{ display: \"flex\", gap: 10, alignItems: \"center\" }}>
            <span className=\"status-dot\" />
            <span style={{ fontSize: 13, color: \"var(--cf-muted)\", fontFamily: \"JetBrains Mono\" }}>
              {String(statusIdx + 1).padStart(2, \"0\")} / {String(STATUS_MESSAGES.length).padStart(2, \"0\")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // -------- RESULT STATE --------
  if (result) {
    return (
      <div className=\"preview-canvas animate-fade-in\" data-testid=\"preview-result\">
        <div style={{ display: \"flex\", alignItems: \"center\", justifyContent: \"space-between\", marginBottom: 18 }}>
          <div>
            <div className=\"eyebrow\" style={{ marginBottom: 6 }}>Your package</div>
            <h3 className=\"font-serif\" style={{ fontSize: 30, margin: 0, fontWeight: 400, letterSpacing: \"-0.015em\" }}>
              For <span style={{ fontStyle: \"italic\", color: \"var(--cf-rust)\" }}>
                {form?.brand_name || \"your brand\"}
              </span>
            </h3>
          </div>
          <button className=\"cf-btn-ghost\" data-testid=\"export-btn\">
            <Copy size={13} /> Export all
          </button>
        </div>

        {/* Tabs */}
        <div className=\"result-tabs\" data-testid=\"result-tabs\">
          {[
            { id: \"scripts\", label: \"Scripts\", Icon: PenLine },
            { id: \"captions\", label: \"Captions\", Icon: PenLine },
            { id: \"hashtags\", label: \"Hashtags\", Icon: Hash },
            { id: \"visuals\", label: \"Visuals\", Icon: ImageIcon },
            { id: \"calendar\", label: \"Calendar\", Icon: Calendar },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              data-testid={`tab-${id}`}
              className={`result-tab ${activeTab === id ? \"is-active\" : \"\"}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div data-testid={`tab-content-${activeTab}`}>
          {activeTab === \"scripts\" && (
            <div>
              {DEMO_RESULT.scripts.map((s, i) => (
                <div className=\"result-card animate-float-up\" key={i} style={{ animationDelay: `${i * 80}ms` }}>
                  <div style={{ display: \"flex\", justifyContent: \"space-between\", alignItems: \"start\", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <span className=\"result-tag\">{s.tag}</span>
                      <h4 style={{ marginTop: 8 }}>{s.title}</h4>
                      <p>{s.body}</p>
                    </div>
                    <button
                      className=\"cf-btn-ghost\"
                      data-testid={`copy-script-${i}`}
                      onClick={() => copy(s.body, `s-${i}`)}
                      style={{ flexShrink: 0 }}
                    >
                      {copied === `s-${i}` ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === \"captions\" && (
            <div>
              {DEMO_RESULT.captions.map((c, i) => (
                <div className=\"result-card animate-float-up\" key={i} style={{ animationDelay: `${i * 80}ms` }}>
                  <p style={{ fontSize: 15, color: \"var(--cf-ink)\", lineHeight: 1.6 }}>\"{c}\"</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === \"hashtags\" && (
            <div className=\"result-card\">
              <div style={{ display: \"flex\", flexWrap: \"wrap\", gap: 8 }}>
                {DEMO_RESULT.hashtags.map((h) => (
                  <span key={h} className=\"result-tag\" style={{ fontSize: 13, padding: \"6px 12px\" }}>
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeTab === \"visuals\" && (
            <div style={{ display: \"grid\", gridTemplateColumns: \"1fr 1fr\", gap: 14 }}>
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className=\"animate-scale-in\"
                  style={{
                    aspectRatio: \"1\",
                    background: `linear-gradient(${135 + n * 30}deg, ${form?.brand_primary_color || \"#B8482B\"} 0%, #1C1917 100%)`,
                    borderRadius: 14,
                    border: \"1px solid var(--cf-line)\",
                    display: \"grid\",
                    placeItems: \"center\",
                    color: \"white\",
                    fontFamily: \"Instrument Serif\",
                    fontSize: 24,
                    fontStyle: \"italic\",
                    animationDelay: `${n * 100}ms`,
                  }}
                  data-testid={`visual-${n}`}
                >
                  Concept {n}
                </div>
              ))}
            </div>
          )}

          {activeTab === \"calendar\" && (
            <div className=\"result-card\">
              {[\"Mon\", \"Wed\", \"Fri\", \"Sun\"].map((day, i) => (
                <div
                  key={day}
                  style={{
                    display: \"flex\",
                    alignItems: \"center\",
                    justifyContent: \"space-between\",
                    padding: \"14px 0\",
                    borderBottom: i < 3 ? \"1px dashed var(--cf-line)\" : \"none\",
                  }}
                >
                  <div>
                    <span className=\"result-tag\">{day}</span>
                    <span style={{ marginLeft: 12, fontSize: 14, color: \"var(--cf-ink)\" }}>
                      Pillar {i + 1} — {[\"Hook\", \"Story\", \"Lesson\", \"CTA\"][i]} post
                    </span>
                  </div>
                  <span style={{ fontFamily: \"JetBrains Mono\", fontSize: 11, color: \"var(--cf-muted)\" }}>
                    9:00 AM
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------- EMPTY STATE --------
  return (
    <div className=\"preview-canvas animate-float-up\" data-testid=\"preview-empty\" style={{ animationDelay: \"300ms\" }}>
      <div className=\"preview-empty\">
        <div className=\"preview-medallion\">
          <PenLine size={42} color=\"var(--cf-rust)\" strokeWidth={1.4} />
        </div>

        <div>
          <div className=\"eyebrow\" style={{ marginBottom: 12, textAlign: \"center\" }}>
            Awaiting brief
          </div>
          <h3
            className=\"font-serif\"
            style={{
              fontSize: 38,
              margin: 0,
              fontWeight: 400,
              letterSpacing: \"-0.02em\",
              lineHeight: 1.05,
              textAlign: \"center\",
            }}
          >
            Your content package
            <br />
            will <span style={{ fontStyle: \"italic\", color: \"var(--cf-rust)\" }}>appear here</span>.
          </h3>
          <p
            style={{
              maxWidth: 380,
              margin: \"16px auto 0\",
              color: \"var(--cf-muted)\",
              fontSize: 14,
              lineHeight: 1.55,
              textAlign: \"center\",
            }}
          >
            Fill in the brief on the left. We'll generate scripts, captions, visuals,
            hashtags and a calendar — tailored to your audience.
          </p>
        </div>

        <div className=\"feature-grid\">
          {FEATURE_CHIPS.map(({ Icon, label }, i) => (
            <div
              key={label}
              className=\"feature-chip animate-float-up\"
              style={{ animationDelay: `${600 + i * 100}ms` }}
              data-testid={`feature-${label.toLowerCase().replace(/\s+/g, \"-\")}`}
            >
              <div className=\"feature-chip-icon\">
                <Icon size={17} strokeWidth={1.6} />
              </div>
              <div className=\"feature-chip-label\">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
"