import React, { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { useInView } from "framer-motion";
import BlurGradientText from "@/components/BlurGradientText";
import BorderGlow from "@/components/BorderGlow";

const faqs = [
  { q: "Do I need a creative team to use ContentForge?", a: "No. The agent swarm covers research, strategy, copy, design, video preparation, and publishing. You stay in the editor-in-chief seat and approve what ships." },
  { q: "Whose voice do the agents write in?", a: "Yours. Add a few examples of existing content and ContentForge builds a voice memory around tone, cadence, vocabulary, proof style, and calls to action." },
  { q: "What channels does it publish to natively?", a: "The workflow is built for X, LinkedIn, Instagram, TikTok, YouTube, newsletters, blogs, and custom webhooks, with asset formatting handled per channel." },
  { q: "How is video handled?", a: "The motion agent prepares hooks, scripts, storyboards, scene beats, captions, and aspect-ratio cutdowns so video production starts from a coherent campaign system." },
  { q: "Can I stop or edit a campaign mid-run?", a: "Yes. Campaigns are reviewable as boards. You can pause, branch, rewrite, approve individual assets, or ask agents to rework a specific part." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  return (
    <section ref={sectionRef} id="faq" className="relative overflow-hidden border-t border-black/5 bg-white py-28 md:py-36" data-testid="faq-section">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 md:px-10 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#8763e5]/25 bg-[#8763e5]/8 px-3 py-2 font-sans font-bold text-[11px] uppercase tracking-[0.22em] text-[#8763e5]">
            FAQ
          </div>
          <BlurGradientText
            text="Clear answers before you hand over the brief."
            animateBy="words"
            direction="bottom"
            delay={80}
            colors={['#000000', '#000000', '#000000']}
            animationSpeed={4}
            className="font-sans font-bold text-5xl sm:text-6xl leading-[1.05] tracking-tight text-left justify-start text-black"
          />
          <p className="mt-7 text-lg leading-8 text-black/60 font-sans">
            The product should feel powerful, but the buying moment should feel calm. These are the questions users ask before trusting an AI with their brand voice.
          </p>
        </div>

        <BorderGlow
          animated={isInView}
          edgeSensitivity={0}
          glowColor="256 73 64"
          backgroundColor="#120F17"
          borderRadius={28}
          glowRadius={80}
          glowIntensity={3.0}
          colors={['#d79de4', '#8763e5', '#53099d']}
          className="relative flex flex-col w-full shadow-[0_15px_45px_rgba(135,99,229,0.12)] border-none"
        >
          <div className="w-full" data-testid="faq-accordion">
            {faqs.map((faq, index) => {
              const active = open === index;
              return (
                <div key={faq.q} className="border-b border-white/10 last:border-b-0">
                  <button
                    className="flex w-full items-center justify-between gap-6 px-6 py-6 text-left transition hover:bg-white/[0.025] md:px-8"
                    onClick={() => setOpen(active ? null : index)}
                    data-testid={`faq-trigger-${index}`}
                  >
                    <span className="font-sans font-bold text-xl sm:text-2xl leading-tight text-white">{faq.q}</span>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 transition ${active ? "rotate-45 bg-[#8763e5] text-white border-none" : "bg-white/[0.03] text-[#d79de4]"}`}>
                      <Plus size={18} />
                    </span>
                  </button>
                  <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: active ? "220px" : "0px", opacity: active ? 1 : 0 }}>
                    <p className="px-6 pb-7 text-base leading-8 text-white/60 md:px-8 font-sans" data-testid={`faq-content-${index}`}>{faq.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </BorderGlow>
      </div>
    </section>
  );
}
