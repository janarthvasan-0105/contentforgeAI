"use client";

import { useEffect, useState } from "react";
import { getTwitterStatus, liveCheckTwitter, disconnectTwitter, connectTwitter } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function TwitterSettingsPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Reconnect forms
  const [authToken, setAuthToken] = useState("");
  const [ct0, setCt0] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("cf_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.sub) setUserId(payload.sub);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchStatus();
    }
  }, [userId]);

  async function fetchStatus() {
    setLoading(true);
    try {
      const data = await getTwitterStatus(userId);
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLiveCheck() {
    try {
      const data = await liveCheckTwitter(userId);
      if (data.valid) {
        alert("Tokens are valid! " + data.message);
        fetchStatus();
      } else {
        alert("Tokens are invalid: " + data.message);
      }
    } catch (err: any) {
      alert("Live check failed: " + err.message);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Are you sure you want to disconnect Twitter?")) return;
    try {
      await disconnectTwitter(userId);
      fetchStatus();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    setError("");
    try {
      await connectTwitter({
        user_id: userId,
        auth_token: authToken,
        ct0: ct0
      });
      setAuthToken("");
      setCt0("");
      fetchStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to connect");
    } finally {
      setConnecting(false);
    }
  }

  const statusColor = (s: string) => {
    if (s === "active") return "border-teal-600 bg-teal-950/20";
    if (s === "expiring_soon") return "border-yellow-600 bg-yellow-950/20";
    return "border-red-600 bg-red-950/20";
  };

  if (loading || !userId) {
    return <div className="p-8 text-center"><Loader2 className="animate-spin inline-block text-teal-500" /></div>;
  }

  return (
    <div className="max-w-xl mx-auto p-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-2">Twitter Settings</h1>
      <p className="text-gray-400 text-sm mb-8">Manage your Twitter auto-publishing connection.</p>

      {status?.connected ? (
        <>
          <div className={`p-5 rounded-2xl border mb-6 ${statusColor(status.status)}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-white">{status.handle}</p>
                <p className="text-xs opacity-70">Connected {status.days_since} days ago</p>
              </div>
              <span className="text-2xl">
                {status.status === "active" ? "✅" : status.status === "expiring_soon" ? "⚠️" : "❌"}
              </span>
            </div>
            <p className="text-xs">{status.message}</p>

            {/* Days remaining progress bar */}
            <div className="mt-3 bg-black/20 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-current"
                style={{ width: `${Math.min(100, ((status.days_left || 0) / 30) * 100)}%` }}
              />
            </div>
            <p className="text-xs opacity-50 mt-1">{status.days_left} days remaining</p>
          </div>

          <div className="flex gap-3 mb-8">
            <button onClick={handleLiveCheck} className="flex-1 py-2.5 rounded-xl border border-teal-600 text-teal-400 text-sm hover:bg-teal-900/20 transition-colors">
              🔄 Live Check
            </button>
            <button onClick={handleDisconnect} className="flex-1 py-2.5 rounded-xl border border-red-700 text-red-400 text-sm hover:bg-red-900/20 transition-colors">
              🔌 Disconnect
            </button>
          </div>
        </>
      ) : (
        <div className="p-5 rounded-2xl border border-slate-700 bg-slate-800/50 mb-8 text-center">
          <p className="text-gray-400 text-sm">No Twitter account connected.</p>
        </div>
      )}

      {/* Connect/Reconnect Form */}
      <h2 className="text-lg font-bold text-white mb-4">{status?.connected ? "Update Tokens" : "Connect Account"}</h2>
      
      <button
        onClick={() => setShowGuide(!showGuide)}
        style={{ width: "100%", textAlign: "left", padding: 16, borderRadius: 12, border: "1px solid var(--cf-border)", background: "var(--cf-surface)", fontSize: 14, marginBottom: 16 }}
      >
        <span style={{ fontWeight: 500, color: "var(--cf-rust)" }}>
          📖 How to find your auth_token and ct0
        </span>
        <span style={{ float: "right", color: "var(--cf-muted)" }}>{showGuide ? "▲" : "▼"}</span>
      </button>

      {showGuide && (
        <div style={{ background: "var(--cf-bg)", border: "1px solid var(--cf-border)", borderRadius: 12, padding: 16, fontSize: 12, color: "var(--cf-muted)", display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          <p style={{ color: "var(--cf-ink)", fontWeight: 500, marginBottom: 8 }}>Step by step:</p>
          <ol style={{ listStylePosition: "inside", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>Open <strong>twitter.com</strong> and log in</li>
            <li>Press <strong>F12</strong> → Developer Tools</li>
            <li>Go to <strong>Application</strong> tab (Chrome)</li>
            <li>Click <strong>Cookies → https://twitter.com</strong></li>
            <li>Find <strong style={{color: "var(--cf-rust)"}}>auth_token</strong> → copy Value</li>
            <li>Find <strong style={{color: "var(--cf-rust)"}}>ct0</strong> → copy Value</li>
          </ol>
        </div>
      )}

      <div className="space-y-4 mb-4">
        <div>
          <input
            type="password"
            value={authToken}
            onChange={e => setAuthToken(e.target.value)}
            placeholder="Paste new auth_token here"
            className="cf-input font-mono w-full"
          />
        </div>
        <div>
          <input
            type="password"
            value={ct0}
            onChange={e => setCt0(e.target.value)}
            placeholder="Paste new ct0 here"
            className="cf-input font-mono w-full"
          />
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, color: "#DC2626", fontSize: 14, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={connecting || !authToken || !ct0}
        className="cf-btn-primary w-full py-3"
      >
        {connecting ? "Connecting..." : status?.connected ? "Update Connection" : "Connect Account"}
      </button>
    </div>
  );
}
