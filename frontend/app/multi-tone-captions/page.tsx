'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquareText, Feather, Target, Mic2 } from 'lucide-react';
import Footer from '@/components/site/Footer';

export default function MultiToneCaptionsPage() {
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
          <MessageSquareText size={12} className="text-[#8763e5]" />
          Multi-Tone Copywriting
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[3.5rem] md:text-[5rem] font-bold tracking-tight leading-[0.95] max-w-4xl mb-6"
        >
          One campaign. Every voice.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-neutral-500 max-w-2xl leading-relaxed font-light mb-12"
        >
          Stop writing the same caption ten different ways. Your Copywriter agent automatically generates funny, educational, professional, and storytelling variants for every platform—instantly.
        </motion.p>
      </section>

      {/* Image Showcase */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative w-full flex justify-center"
        >
          <Image
            src="/features/multi-tone-captions.png"
            alt="Multi-Tone Captions Dashboard"
            width={1200}
            height={800}
            className="rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] w-full h-auto border border-black/5"
          />
        </motion.div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-[#f9f9fb] border-y border-black/5 py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <div className="h-12 w-12 rounded-full bg-white border border-black/10 shadow-sm flex items-center justify-center mb-6">
              <Mic2 size={24} className="text-[#8763e5]" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-black">A/B Test Copy Variants</h3>
            <p className="text-neutral-500 leading-relaxed">
              Instantly review four distinct psychological angles for every post: Funny, Educational, Professional, and Storytelling. Find what converts best for your audience.
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-start">
            <div className="h-12 w-12 rounded-full bg-white border border-black/10 shadow-sm flex items-center justify-center mb-6">
              <Target size={24} className="text-[#8763e5]" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-black">Platform-Native Formats</h3>
            <p className="text-neutral-500 leading-relaxed">
              The copywriter agent knows exactly how to format for each network. Short threads for Twitter, long-form depth for LinkedIn, and punchy hooks for Instagram.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <div className="h-12 w-12 rounded-full bg-white border border-black/10 shadow-sm flex items-center justify-center mb-6">
              <Feather size={24} className="text-[#8763e5]" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-black">One-Click Clipboard</h3>
            <p className="text-neutral-500 leading-relaxed">
              Spot the perfect caption? Hit the copy button and drop it straight into your manual scheduler, or approve it for our Distributor agent to post automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
