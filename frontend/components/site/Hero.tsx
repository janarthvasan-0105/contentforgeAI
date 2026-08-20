"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Download, Sparkles } from "lucide-react";
import BlurGradientText from "@/components/BlurGradientText";
import SplashCursor from "@/components/SplashCursor";
import AgentsMegaMenu from "@/components/site/AgentsMegaMenu";
import Logo from "./Logo";

export default function Hero() {
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);

  return (
    <div className="min-h-screen w-full bg-white flex flex-col relative">
      <SplashCursor
        DENSITY_DISSIPATION={3.5}
        VELOCITY_DISSIPATION={2}
        PRESSURE={0.1}
        CURL={3}
        SPLAT_RADIUS={0.2}
        SPLAT_FORCE={6000}
        COLOR_UPDATE_SPEED={10}
        SHADING
        RAINBOW_MODE={false}
        COLOR="#53099d"
      />
      {/* Nav */}
      <header className="w-full flex items-center justify-between px-8 py-5 border-b border-black/5 relative z-50 bg-white">
        <Link href="/" className="flex items-center hover:opacity-90 transition">
          <Logo className="text-[22px]" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[15px] text-black/70">
          <NavItem label="Product" hasDropdown />
          <NavItem 
            label="Agents" 
            hasDropdown 
            isActive={activeMegaMenu === 'Agents'}
            onClick={() => setActiveMegaMenu(activeMegaMenu === 'Agents' ? null : 'Agents')}
          />
          <NavItem label="Pricing" href="/#pricing" />
          <NavItem label="Blog" href="/blog" />
          <NavItem label="Resources" hasDropdown />
        </nav>

        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-full bg-black text-white text-[14px] font-medium px-5 py-2.5 hover:bg-black/85 transition"
        >
          Get Started
          <Download size={15} />
        </Link>

        <AgentsMegaMenu isOpen={activeMegaMenu === 'Agents'} />
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="flex items-center gap-2 mb-8 text-black/50 opacity-80">
          <Sparkles size={18} className="text-[#8763e5]" />
          <Logo className="text-[17px]" />
        </div>

        <BlurGradientText
          text="Ship content at the speed of thought"
          animateBy="words"
          direction="bottom"
          delay={80}
          colors={['#d79de4', '#8763e5', '#d79de4']}
          animationSpeed={4}
          className="text-[44px] sm:text-[64px] lg:text-[80px] leading-[1.03] font-bold tracking-tight max-w-[1100px] justify-center text-center"
        />

        <div className="flex items-center gap-3 mt-10">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-black text-white text-[15px] font-medium px-6 py-3.5 hover:bg-black/85 transition"
          >
            Start Creating
          </Link>
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 rounded-full bg-black/[0.04] text-black text-[15px] font-medium px-6 py-3.5 hover:bg-black/[0.07] transition"
          >
            Explore Agents
          </Link>
        </div>
      </main>
    </div>
  );
}

function NavItem({ 
  label, 
  hasDropdown, 
  isActive, 
  onClick,
  href 
}: { 
  label: string; 
  hasDropdown?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  if (href) {
    return (
      <Link href={href} className={`flex items-center gap-1 transition hover:text-black`}>
        {label}
      </Link>
    );
  }
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-1 transition ${isActive ? 'text-[#0A5CFF]' : 'hover:text-black'}`}
    >
      {label}
      {hasDropdown && <ChevronDown size={14} className={isActive ? 'text-[#0A5CFF]/70' : 'text-black/40'} />}
    </button>
  );
}

