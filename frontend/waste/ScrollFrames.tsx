"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { FRAMES, CAPTIONS } from "./frames";

/**
 * Apple-style scroll-pinned frame-by-frame animation.
 * Uses <canvas> for performance instead of 300 stacked <img> tags.
 * - Sticky section 1200vh tall
 * - Progress 0->1 mapped across FRAMES
 * - Active frame drawn to canvas via requestAnimationFrame
 */
export default function ScrollFrames() {
  const wrapRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [totalFrames] = useState(FRAMES.length);
  const currentFrameRef = useRef(0);

  // Preload all images into memory
  useEffect(() => {
    let mounted = true;
    const images: HTMLImageElement[] = [];

    FRAMES.forEach((src, idx) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        if (!mounted) return;
        setLoaded((n) => n + 1);

        // Draw the first frame immediately when it loads
        if (idx === 0 && canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            canvasRef.current.width = img.naturalWidth;
            canvasRef.current.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
          }
        }
      };
      images[idx] = img;
    });

    imagesRef.current = images;
    return () => { mounted = false; };
  }, []);

  // Draw frame to canvas
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[frameIndex];
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to match image dimensions (only if changed)
    if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  }, []);

  // Scroll listener
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = wrapRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = rect.height - vh;
        const scrolled = Math.min(Math.max(-rect.top, 0), total);
        const newProgress = total > 0 ? scrolled / total : 0;
        setProgress(newProgress);

        // Calculate and draw the active frame
        const frameIndex = Math.min(
          Math.floor(newProgress * (totalFrames - 1)),
          totalFrames - 1
        );
        if (frameIndex !== currentFrameRef.current) {
          currentFrameRef.current = frameIndex;
          drawFrame(frameIndex);
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [drawFrame, totalFrames]);

  const activeIndex = Math.min(
    Math.floor(progress * (totalFrames - 1)),
    totalFrames - 1
  );

  const activeCaption =
    CAPTIONS.find((c) => progress >= c.at && progress < c.until) || CAPTIONS[0];

  const loadPct = Math.round((loaded / totalFrames) * 100);

  return (
    <section
      ref={wrapRef}
      className="relative"
      style={{ height: "1200vh" }}
      data-testid="scroll-frames-section"
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        {/* Canvas frame renderer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "contrast(1.05) saturate(0.9)" }}
        />

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: "radial-gradient(120% 80% at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)" }} />
        {/* Bottom gradient for text legibility */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
             style={{ background: "linear-gradient(to top, rgba(10,10,11,0.92) 0%, rgba(10,10,11,0.4) 55%, transparent 100%)" }} />

        {/* Loading indicator */}
        {loaded < totalFrames && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 font-mono text-xs tracking-[0.3em] text-[#d4a24c]"
               data-testid="frames-loading">
            LOADING FRAMES - {loadPct}%
          </div>
        )}

        {/* Cinema chrome - top HUD */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-8 md:px-14 py-6 font-mono text-[10px] md:text-xs tracking-[0.35em] text-[#d4a24c]/80">
          <span>REC * SCENE {String(activeIndex + 1).padStart(2, "0")}/{String(totalFrames).padStart(2, "0")}</span>
          <span>{String(Math.round(progress * 100)).padStart(3, "0")}%</span>
          <span>CONTENTFORGE - CAMPAIGN.001</span>
        </div>

        {/* Cinema chrome - corner brackets */}
        <Corners />

        {/* Caption overlay */}
        <div className="absolute inset-0 z-10 flex items-center pointer-events-none">
          <div className="w-full px-12 md:px-24 mt-20 max-w-4xl">
            <div key={activeCaption.eyebrow} className="fade-up border-l border-white/20 pl-6 md:pl-10">
              <div className="font-sans text-[10px] tracking-[0.2em] uppercase text-white/50 mb-3"
                   data-testid="caption-eyebrow">
                {activeCaption.eyebrow}
              </div>
              <h2 className="font-sans font-light text-2xl md:text-3xl leading-snug text-white tracking-wide"
                  data-testid="caption-title">
                {activeCaption.title}
              </h2>
              <p className="mt-4 max-w-md font-sans font-light text-xs md:text-sm text-white/40 leading-loose"
                 data-testid="caption-body">
                {activeCaption.body}
              </p>
            </div>
          </div>
        </div>

        {/* Progress rail */}
        <div className="absolute bottom-0 inset-x-0 z-20 px-8 md:px-14 pb-6">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] tracking-[0.3em] text-white/40">00:00</span>
            <div className="relative flex-1 h-[2px] bg-white/10 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-[#d4a24c]"
                style={{ width: `${progress * 100}%` }}
                data-testid="scroll-progress-bar"
              />
              {CAPTIONS.map((c, i) => (
                <span key={i}
                      className="absolute top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-white/40"
                      style={{ left: `${c.at * 100}%` }} />
              ))}
            </div>
            <span className="font-mono text-[10px] tracking-[0.3em] text-white/40">00:{String(Math.round(progress * 24)).padStart(2, "0")}</span>
          </div>
        </div>

        {/* Scroll hint - only when at top */}
        {progress < 0.02 && (
          <div className="absolute right-8 md:right-14 top-1/2 -translate-y-1/2 z-20 rotate-90 origin-center">
            <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.4em] text-white/60">
              <span className="w-8 h-[1px] bg-white/60" />
              SCROLL
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Corners() {
  const brackets = [
    "top-6 left-6 border-t border-l",
    "top-6 right-6 border-t border-r",
    "bottom-6 left-6 border-b border-l",
    "bottom-6 right-6 border-b border-r",
  ];
  return (
    <>
      {brackets.map((cls, i) => (
        <span key={i} className={`absolute ${cls} border-[#d4a24c]/50 w-8 h-8 z-20 pointer-events-none`} />
      ))}
    </>
  );
}
