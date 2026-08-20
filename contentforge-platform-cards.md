# ContentForge AI — Platform Stat Cards (4 cards)

Replaces the single "Total packages" card with 4 identical-structure cards, one per platform: **Instagram, YouTube, LinkedIn, Twitter**. Each card is scoped entirely to its own platform's data — no cross-platform numbers on any card.

---

## Shared card structure (applies to all 4)

```
┌──────────────────────────────────────┐
│  {Platform name}                ⓘ     │
│                                        │
│  $  {platform total spend}   ↑/↓ {%}  │
│                                        │
│  Posts     {count}   ${posts_cost}    │
│  Videos    {count}   ${videos_cost}   │
│                                        │
│  [ mini line chart: Yesterday vs Today ]│
│  12 AM   8 AM   4 PM   12 AM            │
│  ● Yesterday   ● Today                  │
└──────────────────────────────────────┘
```

**Field definitions:**
1. **Header** — platform name (no "Total packages" label; each card is named after its platform) + ⓘ info icon (tooltip: "Estimated cost for {platform} — posts and videos generated").
2. **Big $ figure** — total spend for that platform alone: `(image_count × 0.25) + (video_count × 2.00)`, scoped to `platform = '{platform}'`.
3. **Trend badge** — % change in that platform's spend, today vs yesterday. Green ↑ / red ↓, same style as reference image.
4. **Posts row** — total post (image) count for this platform + its dollar cost (`image_count × 0.25`).
5. **Videos row** — total video count for this platform + its dollar cost (`video_count × 2.00`).
6. **Mini chart** — same yesterday-vs-today line chart style as the reference, but plotting only this platform's spend/activity across the day.
7. No "View report" button (consistent with earlier direction).

---

## 1. Instagram card

```
┌──────────────────────────────────────┐
│  Instagram                       ⓘ    │
│                                        │
│  $  38.60              ↑ 7.2%         │
│                                        │
│  Posts     104          $26.00        │
│  Videos    6.3          $12.60        │
│                                        │
│  [chart: Instagram, Yesterday vs Today]│
│  12 AM   8 AM   4 PM   12 AM            │
│  ● Yesterday   ● Today                  │
└──────────────────────────────────────┘
```
*(Counts above are illustrative — use real `image_count`/`video_count` sums once tracked. Video count must be a whole number; shown as clean integers in production, e.g. Posts: 104, Videos: 6.)*

**Query:**
```sql
select 
  sum(image_count) as posts_count,
  sum(video_count) as videos_count,
  sum(image_count * 0.25) as posts_cost,
  sum(video_count * 2.00) as videos_cost,
  sum((image_count * 0.25) + (video_count * 2.00)) as total_cost
from content_packages
where user_id = auth.uid() and platform = 'instagram';
```

---

## 2. YouTube card

```
┌──────────────────────────────────────┐
│  YouTube                         ⓘ    │
│                                        │
│  $  52.10              ↓ 2.2%         │
│                                        │
│  Posts     18           $4.50         │
│  Videos    24            $47.60       │
│                                        │
│  [chart: YouTube, Yesterday vs Today]  │
│  12 AM   8 AM   4 PM   12 AM            │
│  ● Yesterday   ● Today                  │
└──────────────────────────────────────┘
```

**Query:**
```sql
select 
  sum(image_count) as posts_count,
  sum(video_count) as videos_count,
  sum(image_count * 0.25) as posts_cost,
  sum(video_count * 2.00) as videos_cost,
  sum((image_count * 0.25) + (video_count * 2.00)) as total_cost
from content_packages
where user_id = auth.uid() and platform = 'youtube';
```

---

## 3. LinkedIn card

```
┌──────────────────────────────────────┐
│  LinkedIn                        ⓘ    │
│                                        │
│  $  21.90              ↑ 1.0%         │
│                                        │
│  Posts     56           $14.00        │
│  Videos    3.95          $7.90        │
│                                        │
│  [chart: LinkedIn, Yesterday vs Today] │
│  12 AM   8 AM   4 PM   12 AM            │
│  ● Yesterday   ● Today                  │
└──────────────────────────────────────┘
```
*(Video count should resolve to a clean integer, e.g. 4, in production — shown here only to illustrate the formula.)*

**Query:**
```sql
select 
  sum(image_count) as posts_count,
  sum(video_count) as videos_count,
  sum(image_count * 0.25) as posts_cost,
  sum(video_count * 2.00) as videos_cost,
  sum((image_count * 0.25) + (video_count * 2.00)) as total_cost
from content_packages
where user_id = auth.uid() and platform = 'linkedin';
```

---

## 4. Twitter card

```
┌──────────────────────────────────────┐
│  Twitter                         ⓘ    │
│                                        │
│  $  15.80              ↑ 3.4%         │
│                                        │
│  Posts     47           $11.75        │
│  Videos    2            $4.00         │
│                                        │
│  [chart: Twitter, Yesterday vs Today]  │
│  12 AM   8 AM   4 PM   12 AM            │
│  ● Yesterday   ● Today                  │
└──────────────────────────────────────┘
```

**Query:**
```sql
select 
  sum(image_count) as posts_count,
  sum(video_count) as videos_count,
  sum(image_count * 0.25) as posts_cost,
  sum(video_count * 2.00) as videos_cost,
  sum((image_count * 0.25) + (video_count * 2.00)) as total_cost
from content_packages
where user_id = auth.uid() and platform = 'twitter';
```

---

## Today vs Yesterday (per platform, for trend badge + mini chart)

Same formula as the Total Packages card, but with a `platform` filter added:

```sql
select 
  sum((image_count * 0.25) + (video_count * 2.00)) 
    filter (where created_at::date = current_date) as today_cost,
  sum((image_count * 0.25) + (video_count * 2.00)) 
    filter (where created_at::date = current_date - 1) as yesterday_cost
from content_packages
where user_id = auth.uid() and platform = '{platform}';
```

**Trend % formula:**
```
trend_percent = ((today_cost - yesterday_cost) / yesterday_cost) × 100
```
- If `yesterday_cost = 0` and `today_cost > 0`, show "New" instead of dividing by zero.
- Round to 1 decimal place for display.

---

## Layout note

These 4 cards replace the single Total Packages card in the stats strip, arranged side by side (or 2×2 on smaller screens). If an overall total is still needed elsewhere, it can be derived by summing across all 4 platform queries rather than kept as a separate 5th card.
