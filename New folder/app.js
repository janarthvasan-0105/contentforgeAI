"import { useEffect, useState } from \"react\";
import \"@/App.css\";
import IntroAnimation from \"@/components/IntroAnimation\";
import AppHeader from \"@/components/AppHeader\";
import ContentBriefForm from \"@/components/ContentBriefForm\";
import PreviewCanvas from \"@/components/PreviewCanvas\";
import { ArrowDown } from \"lucide-react\";

function App() {
  const [introDone, setIntroDone] = useState(false);
  const [form, setForm] = useState({
    purpose: \"general\",
    topic: \"\",
    platform: \"instagram\",
    audience: \"\",
    tone: \"\",
    brand_name: \"\",
    brand_primary_color: \"#B8482B\",
    brand_secondary_color: \"#1C1917\",
    visual_style: \"modern\",
    post_type: \"single_post\",
    cta_goal: \"\",
    image_style: \"editorial\",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Skip intro on subsequent visits in same session
  useEffect(() => {
    if (sessionStorage.getItem(\"cf_intro_seen\")) {
      setIntroDone(true);
    }
  }, []);

  const handleIntroDone = () => {
    sessionStorage.setItem(\"cf_intro_seen\", \"1\");
    setIntroDone(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);
    // Demo simulation — in production this calls /api/generate
    setTimeout(() => {
      setLoading(false);
      setResult({ generated: true });
    }, 3600);
  };

  return (
    <>
      {!introDone && <IntroAnimation onDone={handleIntroDone} />}

      <div className=\"app-shell\">
        <AppHeader />

        {/* Hero */}
        <section style={{ maxWidth: 1280, margin: \"0 auto\", padding: \"72px 32px 32px\" }}>
          <div className=\"eyebrow animate-float-up\" style={{ marginBottom: 18 }}>
            ContentForge AI · Generate
          </div>
          <h1 className=\"headline-display animate-word-reveal\" style={{ animationDelay: \"120ms\" }}>
            Generate a <span className=\"italic-word\">content package</span>,
            <br />
            crafted by quiet machines.
          </h1>
          <p className=\"lead animate-float-up\" style={{ marginTop: 22, animationDelay: \"320ms\" }}>
            Fill in the brief. We orchestrate research, scripts, visuals, captions, hashtags
            and a calendar — in the time it takes to brew an espresso.
          </p>

          <div
            className=\"animate-float-up\"
            style={{
              display: \"flex\",
              alignItems: \"center\",
              gap: 8,
              marginTop: 32,
              color: \"var(--cf-muted)\",
              fontSize: 13,
              fontFamily: \"JetBrains Mono\",
              animationDelay: \"480ms\",
            }}
          >
            <ArrowDown size={14} />
            <span>Start with your brief below</span>
          </div>
        </section>

        {/* Workspace */}
        <section style={{ maxWidth: 1280, margin: \"0 auto\", padding: \"32px 32px 88px\" }}>
          <div className=\"workspace-grid\">
            <ContentBriefForm
              form={form}
              setForm={setForm}
              onSubmit={handleSubmit}
              loading={loading}
            />
            <PreviewCanvas loading={loading} result={result} form={form} />
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            borderTop: \"1px solid var(--cf-line)\",
            padding: \"32px\",
            textAlign: \"center\",
            color: \"var(--cf-muted)\",
            fontSize: 13,
            fontFamily: \"JetBrains Mono\",
            letterSpacing: \"0.04em\",
          }}
        >
          <div className=\"font-serif\" style={{ fontSize: 20, marginBottom: 6, color: \"var(--cf-ink)\", fontFamily: \"Instrument Serif\", letterSpacing: \"-0.02em\" }}>
            Content<span style={{ color: \"var(--cf-rust)\", fontStyle: \"italic\" }}>Forge</span>
          </div>
          <div>Crafted with care · © {new Date().getFullYear()}</div>
        </footer>
      </div>
    </>
  );
}

export default App;
"