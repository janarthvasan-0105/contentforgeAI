"import { RotateCw, LogOut } from \"lucide-react\";

export default function AppHeader() {
  return (
    <header className=\"cf-nav\" data-testid=\"app-header\">
      <div className=\"cf-nav-inner\">
        <a href=\"#\" className=\"cf-logo\" data-testid=\"cf-logo\">
          <div className=\"cf-logo-mark\">
            <span
              className=\"font-serif\"
              style={{ fontSize: 20, fontStyle: \"italic\", position: \"relative\", zIndex: 1 }}
            >
              C
            </span>
          </div>
          <div className=\"cf-logo-text\">
            Content<em>Forge</em>
          </div>
        </a>

        <nav style={{ display: \"flex\", alignItems: \"center\", gap: 10 }}>
          <a
            href=\"#\"
            className=\"nav-pill\"
            data-testid=\"nav-features\"
            style={{ background: \"transparent\", border: \"none\" }}
          >
            Generate
          </a>
          <a
            href=\"#\"
            className=\"nav-pill\"
            data-testid=\"nav-library\"
            style={{ background: \"transparent\", border: \"none\" }}
          >
            Library
          </a>
          <a
            href=\"#\"
            className=\"nav-pill\"
            data-testid=\"nav-pricing\"
            style={{ background: \"transparent\", border: \"none\" }}
          >
            Pricing
          </a>

          <div style={{ width: 1, height: 22, background: \"var(--cf-line)\", margin: \"0 8px\" }} />

          <button className=\"nav-pill\" data-testid=\"refresh-btn\">
            <RotateCw size={13} /> Refresh
          </button>
          <button className=\"nav-pill\" data-testid=\"logout-btn\">
            <LogOut size={13} /> Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
"