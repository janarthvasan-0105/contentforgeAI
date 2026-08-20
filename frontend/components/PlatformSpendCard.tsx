"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Info, ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSpendAnalytics } from "@/lib/api";

// ─────────────────────────────────────────────
// Platform config (visual only — no fake numbers)
// ─────────────────────────────────────────────
const PLATFORM_CONFIG: Record<
  string,
  { label: string; color: string; svgIcon: string; needsInvert: boolean }
> = {
  instagram: { label: "Instagram", color: "#d075d8", svgIcon: "/instagram.svg", needsInvert: false },
  youtube:   { label: "YouTube",   color: "#ef4444", svgIcon: "/youtube.svg",   needsInvert: false },
  linkedin:  { label: "LinkedIn",  color: "#2d8cff", svgIcon: "/linkedin.svg",  needsInvert: false },
  twitter:   { label: "Twitter",   color: "#efc844", svgIcon: "/twitter-x.svg", needsInvert: true  },
};

// ─────────────────────────────────────────────
// (Unused) Helper functions have been removed since backend handles logic
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// Helper: convert hourly buckets to smooth SVG path
// SVG canvas: 280 × 70 (Y axis: 0=top, 70=bottom)
// We map value to Y so higher activity = higher line
// ─────────────────────────────────────────────
function bucketsToPath(buckets: number[]): string {
  const W = 280;
  const H = 90;
  const maxVal = Math.max(...buckets, 1); // avoid divide-by-0

  // Map each hour (0-23) to an (x, y) point
  const pts: [number, number][] = buckets.map((val, i) => {
    const x = (i / 23) * W;
    const y = H - (val / maxVal) * (H * 0.85) - H * 0.05; // 5% padding top/bottom
    return [x, y];
  });

  // Build a smooth cubic-bezier path through all points
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpX = (prev[0] + curr[0]) / 2;
    d += ` C ${cpX.toFixed(1)} ${prev[1].toFixed(1)}, ${cpX.toFixed(1)} ${curr[1].toFixed(1)}, ${curr[0].toFixed(1)} ${curr[1].toFixed(1)}`;
  }
  return d;
}

// ─────────────────────────────────────────────
// Mini chart — renders real hourly comparison
// ─────────────────────────────────────────────
function PlatformChart({
  todayBuckets,
  yesterdayBuckets,
  color,
}: {
  todayBuckets: number[];
  yesterdayBuckets: number[];
  color: string;
}) {
  const todayPath = bucketsToPath(todayBuckets);
  const yesterdayPath = bucketsToPath(yesterdayBuckets);
  const hasAnyData = todayBuckets.some((v) => v > 0) || yesterdayBuckets.some((v) => v > 0);

  return (
    <div className="w-full space-y-3 mt-6 border-t border-white/[0.06] pt-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="relative w-full h-[100px]">
        {hasAnyData ? (
          <svg
            width="100%"
            height={100}
            viewBox="0 0 280 100"
            preserveAspectRatio="none"
            className="overflow-visible"
          >
            {/* Yesterday — grey */}
            {yesterdayPath && (
              <path
                d={yesterdayPath}
                fill="none"
                stroke="#8A8780"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.5}
              />
            )}
            {/* Today — brand color with glow */}
            {todayPath && (
              <path
                d={todayPath}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 6px ${color})` }}
              />
            )}
          </svg>
        ) : (
          /* Empty state */
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-neutral-500 tracking-wide font-medium">
              No activity yet — start generating!
            </p>
          </div>
        )}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-[10px] text-neutral-500 font-medium select-none px-0.5">
        <span>12 AM</span>
        <span>8 AM</span>
        <span>4 PM</span>
        <span>12 AM</span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-[11px] text-neutral-400 font-medium pt-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8A8780] opacity-50" />
          <span>Yesterday</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared card component used by all 4 pages
// ─────────────────────────────────────────────
export function PlatformSpendCard({ platform }: { platform: string }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const cfg = PLATFORM_CONFIG[platform];

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const data = await getSpendAnalytics(session.user.id, platform);
          setStats(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [platform]);

  // ── compute stats ──────────────────────────
  const totalCost = stats?.total_cost || 0;
  const totalImages = stats?.total_posts || 0;
  const totalVideos = stats?.total_videos || 0;
  const postsCost = totalImages * 0.25;
  const videosCost = totalVideos * 2.0;

  // Trend badge
  const trendText = stats?.trend_text || "↑ 0.0%";
  const trendUp = stats?.is_up ?? true;

  // ── hourly chart data ──────────────────────
  const todayBuckets = stats?.hourly?.today || new Array(24).fill(0);
  const yesterdayBuckets = stats?.hourly?.yesterday || new Array(24).fill(0);

  // ── today's post+video counts ──────────────
  const todayPosts = stats?.today_posts || 0;
  const todayVideos = stats?.today_videos || 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <RefreshCw size={22} className="animate-spin text-[#8763e5]" />
        <p className="text-xs text-neutral-500 font-mono uppercase tracking-wider">Loading…</p>
      </div>
    );
  }

  return (
    <div
      className="max-w-xl w-full bg-[#121016] border rounded-[28px] p-10 shadow-2xl flex flex-col justify-between min-h-[520px]"
      style={{ borderColor: `${cfg.color}25`, fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {platform === "twitter" ? (
              <svg viewBox="0 0 300 300" className="w-7 h-7 flex-shrink-0" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66" />
              </svg>
            ) : (
              <img
                src={cfg.svgIcon}
                alt={cfg.label}
                className="w-7 h-7 object-contain"
                style={cfg.needsInvert ? { filter: "invert(1)", opacity: 0.85 } : undefined}
              />
            )}
            <span className="text-sm font-bold text-white tracking-tight">{cfg.label}</span>
          </div>
          <Info
            size={16}
            className="text-neutral-500 hover:text-neutral-300 cursor-pointer transition"
            title={`Estimated cost for ${cfg.label} — posts and videos generated`}
          />
        </div>

        {/* Big spend + trend */}
        <div className="flex items-center gap-4 mt-5">
          <span className="text-5xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            ${totalCost.toFixed(2)}
          </span>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${
              trendUp
                ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/15"
                : "bg-rose-950/40 text-rose-400 border-rose-500/15"
            }`}
          >
            {trendText}
          </span>
        </div>
      </div>

      <div className="border-t border-white/[0.06] my-6" />

      {/* All-time Posts & Videos rows */}
      <div className="space-y-4 text-[13px] text-neutral-300">
        {/* Posts */}
        <div className="grid grid-cols-12 items-center">
          <div className="col-span-5 flex items-center gap-2.5">
            {platform === "twitter" ? (
              <svg viewBox="0 0 300 300" className="w-4 h-4 flex-shrink-0" fill="rgba(255,255,255,0.65)" xmlns="http://www.w3.org/2000/svg">
                <path d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66" />
              </svg>
            ) : (
              <img
                src={cfg.svgIcon}
                alt=""
                className="w-4 h-4 object-contain"
                style={cfg.needsInvert ? { filter: "invert(1)", opacity: 0.6 } : undefined}
              />
            )}
            <span className="font-medium">Posts</span>
          </div>
          <div className="col-span-4 font-bold text-white text-base">{totalImages}</div>
          <div className="col-span-3 text-right text-neutral-400 font-medium">${postsCost.toFixed(2)}</div>
        </div>
        {/* Videos */}
        <div className="grid grid-cols-12 items-center">
          <div className="col-span-5 flex items-center gap-2.5">
            <span className="w-4 h-4 flex items-center justify-center">
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                <polygon points="3,2 13,8 3,14" fill="rgba(255,255,255,0.55)" />
              </svg>
            </span>
            <span className="font-medium">Videos</span>
          </div>
          <div className="col-span-4 font-bold text-white text-base">{totalVideos}</div>
          <div className="col-span-3 text-right text-neutral-400 font-medium">${videosCost.toFixed(2)}</div>
        </div>
      </div>

      {/* Today's quick summary */}
      <div className="mt-5 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-between text-xs text-neutral-400 font-semibold">
        <span className="tracking-wider uppercase text-[10px]">Today</span>
        <span>{todayPosts} posts · {todayVideos} videos</span>
      </div>

      {/* Real-data chart */}
      <PlatformChart
        todayBuckets={todayBuckets}
        yesterdayBuckets={yesterdayBuckets}
        color={cfg.color}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Standalone page wrapper (used by each route)
// ─────────────────────────────────────────────
export default function PlatformSpendPageTemplate({ platform }: { platform: string }) {
  const cfg = PLATFORM_CONFIG[platform];

  return (
    <main className="relative min-h-[calc(100vh-73px)] w-full py-16 px-6 bg-[#f9f9fb] flex flex-col items-center">
      {/* Back link */}
      <div className="max-w-xl w-full mb-8">
        <Link
          href="/generate"
          className="inline-flex items-center gap-2.5 text-sm font-semibold text-neutral-600 hover:text-black transition"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <PlatformSpendCard platform={platform} />
    </main>
  );
}
