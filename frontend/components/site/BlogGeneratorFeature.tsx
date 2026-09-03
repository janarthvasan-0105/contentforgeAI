"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, PenTool } from "lucide-react";
import { motion } from "framer-motion";

export default function BlogGeneratorFeature() {
  return (
    <section className="w-full bg-[#f9f9fb] py-24 md:py-32 px-6 flex flex-col items-center justify-center border-t border-black/5">
      <div className="max-w-7xl w-full flex flex-col md:flex-row items-center gap-16">
        
        {/* Left side text */}
        <div className="flex-1 flex flex-col items-start text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-neutral-200 text-xs font-bold tracking-[0.2em] uppercase text-[#8763e5] mb-6 shadow-sm">
            <PenTool size={12} className="text-[#8763e5]" />
            AI Content Studio
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight leading-tight mb-6">
            Blog Generator.
          </h2>
          
          <p className="text-lg text-neutral-500 max-w-lg leading-relaxed mb-8">
            AI-powered blog research, writing, and SEO optimization. Write entire long-form articles in seconds and publish them directly to your platforms.
          </p>
          
          <Link
            href="/blog-generator"
            className="inline-flex items-center gap-2 text-[15px] font-bold text-[#8763e5] hover:text-[#704ec2] transition group"
          >
            Open the AI Content Studio
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Right side placeholder (No image requested, but to match layout, we can use a stylized div or an existing image if applicable) */}
        <div className="flex-[1.5] w-full relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, type: "spring" }}
            className="relative w-full max-w-[850px] mx-auto transform hover:-translate-y-2 transition-transform duration-500 flex items-center justify-center bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-black/5 aspect-[16/9]"
          >
            <div className="text-center p-8">
               <PenTool size={48} className="mx-auto text-neutral-300 mb-4" />
               <h3 className="text-2xl font-bold text-black mb-2">AI Content Studio</h3>
               <p className="text-neutral-500">Your dedicated long-form writing environment.</p>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
