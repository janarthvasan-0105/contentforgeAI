# ContentForge AI — Studio Dashboard Spec

> Replaces the current brief-form landing page. This is the primary authenticated view after login.

---

## 1. Top Bar (unchanged, minor addition)

```
[C] ContentForge                                    [⟳ Refresh]  [⎋ Log Out]
```
- Add a small **user avatar/initials** before Log Out (future: account menu).

---

## 2. Studio Overview (Hero replacement)

**Headline:** "Your Studio, at a *glance*."
**Subtext:** "Everything crafted by quiet machines — organized, tracked, ready to publish."

**Primary CTA (top-right, sticky):** `+ New Generation` → opens the 5-step brief form as a slide-over panel (right-to-left drawer), not a full page.

### Stats Strip
Horizontal row of 5 cards:

| Card | Content |
|---|---|
| Total Packages | Big number + "Generated all-time" |
| Instagram | Count + mini activity bar |
| YouTube | Count + mini activity bar |
| LinkedIn | Count + mini activity bar |
| Twitter | Count + mini activity bar |

Small label under strip: `Powered by multi-agent AI · updated live`

---

## 3. Navigation Tabs (Studio Library)

Horizontal tab bar, sits below the stats strip. Sticky on scroll.

```
[ Overview ] [ Generated Posts ] [ Generated Videos ] [ Captions ] [ Hashtags ] [ Calendar ] [ Research Insights ] [ Audience Painpoints ]
```

Each tab = a filtered view into the same underlying `content_packages` + `content_assets` data, scoped to the logged-in user.

---

### 3.1 Overview Tab (default view)

- **Recent Activity** — last 6 generated packages as cards (thumbnail, platform badge, date, status chips: Script ✓ Visual ✓ Hashtags ✓ Calendar ✓).
- **Platform Breakdown** — donut or bar chart, packages by platform.
- **Quick Insights strip** — 3 small callouts pulled from Research Insights tab (e.g. "Trending topic this week: AI productivity tools").

Empty state:
> **AWAITING BRIEF**
> "Your Studio is empty — for now."
> "Every post you generate lives here. Start your first content package and watch your library grow."
> `[ Generate your first package ]`

---

### 3.2 Generated Posts Tab

Grid of image/carousel posts.

**Card structure:**
```
┌────────────────────────┐
│ [image thumbnail]      │
│ ● Instagram   Jul 6    │
│ "The art of AI writing"│
│ [View] [Download] [Re-generate]
└────────────────────────┘
```

**Filters:** Platform · Date range · Status (draft/published/scheduled)
**Sort:** Newest first / Oldest / Most engagement (future, if analytics connected)

---

### 3.3 Generated Videos Tab

Grid of video cards with **muted autoplay preview on hover** (like the footer-bg style loop).

**Card structure:**
```
┌────────────────────────┐
│ [video loop preview]   │
│ ▶ 0:32   ● YouTube      │
│ "RentIt Hero Cinematic"│
│ Veo3 · 1080p            │
│ [Play] [Download] [Script]
└────────────────────────┘
```

- `[Script]` opens the Video Script (from VideoPromptAgent) in a modal alongside the video.
- Filter: Platform · Duration · Generation model (Veo3 tag for now, future-proofed for more models).

---

### 3.4 Captions Tab

List view (not grid) — captions are text-first.

```
┌──────────────────────────────────────────────┐
│ ● Twitter · Jul 6                              │
│ "Skip the crew. Keep the cinema. 🎬"           │
│ [Copy] [Edit] [Linked post: view →]            │
└──────────────────────────────────────────────┘
```

- `[Linked post]` deep-links back to the parent package in Generated Posts/Videos.
- Group by platform (captions differ in tone/length per platform — Twitter short, LinkedIn longer).

---

### 3.5 Hashtags Tab

Tag-cloud style + list toggle.

- Top row: **Most-used hashtags** as a tag cloud (size = frequency).
- Below: list per package —
```
#AIcontent #IndieCreators #NoCrewNeeded   → linked to package (Jul 6, Instagram)
```
- `[Copy all]` button per package for quick paste into scheduling tools.

---

### 3.6 Calendar Tab

Month-view calendar (like a content calendar tool).

- Each day cell shows small platform-colored dots for scheduled/generated content.
- Click a day → side panel lists all packages tied to that date, with quick status (Draft/Scheduled/Published).
- Toggle: **Month / Week / List view**.
- CTA inside: `+ Schedule a package` (assign an existing generated package to a future date).

---

### 3.7 Research Insights Tab

This surfaces output from your `ResearchAgent`.

**Card structure:**
```
┌────────────────────────────────────┐
│ TOPIC: AI-assisted writing tools    │
│ Generated Jul 6 · Instagram          │
│                                       │
│ Key findings:                        │
│ • Rising search interest (+18% MoM) │
│ • Competitor gap: no video tutorials│
│ • Best posting window: 6–8 PM IST   │
│                                       │
│ [View full research] [Regenerate]   │
└────────────────────────────────────┘
```

- Filter: Topic · Platform · Date
- This tab doubles as justification/context for *why* a package was generated the way it was — good for trust/transparency.

---

### 3.8 Audience Painpoints Tab

Also sourced from ResearchAgent, but focused on audience psychology rather than trend data.

**Card structure:**
```
┌────────────────────────────────────┐
│ AUDIENCE: Indie creators & founders │
│                                       │
│ Painpoints identified:               │
│ • "Can't afford a production crew"  │
│ • "Struggle staying consistent"      │
│ • "Don't know what platform to focus"│
│                                       │
│ Suggested angle: cost + speed        │
│ [View source package →]              │
└────────────────────────────────────┘
```

- Grouped by audience segment (if the user has generated for multiple audiences).
- Useful as a standalone strategy reference, not just tied to one package.

---

## 4. New Generation Panel (slide-over, triggered by top-right CTA)

Keeps your existing 5-step brief form exactly as-is:
1. Purpose
2. Platform
3. Topic
4. Target Audience
5. Generation Suggestions

Only change: it's a **drawer**, not the whole page. On submit, it closes and the new package appears at the top of Overview + relevant tab, with a subtle "Generating…" pulse state on its card until agents finish (~30s).

---

## 5. Data Model (Supabase)

### `content_packages`
| column | type | notes |
|---|---|---|
| id | uuid, pk | |
| user_id | uuid, fk → auth.users | |
| platform | text | instagram / youtube / linkedin / twitter |
| purpose | text | general / app_marketing / website_marketing |
| topic | text | |
| target_audience | text | |
| status | text | generating / completed / failed |
| created_at | timestamptz | default now() |
| scheduled_for | timestamptz | nullable, used by Calendar tab |

### `content_assets`
| column | type | notes |
|---|---|---|
| id | uuid, pk | |
| package_id | uuid, fk → content_packages | |
| type | text | script / image / video / caption / hashtags |
| storage_url | text | Supabase storage / CDN |
| metadata | jsonb | duration, dimensions, model used, etc. |

### `research_insights`
| column | type | notes |
|---|---|---|
| id | uuid, pk | |
| package_id | uuid, fk → content_packages | |
| type | text | trend / audience_painpoint |
| summary | text | short bullet summary |
| raw_data | jsonb | full ResearchAgent output |

**Stats strip / tab counts** — always derived live:
```sql
select platform, count(*) 
from content_packages 
where user_id = auth.uid() 
group by platform;
```

---

## 6. Copy Style Guide (for consistency across tabs)

- Section labels: small-caps grey, e.g. `STUDIO LIBRARY`, `RESEARCH INSIGHTS`, `AUDIENCE PAINPOINTS`
- Headlines: serif + one amber italic accent word (matches existing hero style)
- Empty states: always name what the tab does + one clear CTA
- Status chips: consistent everywhere — ✓ green for done, ● amber pulse for generating, ✕ red for failed
