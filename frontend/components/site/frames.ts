// Sequence of frames — 300 local files in /public/frames/
// Component logic automatically scales to any array length.
export const FRAMES: string[] = Array.from({ length: 300 }, (_, i) => {
  const num = String(i + 1).padStart(3, "0");
  return `/frames/frame-${num}.jpg`;
});

// Narrative captions timed to scroll progress (0 → 1)
export const CAPTIONS = [
  {
    at: 0.02,
    until: 0.28,
    eyebrow: "01 — The Idea",
    title: "One line. One link. One brief.",
    body: "Drop a raw thought into an empty studio. ContentForge takes it from here — no team, no timeline, no scripts.",
  },
  {
    at: 0.28,
    until: 0.58,
    eyebrow: "02 — The Swarm",
    title: "Six agents. One hive mind.",
    body: "Researcher, strategist, copywriter, art director, video producer and distributor collaborate in real time — synthesizing your idea into a full campaign.",
  },
  {
    at: 0.58,
    until: 0.85,
    eyebrow: "03 — Action",
    title: "Text. Images. Video. Rendered.",
    body: "A cinematic package emerges — long-form posts, thumbnails, reels, ad creatives — all on-brand, all on-message, all in minutes.",
  },
  {
    at: 0.85,
    until: 1.01,
    eyebrow: "04 — Distribution",
    title: "Live on every channel.",
    body: "Scheduled and published to X, LinkedIn, Instagram, YouTube, TikTok and your blog — measured, iterated, optimized by the swarm.",
  },
];
