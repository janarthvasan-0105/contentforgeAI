import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FeaturedPost() {
  return (
    <section className="mb-16 md:mb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left Content */}
        <div className="order-2 lg:order-1 flex flex-col items-start space-y-6">
          <div className="bg-[#EAEFFD] text-[#0A5CFF] font-semibold text-xs tracking-wider uppercase px-3 py-1.5 rounded-md">
            Featured
          </div>
          
          <h1 className="text-4xl lg:text-[44px] leading-[1.15] font-bold tracking-tight text-neutral-900">
            Automating Content Production: The Ultimate Guide to AI Agent Teams
          </h1>
          
          <div className="flex items-center text-sm font-medium text-neutral-500 gap-3">
            <span>May 14, 2024</span>
            <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
            <span className="uppercase tracking-wider">Product</span>
          </div>
          
          <p className="text-lg text-neutral-600 leading-relaxed max-w-lg">
            Discover how multi-agent systems are replacing traditional content workflows. Learn the exact architecture behind autonomous content generation pipelines that ship daily.
          </p>

          <Link href="/blog/automating-content" className="inline-flex items-center justify-center bg-[#0A5CFF] hover:bg-[#084bcf] transition-colors text-white font-medium text-[15px] px-6 py-3 rounded-full mt-4 group">
            Read article
            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Right Media */}
        <div className="order-1 lg:order-2">
          <div className="relative aspect-[4/3] lg:aspect-[16/10] w-full bg-neutral-100 rounded-3xl overflow-hidden shadow-lg border border-black/5 group">
            {/* Actual Video */}
            <video 
              src="/api/video" 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
