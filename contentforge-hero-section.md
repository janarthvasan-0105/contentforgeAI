# ContentForge AI — Hero Section (Antigravity-style layout, light theme, no particles)

Same structural DNA as the reference (nav → small eyebrow logo → huge centered
headline → two pill CTAs), light theme, clean background — no particle effect.
Copy is original to ContentForge, not copied from Google's.

Assumed path: `components/Hero.tsx`, used inside `app/page.tsx`.

---

## `components/Hero.tsx`

```tsx
import Link from "next/link";
import { ChevronDown, Download, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      {/* Nav */}
      <header className="w-full flex items-center justify-between px-8 py-5 border-b border-black/5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-[#0A5CFF]" />
          <span className="text-[17px] font-medium text-black">
            ContentForge <span className="text-black/50 font-normal">AI</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-[15px] text-black/70">
          <NavItem label="Product" hasDropdown />
          <NavItem label="Agents" hasDropdown />
          <NavItem label="Pricing" />
          <NavItem label="Blog" />
          <NavItem label="Resources" hasDropdown />
        </nav>

        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-full bg-black text-white text-[14px] font-medium px-5 py-2.5 hover:bg-black/85 transition"
        >
          Get Started
          <Download size={15} />
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="flex items-center gap-2 mb-8 text-black/50">
          <Sparkles size={18} className="text-[#0A5CFF]" />
          <span className="text-[15px]">
            ContentForge <span className="font-medium text-black/70">AI</span>
          </span>
        </div>

        <h1 className="text-[44px] sm:text-[64px] lg:text-[80px] leading-[1.03] font-bold tracking-tight text-black max-w-[1100px]">
          Ship content at the
          <br />
          speed of thought
        </h1>

        <div className="flex items-center gap-3 mt-10">
          <Link
            href="/signup"
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

function NavItem({ label, hasDropdown = false }: { label: string; hasDropdown?: boolean }) {
  return (
    <button className="flex items-center gap-1 hover:text-black transition">
      {label}
      {hasDropdown && <ChevronDown size={14} className="text-black/40" />}
    </button>
  );
}
```

---

## Notes

- **No particle/background effect** — plain `bg-white`, exactly as requested.
- Nav dropdowns (Product / Agents / Resources) are stubbed as buttons with a chevron
  only — wire up actual dropdown menus (e.g. Radix `DropdownMenu`) once you know
  what lives in each.
- Headline uses your existing `#0A5CFF` accent only on the small eyebrow icon/logo —
  everything else stays pure black/white to match the reference's restraint.
- `lucide-react` icons (`Download`, `Sparkles`, `ChevronDown`) — already in your
  allowed component libraries.
- Swap the `<div className="h-6 w-6 rounded-md bg-[#0A5CFF]" />` placeholder for
  your real logomark SVG when you have one.
