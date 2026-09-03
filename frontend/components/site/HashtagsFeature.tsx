"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Hash } from "lucide-react";
import { motion } from "framer-motion";

export default function HashtagsFeature() {
  return (
    <section className="w-full bg-white py-24 md:py-32 px-6 flex flex-col items-center justify-center border-t border-black/5">
      <div className="max-w-7xl w-full flex flex-col md:flex-row-reverse items-center gap-16">
        
        {/* Right side text (reversed for layout variety) */}
        <div className="flex-1 flex flex-col items-start text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f9f9fb] border border-neutral-200 text-xs font-bold tracking-[0.2em] uppercase text-[#8763e5] mb-6 shadow-sm">
            <Hash size={12} className="text-[#8763e5]" />
            Smart Hashtags
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight leading-tight mb-6">
            Own the <br/> algorithm.
          </h2>
          
          <p className="text-lg text-neutral-500 max-w-lg leading-relaxed mb-8">
            Stop guessing what works. Your Researcher agent automatically maps trending, highly-relevant hashtags for your exact niche and distributes them into platform-optimized lists to maximize organic reach.
          </p>
          
          <Link
            href="/hashtags-generator"
            className="inline-flex items-center gap-2 text-[15px] font-bold text-[#8763e5] hover:text-[#704ec2] transition group"
          >
            Explore the Hashtags Generator feature
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Left side image */}
        <div className="flex-[1.5] w-full relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, type: "spring" }}
            className="relative w-full max-w-[850px] mx-auto transform hover:-translate-y-2 transition-transform duration-500"
          >
            <Image
              src="/features/hashtags-generator.png"
              alt="Hashtags Generator Interface"
              width={1000}
              height={700}
              className="w-full h-auto rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-black/5"
            />
          </motion.div>
        </div>

      </div>
    </section>
  );
}
