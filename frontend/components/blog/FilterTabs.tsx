import React from "react";

const TABS = ["All", "Product", "Engineering", "Company", "Community"];

interface FilterTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function FilterTabs({ activeTab, setActiveTab }: FilterTabsProps) {
  return (
    <div className="w-full border-b border-black/10 mb-12">
      <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[15px] font-medium transition-colors whitespace-nowrap relative ${
                isActive ? "text-[#0A5CFF]" : "text-black/60 hover:text-black"
              }`}
            >
              {tab}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A5CFF]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
