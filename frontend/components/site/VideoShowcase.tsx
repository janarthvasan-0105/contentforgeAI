"use client";

import React, { useRef } from "react";
import { Play } from "lucide-react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import TrueFocus from "@/components/TrueFocus";

export default function VideoShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track the scroll progress of the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    // Start animation when top of container hits bottom of viewport
    // End animation when center of container hits center of viewport
    offset: ["start end", "center center"]
  });

  // Scale the video container up from 0.85 to 1 as you scroll
  const rawScale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);

  // Smooth the scale using spring physics to eliminate scroll jank/lag
  const scale = useSpring(rawScale, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section ref={containerRef} className="w-full bg-white pl-6 md:pl-12 lg:pl-24 pr-6 md:pr-12 lg:pr-0 py-20 md:py-28 relative overflow-hidden">
      <div className="w-full max-w-[1440px] lg:max-w-none mx-auto lg:mr-0 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left Column: TrueFocus animation & Copy */}
        <div className="lg:col-span-5 flex flex-col items-start text-left lg:pr-8 w-full min-w-0">
          {/* Animated Headline using TrueFocus */}
          <TrueFocus 
            sentence="No crew. No shoot. Just content."
            manualMode={false}
            blurAmount={6}
            borderColor="#8763e5"
            glowColor="rgba(135, 99, 229, 0.4)"
            animationDuration={0.6}
            pauseBetweenAnimations={1.2}
            className="text-left justify-start"
            wordClassName="text-[1.6rem] sm:text-[2.4rem] md:text-[3.2rem] lg:text-[4rem] leading-[1.1] font-black tracking-tight"
          />

          {/* Tagline & Subheading */}
          <h4 className="text-[#8763e5] font-semibold text-lg md:text-xl mt-6 tracking-wide uppercase">
            Ads that shoot themselves.
          </h4>
          <p className="text-black/60 text-base md:text-lg mt-3 leading-relaxed max-w-[500px]">
            ContentForge AI automates your entire production pipeline—from concept to final render—with high-end Hollywood output and zero headcount.
          </p>
        </div>

        {/* Right Column: Scroll-scaled Video Container */}
        <div className="lg:col-span-7 w-full flex justify-end">
          <motion.div 
            style={{ scale, transformOrigin: "right center" }}
            className="relative w-full rounded-[24px] md:rounded-[32px] lg:rounded-l-[48px] lg:rounded-r-none overflow-hidden bg-[#050505] flex items-center justify-center aspect-video"
          >
            {/* Video Background */}
            <video
              className="absolute inset-0 w-full h-full object-cover opacity-90"
              src="/footer-bg.mp4"
              autoPlay
              muted
              loop
              playsInline
            />
            
            {/* Play Intro Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button className="flex items-center gap-2.5 bg-white text-black px-6 py-3 rounded-full font-medium text-[14px] pointer-events-auto hover:scale-105 transition-transform duration-300 shadow-xl">
                <Play size={14} fill="currentColor" />
                Play intro
              </button>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
