# ContentForge AI — Cost Calculation (Total Packages Card)

## Flat rate table

| Asset type | Rate |
|---|---|
| Image | $0.25 per image |
| Video | $2.00 per video |

These are flat per-unit rates (not token/second-based). Text (script, captions, hashtags) is not charged in this model — only image and video assets count toward spend.

---

## Per-platform calculator

Each platform's spend is calculated the same way:

```
platform_cost = (images_generated_on_platform × $0.25) + (videos_generated_on_platform × $2.00)
```

### Instagram
```
instagram_cost = (instagram_images × 0.25) + (instagram_videos × 2.00)
```

### YouTube
```
youtube_cost = (youtube_images × 0.25) + (youtube_videos × 2.00)
```

### LinkedIn
```
linkedin_cost = (linkedin_images × 0.25) + (linkedin_videos × 2.00)
```

### Twitter
```
twitter_cost = (twitter_images × 0.25) + (twitter_videos × 2.00)
```

---

## All-platforms calculator (Total Packages card)

```
total_cost = instagram_cost + youtube_cost + linkedin_cost + twitter_cost
```

Equivalently, in one pass:
```
total_cost = (total_images_all_platforms × 0.25) + (total_videos_all_platforms × 2.00)
```

---

## Worked example (matches the demo card)

| Platform | Images | Videos | Cost |
|---|---|---|---|
| YouTube | 8 | 22.05 → not applicable* | $52.10 |
| Instagram | 154.4 → not applicable* | — | $38.60 |

*Note: the demo card's numbers ($52.10, $38.60, etc.) were illustrative placeholders, not derived from this rate table. Once real image/video counts are tracked, plug them into the formulas above. Example with clean numbers:

| Platform | Images | Videos | Cost |
|---|---|---|---|
| YouTube | 12 | 20 | (12 × 0.25) + (20 × 2.00) = $43.00 |
| Instagram | 40 | 5 | (40 × 0.25) + (5 × 2.00) = $20.00 |
| LinkedIn | 18 | 2 | (18 × 0.25) + (2 × 2.00) = $8.50 |
| Twitter | 25 | 0 | (25 × 0.25) + (0 × 2.00) = $6.25 |
| **Total** | **95** | **27** | **$77.75** |

---

## Schema addition (Supabase)

Simplify `content_packages` to track raw counts, then compute cost on read (or on write, whichever is preferred):

| column | type | notes |
|---|---|---|
| platform | text | instagram / youtube / linkedin / twitter |
| image_count | int | number of images generated in this package |
| video_count | int | number of videos generated in this package |
| estimated_cost | numeric | `(image_count × 0.25) + (video_count × 2.00)`, computed at generation completion |

---

## SQL — per-platform and total spend

```sql
-- Per-platform cost breakdown
select 
  platform,
  sum(image_count) as total_images,
  sum(video_count) as total_videos,
  sum((image_count * 0.25) + (video_count * 2.00)) as platform_cost
from content_packages
where user_id = auth.uid()
group by platform;

-- All-platforms total cost
select 
  sum((image_count * 0.25) + (video_count * 2.00)) as total_cost
from content_packages
where user_id = auth.uid();

-- Today vs Yesterday cost (for trend %)
select 
  sum((image_count * 0.25) + (video_count * 2.00)) 
    filter (where created_at::date = current_date) as today_cost,
  sum((image_count * 0.25) + (video_count * 2.00)) 
    filter (where created_at::date = current_date - 1) as yesterday_cost
from content_packages
where user_id = auth.uid();
```

---

## Trend % formula (used in card badges)

```
trend_percent = ((today_cost - yesterday_cost) / yesterday_cost) × 100
```

- If `yesterday_cost = 0` and `today_cost > 0`, display as a fixed indicator (e.g. "New") instead of dividing by zero.
- Round to 1 decimal place for display, e.g. `4.1%`.
