"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Features", href: "#features" },
    { label: "Portfolio", href: "#portfolio" },
    { label: "About", href: "#about" },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-[#0a0a0b]/60 backdrop-blur-md" : "bg-transparent"
      }`}
      data-testid="site-nav"
    >
      <div className="mx-auto px-8 md:px-16 h-20 md:h-28 flex items-center justify-between border-b border-white/5">
        <a href="#top" className="flex items-center" data-testid="nav-logo">
          <span className="font-sans font-light text-2xl tracking-wide text-white">ContentForge</span>
        </a>
        <div className="flex items-center gap-8 md:gap-12">
          <nav className="hidden md:flex items-center gap-8 font-sans font-light text-sm text-white/80">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-white transition"
                 data-testid={`nav-link-${l.label.toLowerCase()}`}>
                {l.label}
              </a>
            ))}
          </nav>
          
          <Link href="/contact"
             className="group flex items-center gap-3 font-sans font-light text-sm text-white hover:text-white/80 transition-colors"
             data-testid="nav-contact">
            <span className="w-5 h-[10px] rounded-full bg-white/20 border border-white/40 group-hover:bg-white/40 transition-colors" />
            Contact
          </Link>
        </div>
      </div>
    </header>
  );
}
