"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function AutoPublishingFeature() {
  return (
    <section className="w-full bg-[#f9f9fb] py-24 md:py-32 px-6 flex flex-col items-center justify-center border-t border-black/5">
      <div className="max-w-7xl w-full flex flex-col md:flex-row items-center gap-16">
        
        {/* Left side text */}
        <div className="flex-1 flex flex-col items-start text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-neutral-200 text-xs font-bold tracking-[0.2em] uppercase text-[#8763e5] mb-6 shadow-sm">
            <Send size={12} className="text-[#8763e5]" />
            Zero-Click Publishing
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight leading-tight mb-6">
            Secure, autonomous <br/> channel rollouts.
          </h2>
          
          <p className="text-lg text-neutral-500 max-w-lg leading-relaxed mb-8">
            Connect your accounts once. ContentForge continuously monitors your tokens with enterprise-grade encryption and automatically pushes your approved campaigns directly to your audience. Never copy and paste a tweet again.
          </p>
          
          <Link
            href="/auto-publishing"
            className="inline-flex items-center gap-2 text-[15px] font-bold text-[#8763e5] hover:text-[#704ec2] transition group"
          >
            Explore the Auto-Publishing feature
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Right side image */}
        <div className="flex-1 w-full relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, type: "spring" }}
            className="relative w-full max-w-[450px] mx-auto transform hover:-translate-y-2 transition-transform duration-500"
          >
            <Image
              src="/features/auto-publishing.png"
              alt="Twitter Auto Publishing Interface"
              width={700}
              height={850}
              className="w-full h-auto rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-black/5"
            />
          </motion.div>
        </div>

      </div>
    </section>
  );
}
