"use client";

import React from "react";
import MagicRings from "@/components/MagicRings";
import LogoLoop from "@/components/LogoLoop";
import { Code2, Hexagon, FileCode2, Wind } from "lucide-react";

const techLogos = [
  {
    node: (
      <div className="flex items-center gap-3 px-6">
        <Code2 size={48} className="text-black" />
        <span className="text-black font-sans font-bold text-3xl tracking-tight">React</span>
      </div>
    )
  },
  {
    node: (
      <div className="flex items-center gap-3 px-6">
        <Hexagon size={48} className="text-black fill-black" />
        <span className="text-black font-sans font-bold text-3xl tracking-tight">Next.js</span>
      </div>
    )
  },
  {
    node: (
      <div className="flex items-center gap-3 px-6">
        <FileCode2 size={48} className="text-black" />
        <span className="text-black font-sans font-bold text-3xl tracking-tight">TypeScript</span>
      </div>
    )
  },
  {
    node: (
      <div className="flex items-center gap-3 px-6">
        <Wind size={48} className="text-black" />
        <span className="text-black font-sans font-bold text-3xl tracking-tight">Tailwind CSS</span>
      </div>
    )
  },
];

export default function OutputVolumeSection() {
  return (
    <section className="relative w-full bg-white py-32 md:py-44 overflow-hidden flex flex-col items-center justify-center">
      
      {/* Magic Rings Shader Background spanning full-bleed */}
      <div className="absolute inset-0 z-0">
        <MagicRings
          color="#A855F7"
          colorTwo="#6366F1"
          ringCount={6}
          speed={0.8}
          attenuation={7}
          lineThickness={1.8}
          baseRadius={0.12}
          radiusStep={0.06}
          scaleRate={0.16}
          opacity={0.95}
          blur={0}
          noiseAmount={0}
          rotation={30}
          ringGap={1.3}
          fadeIn={0.7}
          fadeOut={0.5}
          followMouse={true}
          mouseInfluence={0.18}
          hoverScale={1.12}
          parallax={0.04}
          clickBurst={true}
        />
      </div>

      {/* Centered Stat Content Overlay */}
      <div className="relative w-full max-w-7xl px-6 md:px-12 z-10 flex flex-col items-center justify-center text-center pointer-events-none select-none">
        
        {/* Actual 3D Logo Mark */}
        <div className="mb-8 p-4 rounded-3xl bg-white border border-black/10 shadow-[0_8px_32px_rgba(135,99,229,0.15)] flex items-center justify-center backdrop-blur-sm">
          <svg width="40" height="40" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="cubeGradOutput" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d79de4"/>
                <stop offset="100%" stopColor="#8763e5"/>
              </linearGradient>
            </defs>
            <polygon points="50,8 88,28 50,48 12,28" fill="url(#cubeGradOutput)" opacity="0.95"/>
            <polygon points="12,28 50,48 50,92 12,72" fill="url(#cubeGradOutput)" opacity="0.7"/>
            <polygon points="50,48 88,28 88,72 50,92" fill="url(#cubeGradOutput)" opacity="0.55"/>
          </svg>
        </div>

        {/* Stat Title */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black tracking-tight leading-none mb-4">
          6 agents. 1 pipeline.
        </h2>

        <div className="mt-14 w-full w-[100vw] ml-[calc(-50vw+50%)] relative left-1/2 right-1/2 pointer-events-auto">
          <LogoLoop
            logos={techLogos}
            speed={40}
            direction="left"
            logoHeight={60}
            gap={40}
            hoverSpeed={10}
            scaleOnHover={true}
            fadeOut={true}
            fadeOutColor="#ffffff"
            ariaLabel="Technology partners marquee"
          />
        </div>
      </div>

    </section>
  );
}
