"use client";

import React, { useRef } from "react";
import { ArrowDown, CheckCircle2 } from "lucide-react";
import { useInView } from "framer-motion";
import BlurGradientText from "@/components/BlurGradientText";
import BorderGlow from "@/components/BorderGlow";

const steps = [
  {
    n: "01",
    label: "Ingest",
    title: "Bring the raw signal.",
    body: "Paste a brief, URL, voice note, competitor post, or messy thought. The system extracts audience, offer, constraints, and context.",
    output: "Context map",
  },
  {
    n: "02",
    label: "Decide",
    title: "Choose the campaign thesis.",
    body: "Strategy agents compare angles, hooks, urgency, channel fit, and proof before a production path is selected.",
    output: "Creative direction",
  },
  {
    n: "03",
    label: "Produce",
    title: "Generate every asset in parallel.",
    body: "Copy, design, and motion work together so a reel, post pack, carousel, email, and thumbnail all feel like one launch.",
    output: "Asset board",
  },
  {
    n: "04",
    label: "Approve",
    title: "Edit like a creative director.",
    body: "Review one board, branch variants, rewrite tone, adjust visuals, or approve the full campaign without jumping tools.",
    output: "Final campaign",
  },
  {
    n: "05",
    label: "Publish",
    title: "Ship native, not copied over.",
    body: "Scheduling, captions, ratios, channel rules, and distribution timing are handled per platform.",
    output: "Live rollout",
  },
  {
    n: "06",
    label: "Learn",
    title: "Feed the next campaign.",
    body: "Performance data updates the brand playbook, improving formats, cadence, and audience assumptions.",
    output: "Smarter brief",
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  return (
    <section ref={sectionRef} className="relative overflow-hidden border-t border-black/5 bg-white py-28 md:py-36" data-testid="how-it-works-section">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,rgba(0,0,0,0.012)_1px,transparent_1px),linear-gradient(180deg,rgba(0,0,0,0.012)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(135,99,229,0.03)_0%,transparent_70%)]" />
      
      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <BlurGradientText
              text="Set the strategy, and the swarm handles the rest."
              animateBy="words"
              direction="bottom"
              delay={80}
              colors={['#000000', '#000000', '#000000']}
              animationSpeed={4}
              className="font-sans font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-left justify-start text-black"
            />
          </div>
          <p className="text-lg leading-8 text-black/60 lg:col-span-4 lg:col-start-9 font-sans">
            Each step produces a concrete artifact. That makes the experience feel less like prompting and more like operating a private creative studio.
          </p>
        </div>

        <div className="mt-16 grid gap-4 lg:grid-cols-6">
          {steps.map((step, index) => (
            <BorderGlow
              key={step.n}
              animated={isInView}
              animationDelay={index * 220}
              edgeSensitivity={0}
              glowColor="256 73 64"
              backgroundColor="#120F17"
              borderRadius={28}
              glowRadius={80}
              glowIntensity={3.0}
              colors={['#d79de4', '#8763e5', '#53099d']}
              className="lg:min-h-[360px] transition duration-500 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(135,99,229,0.08)] border-none"
            >
              <div className="flex flex-col h-full justify-between p-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-black text-5xl text-[#8763e5]/90 transition-colors">{step.n}</span>
                    {index < steps.length - 1 && <ArrowDown size={18} className="text-white/20 lg:rotate-[-90deg]" />}
                  </div>
                  <div className="mt-9 font-sans font-bold text-[10px] uppercase tracking-[0.22em] text-[#d79de4]">{step.label}</div>
                  <h3 className="mt-4 font-sans font-bold text-xl sm:text-2xl leading-tight text-white tracking-tight">{step.title}</h3>
                  <p className="mt-5 text-sm leading-6 text-white/60 font-sans">{step.body}</p>
                </div>
                <div className="mt-7 flex items-center gap-2 text-sm text-[#d79de4] font-sans font-semibold">
                  <CheckCircle2 size={16} className="text-[#8763e5]" />
                  {step.output}
                </div>
              </div>
            </BorderGlow>
          ))}
        </div>
      </div>
    </section>
  );
}
