"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Info, ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSpendAnalytics } from "@/lib/api";

// ─────────────────────────────────────────────
// Convert hourly buckets → smooth SVG path
// ─────────────────────────────────────────────
function bucketsToPath(buckets: number[]): string {
  const W = 320;
  const H = 100;
  const maxVal = Math.max(...buckets, 1);

  const pts: [number, number][] = buckets.map((val, i) => {
    const x = (i / 23) * W;
    const y = H - (val / maxVal) * (H * 0.85) - H * 0.05;
    return [x, y];
  });

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
// Platform config
// ─────────────────────────────────────────────
const PLATFORMS = [
  { key: "youtube",   label: "YouTube",   color: "#ef4444", svgIcon: "/youtube.svg" },
  { key: "instagram", label: "Instagram", color: "#d075d8", svgIcon: "/instagram.svg" },
  { key: "linkedin",  label: "LinkedIn",  color: "#2d8cff", svgIcon: "/linkedin.svg" },
  { key: "twitter",   label: "Twitter",   color: "#efc844", svgIcon: "" },
];

export default function SpendPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const data = await getSpendAnalytics(session.user.id, "all");
          setStats(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalCost = stats?.total_cost || 0;
  const totalTrendText = stats?.trend_text || "↑ 0.0%";
  const totalTrendUp = stats?.is_up ?? true;

  const getPlatStats = (plat: string) => {
    const p = stats?.platforms?.find((x: any) => x.platform === plat);
    if (!p) return { costVal: 0, trendText: "↑ 0.0%", isUp: true, totalAssets: 0 };
    return {
      costVal: p.total_cost,
      trendText: p.trend_text,
      isUp: p.is_up,
      totalAssets: p.total_assets
    };
  };

  const todayBuckets = stats?.hourly?.today || new Array(24).fill(0);
  const yesterdayBuckets = stats?.hourly?.yesterday || new Array(24).fill(0);
  const todayPath = bucketsToPath(todayBuckets);
  const yesterdayPath = bucketsToPath(yesterdayBuckets);
  const hasChartData = todayBuckets.some((v: number) => v > 0) || yesterdayBuckets.some((v: number) => v > 0);

  const todayPosts = stats?.today_posts || 0;
  const todayVideosCount = stats?.today_videos || 0;

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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <RefreshCw size={24} className="animate-spin text-[#8763e5]" />
          <p className="text-sm text-neutral-500 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
            Syncing spend records...
          </p>
        </div>
      ) : (
        <div
          className="max-w-xl w-full bg-[#121016] border rounded-[28px] p-10 shadow-2xl flex flex-col justify-between min-h-[580px]"
          style={{ borderColor: "rgba(255,255,255,0.06)", fontFamily: "'Inter', sans-serif" }}
        >
          {/* Header */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white tracking-tight">Total packages</span>
              <Info
                size={16}
                className="text-neutral-500 hover:text-neutral-300 cursor-pointer transition"
                title="Estimated cost across all platforms — posts and videos generated"
              />
            </div>

            {/* Cost + trend */}
            <div className="flex items-center gap-4 mt-5">
              <span
                className="text-5xl font-extrabold text-white tracking-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                ${totalCost.toFixed(2)}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${
                  totalTrendUp
                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/15"
                    : "bg-rose-950/40 text-rose-400 border-rose-500/15"
                }`}
              >
                {totalTrendText}
              </span>
            </div>
          </div>

          <div className="border-t border-white/[0.06] my-6" />

          {/* Per-platform breakdown */}
          <div className="space-y-4 text-[13px] text-neutral-300">
            {PLATFORMS.map(({ key, label, color, svgIcon }) => {
              const s = getPlatStats(key);
              return (
                <div key={key} className="grid grid-cols-12 items-center">
                  <div className="col-span-5 flex items-center gap-2.5">
                    {key === "twitter" ? (
                      <svg viewBox="0 0 300 300" className="w-4 h-4 flex-shrink-0" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66" />
                      </svg>
                    ) : (
                      <img src={svgIcon} alt={label} className="w-4 h-4 object-contain shrink-0" />
                    )}
                    <span className="font-semibold text-white">{label}</span>
                  </div>
                  <div className="col-span-4 font-bold text-white text-base">${s.costVal.toFixed(2)}</div>
                  <div className={`col-span-3 text-right font-bold text-xs ${s.isUp ? "text-emerald-400" : "text-rose-400"}`}>
                    {s.trendText}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Today's quick summary */}
          <div className="mt-5 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-between text-xs text-neutral-400 font-semibold">
            <span className="tracking-wider uppercase text-[10px]">Today</span>
            <span>{todayPosts} posts · {todayVideosCount} videos</span>
          </div>

          {/* Real-data chart — all platforms combined */}
          <div className="w-full space-y-3 mt-6 border-t border-white/[0.06] pt-5">
            <div className="relative w-full h-[110px]">
              {hasChartData ? (
                <svg
                  width="100%"
                  height={110}
                  viewBox="0 0 320 110"
                  preserveAspectRatio="none"
                  className="overflow-visible"
                >
                  {/* Yesterday */}
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
                  {/* Today — gradient-like vibrant line */}
                  {todayPath && (
                    <path
                      d={todayPath}
                      fill="none"
                      stroke="#8763e5"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ filter: "drop-shadow(0 0 6px #8763e5)" }}
                    />
                  )}
                </svg>
              ) : (
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
                <span className="w-2 h-2 rounded-full bg-[#8763e5]" />
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
