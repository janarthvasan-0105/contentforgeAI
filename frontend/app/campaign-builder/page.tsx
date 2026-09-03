'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Target, Palette, Workflow, FileSignature } from 'lucide-react';
import Footer from '@/components/site/Footer';

export default function CampaignBuilderPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#8763e5] selection:text-white">
      {/* Navbar Minimal */}
      <header className="w-full flex items-center justify-between px-8 py-5 border-b border-black/5 bg-white sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition font-bold text-lg">
          <ArrowLeft size={18} />
          Back to Home
        </Link>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="inline-flex items-center rounded-full border border-black/10 px-5 py-2 text-sm font-medium hover:bg-black/5 transition"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-full bg-black text-white text-[14px] font-medium px-5 py-2 hover:bg-black/85 transition"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f9f9fb] border border-neutral-200 text-xs font-bold tracking-[0.2em] uppercase text-[#8763e5] mb-8"
        >
          <FileSignature size={12} className="text-[#8763e5]" />
          Campaign Briefs
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[3.5rem] md:text-[5rem] font-bold tracking-tight leading-[0.95] max-w-4xl mb-6"
        >
          Brief your agents. Launch in seconds.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-neutral-500 max-w-2xl leading-relaxed font-light mb-12"
        >
          Tell your AI swarm exactly what you want to achieve. From defining target audiences to selecting asset types and uploading brand logos, ContentForge takes your brief and orchestrates the perfect campaign automatically.
        </motion.p>
      </section>

      {/* Image Showcase */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative w-full flex justify-center"
        >
          <Image
            src="/features/campaign-brief.png"
            alt="Campaign Builder Interface"
            width={600}
            height={1200}
            className="rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] w-full max-w-[500px] h-auto border border-black/10 bg-white"
          />
        </motion.div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-[#f9f9fb] text-black border-y border-black/5 py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <div className="h-12 w-12 rounded-full bg-white border border-black/10 shadow-sm flex items-center justify-center mb-6">
              <Target size={24} className="text-[#8763e5]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Audience Targeting</h3>
            <p className="text-neutral-500 leading-relaxed">
              Define exact personas and pain points. Your researcher and copywriter agents will automatically adapt tone and angle to convert your specific audience.
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-start">
            <div className="h-12 w-12 rounded-full bg-white border border-black/10 shadow-sm flex items-center justify-center mb-6">
              <Palette size={24} className="text-[#8763e5]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Brand Integrity</h3>
            <p className="text-neutral-500 leading-relaxed">
              Upload your logo and feed aesthetic suggestions directly to the Art Director agent. Every image and video generated will stay perfectly on-brand.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <div className="h-12 w-12 rounded-full bg-white border border-black/10 shadow-sm flex items-center justify-center mb-6">
              <Workflow size={24} className="text-[#8763e5]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Cross-Platform Sync</h3>
            <p className="text-neutral-500 leading-relaxed">
              Select YouTube, Instagram, LinkedIn, or Twitter in a single click. The orchestrator will automatically spin up the required agents to build native assets for each platform simultaneously.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
