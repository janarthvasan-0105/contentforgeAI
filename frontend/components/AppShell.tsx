"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { RotateCw, LogOut } from "lucide-react";
import { logout } from "@/lib/api";
import IntroAnimation from "@/components/IntroAnimation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/";
  const [ready, setReady] = useState(false);

  return (
    <div className="app-shell" style={{ position: "relative", zIndex: 1 }}>
      {/* Intro Animation — only show once on first load */}
      {!ready && !isAuthPage && <IntroAnimation onDone={() => setReady(true)} />}

      {!isAuthPage && (
        <header className="cf-nav">
          <div className="cf-nav-inner">
            <Link href="/generate" className="cf-logo">
              <div className="cf-logo-mark">
                <span
                  className="font-serif"
                  style={{ fontSize: 20, fontStyle: "italic", position: "relative", zIndex: 1 }}
                >
                  C
                </span>
              </div>
              <div className="cf-logo-text">
                Content<em>Forge</em>
              </div>
            </Link>

            <nav style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 1, height: 22, background: "var(--cf-line)", margin: "0 4px" }} />

              <button
                className="nav-pill"
                onClick={() => (window.location.href = "/generate")}
                title="Clear page and start new generation"
              >
                <RotateCw size={13} />
                Refresh
              </button>
              <button
                className="nav-pill"
                onClick={logout}
              >
                <LogOut size={13} />
                Log out
              </button>
            </nav>
          </div>
        </header>
      )}

      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
