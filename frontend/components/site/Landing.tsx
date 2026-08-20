"use client";

import React from "react";
import Hero from "@/components/site/Hero";
import VideoShowcase from "@/components/site/VideoShowcase";
import ScrollSequence from "@/components/site/ScrollSequence";
import OutputVolumeSection from "@/components/site/OutputVolumeSection";
import HowItWorks from "@/components/site/HowItWorks";
import LiveAgents from "@/components/site/LiveAgents";
import Pricing from "@/components/site/Pricing";
import FAQ from "@/components/site/FAQ";
import Footer from "@/components/site/Footer";

export default function Landing() {
  return (
    <div className="bg-white text-black min-h-screen relative">
      <Hero />
      <VideoShowcase />
      <OutputVolumeSection />
      <ScrollSequence />
      <HowItWorks />
      <LiveAgents />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}
