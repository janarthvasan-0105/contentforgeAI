'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, PieChart, Activity, DollarSign } from 'lucide-react';
import Footer from '@/components/site/Footer';

export default function PriceBreakdownPage() {
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
          <PieChart size={12} className="text-[#8763e5]" />
          Analytics Feature
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[3.5rem] md:text-[5rem] font-bold tracking-tight leading-[0.95] max-w-4xl mb-6"
        >
          Know exactly where your budget is going.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-neutral-500 max-w-2xl leading-relaxed font-light mb-12"
        >
          Our new Spend Analytics dashboard breaks down your AI generation costs by platform, so you can optimize your content strategy in real-time.
        </motion.p>
      </section>

      {/* Image Showcase */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative rounded-2xl bg-[#f9f9fb] border border-black/5 p-4 md:p-12 flex justify-center shadow-2xl shadow-black/5"
        >
          {/* Using the image uploaded by the user */}
          <div className="relative w-full max-w-md mx-auto">
            <Image
              src="/features/price-breakdown.png"
              alt="Price Breakdown Dashboard"
              width={800}
              height={1000}
              className="rounded-xl shadow-2xl w-full h-auto"
            />
          </div>
        </motion.div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-black text-white py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mb-6">
              <Activity size={24} className="text-[#8763e5]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Real-time Tracking</h3>
            <p className="text-white/60 leading-relaxed">
              Every post, image, and video generation is tracked the moment it hits our servers, giving you up-to-the-minute spend metrics.
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-start">
            <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mb-6">
              <PieChart size={24} className="text-[#8763e5]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Channel Breakdown</h3>
            <p className="text-white/60 leading-relaxed">
              Instantly see whether you are spending more on YouTube shorts or LinkedIn thought leadership, helping you allocate budget effectively.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mb-6">
              <DollarSign size={24} className="text-[#8763e5]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Predictive Forecasting</h3>
            <p className="text-white/60 leading-relaxed">
              Use your historical generation data to forecast next month's spending and avoid unexpected package usage limits.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
