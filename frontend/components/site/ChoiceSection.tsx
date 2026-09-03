"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Antigravity from '../ui/Antigravity';

export default function ChoiceSection() {
  const [hoveredLeft, setHoveredLeft] = useState(false);
  const [hoveredRight, setHoveredRight] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      setHoveredLeft(true);
      setHoveredRight(false);
    } else {
      setHoveredLeft(false);
      setHoveredRight(true);
    }
  };

  const handleMouseLeave = () => {
    setHoveredLeft(false);
    setHoveredRight(false);
  };

  return (
    <section 
      id="choice-section"
      className="relative w-full min-h-screen py-20 bg-white overflow-hidden flex items-center justify-center border-y border-neutral-100"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      
      {/* Interactive Background */}
      <div className="absolute inset-0 z-0 opacity-60">
        <Antigravity
            count={4800}
            magnetRadius={6}
            ringRadius={23}
            waveSpeed={0.4}
            waveAmplitude={0.7}
            particleSize={1.2}
            lerpSpeed={0.02}
            color="#2563eb"
            autoAnimate={true}
            particleVariance={1}
            rotationSpeed={0.9}
            depthFactor={1.7}
            pulseSpeed={5.4}
            particleShape="sphere"
            fieldStrength={7.6}
            hoverActive={hoveredLeft || hoveredRight}
            targetX={hoveredLeft ? -0.25 : hoveredRight ? 0.25 : 0}
            targetY={0}
        />
      </div>

      <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-center justify-center pointer-events-none gap-8 md:gap-24 px-4">
        
        {/* Left Option */}
        <div className="flex-1 w-full flex flex-col items-center justify-center h-full pointer-events-auto transition-all duration-300">
          <div className={`flex flex-col items-center text-center transition-opacity duration-300 ${hoveredRight ? 'opacity-30' : 'opacity-100'}`}>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-6">
              AI Video Studio
            </span>
            <h2 className="text-5xl md:text-[52px] font-sans font-medium leading-[1.1] tracking-tighter mb-8">
              <span className="text-neutral-900 block">Create stunning ads</span>
              <span className="text-neutral-500 block">and video campaigns</span>
            </h2>
            <Link href="/login">
              <button className="bg-[#111111] hover:bg-black text-white text-[15px] rounded-full px-10 py-4 font-medium transition-all hover:scale-105 shadow-lg shadow-black/10 flex items-center gap-2">
                Try Video Studio
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </button>
            </Link>
          </div>
        </div>

        {/* Right Option */}
        <div className="flex-1 w-full flex flex-col items-center justify-center h-full pointer-events-auto transition-all duration-300">
          <div className={`flex flex-col items-center text-center transition-opacity duration-300 ${hoveredLeft ? 'opacity-30' : 'opacity-100'}`}>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-6">
              AI Writing Engine
            </span>
            <h2 className="text-5xl md:text-[52px] font-sans font-medium leading-[1.1] tracking-tighter mb-8">
              <span className="text-neutral-900 block">Generate SEO blogs</span>
              <span className="text-neutral-500 block">and organic content</span>
            </h2>
            <Link href="/blog-generator">
              <button className="bg-[#111111] hover:bg-black text-white text-[15px] rounded-full px-10 py-4 font-medium transition-all hover:scale-105 shadow-lg shadow-black/10 flex items-center gap-2">
                Try Blog Engine
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </button>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
