'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PricingPage() {
  const handleStart = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-[#8763e5] selection:text-white pb-24">
      {/* Navbar placeholder if needed, otherwise just spacing */}
      <div className="pt-20 pb-16 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Top Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f9f9fb] border border-neutral-200 text-xs font-bold tracking-[0.2em] uppercase text-[#8763e5] mb-8"
        >
          <Zap size={12} className="fill-[#8763e5]" />
          Pricing
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[3.5rem] md:text-[5rem] font-bold tracking-tight leading-[0.95] max-w-3xl mb-6 text-black"
        >
          Pay for shipped campaigns, not headcount.
        </motion.h1>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-neutral-500 max-w-2xl leading-relaxed font-light"
        >
          Start lean, then scale into a full autonomous content operation when the output becomes a growth channel.
        </motion.p>

      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start mt-4">
        
        {/* Solo Plan */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[#120F17] rounded-[2rem] p-8 md:p-10 text-white flex flex-col h-full border border-white/5"
        >
          <div className="text-[10px] tracking-[0.2em] font-bold uppercase text-neutral-400 mb-6">
            Creator Operating System
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-4">Solo</h2>
          <p className="text-sm text-neutral-400 leading-relaxed mb-8 min-h-[60px]">
            For founders and creators who need consistent output without hiring a team.
          </p>
          
          <div className="flex items-baseline gap-1 mb-10">
            <span className="text-lg font-medium text-neutral-400 self-start mt-2">$</span>
            <span className="text-6xl font-bold tracking-tighter">29</span>
            <span className="text-sm text-neutral-400 font-medium">/mo</span>
          </div>

          <ul className="space-y-4 mb-10 flex-grow">
            {[
              "20 campaigns per month",
              "Copy + Image agents",
              "3 connected channels",
              "Brand voice memory",
              "Community support"
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-neutral-300">
                <Check size={16} className="text-white shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <button 
            onClick={handleStart}
            className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors duration-200"
          >
            Start Solo
          </button>
        </motion.div>

        {/* Studio Plan */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-[#120F17] rounded-[2rem] p-8 md:p-10 text-white flex flex-col h-full border border-[#8763e5]/30 relative shadow-2xl shadow-[#8763e5]/10 transform md:-translate-y-4"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="text-[10px] tracking-[0.2em] font-bold uppercase text-[#8763e5]">
              Most Teams Start Here
            </div>
            <div className="bg-[#8763e5] text-white text-[10px] tracking-wider font-bold uppercase px-3 py-1 rounded-full flex items-center gap-1">
              <Zap size={10} className="fill-white" />
              Best Value
            </div>
          </div>
          
          <h2 className="text-3xl font-bold tracking-tight mb-4">Studio</h2>
          <p className="text-sm text-neutral-400 leading-relaxed mb-8 min-h-[60px]">
            For companies shipping weekly launches, thought leadership, and social campaigns.
          </p>
          
          <div className="flex items-baseline gap-1 mb-10">
            <span className="text-lg font-medium text-neutral-400 self-start mt-2">$</span>
            <span className="text-6xl font-bold tracking-tighter">129</span>
            <span className="text-sm text-neutral-400 font-medium">/mo</span>
          </div>

          <ul className="space-y-4 mb-10 flex-grow">
            {[
              "Unlimited campaigns",
              "Full 6-agent swarm",
              "Video scripts + reel packs",
              "9 channels + scheduling",
              "Approval board",
              "Priority generation queue"
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-white font-medium">
                <Check size={16} className="text-[#8763e5] shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <button 
            onClick={handleStart}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#8763e5] to-[#6c3fcf] hover:opacity-90 text-white font-bold transition-opacity duration-200 shadow-lg shadow-[#8763e5]/25"
          >
            Start Studio
          </button>
        </motion.div>

        {/* Enterprise Plan */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-[#120F17] rounded-[2rem] p-8 md:p-10 text-white flex flex-col h-full border border-white/5"
        >
          <div className="text-[10px] tracking-[0.2em] font-bold uppercase text-neutral-400 mb-6">
            Private Content Floor
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-4">Enterprise</h2>
          <p className="text-sm text-neutral-400 leading-relaxed mb-8 min-h-[60px]">
            For brands with custom workflows, controls, integrations, and security needs.
          </p>
          
          <div className="flex items-baseline gap-1 mb-10 h-[72px] items-center">
            <span className="text-5xl font-bold tracking-tight">Custom</span>
          </div>

          <ul className="space-y-4 mb-10 flex-grow">
            {[
              "Dedicated agent setup",
              "Custom publishing integrations",
              "SSO and advanced roles",
              "Onboarding and governance",
              "Private model routing"
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-neutral-300">
                <Check size={16} className="text-white shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <button 
            onClick={handleStart}
            className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors duration-200"
          >
            Contact Sales
          </button>
        </motion.div>

      </div>
    </div>
  );
}
