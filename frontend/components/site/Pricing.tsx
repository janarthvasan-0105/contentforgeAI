import React, { useRef } from "react";
import Link from "next/link";
import { Check, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useInView } from "framer-motion";
import ScrollFloat from "../ScrollFloat";
import BorderGlow from "@/components/BorderGlow";
import BlurGradientText from "@/components/BlurGradientText";

const tiers = [
  {
    name: "Solo",
    price: "29",
    label: "Creator operating system",
    tag: "For founders and creators who need consistent output without hiring a team.",
    features: ["20 campaigns per month", "Copy + image agents", "3 connected channels", "Brand voice memory", "Community support"],
    cta: "Start solo",
    highlight: false,
  },
  {
    name: "Studio",
    price: "129",
    label: "Most teams start here",
    tag: "For companies shipping weekly launches, thought leadership, and social campaigns.",
    features: ["Unlimited campaigns", "Full 6-agent swarm", "Video scripts + reel packs", "9 channels + scheduling", "Approval board", "Priority generation queue"],
    cta: "Start studio",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    label: "Private content floor",
    tag: "For brands with custom workflows, controls, integrations, and security needs.",
    features: ["Dedicated agent setup", "Custom publishing integrations", "SSO and advanced roles", "Onboarding and governance", "Private model routing"],
    cta: "Talk to us",
    highlight: false,
  },
];

export default function Pricing() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  return (
    <section ref={sectionRef} id="pricing" className="relative overflow-hidden bg-white pt-12 pb-28 md:pt-16 md:pb-36" data-testid="pricing-section">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_14%,rgba(135,99,229,0.04),transparent_34%)]" />
      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#8763e5]/25 bg-[#8763e5]/8 px-3 py-2 font-sans font-bold text-[11px] uppercase tracking-[0.22em] text-[#8763e5]">
            <Zap size={14} />
            Pricing
          </div>
          <BlurGradientText
            text="Pay for shipped campaigns, not headcount."
            animateBy="words"
            direction="bottom"
            delay={80}
            colors={['#000000', '#000000', '#000000']}
            animationSpeed={4}
            className="font-sans font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight justify-center text-center text-black"
          />
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-black/60 font-sans">
            Start lean, then scale into a full autonomous content operation when the output becomes a growth channel.
          </p>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {tiers.map((tier, index) => (
            <BorderGlow
              key={tier.name}
              animated={isInView}
              animationDelay={index * 220}
              edgeSensitivity={0}
              glowColor="256 73 64"
              backgroundColor="#120F17"
              borderRadius={28}
              glowRadius={80}
              glowIntensity={3.0}
              colors={['#d79de4', '#8763e5', '#53099d']}
              className="relative flex min-h-[620px] flex-col transition duration-500 hover:-translate-y-1 hover:shadow-[0_15px_45px_rgba(135,99,229,0.12)] border-none"
            >
              <div className="flex flex-col h-full justify-between p-7 md:p-8">
                <div>
                  {tier.highlight && (
                    <div className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-full bg-[#8763e5] px-3 py-1.5 font-sans font-bold text-[10px] uppercase tracking-[0.18em] text-white">
                      <Sparkles size={12} />
                      Best value
                    </div>
                  )}
                  <div className="font-sans font-bold text-[10px] uppercase tracking-[0.24em] text-[#d79de4]">{tier.label}</div>
                  <h3 className="mt-5 font-sans font-bold tracking-tight text-4xl text-white">{tier.name}</h3>
                  <p className="mt-4 min-h-[76px] text-sm leading-7 text-white/50">{tier.tag}</p>
                  <div className="mt-8 flex items-end gap-2">
                    {tier.price !== "Custom" && <span className="mb-2 font-sans text-sm text-white/60">$</span>}
                    <span className="font-sans font-bold tracking-tight text-7xl leading-none text-white">{tier.price}</span>
                    {tier.price !== "Custom" && <span className="mb-3 text-sm text-white/60">/mo</span>}
                  </div>
                  <ul className="mt-9 space-y-4">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-white/70">
                        <Check size={16} className="mt-1 shrink-0 text-[#d79de4]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/login"
                  data-testid={`pricing-cta-${tier.name.toLowerCase()}`}
                  className={`mt-9 inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold transition ${
                    tier.highlight
                      ? "bg-[#8763e5] text-white hover:bg-[#d79de4]"
                      : "border border-white/20 text-white/80 hover:border-[#8763e5]/60 hover:text-[#d79de4]"
                  }`}
                >
                  {tier.cta} -&gt;
                </Link>
              </div>
            </BorderGlow>
          ))}
        </div>

        <div className="mt-8 grid gap-4 rounded-[24px] border border-black/5 bg-black/[0.02] p-5 md:grid-cols-3 md:p-6">
          {["No card required to test the workflow", "Cancel before the next billing cycle", "Brand assets and drafts stay exportable"].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-neutral-600 font-sans">
              <ShieldCheck size={17} className="shrink-0 text-[#8763e5]" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
