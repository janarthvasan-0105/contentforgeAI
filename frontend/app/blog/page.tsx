"use client";

import React, { useState } from "react";
import Footer from "@/components/site/Footer";
import FeaturedPost from "@/components/blog/FeaturedPost";
import FilterTabs from "@/components/blog/FilterTabs";
import PostGrid from "@/components/blog/PostGrid";
import Link from "next/link";
import Logo from "@/components/site/Logo";

export default function BlogPage() {
  const [activeTab, setActiveTab] = useState("All");

  return (
    <div className="bg-[#fcfcfc] text-[#111827] min-h-screen relative font-sans">
      
      {/* Blog Navigation (Simplified version of main nav for blog) */}
      <header className="fixed top-0 w-full z-50 bg-[#fcfcfc]/90 backdrop-blur-xl border-b border-black/5 transition-all duration-300 ease-in-out">
        <div className="flex justify-between items-center h-20 px-8 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center hover:opacity-90 transition gap-2">
            <Logo className="text-[20px]" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 font-medium text-[15px] text-black/70">
            <Link className="hover:text-black transition-colors" href="/#product">Product</Link>
            <Link className="hover:text-black transition-colors" href="/agents">Agents</Link>
            <Link className="hover:text-black transition-colors" href="/#pricing">Pricing</Link>
            <Link className="text-[#0A5CFF] font-semibold" href="/blog">Blog</Link>
          </nav>
          <div className="flex items-center">
            <Link href="/signup" className="text-[14px] bg-black text-white px-5 py-2.5 rounded-full font-medium hover:bg-black/85 transition-colors">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        <FeaturedPost />
        <FilterTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <PostGrid activeTab={activeTab} />
      </main>
      
      <Footer />
    </div>
  );
}
