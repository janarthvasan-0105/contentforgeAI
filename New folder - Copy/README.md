"# ContentForge AI — Editorial Redesign

A complete visual overhaul of your ContentForge AI in the **Stripe / Notion editorial** aesthetic.

## What changed (visual direction)

| Before | After |
|---|---|
| Dark glass UI with teal accents | Warm cream paper (#FAF7F2) with terracotta (#B8482B) accent |
| Emoji icons (📸 🎉 🌐) | Clean Lucide line icons |
| Generic Inter everywhere | **Instrument Serif** (editorial) + **Inter Tight** (UI) + **JetBrains Mono** (labels) |
| Flat dark cards | Hairline-bordered paper panels with warm shadows |
| Heavy \"Generate Content Package\" heading | Editorial italic accent: *Generate a **content package**, crafted by quiet machines.* |
| No entrance animation | Stripe-style particle constellation + arc draw + serif wordmark reveal (~3s) |

## Live demo

A fully working JSX demo is running in `/app/frontend/src` — open the preview URL to see the design in action including the entrance animation.

## How to apply to your Next.js codebase

### 1. Add fonts & design tokens
Open your `app/globals.css` and paste the contents of **`globals.css.snippet`** at the top
(after Tailwind's `@tailwind base/components/utilities` directives).

### 2. Drop in the intro animation
Copy **`IntroAnimation.tsx`** to `components/IntroAnimation.tsx`.
Use it in your `app/layout.tsx` or root client component:

```tsx
\"use client\";
import { useState } from \"react\";
import IntroAnimation from \"@/components/IntroAnimation\";

export default function ClientShell({ children }) {
  const [ready, setReady] = useState(false);
  return (
    <>
      {!ready && <IntroAnimation onDone={() => setReady(true)} />}
      {children}
    </>
  );
}
```

### 3. Replace emoji icons with Lucide icons
Install `lucide-react` (you may already have it) and replace the `PLATFORM_ICONS` /
`TONE_ICONS` maps in `page.tsx`:

```tsx
import {
  Instagram, Youtube, Linkedin, Twitter,
  GraduationCap, Smile, Briefcase, BookOpen, Flame,
  FileText, Smartphone, Globe,
} from \"lucide-react\";

const PLATFORM_ICONS = {
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  twitter: Twitter,
};

const TONE_ICONS = {
  educational: GraduationCap,
  funny: Smile,
  professional: Briefcase,
  storytelling: BookOpen,
  motivational: Flame,
};

// usage: const Icon = PLATFORM_ICONS[p]; <Icon size={16} strokeWidth={1.75} />
```

### 4. Swap class names
| Old class | New class |
|---|---|
| `glass-pill` | `cf-pill` |
| `glass-pill-active text-teal-300` | `cf-pill cf-pill-active` |
| `bg-gradient-to-br from-... to-...` | `surface-paper` |
| `text-teal-400` / `text-teal-300` | `text-[color:var(--cf-rust)]` |

### 5. Update headlines
Wrap accent words in italic + terracotta:

```tsx
<h1 className=\"font-serif\" style={{ fontSize: 72, lineHeight: 0.96 }}>
  Generate a{\" \"}
  <span style={{ fontStyle: \"italic\", color: \"var(--cf-rust)\" }}>content package</span>,
  <br />
  crafted by quiet machines.
</h1>
```

### 6. Reference component files (in `/app/frontend/src/components/`)
These are React .jsx — rename to .tsx and add types for Next.js:
- `AppHeader.jsx` → top navigation
- `ContentBriefForm.jsx` → left brief panel (form)
- `PreviewCanvas.jsx` → right preview / loading / result panel
- `IntroAnimation.jsx` → already converted to .tsx in this folder

## Design tokens (CSS variables)

```css
/* Warm paper */
--cf-cream:   #FAF7F2   /* page bg */
--cf-paper:   #FFFFFF   /* card bg */
--cf-ink:     #1C1917   /* primary text & buttons */
--cf-muted:   #78716C   /* secondary text */
--cf-line:    #E7E1D9   /* hairline borders */

/* Terracotta accent */
--cf-rust:      #B8482B  /* primary accent — italic words, focus rings, CTAs */
--cf-rust-deep: #8B3413
--cf-rust-soft: #DA6A48
--cf-rust-bg:   #FBEEE7  /* tinted background pills */

/* Secondary */
--cf-gold: #B45309
```

## Type scale

| Use | Font | Size |
|---|---|---|
| Hero display | Instrument Serif | 72-88px |
| Section headings | Instrument Serif | 30-38px |
| Body | Inter Tight 400 | 14-17px |
| Labels / eyebrows | JetBrains Mono 500 | 11px (uppercase, 0.16em tracking) |

## Why this works

1. **Warm cream paper** ≠ AI-slop white. It feels like a magazine.
2. **Serif italic accent words** create the Stripe / Notion \"hand-crafted\" feeling — far from generic SaaS.
3. **Terracotta** is uncommon as a brand color and reads as confident + warm, not techy.
4. **Mono labels with numbering (01 — PURPOSE)** add editorial structure without screaming.
5. **Hairline borders + warm shadows** = polished, never cluttered.
"