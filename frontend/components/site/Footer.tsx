import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import Strands from "@/components/Strands";

const columns = [
  { title: "Product", links: ["Features", "Agents", "Pricing", "Changelog"] },
  { title: "Company", links: ["Manifesto", "Careers", "Press kit", "Contact"] },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-black/5 bg-white" data-testid="site-footer">
      {/* Subtle light background glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(135,99,229,0.04),transparent_34%)]" />
      
      <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-24 md:px-10 md:pt-32">
        {/* Top CTA Area (No Box, Strands in between) */}
        <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto px-6">
          <p className="mx-auto text-2xl sm:text-3xl lg:text-4xl font-sans font-bold leading-snug tracking-tight text-neutral-950">
            Your entire content pipeline, automated. Generate viral video ads and high-ranking SEO blogs from a single prompt.
          </p>

          {/* Standalone Strands WebGL Visual Banner (Vertically between text and buttons) */}
          <div className="relative w-full h-[220px] my-6 pointer-events-none select-none">
            <Strands
              colors={["#d075d8", "#610bf3", "#783fa7"]}
              count={4}
              speed={0.2}
              amplitude={1}
              waviness={1.3}
              thickness={0.5}
              glow={2.6}
              taper={4.4}
              spread={2.1}
              intensity={0.55}
              saturation={2}
              opacity={1}
              scale={1.9}
              glass={false}
              refraction={1}
              dispersion={1}
              glassSize={1}
              hueShift={0.47}
            />
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row mt-4">
            <Link href="#choice-section" className="inline-flex min-h-14 items-center gap-2 rounded-full bg-[#8763e5] px-10 text-[17px] font-sans font-bold text-white transition hover:bg-[#53099d] shadow-md shadow-[#8763e5]/20" data-testid="footer-cta-primary">
              Login for free
              <ArrowRight size={20} />
            </Link>
            <Link href="/pricing" className="inline-flex min-h-14 items-center rounded-full border border-black/12 bg-white px-10 text-[17px] font-sans font-semibold text-neutral-700 transition hover:border-[#8763e5] hover:text-[#8763e5] shadow-sm hover:shadow-md" data-testid="footer-cta-secondary">
              Explore pricing plan
            </Link>
          </div>
        </div>


        {/* Footer Navigation (Screenshot Match Layout) */}
        <div className="mt-20 grid gap-10 border-t border-black/5 pt-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <h3 className="font-sans font-bold text-2xl tracking-tight text-neutral-900">Experience liftoff</h3>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <div className="mb-4 font-sans font-bold text-[11px] uppercase tracking-[0.25em] text-neutral-400">{column.title}</div>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm font-sans font-medium text-neutral-500 transition hover:text-[#8763e5]">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Massive Full Width Brand Typography */}
        <div className="w-full text-center py-10 select-none pointer-events-none flex justify-center items-center">
          <div className="font-sans leading-none text-neutral-950 text-[10vw] md:text-[12vw] lg:text-[13vw] flex items-center justify-center tracking-tighter">
            <span className="font-black text-neutral-950">Contentf</span>
            <svg width="0.8em" height="0.8em" viewBox="0 0 100 100" className="mx-[0.02em] relative top-[0.05em] shrink-0">
              <defs>
                <linearGradient id="giantFooterCubeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d79de4"/>
                  <stop offset="100%" stopColor="#8763e5"/>
                </linearGradient>
              </defs>
              <polygon points="50,8 88,28 50,48 12,28" fill="url(#giantFooterCubeGrad)" opacity="0.95"/>
              <polygon points="12,28 50,48 50,92 12,72" fill="url(#giantFooterCubeGrad)" opacity="0.7"/>
              <polygon points="50,48 88,28 88,72 50,92" fill="url(#giantFooterCubeGrad)" opacity="0.55"/>
            </svg>
            <span className="font-black text-neutral-950">rge</span>
            <span className="font-light text-[#8763e5] ml-[0.02em] relative top-[0.03em]">AI</span>
          </div>
        </div>

        {/* Bottom Legal Row */}
        <div className="flex flex-col gap-4 border-t border-black/5 pt-8 font-sans text-xs text-neutral-500 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center hover:opacity-90 transition">
            <div className="flex items-center tracking-[0.3px] text-neutral-900 text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>
              <span className="font-semibold text-neutral-900">Contentf</span>
              <svg width="1.2em" height="1.2em" viewBox="0 0 100 100" className="mx-[0.04em] relative top-[0.05em] shrink-0">
                <defs>
                  <linearGradient id="footerCubeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d79de4"/>
                    <stop offset="100%" stopColor="#8763e5"/>
                  </linearGradient>
                </defs>
                <polygon points="50,8 88,28 50,48 12,28" fill="url(#footerCubeGrad)" opacity="0.95"/>
                <polygon points="12,28 50,48 50,92 12,72" fill="url(#footerCubeGrad)" opacity="0.7"/>
                <polygon points="50,48 88,28 88,72 50,92" fill="url(#footerCubeGrad)" opacity="0.55"/>
              </svg>
              <span className="font-semibold text-neutral-900">rge</span>
              <span className="text-[#8763e5] ml-[0.08em] font-light relative top-[0.03em]">AI</span>
            </div>
          </Link>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#8763e5] transition">About ContentForge</a>
            <a href="#" className="hover:text-[#8763e5] transition">Privacy</a>
            <a href="#" className="hover:text-[#8763e5] transition">Terms</a>
            <a href="#" className="hover:text-[#8763e5] transition">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
