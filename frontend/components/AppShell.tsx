"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { RotateCw, LogOut, ArrowUpRight, Library } from "lucide-react";
import { logout } from "@/lib/api";
import IntroAnimation from "@/components/IntroAnimation";
import LightRays from "@/components/LightRays";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const isLoginPage = pathname === "/login";
  const isAgentsPage = pathname === "/agents";
  const isSignupPage = pathname === "/signup";
  const isStandalone = isLandingPage || isLoginPage || isAgentsPage || isSignupPage;
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (!isStandalone) return;
    setReady(true);
  }, [isStandalone]);

  // Auth check & listeners
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    }
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Landing and login pages manage their own nav — render children directly to avoid
  // any wrapper that could break position:sticky or add unwanted headers.
  if (isStandalone) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell bg-[#f9f9fb]" style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
      {!ready && <IntroAnimation onDone={() => setReady(true)} />}

      <header className="fixed top-0 inset-x-0 z-50 transition-all duration-500 bg-white/90 backdrop-blur-xl border-b border-black/5">
        <div className="w-full px-8 md:px-12 h-16 md:h-20 flex items-center justify-between">
          <Link href="/generate" className="flex items-center hover:opacity-90 transition" data-testid="nav-logo">
            <div className="flex items-center font-semibold tracking-[-0.01em] text-neutral-900 text-[26px]" style={{ fontFamily: "'Poppins', sans-serif" }}>
              <span>Contentf</span>
              <svg width="0.75em" height="0.75em" viewBox="0 0 100 100" className="mx-[0.05em] relative top-[0.1em]">
                <defs>
                  <linearGradient id="cubeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d79de4"/>
                    <stop offset="100%" stopColor="#8763e5"/>
                  </linearGradient>
                </defs>
                <polygon points="50,8 88,28 50,48 12,28" fill="url(#cubeGrad)" opacity="0.95"/>
                <polygon points="12,28 50,48 50,92 12,72" fill="url(#cubeGrad)" opacity="0.7"/>
                <polygon points="50,48 88,28 88,72 50,92" fill="url(#cubeGrad)" opacity="0.55"/>
              </svg>
              <span>rge</span>
              <span className="text-[#8763e5] ml-[0.05em] font-light relative top-[0.03em]">AI</span>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/blog-generator/drafts"
              className="group relative inline-flex items-center gap-2 px-4 py-2 border border-neutral-200 text-neutral-600 font-medium text-xs uppercase tracking-widest hover:border-neutral-900 hover:text-neutral-900 transition-colors"
            >
              <Library size={13} className="mr-1" />
              My Blogs
            </Link>

            <button
              onClick={() => (window.location.href = "/generate")}
              title="Start a new generation"
              className="group relative inline-flex items-center gap-2 px-4 py-2 border border-neutral-200 text-neutral-600 font-medium text-xs uppercase tracking-widest hover:border-neutral-900 hover:text-neutral-900 transition-colors"
            >
              <RotateCw size={13} />
              Refresh
            </button>

            {/* Initials Avatar and Profile Dropdown Menu */}
            {user?.email && (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(prev => !prev)}
                  className="w-10 h-10 rounded-full bg-[#8763e5]/10 border border-[#8763e5]/30 flex items-center justify-center text-sm font-bold text-[#8763e5] select-none uppercase hover:bg-[#8763e5]/20 hover:border-[#8763e5] transition shadow-sm"
                >
                  {user.email.substring(0, 2)}
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <>
                      {/* Close overlay */}
                      <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => setShowProfileMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-3 w-80 rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl z-50 text-left normal-case tracking-normal"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {/* Profile Header */}
                        <div className="flex items-center gap-3.5 border-b border-neutral-100 pb-4 mb-4 select-none">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8763e5] to-[#6c3fcf] flex items-center justify-center text-sm font-bold text-white uppercase shadow-lg shadow-[#8763e5]/20">
                            {user.email.substring(0, 2)}
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-sm font-bold text-neutral-900 truncate tracking-tight">
                              {user.email.split('@')[0]}
                            </div>
                            <div className="text-xs text-neutral-500 truncate mt-0.5">
                              {user.email}
                            </div>
                          </div>
                        </div>

                        {/* Account Tier Badge */}
                        <div className="mb-4 bg-[#f8f6ff] border border-[#8763e5]/15 rounded-xl px-4 py-2.5 flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-600">Account tier</span>
                          <span className="text-xs font-bold text-[#8763e5] bg-[#8763e5]/10 px-2.5 py-0.5 rounded-full">Pro Creator</span>
                        </div>

                        {/* Menu Links */}
                        <div className="space-y-1 text-sm">
                          <Link 
                            href="/settings/twitter"
                            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition font-medium text-left"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <svg viewBox="0 0 300 300" className="w-4 h-4 flex-shrink-0" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                              <path d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66" />
                            </svg>
                            <span>Twitter Settings</span>
                          </Link>
                          
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              logout();
                            }}
                            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition font-semibold text-left"
                          >
                            <LogOut size={15} />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>
        </div>
      </header>

      <div style={{ position: "relative", paddingTop: 72 }}>
        {children}
      </div>
    </div>
  );
}
