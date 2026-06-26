"use client";

import { useState } from "react";
import { login, register, connectTwitter } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Twitter Connect State
  const [step, setStep] = useState(1);
  const [authToken, setAuthToken] = useState("");
  const [ct0, setCt0] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  
  const router = useRouter();

  function switchMode(next: AuthMode) {
    setMode(next);
    setError("");
    setUsername("");
    setEmail("");
    setPassword("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      router.push("/generate");
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Try sandy / demo123");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await register(username, email, password);
      if (!data.session) {
        setError("Account created, but email confirmation is required. Please check your email or disable 'Confirm Email' in Supabase.");
        setLoading(false);
        return;
      }
      setStep(2); // Go to Twitter connect step
    } catch (err: any) {
      setError(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    setConnectError("");
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) throw new Error("User not logged in");

      await connectTwitter({
        user_id: userId,
        auth_token: authToken,
        ct0: ct0,
      });
      router.push("/generate");
    } catch (err: any) {
      setConnectError(err?.response?.data?.detail || err.message || "Failed to connect Twitter");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div className="animate-fade-in" style={{ width: "100%", maxWidth: 440 }}>
        
        {/* ── Brand Header ── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="cf-logo-mark" style={{ margin: "0 auto 16px", width: 48, height: 48, fontSize: 24 }}>
            <span className="font-serif" style={{ fontStyle: "italic", position: "relative", zIndex: 1, marginTop: 2 }}>
              C
            </span>
          </div>
          <h1 className="font-serif" style={{ fontSize: 40, letterSpacing: "-0.03em", color: "var(--cf-ink)", lineHeight: 1.1, margin: 0 }}>
            Content<span style={{ color: "var(--cf-rust)", fontStyle: "italic" }}>Forge</span> AI
          </h1>
          <p style={{ color: "var(--cf-muted)", fontSize: 15, marginTop: 8 }}>
            AI-powered content generation platform.
          </p>
        </div>

        {/* ── Auth Card ── */}
        <div className="surface-elevated animate-float-up" style={{ padding: 40, animationDelay: "150ms" }}>
          
          {/* Tabs */}
          {step === 1 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`cf-pill ${mode === "login" ? "cf-pill-active" : ""}`}
                style={{ flex: 1, justifyContent: "center", padding: "12px 16px" }}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`cf-pill ${mode === "register" ? "cf-pill-active" : ""}`}
                style={{ flex: 1, justifyContent: "center", padding: "12px 16px" }}
              >
                New User
              </button>
            </div>
          )}

          {/* Forms */}
          {step === 1 && mode === "login" ? (
            <form key="login" onSubmit={handleLogin} className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label className="cf-label">Email</label>
                <input
                  type="email"
                  className="cf-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="cf-label">Password</label>
                <input
                  type="password"
                  className="cf-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, color: "#DC2626", fontSize: 14 }}>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="cf-btn-primary"
                style={{ width: "100%", padding: "14px", marginTop: 8 }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} />
                    Signing in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>
          ) : step === 1 && mode === "register" ? (
            <form key="register" onSubmit={handleRegister} className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label className="cf-label">Username</label>
                <input
                  className="cf-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  placeholder="Choose a username"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="cf-label">Email</label>
                <input
                  type="email"
                  className="cf-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="cf-label">Create Password</label>
                <input
                  type="password"
                  className="cf-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                />
              </div>
              {error && (
                <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, color: "#DC2626", fontSize: 14 }}>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="cf-btn-primary"
                style={{ width: "100%", padding: "14px", marginTop: 8 }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          ) : (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🐦</div>
                <h2 style={{ fontSize: 24, fontWeight: "bold", color: "var(--cf-ink)", marginBottom: 8 }}>
                  Connect Twitter
                </h2>
                <p style={{ color: "var(--cf-muted)", fontSize: 14 }}>
                  Enable auto-publishing. You can skip and connect later from Settings.
                </p>
              </div>

              <button
                onClick={() => setShowGuide(!showGuide)}
                style={{ width: "100%", textAlign: "left", padding: 16, borderRadius: 12, border: "1px solid var(--cf-border)", background: "var(--cf-surface)", fontSize: 14 }}
              >
                <span style={{ fontWeight: 500, color: "var(--cf-rust)" }}>
                  📖 How to find your auth_token and ct0
                </span>
                <span style={{ float: "right", color: "var(--cf-muted)" }}>{showGuide ? "▲" : "▼"}</span>
              </button>

              {showGuide && (
                <div style={{ background: "var(--cf-bg)", border: "1px solid var(--cf-border)", borderRadius: 12, padding: 16, fontSize: 12, color: "var(--cf-muted)", display: "flex", flexDirection: "column", gap: 6 }}>
                  <p style={{ color: "var(--cf-ink)", fontWeight: 500, marginBottom: 8 }}>Step by step:</p>
                  <ol style={{ listStylePosition: "inside", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    <li>Open <strong>twitter.com</strong> and log in</li>
                    <li>Press <strong>F12</strong> → Developer Tools</li>
                    <li>Go to <strong>Application</strong> tab (Chrome)</li>
                    <li>Click <strong>Cookies → https://twitter.com</strong></li>
                    <li>Find <strong style={{color: "var(--cf-rust)"}}>auth_token</strong> → copy Value</li>
                    <li>Find <strong style={{color: "var(--cf-rust)"}}>ct0</strong> → copy Value</li>
                  </ol>
                  <p style={{ color: "#EAB308", marginTop: 12 }}>
                    ⚠️ Never share these. ContentForge encrypts them securely.
                  </p>
                </div>
              )}

              <div>
                <input
                  type="password"
                  value={authToken}
                  onChange={e => setAuthToken(e.target.value)}
                  placeholder="Paste auth_token here"
                  className="cf-input font-mono"
                />
              </div>
              <div>
                <input
                  type="password"
                  value={ct0}
                  onChange={e => setCt0(e.target.value)}
                  placeholder="Paste ct0 here"
                  className="cf-input font-mono"
                />
              </div>

              {connectError && (
                <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, color: "#DC2626", fontSize: 14 }}>
                  {connectError}
                </div>
              )}

              <button
                onClick={handleConnect}
                disabled={connecting || !authToken || !ct0}
                className="cf-btn-primary"
                style={{ width: "100%", padding: "14px" }}
              >
                {connecting ? "Verifying & Connecting..." : "Connect Twitter Account"}
              </button>

              <button
                onClick={() => router.push("/generate")}
                style={{ width: "100%", padding: "14px", background: "none", border: "none", color: "var(--cf-muted)", fontSize: 14, cursor: "pointer" }}
              >
                Skip for now — I'll connect later
              </button>
            </div>
          )}


        </div>
      </div>
    </main>
  );
}
