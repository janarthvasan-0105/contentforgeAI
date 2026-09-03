'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, ShieldCheck, Zap } from 'lucide-react';
import Footer from '@/components/site/Footer';

export default function AutoPublishingPage() {
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
          <Send size={12} className="text-[#8763e5]" />
          Zero-Click Publishing
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[3.5rem] md:text-[5rem] font-bold tracking-tight leading-[0.95] max-w-4xl mb-6"
        >
          Never copy and paste a tweet again.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-neutral-500 max-w-2xl leading-relaxed font-light mb-12"
        >
          Securely link your social accounts once. ContentForge agents will automatically queue, schedule, and publish your generated content directly to your audience without lifting a finger.
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
            src="/features/auto-publishing.png"
            alt="Twitter Auto Publishing Settings"
            width={700}
            height={850}
            className="rounded-3xl shadow-2xl shadow-black/15 w-full max-w-[600px] h-auto border border-black/5"
          />
        </motion.div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-[#f9f9fb] py-24 px-6 border-y border-black/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <div className="h-12 w-12 rounded-full bg-white border border-black/10 flex items-center justify-center mb-6 shadow-sm">
              <ShieldCheck size={24} className="text-[#8763e5]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Enterprise-Grade Security</h3>
            <p className="text-neutral-500 leading-relaxed">
              Your authentication tokens are military-grade encrypted and heavily monitored. Intelligent 30-day expiry locks ensure your accounts are never at risk of ghost-bans or unauthorized access.
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-start">
            <div className="h-12 w-12 rounded-full bg-white border border-black/10 flex items-center justify-center mb-6 shadow-sm">
              <Zap size={24} className="text-[#8763e5]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Live Token Validation</h3>
            <p className="text-neutral-500 leading-relaxed">
              Forget silent failures. ContentForge continuously performs live API validation on your tokens before attempting to publish, alerting you instantly if a connection needs refreshing.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <div className="h-12 w-12 rounded-full bg-white border border-black/10 flex items-center justify-center mb-6 shadow-sm">
              <Send size={24} className="text-[#8763e5]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Autonomous Pipeline</h3>
            <p className="text-neutral-500 leading-relaxed">
              Once an asset passes the approval board, the Distributor agent handles the rest. Rich media, multi-thread formatting, and optimal timing are completely automated.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
