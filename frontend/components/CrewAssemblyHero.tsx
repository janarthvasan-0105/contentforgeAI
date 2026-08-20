"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { ArrowDown } from "lucide-react";

export default function CrewAssemblyHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const totalFrames = 300;

  // Preload frames into a ref to avoid React state re-renders
  const imagesRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];
    let firstFrameLoaded = false;

    const checkReady = () => {
      if (!firstFrameLoaded) {
        firstFrameLoaded = true;
        setImagesLoaded(true);
        // Delay drawing slightly to ensure canvas is painted in DOM
        requestAnimationFrame(() => drawFrame(0));
      }
    };

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      const paddedIndex = String(i).padStart(3, "0");

      img.onload = () => {
        loadedCount++;
        setLoadingProgress(Math.round((loadedCount / totalFrames) * 100));
        if (i === 1) checkReady();
      };
      
      img.onerror = () => {
        loadedCount++;
        if (i === 1) checkReady();
      };

      img.src = `/frames/frame-${paddedIndex}.jpg`;
      images.push(img);
    }
    
    imagesRef.current = images;
    
    // Fallback just in case
    const timeout = setTimeout(checkReady, 2000);
    return () => clearTimeout(timeout);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Map scroll (0 to 1) to frame index (0 to 299)
  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, totalFrames - 1]);

  const drawFrame = (index: number) => {
    if (!canvasRef.current || !imagesRef.current[index]) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imagesRef.current[index];
    if (!img.complete || img.naturalWidth === 0) return;

    // Match device pixel ratio for sharp canvas
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set actual size in memory (scaled to account for extra pixel density)
    if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    }
    
    // Reset transform to identity before scaling
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // clear background to match white theme
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Object-cover equivalent math
    const canvasRatio = rect.width / rect.height;
    const imgRatio = img.width / img.height;

    let drawWidth = rect.width;
    let drawHeight = rect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      // Canvas is wider than image (crop top/bottom)
      drawHeight = rect.width / imgRatio;
      offsetY = (rect.height - drawHeight) / 2;
    } else {
      // Canvas is taller than image (crop sides)
      drawWidth = rect.height * imgRatio;
      offsetX = (rect.width - drawWidth) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    
    // Reset transform so next clearRect works correctly
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  // Sync scroll exactly to frame draw without causing React re-renders
  useMotionValueEvent(frameIndex, "change", (latest) => {
    if (imagesLoaded) {
      drawFrame(Math.round(latest));
    }
  });

  // Re-draw on resize
  useEffect(() => {
    const handleResize = () => {
      if (imagesLoaded) {
        drawFrame(Math.round(frameIndex.get()));
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [imagesLoaded, frameIndex]);

  return (
    <section ref={containerRef} className="relative h-[400vh] bg-white border-t border-black/5">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-white">
        
        {/* Loading State */}
        <AnimatePresence>
          {!imagesLoaded && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white text-black"
            >
              <div className="w-48 h-1 bg-black/10 rounded-full overflow-hidden mb-4">
                <motion.div 
                  className="h-full bg-black"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <div className="text-sm font-mono text-black/50 tracking-widest uppercase">
                Preparing Set... {loadingProgress}%
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas for Sequence */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ width: "100%", height: "100%", display: "block" }}
        />

        {/* Gradient Overlay for Text Legibility */}
        <div className="absolute inset-0 bg-white/60 z-10 pointer-events-none" />

        {/* ======================= SCROLL BEATS (OVERLAYS) ======================= */}
        
        {/* Beat 1: 0 - 15% | Empty dark stage */}
        <ScrollOverlay 
          progress={scrollYProgress} 
          start={0} 
          fadeStart={0} 
          end={0.15}
          className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 px-6"
        >
          <motion.div
            style={{
              scale: useTransform(scrollYProgress, [0, 0.15], [1, 1.05])
            }}
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-black mb-6 font-sans">
              Every campaign starts with <span className="text-[#8763e5]">a blank brief.</span>
            </h1>
            <p className="text-lg md:text-xl text-black/60 font-sans">
              Instead of hiring a film crew, you deploy agents.
            </p>
          </motion.div>
          <div className="absolute bottom-12 flex flex-col items-center gap-3 text-black/40 animate-pulse">
            <ArrowDown size={16} />
            <span className="text-xs font-mono tracking-widest uppercase">Scroll</span>
          </div>
        </ScrollOverlay>

        {/* Beat 2: 15 - 40% | Gear drifts in */}
        <ScrollOverlay 
          progress={scrollYProgress} 
          start={0.15} 
          fadeStart={0.17}
          fadeEnd={0.38}
          end={0.40}
          className="absolute inset-y-0 left-0 w-full md:w-1/2 flex flex-col items-start justify-center z-20 px-8 md:px-24"
        >
          <motion.div
            style={{
              x: useTransform(scrollYProgress, [0.15, 0.25], [-40, 0])
            }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black font-sans leading-tight">
              No sets to dress. <br/> No lights to rig.
            </h2>
            <p className="mt-4 text-lg text-black/60 font-sans">
              Cato and Vela map the market and select launch angles.
            </p>
          </motion.div>
        </ScrollOverlay>

        {/* Beat 3: 40 - 65% | Crew silhouettes */}
        <ScrollOverlay 
          progress={scrollYProgress} 
          start={0.40} 
          fadeStart={0.42}
          fadeEnd={0.63}
          end={0.65}
          className="absolute inset-y-0 right-0 w-full md:w-1/2 flex flex-col items-end justify-center text-right z-20 px-8 md:px-24"
        >
          <motion.div
            style={{
              x: useTransform(scrollYProgress, [0.40, 0.50], [40, 0])
            }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black font-sans leading-tight">
              Zero headcount. <br/> Infinite scale.
            </h2>
            <p className="mt-4 text-lg text-black/60 font-sans">
              Orin writes the copy while Iris builds visual assets.
            </p>
          </motion.div>
        </ScrollOverlay>

        {/* Beat 4: 65 - 85% | Talent on mark */}
        <ScrollOverlay 
          progress={scrollYProgress} 
          start={0.65} 
          fadeStart={0.67}
          fadeEnd={0.83}
          end={0.85}
          className="absolute inset-y-0 left-0 w-full md:w-1/2 flex flex-col items-start justify-center z-20 px-8 md:px-24"
        >
          <motion.div
            style={{
              x: useTransform(scrollYProgress, [0.65, 0.75], [-40, 0])
            }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black font-sans leading-tight">
              Cinema quality. <br/> Zero production drag.
            </h2>
            <p className="mt-4 text-lg text-black/60 font-sans">
              Kade renders the video reels as Nova schedules native rollouts.
            </p>
          </motion.div>
        </ScrollOverlay>

        {/* Beat 5: 85 - 100% | Clapperboard snaps */}
        <ScrollOverlay 
          progress={scrollYProgress} 
          start={0.85} 
          fadeStart={0.87}
          fadeEnd={1}
          end={1}
          className="absolute inset-0 flex flex-col items-center justify-center text-center z-30 px-6"
        >
          <motion.div
            style={{
              y: useTransform(scrollYProgress, [0.85, 0.95], [40, 0])
            }}
            className="flex flex-col items-center"
          >
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-black mb-10 font-sans">
              One pipeline. Autonomously.
            </h2>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-5 bg-black text-white font-semibold rounded-full hover:bg-black/90 transition-colors shadow-[0_0_40px_rgba(0,0,0,0.1)] text-sm md:text-base max-w-2xl mx-auto font-sans"
            >
              From idea to published post — with Cato, Vela, Orin, Iris, Kade, and Nova active
            </motion.button>
          </motion.div>
        </ScrollOverlay>

      </div>
    </section>
  );
}

/** Helper component to map scroll progress to opacity */
function ScrollOverlay({
  children,
  progress,
  start,
  fadeStart,
  fadeEnd,
  end,
  className
}: {
  children: React.ReactNode;
  progress: any; // MotionValue<number>
  start: number;
  fadeStart: number;
  fadeEnd?: number;
  end: number;
  className?: string;
}) {
  const fEnd = fadeEnd ?? (end - 0.02);
  
  // Build arrays dynamically to avoid duplicate offsets
  const input = [];
  const output = [];
  
  if (start < fadeStart) {
    input.push(start);
    output.push(0);
  }
  
  input.push(fadeStart);
  output.push(1);
  
  if (fEnd > fadeStart) {
    input.push(fEnd);
    output.push(1);
  }
  
  if (end > fEnd) {
    input.push(end);
    output.push(0);
  }

  const opacity = useTransform(progress, input, output);
  
  // To avoid pointer events blocking clicks when invisible
  const pointerEvents = useTransform(opacity, (val) => val > 0.1 ? "auto" : "none");

  return (
    <motion.div style={{ opacity, pointerEvents }} className={className}>
      {children}
    </motion.div>
  );
}
