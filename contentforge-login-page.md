# ContentForge AI — Login Page (Video-BG Split Layout)

Reskin of your reference design (isometric depot scene → looping video), adapted for
**sign in** instead of sign up, matching the dark blue/black palette 1:1.

Assumed path: `app/login/page.tsx` (App Router). If your app actually uses the Pages
Router, just move the component into `pages/login.tsx` and drop the `"use client"` line.

---

## 1. Video spec — what to generate

Measuring the reference panel: it's **~570px wide × ~577px tall inside the card**,
i.e. almost square but slightly portrait, and on real breakpoints that left panel
stretches to fill the full card height (desktop) or the full screen (mobile, stacked).

Generate the video **portrait**, not square or landscape, so `object-fit: cover` can
crop it safely into both a tall desktop panel and a full-bleed mobile hero without
ever showing letterboxing:

| Setting | Value |
|---|---|
| **Resolution** | **1080 × 1920** (9:16 portrait) |
| Duration | 6–10s |
| Loop | Seamless (first & last frame should match — ask Veo3 for "seamless loop") |
| Motion | Slow, ambient — gentle camera drift/orbit around the isometric scene, no hard cuts |
| Audio | None needed (video is rendered `muted`) |
| Format | `.mp4` (H.264) — smallest reliable file for autoplay across browsers |
| Optional fallback | Export one frame as `.jpg`/`.webp` for the `poster` attribute |

Drop the exported file at `public/videos/login-bg.mp4` (+ optional `public/videos/login-bg.jpg` poster).

---

## 2. `app/login/page.tsx`

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050506] p-6">
      <div className="w-full max-w-[980px] rounded-[28px] overflow-hidden border border-white/10 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] flex flex-col md:flex-row bg-[#0a0a0d]">

        {/* Left — video panel */}
        <div className="relative w-full md:w-[48%] aspect-square md:aspect-auto md:min-h-[640px] overflow-hidden">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/videos/login-bg.mp4"
            poster="/videos/login-bg.jpg"
            autoPlay
            muted
            loop
            playsInline
          />
          {/* subtle vignette so the form side reads clean at the seam */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0a0a0d]/40" />
        </div>

        {/* Right — form panel */}
        <div className="w-full md:w-[52%] flex flex-col justify-center px-8 py-14 sm:px-14">
          <h1 className="text-white text-[32px] font-medium tracking-tight mb-2">
            Sign in
          </h1>
          <p className="text-white/50 text-[14px] leading-relaxed mb-10">
            Welcome back to ContentForge AI. Sign in to your workspace to
            keep shipping content.
          </p>

          <form className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-white/70 text-[13px]">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="h-12 rounded-xl bg-white/[0.06] border border-white/10 px-4 text-white text-[14px] placeholder:text-white/30 outline-none focus:border-[#0A5CFF] focus:ring-1 focus:ring-[#0A5CFF]/60 transition"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-white/70 text-[13px]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[13px] text-[#3B82F6] hover:text-[#5B93F5] transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 pr-12 text-white text-[14px] placeholder:text-white/30 outline-none focus:border-[#0A5CFF] focus:ring-1 focus:ring-[#0A5CFF]/60 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-[12px] transition"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 select-none cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/20 bg-white/[0.06] accent-[#0A5CFF]"
              />
              <span className="text-white/60 text-[13px]">Remember me</span>
            </label>

            <button
              type="submit"
              className="h-12 rounded-xl bg-[#0A5CFF] hover:bg-[#0B52E0] text-white text-[14px] font-medium transition shadow-[0_8px_30px_-8px_rgba(10,92,255,0.6)]"
            >
              Sign In
            </button>
          </form>

          <p className="text-white/50 text-[13px] mt-10">
            New to ContentForge?{" "}
            <Link href="/signup" className="text-[#3B82F6] hover:text-[#5B93F5] transition">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 3. Notes

- **Replacing your existing file**: overwrite whatever currently lives at
  `app/login/page.tsx` with the block above. If your project already has a shared
  `<Input>` / `<Button>` component set, swap the raw `<input>`/`<button>` markup for
  those instead of duplicating styles.
- **Colors used** (matches the reference, not the ContentForge cyan-blue brand, per your call):
  `#050506` page bg · `#0a0a0d` card bg · `#0A5CFF` primary action · `#3B82F6` link text.
- **Mobile**: panel stacks (video on top, form below) via the `md:` breakpoint —
  test that the 9:16 video still reads fine cropped to a short `aspect-square` band on small screens; if it feels too cropped on mobile, drop `aspect-square` for `h-[280px]` instead.
- Video autoplay requires `muted` + `playsInline` — both are already set, so this'll autoplay on iOS Safari too.
