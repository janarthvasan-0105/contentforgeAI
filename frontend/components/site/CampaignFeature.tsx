"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileSignature } from "lucide-react";
import { motion } from "framer-motion";

export default function CampaignFeature() {
  return (
    <section className="w-full bg-white py-24 md:py-32 px-6 flex flex-col items-center justify-center border-t border-black/5">
      <div className="max-w-7xl w-full flex flex-col md:flex-row-reverse items-center gap-16">
        
        {/* Right side text (reversed for layout variety) */}
        <div className="flex-1 flex flex-col items-start text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f9f9fb] border border-neutral-200 text-xs font-bold tracking-[0.2em] uppercase text-[#8763e5] mb-6">
            <FileSignature size={12} className="text-[#8763e5]" />
            Campaign Briefs
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight leading-tight mb-6">
            Brief your agents. <br/> Launch in seconds.
          </h2>
          
          <p className="text-lg text-neutral-500 max-w-lg leading-relaxed mb-6">
            Tell your AI swarm exactly what you want to achieve. ContentForge takes your brief and orchestrates the perfect campaign automatically.
          </p>
          
          <ul className="flex flex-col gap-3 mb-8 text-[15px] text-neutral-600 max-w-lg">
            <li className="flex items-start gap-2">
              <span className="text-[#8763e5] font-bold mt-0.5">•</span>
              <span><strong>Purpose & Topic:</strong> Define the campaign goal and starting point for the Researcher agent.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#8763e5] font-bold mt-0.5">•</span>
              <span><strong>Platform & Media:</strong> Route tasks to the Art Director or Video Producer based on platform needs.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#8763e5] font-bold mt-0.5">•</span>
              <span><strong>Audience & Styles:</strong> Micro-manage the copywriter's tone, visual aesthetics, and pain-point targeting.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#8763e5] font-bold mt-0.5">•</span>
              <span><strong>Brand Assets:</strong> Auto-composite and watermark your logo directly onto generated media.</span>
            </li>
          </ul>
          
          <Link
            href="/campaign-builder"
            className="inline-flex items-center gap-2 text-[15px] font-bold text-[#8763e5] hover:text-[#704ec2] transition group"
          >
            Explore the Campaign Builder feature
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Left side image */}
        <div className="flex-1 w-full relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, type: "spring" }}
            className="relative w-full max-w-[450px] mx-auto transform hover:-translate-y-2 transition-transform duration-500"
          >
            <Image
              src="/features/campaign-brief.png"
              alt="Campaign Brief Form Interface"
              width={800}
              height={1400}
              className="w-full h-auto rounded-3xl shadow-2xl shadow-black/20 border border-black/5 bg-white"
            />
          </motion.div>
        </div>

      </div>
    </section>
  );
}
