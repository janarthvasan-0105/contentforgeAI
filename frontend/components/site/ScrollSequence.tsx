"use client";

import React, { useRef, useEffect, useState } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";

const FRAME_COUNT = 480;

export default function ScrollSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Preload images
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      const paddedIndex = i.toString().padStart(4, "0");
      img.src = `/frames/${paddedIndex}.jpg`;
      loadedImages.push(img);
    }
    setImages(loadedImages);
  }, []);

  const drawFrame = (index: number) => {
    if (!canvasRef.current || !images[index]) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = images[index];
    if (img.complete && img.naturalWidth !== 0) {
      // Calculate contain dimensions (full frame visible)
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.min(hRatio, vRatio);
      const centerShift_x = (canvas.width - img.width * ratio) / 2;
      const centerShift_y = (canvas.height - img.height * ratio) / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        centerShift_x,
        centerShift_y,
        img.width * ratio,
        img.height * ratio
      );
    }
  };

  // Draw initial frame once loaded
  useEffect(() => {
    if (images.length > 0 && images[0]) {
      images[0].onload = () => {
        drawFrame(0);
      };
    }
  }, [images]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // Map latest (0 to 1) to frame index (0 to 479)
    let frameIndex = Math.floor(latest * (FRAME_COUNT - 1));
    if (frameIndex < 0) frameIndex = 0;
    if (frameIndex >= FRAME_COUNT) frameIndex = FRAME_COUNT - 1;
    drawFrame(frameIndex);
  });

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        // redraw current frame
        const currentProgress = scrollYProgress.get();
        let frameIndex = Math.floor(currentProgress * (FRAME_COUNT - 1));
        drawFrame(frameIndex);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial call
    return () => window.removeEventListener("resize", handleResize);
  }, [images]);

  return (
    <div ref={containerRef} className="relative h-[400vh] w-full bg-white">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
        />
        {/* Subtle gradients to seamlessly blend the top and bottom into the surrounding sections */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white pointer-events-none opacity-60" />
      </div>
    </div>
  );
}
