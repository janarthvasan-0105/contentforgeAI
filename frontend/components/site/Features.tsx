"use client";

import React from "react";
import { BarChart3, Clapperboard, FileText, GitBranch, Image as ImageIcon, Radio, Sparkles, Wand2 } from "lucide-react";
import ScrollFloat from "../ScrollFloat";

const capabilities = [
  {
    icon: FileText,
    eyebrow: "Voice engine",
    title: "Copy that sounds like you, not the internet.",
    body: "Feed ContentForge examples of your best writing and every campaign inherits your cadence, objections, proof points, and preferred calls to action.",
  },
  {
    icon: ImageIcon,
    eyebrow: "Visual system",
    title: "Campaign art with a memory.",
    body: "Thumbnails, carousels, hero graphics, and social visuals stay inside your palette, type system, and composition rules across every channel.",
  },
  {
    icon: Clapperboard,
    eyebrow: "Motion desk",
    title: "Short-form video without the production drag.",
    body: "Storyboards, hooks, scene beats, captions, and export ratios are prepared together so reels and shorts feel native, not repurposed.",
  },
  {
    icon: Radio,
    eyebrow: "Distribution",
    title: "Publish natively where your audience lives.",
    body: "X, LinkedIn, Instagram, TikTok, YouTube, newsletters, blogs, and webhooks get channel-specific assets from one approved campaign board.",
  },
  {
    icon: GitBranch,
    eyebrow: "Orchestration",
    title: "Agents critique before you ever review.",
    body: "Research, strategy, copy, art, video, and publishing agents work in parallel, challenge weak angles, and converge on a stronger launch plan.",
  },
  {
    icon: BarChart3,
    eyebrow: "Learning loop",
    title: "Every campaign updates the playbook.",
    body: "Performance data feeds the next brief, turning hooks, formats, and publishing windows into a compounding advantage.",
  },
];

const proof = ["Research", "Strategy", "Copy", "Design", "Video", "Schedule", "Measure"];

export default function Features() {
  return (
    <section id="process" className="relative overflow-hidden border-t border-white/10 bg-[#090a0d] py-28 md:py-36" data-testid="features-section">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_14%_12%,rgba(212,162,76,0.16),transparent_28%),radial-gradient(circle_at_86%_24%,rgba(141,199,255,0.10),transparent_24%)]" />
      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d4a24c]/25 bg-[#d4a24c]/8 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#d4a24c]">
              <Sparkles size={14} />
              Campaign engine
            </div>
            <ScrollFloat
              textClassName="font-display text-5xl italic leading-[0.98] tracking-tight text-[#fff7e8] sm:text-6xl lg:text-7xl"
              animationDuration={1}
              ease="back.inOut(2)"
              scrollStart="center bottom+=50%"
              scrollEnd="bottom bottom-=40%"
              stagger={0.03}
            >
              The whole content floor, compressed into one system.
            </ScrollFloat>
          </div>
          <div className="lg:pb-3">
            <p className="max-w-xl text-lg leading-8 text-white/62">
              The premium feel should not stop after the opening scene. ContentForge becomes an operating layer for content: strategy, production, approvals, publishing, and learning all connected.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {proof.map((item) => (
                <span key={item} className="rounded-full border border-white/12 bg-white/[0.035] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/54">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-[28px] border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <article key={item.eyebrow} className="group relative min-h-[310px] bg-[#0d0f14]/95 p-7 transition duration-500 hover:bg-[#12151d] md:p-8" data-testid={`feature-card-${index}`}>
                <div className="absolute inset-x-8 top-0 h-px origin-left scale-x-0 bg-[#d4a24c] transition-transform duration-500 group-hover:scale-x-100" />
                <div className="flex items-start justify-between gap-6">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#d4a24c] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition group-hover:-translate-y-1 group-hover:border-[#d4a24c]/40">
                    <Icon size={20} />
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.22em] text-white/24">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="mt-10 font-mono text-[10px] uppercase tracking-[0.28em] text-[#d4a24c]/80">{item.eyebrow}</div>
                <h3 className="mt-4 max-w-sm font-display text-3xl italic leading-[1.05] tracking-tight text-white">{item.title}</h3>
                <p className="mt-5 max-w-sm text-sm leading-7 text-white/56">{item.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
