"use client";

import React from "react";
import { Activity, Aperture, Brain, Clapperboard, FileText, Megaphone, Search, Send } from "lucide-react";
import ScrollFloat from "../ScrollFloat";

const agents = [
  { name: "Cato", role: "Researcher", status: "Scanning audience language", detail: "18 sources mapped", icon: Search, hue: "#d4a24c" },
  { name: "Vela", role: "Strategist", status: "Selecting launch angle", detail: "3 routes scored", icon: Brain, hue: "#8ecae6" },
  { name: "Orin", role: "Copywriter", status: "Writing hook variants", detail: "12 drafts active", icon: FileText, hue: "#f5f2ea" },
  { name: "Iris", role: "Art director", status: "Building visual system", detail: "24 assets queued", icon: Aperture, hue: "#ffb4a2" },
  { name: "Kade", role: "Video producer", status: "Rendering reel sequence", detail: "Scene 04 of 09", icon: Clapperboard, hue: "#b5e48c" },
  { name: "Nova", role: "Distributor", status: "Preparing channel rollout", detail: "6 channels ready", icon: Send, hue: "#c9ada7" },
];

const channels = ["LinkedIn", "X", "Instagram", "TikTok", "YouTube", "Newsletter", "Blog", "Webhooks"];

export default function LiveAgents() {
  return (
    <section id="agents" className="relative overflow-hidden border-t border-black/5 bg-white py-28 md:py-36" data-testid="agents-section">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(135,99,229,0.03)_0%,transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#8763e5]">
              <Activity size={14} className="animate-pulse" />
              Live command center
            </div>
          <ScrollFloat
            textClassName="font-sans font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-black"
            animationDuration={1}
            ease="back.inOut(2)"
            scrollStart="center bottom+=50%"
            scrollEnd="bottom bottom-=40%"
            stagger={0.03}
          >
            Six specialists. One calm control room.
          </ScrollFloat>
            <p className="mt-7 max-w-xl text-lg leading-8 text-black/60 font-sans">
              The agent layer should feel premium and operational: clear status, visible ownership, and enough motion to communicate work happening in real time.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {channels.map((channel) => (
                <span key={channel} className="rounded-full border border-black/10 bg-black/5 px-3 py-2 text-sm text-black/60 font-sans">
                  {channel}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-black/5 bg-[#120F17] shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff615c]" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd44]" />
                <span className="h-3 w-3 rounded-full bg-[#00ca4e]" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">campaign.001</span>
            </div>

            <div className="grid gap-px bg-white/10 sm:grid-cols-2">
              {agents.map((agent, index) => {
                const Icon = agent.icon;
                return (
                <article key={agent.name} className="bg-[#1a1721] p-5 transition hover:bg-[#221e2b]" data-testid={`agent-row-${index}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl" style={{ background: `${agent.hue}22`, color: agent.hue }}>
                        <Icon size={18} />
                      </span>
                      <div>
                        <div className="font-sans font-bold text-2xl text-white">{agent.name}</div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">{agent.role}</div>
                      </div>
                    </div>
                    <span className="mt-2 h-2 w-2 rounded-full animate-pulse" style={{ background: agent.hue }} />
                  </div>
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-sans text-white/80">{agent.status}</div>
                    <div className="mt-2 text-xs font-sans text-white/50">{agent.detail}</div>
                  </div>
                </article>
                );
              })}
            </div>

            <div className="border-t border-white/10 bg-[#120F17] p-5">
              <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
                <span>Throughput</span>
                <span>82% complete</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#d79de4] via-[#8763e5] to-[#53099d]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-12 overflow-hidden border-y border-black/5 py-7 group">
        <div className="marquee-track flex whitespace-nowrap font-sans font-black text-5xl text-black/10 md:text-7xl transition-colors duration-500 hover:text-black">
          {Array(2).fill(0).map((_, index) => (
            <span key={index} className="mx-8 flex items-center gap-8">
              Idea - Brief - Strategy - Copy - Design - Video - Publish - Learn
              <Megaphone className="text-[#8763e5]/40" size={34} />
              Idea - Brief - Strategy - Copy - Design - Video - Publish - Learn
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
