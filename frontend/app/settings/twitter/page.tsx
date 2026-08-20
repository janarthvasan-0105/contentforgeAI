"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTwitterStatus, liveCheckTwitter, disconnectTwitter, connectTwitter } from "@/lib/api";
import { Loader2, ArrowLeft } from "lucide-react";

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
    if (s === "active") return "border-teal-200 bg-teal-50 text-teal-900";
    if (s === "expiring_soon") return "border-amber-200 bg-amber-50 text-amber-900";
    return "border-red-200 bg-red-50 text-red-900";
  };

  if (loading || !userId) {
    return <div className="p-8 text-center"><Loader2 className="animate-spin inline-block text-[#8763e5]" /></div>;
  }

  return (
    <div className="max-w-xl mx-auto mt-12 p-8 md:p-10 bg-white border border-neutral-200/80 rounded-2xl shadow-sm animate-fade-in select-none">
      <Link
        href="/generate"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-900 transition mb-6"
      >
        <ArrowLeft size={13} />
        Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2 font-sans tracking-tightest">Twitter Settings</h1>
      <p className="text-neutral-600 text-sm mb-8 font-medium">Manage your Twitter auto-publishing connection.</p>

      {status?.connected ? (
        <>
          <div className={`p-5 rounded-2xl border mb-6 ${statusColor(status.status)}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-neutral-900">{status.handle}</p>
                <p className="text-xs opacity-75">Connected {status.days_since} days ago</p>
              </div>
              <span className="text-2xl">
                {status.status === "active" ? "✅" : status.status === "expiring_soon" ? "⚠️" : "❌"}
              </span>
            </div>
            <p className="text-xs">{status.message}</p>

            {/* Days remaining progress bar */}
            <div className="mt-3 bg-black/5 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#8763e5]"
                style={{ width: `${Math.min(100, ((status.days_left || 0) / 30) * 100)}%` }}
              />
            </div>
            <p className="text-xs opacity-60 mt-1">{status.days_left} days remaining</p>
          </div>

          <div className="flex gap-3 mb-8">
            <button onClick={handleLiveCheck} className="flex-1 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-sm font-semibold transition-colors">
              🔄 Live Check
            </button>
            <button onClick={handleDisconnect} className="flex-1 py-2.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 text-sm font-semibold transition-colors">
              🔌 Disconnect
            </button>
          </div>
        </>
      ) : (
        <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50 mb-8 text-center">
          <p className="text-neutral-600 text-sm font-medium">No Twitter account connected.</p>
        </div>
      )}

      {/* Connect/Reconnect Form */}
      <h2 className="text-lg font-bold text-neutral-900 mb-4 tracking-tight">{status?.connected ? "Update Tokens" : "Connect Account"}</h2>
      
      <button
        onClick={() => setShowGuide(!showGuide)}
        className="w-full text-left p-4 rounded-xl border border-neutral-200 bg-neutral-50 text-sm hover:bg-neutral-100 transition mb-4 flex items-center justify-between font-medium"
      >
        <span className="text-[#8763e5] font-bold">
          📖 How to find your auth_token and ct0
        </span>
        <span className="text-neutral-400">{showGuide ? "▲" : "▼"}</span>
      </button>

      {showGuide && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs text-neutral-600 flex flex-col gap-2 mb-4 font-medium">
          <p className="text-neutral-900 font-bold mb-2">Step by step:</p>
          <ol className="list-inside p-0 m-0 flex flex-col gap-2 list-decimal">
            <li>Open <strong>twitter.com</strong> and log in</li>
            <li>Press <strong>F12</strong> → Developer Tools</li>
            <li>Go to <strong>Application</strong> tab (Chrome)</li>
            <li>Click <strong>Cookies → https://twitter.com</strong></li>
            <li>Find <strong className="text-[#8763e5]">auth_token</strong> → copy Value</li>
            <li>Find <strong className="text-[#8763e5]">ct0</strong> → copy Value</li>
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
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400 focus:bg-white transition text-sm font-mono"
          />
        </div>
        <div>
          <input
            type="password"
            value={ct0}
            onChange={e => setCt0(e.target.value)}
            placeholder="Paste new ct0 here"
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400 focus:bg-white transition text-sm font-mono"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 px-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-4 font-medium">
          {error}
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={connecting || !authToken || !ct0}
        className={`w-full py-3.5 rounded-full font-bold text-sm transition shadow-md flex items-center justify-center gap-2 ${
          connecting || !authToken || !ct0
            ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
            : "bg-[#120F17] hover:bg-neutral-800 text-white"
        }`}
      >
        {connecting ? "Connecting..." : status?.connected ? "Update Connection" : "Connect Account"}
      </button>
    </div>
  );
}
