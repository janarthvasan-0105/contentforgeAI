"use client";

import React from "react";
import Hero from "@/components/site/Hero";
import ChoiceSection from "@/components/site/ChoiceSection";
import ScrollSequence from "@/components/site/ScrollSequence";
import OutputVolumeSection from "@/components/site/OutputVolumeSection";
import PriceBreakdownFeature from "@/components/site/PriceBreakdownFeature";
import CampaignFeature from "@/components/site/CampaignFeature";
import StudioFeature from "@/components/site/StudioFeature";
import ResearchFeature from "@/components/site/ResearchFeature";
import PainpointsFeature from "@/components/site/PainpointsFeature";
import CaptionsFeature from "@/components/site/CaptionsFeature";
import HashtagsFeature from "@/components/site/HashtagsFeature";
import AutoPublishingFeature from "@/components/site/AutoPublishingFeature";
import BlogGeneratorFeature from "@/components/site/BlogGeneratorFeature";
import HowItWorks from "@/components/site/HowItWorks";
import LiveAgents from "@/components/site/LiveAgents";
import FAQ from "@/components/site/FAQ";
import Footer from "@/components/site/Footer";

export default function Landing() {
  return (
    <div className="bg-white text-black min-h-screen relative">
      <Hero />
      <OutputVolumeSection />
      <ScrollSequence />
      <HowItWorks />
      <PriceBreakdownFeature />
      <CampaignFeature />
      <StudioFeature />
      <ResearchFeature />
      <PainpointsFeature />
      <CaptionsFeature />
      <HashtagsFeature />
      <AutoPublishingFeature />
      <BlogGeneratorFeature />
      <LiveAgents />
      <FAQ />
      <ChoiceSection />
      <Footer />
    </div>
  );
}
