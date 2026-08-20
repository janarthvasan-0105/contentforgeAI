"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { generateContent, fetchSessionsFromApi, publishContent, uploadLogo } from "@/lib/api";
import BorderGlow from "@/components/BorderGlow";
import {
  Camera, Video, Briefcase, MessageSquare, Plus, RefreshCw, LogOut,
  Check, Sparkles, Copy, Download, Wand2, Image as ImageIcon, Film,
  PenLine, Lightbulb, Calendar, Hash, Search, FileText, Smartphone,
  Globe, TrendingUp, User, X, Play, Info, AlertCircle, Link2 as LinkIcon, Send
} from "lucide-react";

// Premium vector Sparkline path generator
function Sparkline({ points, color }: { points: number[]; color: string }) {
  const width = 80;
  const height = 16;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  
  const coords = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return `${x},${y}`;
  });
  
  const pathData = `M ${coords.join(" L ")}`;
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 2px ${color})` }}
      />
    </svg>
  );
}

// Double Sparkline component for Total Packages Spend Card
function DoubleSparkline({ color1, color2 }: { color1: string; color2: string }) {
  const width = 280;
  const height = 80;
  
  // Custom paths matching the mockup shape exactly
  const yesterdayPath = "M 0 75 Q 40 70 70 30 T 140 60 T 210 30 T 280 75";
  const todayPath = "M 0 75 Q 45 72 80 20 T 150 70 T 230 35 T 280 45";
  
  return (
    <div className="w-full space-y-2 mt-4 border-t border-white/5 pt-4">
      <div className="relative w-full h-[80px]">
        <svg width="100%" height={height} viewBox="0 0 280 80" preserveAspectRatio="none" className="overflow-visible">
          {/* Yesterday Line */}
          <path
            d={yesterdayPath}
            fill="none"
            stroke="#8A8780"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-50"
          />
          {/* Today Line */}
          <path
            d={todayPath}
            fill="none"
            stroke={color2}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 2px ${color2})` }}
          />
        </svg>
      </div>
      
      {/* X-Axis labels */}
      <div className="flex justify-between text-[8px] text-[#8A8780] font-mono select-none px-1">
        <span>12 AM</span>
        <span>8 AM</span>
        <span>4 PM</span>
        <span>12 AM</span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[8.5px] font-mono text-[#8A8780] pt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8A8780] opacity-50" />
          <span>Yesterday</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color2 }} />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

// Platform details
const PLATFORMS = ["instagram", "youtube", "linkedin", "twitter"];
const PLATFORM_ICONS: Record<string, any> = {
  instagram: Camera,
  youtube: Video,
  linkedin: Briefcase,
  twitter: MessageSquare,
};
const PLATFORM_SVGS: Record<string, string> = {
  instagram: "/instagram.svg",
  youtube: "/youtube.svg",
  linkedin: "/linkedin.svg",
  twitter: "/twitter-x.svg",
};
const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#d075d8",
  youtube: "#ef4444",
  linkedin: "#0a66c2",
  twitter: "#1da1f2",
};

export default function GeneratePage() {
  // Authentication & Session data
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState("overview");
  const [showDrawer, setShowDrawer] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [publishFeedback, setPublishFeedback] = useState<{ message: string, type: "success" | "error" } | null>(null);
  const [activeImageModal, setActiveImageModal] = useState<{ url: string; session: any } | null>(null);
  const [selectedCaptionModal, setSelectedCaptionModal] = useState<string>("");
  const [selectedHashtagsModal, setSelectedHashtagsModal] = useState<string[]>([]);
  const [activeVideoModal, setActiveVideoModal] = useState<{ url: string; session: any } | null>(null);
  const [activeScriptModal, setActiveScriptModal] = useState<any | null>(null);

  // Filtering & Sorting
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [publishing, setPublishing] = useState<string | null>(null);

  // Form State (New Generation Drawer)
  const [form, setForm] = useState({
    purpose: "general",
    topic: "",
    platform: "instagram",
    audience: "",
    tone: "educational",
    brand_name: "",
    brand_primary_color: "#8763e5",
    brand_secondary_color: "#120F17",
    visual_style: "modern",
    post_type: "single_post",
    cta_goal: "downloads",
    image_style: "realistic",
    app_context_url: "",
    app_context_file_content: "",
    user_suggestion: "",
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Load auth state & fetch sessions
  useEffect(() => {
    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchSessions(session.user.id);
      } else {
        window.location.href = "/login";
      }
    }
    initAuth();
  }, []);

  async function fetchSessions(userId: string) {
    try {
      const data = await fetchSessionsFromApi();
      
      // Filter out 'generating' sessions that are older than 5 minutes (stuck/failed sessions)
      const now = new Date().getTime();
      const validSessions = (data.sessions || []).filter((s: any) => {
        const status = s.status || s.session_data?.status;
        
        // Remove failed sessions
        if (status === "failed") return false;

        // Keep generating sessions only if they are fresh (< 5 mins)
        if (status === "generating") {
          const createdTime = new Date(s.created_at).getTime();
          const ageMinutes = (now - createdTime) / (1000 * 60);
          return ageMinutes < 5;
        }
        
        // Remove partially generated sessions (completed but missing core assets)
        if (status === "completed") {
          const sData = s.session_data || {};
          const hasScript = !!(sData.video_script || sData.post_scripts || sData.twitter_scripts);
          const hasVisual = !!(sData.rendered_post_urls?.length || sData.generated_images?.length || sData.generated_video?.url || (sData.language_videos && Object.keys(sData.language_videos).length > 0));
          
          if (!hasScript || !hasVisual) {
            return false;
          }
        }

        return true;
      });
      
      setSessions(validSessions);
    } catch (e) {
      console.error("Error fetching sessions:", e);
    } finally {
      setLoadingSessions(false);
      setRefreshing(false);
    }
  }

  // Manual refresh trigger
  function handleRefresh() {
    if (!user) return;
    setRefreshing(true);
    fetchSessions(user.id);
  }

  // Copy helper
  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(""), 2000);
  }

  // Force local download helper
  async function handleDownload(url: string, filename: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed", error);
      window.open(url, '_blank');
    }
  }

  // Client-side UUID generator for local pending session keys
  function generateUUID() {
    if (typeof window !== "undefined" && window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Handle direct publishing to connected social accounts
  async function handlePublish(session: any, imageUrl: string, textOverride?: string, hashtagsOverride?: string[]) {
    if (!user) return;
    if (session.platform !== "twitter") {
      setPublishFeedback({ message: "Direct publishing is currently only supported for Twitter/X. Go to Settings to connect your account.", type: "error" });
      setTimeout(() => setPublishFeedback(null), 5000);
      return;
    }
    
    setPublishing(imageUrl);
    try {
      const sData = session.session_data || {};
      const formData = new FormData();
      formData.append("platform", session.platform);
      
      // Select the caption text
      let text = textOverride;
      if (!text) {
        if (sData.captions && typeof sData.captions === "object") {
          const keys = Object.keys(sData.captions);
          if (keys.length > 0) text = sData.captions[keys[0]];
        } else if (sData.captions && typeof sData.captions === "string") {
          text = sData.captions;
        } else if (sData.twitter_scripts && sData.twitter_scripts.length > 0) {
          text = sData.twitter_scripts[0];
        } else if (sData.post_scripts && sData.post_scripts.length > 0) {
          text = sData.post_scripts[0];
        } else {
          text = sData.topic || "";
        }
      }
      
      // Select hashtags
      let tagsText = "";
      if (hashtagsOverride && hashtagsOverride.length > 0) {
        tagsText = hashtagsOverride.map(t => t.startsWith('#') ? t : `#${t}`).join(" ");
      } else if (sData.hashtags && sData.hashtags.recommended_mix) {
        const mix = Array.isArray(sData.hashtags.recommended_mix) 
          ? sData.hashtags.recommended_mix 
          : (typeof sData.hashtags.recommended_mix === 'string' ? sData.hashtags.recommended_mix.split(' ').filter(Boolean) : []);
        tagsText = mix.slice(0, 3).map((t: string) => t.startsWith('#') ? t : `#${t}`).join(" ");
      }
      
      formData.append("text", String(text));
      if (tagsText) formData.append("hashtags", tagsText);
      formData.append("posterUrl", imageUrl);
      
      await publishContent(formData);
      setPublishFeedback({ message: `Successfully published to ${session.platform}!`, type: "success" });
      setTimeout(() => setPublishFeedback(null), 5000);
      setActiveImageModal(null); // close modal if open
    } catch (e: any) {
      console.error(e);
      setPublishFeedback({ message: e.response?.data?.detail || "Failed to publish. Have you connected your account in Settings?", type: "error" });
      setTimeout(() => setPublishFeedback(null), 6000);
    } finally {
      setPublishing(null);
    }
  }

  // Form submission handler
  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || isGenerating) return; // Block duplicate submissions

    setIsGenerating(true);

    // Create a local pending session card to show "generating..."
    const tempSessionId = generateUUID();
    const tempSession = {
      session_id: tempSessionId,
      user_id: user.id,
      created_at: new Date().toISOString(),
      brand_name: form.brand_name || "New Campaign",
      platform: form.platform,
      tone: form.tone,
      cta_goal: form.cta_goal,
      image_style: form.image_style,
      status: "generating", // amber pulse chip
      session_data: {
        topic: form.topic,
        target_audience: form.audience,
        user_suggestion: form.user_suggestion,
        purpose: form.purpose,
      }
    };

    // Prepend the new session and close the drawer
    setSessions(prev => [tempSession, ...prev]);
    setShowDrawer(false);
    setActiveTab("overview");

    try {
      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        await uploadLogo(formData);
      }

      const payload = { ...form, use_logo: !!logoFile };
      const data = await generateContent(payload);

      // The API returns request_id which matches the session_id saved in Supabase.
      // Re-fetch the real session from Supabase to get the correct data structure
      // (with session_data containing captions, images, calendar, etc.)
      const realSessionId = data?.request_id;
      if (realSessionId && user?.id) {
        // Poll up to 60 times (90 seconds) for the completed session, since image + video gen takes time
        let realSession: any = null;
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 1500));
          const { data: dbData } = await supabase
            .from("sessions")
            .select("*")
            .eq("session_id", realSessionId)
            .eq("user_id", user.id)
            .single();
          if (dbData?.session_data?.status === "completed" || dbData?.session_data?.status === "failed" || dbData?.status === "completed") {
            realSession = dbData;
            break;
          }
        }

        if (realSession) {
          // Replace the temp placeholder with the real DB record
          setSessions(prev => prev.map(s =>
            s.session_id === tempSessionId ? realSession : s
          ));
        } else {
          // Fallback: remove temp and re-fetch all sessions to get latest state
          setSessions(prev => prev.filter(s => s.session_id !== tempSessionId));
          fetchSessions(user.id);
        }
      } else {
        setSessions(prev => prev.filter(s => s.session_id !== tempSessionId));
        fetchSessions(user.id);
      }
    } catch (err: any) {
      console.error(err);
      // Mark as failed
      setSessions(prev => prev.map(s => s.session_id === tempSessionId ? {
        ...s,
        status: "failed",
        session_data: {
          ...s.session_data,
          status: "failed",
          error_message: err?.message || "Generation failed."
        }
      } : s));
    } finally {
      setIsGenerating(false);
    }
  }

  // Pre-fill fields for a "Re-generate" action
  function handleReGenerate(session: any) {
    const sData = session.session_data || {};
    setForm({
      purpose: sData.purpose || session.purpose || "general",
      topic: sData.topic || session.topic || "",
      platform: session.platform || "instagram",
      audience: sData.target_audience || sData.audience || "",
      tone: session.tone || "educational",
      brand_name: session.brand_name || "",
      brand_primary_color: "#8763e5",
      brand_secondary_color: "#120F17",
      visual_style: sData.visual_style || "modern",
      post_type: sData.post_type || "single_post",
      cta_goal: session.cta_goal || "downloads",
      image_style: session.image_style || "realistic",
      app_context_url: sData.app_context_url || "",
      app_context_file_content: sData.app_context_file_content || "",
      user_suggestion: sData.user_suggestion || "",
    });
    setShowDrawer(true);
  }

  // Dynamic derivation of statistics - only count fully completed sessions
  const completedSessions = sessions.filter(s => s.status === "completed" || s.session_data?.status === "completed");
  const totalCount = completedSessions.length;

  // Count actual posts+videos generated per platform (not just sessions)
  // Use only generated_images to avoid double-counting with rendered_post_urls
  const platformCounts = (() => {
    const counts: Record<string, number> = { instagram: 0, youtube: 0, linkedin: 0, twitter: 0 };
    completedSessions.forEach(s => {
      const plat = s.platform;
      if (!counts.hasOwnProperty(plat)) return;
      const d = s.session_data || {};
      const posts = d.generated_images?.length || 0;
      const videos = (d.generated_video?.url ? 1 : 0) + (d.language_videos ? Object.keys(d.language_videos).length : 0);
      counts[plat] += posts + videos;
    });
    return counts;
  })();

  // Dynamic Spend Calculations based on contentforge-cost-calculation.md rate limits
  const getCostStats = () => {
    let totalImages = 0;
    let totalVideos = 0;
    let todayCost = 0;
    let yesterdayCost = 0;

    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    completedSessions.forEach(s => {
      const sData = s.session_data || {};
      // Use only generated_images (not rendered_post_urls) to match backend spend logic
      const images = sData.generated_images?.length || 0;
      const videos = (sData.generated_video?.url ? 1 : 0) + (sData.language_videos ? Object.keys(sData.language_videos).length : 0);
      const cost = (images * 0.25) + (videos * 2.00);

      totalImages += images;
      totalVideos += videos;

      if (s.created_at?.startsWith(todayStr)) {
        todayCost += cost;
      } else if (s.created_at?.startsWith(yesterdayStr)) {
        yesterdayCost += cost;
      }
    });

    const totalCost = (totalImages * 0.25) + (totalVideos * 2.00);

    let trendBadge = "New";
    if (yesterdayCost > 0) {
      const pct = ((todayCost - yesterdayCost) / yesterdayCost) * 100;
      trendBadge = (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
    } else if (todayCost === 0) {
      trendBadge = "0.0%";
    }

    return { totalCost, totalImages, totalVideos, trendBadge };
  };

  const { totalCost, totalImages, totalVideos, trendBadge } = getCostStats();

  // Safe formatting helpers
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Compile tag cloud data for Hashtags tab
  const getCompiledHashtags = () => {
    const frequency: Record<string, number> = {};
    sessions.forEach(s => {
      const mix = s.session_data?.hashtags?.recommended_mix;
      if (typeof mix === "string") {
        const matches = mix.match(/#\w+/g);
        if (matches) {
          matches.forEach(tag => {
            frequency[tag] = (frequency[tag] || 0) + 1;
          });
        }
      }
    });
    return Object.entries(frequency)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  };

  // Build calendar days mapping
  const getCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const daysArray = [];
    // Leading pads
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push(null);
    }
    // Month days
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      // Find all completed sessions scheduled for or generated on this date
      const daySessions = completedSessions.filter(s => {
        const sched = s.session_data?.scheduled_for || s.scheduled_for;
        if (sched) return sched.startsWith(dateStr);
        return s.created_at.startsWith(dateStr);
      });
      daysArray.push({ dayNum, dateStr, daySessions });
    }
    return daysArray;
  };

  const calendarDays = getCalendarDays();
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<any>(null);

  // Dynamic filter lists for specific tabs — only show completed sessions in content tabs
  const filteredSessions = sessions.filter(s => {
    // 1. Only show completed sessions (skip ones that are still generating)
    const isCompleted = s.status === "completed" || s.session_data?.status === "completed";
    if (!isCompleted) return false;

    // 2. Filter by platform
    if (platformFilter !== "all" && s.platform !== platformFilter) return false;
    
    // 3. Filter by status
    if (statusFilter !== "all" && (s.status !== statusFilter && s.session_data?.status !== statusFilter)) return false;

    return true;
  }).sort((a, b) => {
    if (sortOrder === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-[#f9f9fb] text-neutral-950 font-sans antialiased relative pb-24">
      {/* Canvas Background */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[#f9f9fb]" />

      {/* Main Studio Frame */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 mt-12">
        {/* Studio Overview / Hero */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="font-sans font-bold tracking-tightest text-4xl md:text-5xl lg:text-6xl text-neutral-900 leading-[1.03]">
              Your Studio, at a <span className="text-[#8763e5]">glance</span>.
            </h1>
            <p className="lead mt-2 text-sm md:text-base text-neutral-600">
              Everything crafted by quiet machines — organized, tracked, ready to publish.
            </p>
          </div>
          <button
            onClick={() => setShowDrawer(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#120F17] hover:bg-neutral-800 text-white rounded-full font-semibold text-sm transition shadow-lg self-start md:self-center shrink-0"
          >
            <Plus size={16} />
            <span>New Generation</span>
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 mb-4">
          {/* Card 1: Total Packages */}
          <Link 
            href="/spend"
            className="group relative flex flex-col justify-between p-6 rounded-3xl h-[115px] bg-[#120F17] hover:bg-[#181520] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-xl hover:shadow-black/10"
          >
            <div className="flex flex-col justify-between h-full w-full">
              <span className="text-[10px] tracking-[0.18em] uppercase font-semibold text-[#8A8780]" style={{ fontFamily: "'Inter', sans-serif" }}>Total Packages</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold tracking-tight text-white">{totalCount}</span>
                <span className="text-[9px] text-[#8A8780] font-semibold tracking-wider uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>All-time</span>
              </div>
            </div>
          </Link>

          {/* Platform breakdown items — each links to its own spend page */}
          {([
            { plat: "instagram", svgIcon: "/instagram.svg", color: "#d075d8" },
            { plat: "youtube",   svgIcon: "/youtube.svg",   color: "#ef4444" },
            { plat: "linkedin",  svgIcon: "/linkedin.svg",  color: "#2d8cff" },
            { plat: "twitter",   svgIcon: "",               color: "#efc844" },
          ] as const).map(({ plat, svgIcon, color }) => (
            <Link
              key={plat}
              href={`/spend/${plat}`}
              className="group relative flex flex-col justify-between p-6 rounded-3xl h-[115px] bg-[#120F17] hover:bg-[#181520] border border-white/[0.06] transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-xl hover:shadow-black/10"
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${color}40`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
            >
              {/* Top row: label + platform icon */}
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] tracking-[0.18em] uppercase font-semibold text-[#8A8780] capitalize" style={{ fontFamily: "'Inter', sans-serif" }}>{plat}</span>

                {plat === "twitter" ? (
                  <svg viewBox="0 0 300 300" className="w-7 h-7 flex-shrink-0" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66" />
                  </svg>
                ) : (
                  <img src={svgIcon} alt={plat} className="w-6 h-6 object-contain" />
                )}
              </div>

              {/* Bottom row: count + mini bar */}
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold tracking-tight text-white">
                  {platformCounts[plat] ?? 0}
                </span>
                <div className="flex items-end gap-[3px] h-[18px]">
                  <div className="w-[3px] bg-white/5 rounded-sm h-[30%]" />
                  <div className="w-[3px] rounded-sm h-[75%] animate-pulse" style={{ backgroundColor: color }} />
                  <div className="w-[3px] rounded-sm h-[50%]" style={{ backgroundColor: `${color}90` }} />
                  <div className="w-[3px] bg-white/5 rounded-sm h-[40%]" />
                  <div className="w-[3px] rounded-sm h-[90%]" style={{ backgroundColor: color }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-[10px] tracking-[0.2em] uppercase mb-10 select-none font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
          <span className="bg-gradient-to-r from-[#8763e5] via-[#d075d8] to-[#ef4444] bg-clip-text text-transparent">Powered by multi-agent AI</span>
          <span className="text-neutral-400 mx-1.5">·</span>
          <span className="text-neutral-900 font-semibold">Updated live</span>
        </div>

        {/* Tab Navigation Menu */}
        <div className="sticky top-[72px] z-30 bg-[#f9f9fb]/90 backdrop-blur-md border-b border-neutral-200 py-4 mb-8 overflow-x-auto scrollbar-none flex items-center gap-2">
          {[
            { id: "overview", label: "Overview" },
            { id: "posts", label: "Generated Posts" },
            { id: "videos", label: "Generated Videos" },
            { id: "captions", label: "Captions" },
            { id: "hashtags", label: "Hashtags" },
            { id: "calendar", label: "Calendar" },
            { id: "insights", label: "Research Insights" },
            { id: "painpoints", label: "Audience Painpoints" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-200 border ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-[#8763e5] to-[#6c3fcf] text-white border-transparent shadow-lg shadow-[#8763e5]/20"
                  : "bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400 hover:shadow-sm"
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State for History */}
        {loadingSessions ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <RefreshCw size={24} className="animate-spin text-[#8763e5]" />
            <p className="text-sm text-neutral-500 font-mono uppercase tracking-wider">Syncing Studio Records...</p>
          </div>
        ) : (
          <div className="relative min-h-[400px]">
            {/* 3.1 OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity (Left 2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <div className="text-sm font-bold text-neutral-900 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Recent Activity</div>
                  </div>
                  {sessions.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white border border-neutral-200/80 shadow-sm p-12 text-center rounded-2xl flex flex-col items-center justify-center min-h-[300px]">
                      <span className="text-xs font-bold tracking-[0.2em] text-[#b38840] mb-6 uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>AWAITING BRIEF</span>
                      <h3 className="font-sans font-bold text-2xl md:text-3xl tracking-tightest mb-2 text-neutral-900">Your Studio is empty — for now.</h3>
                      <p className="text-sm text-neutral-600 max-w-sm mb-8 leading-relaxed">
                        Every post you generate lives here. Start your first content package and watch your library grow.
                      </p>
                      <button
                        onClick={() => setShowDrawer(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:text-black font-semibold text-xs rounded-full transition"
                      >
                        Generate your first package
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sessions.filter(s => {
                        if (platformFilter !== "all" && s.platform !== platformFilter) return false;
                        return true;
                      }).slice(0, 6).map((session) => {
                        const sData = session.session_data || {};
                        const hasScript = !!(sData.video_script || sData.post_scripts || sData.twitter_scripts);
                        const hasVisual = !!(sData.rendered_post_urls?.length || sData.generated_images?.length || sData.generated_video?.url);
                        const hasHashtags = !!(sData.hashtags?.recommended_mix);
                        const hasCalendar = !!(sData.calendar_7day?.length || sData.calendar_30day?.length);

                        // Image thumbnail resolver
                        let thumbnail = null;
                        let isVideoThumb = false;
                        if (sData.rendered_post_urls?.length) thumbnail = sData.rendered_post_urls[0];
                        else if (sData.generated_images?.length) thumbnail = sData.generated_images[0]?.url || sData.generated_images[0];
                        else if (sData.generated_video?.url) {
                          thumbnail = sData.generated_video.url;
                          isVideoThumb = true;
                        }

                        return (
                          <BorderGlow
                            key={session.session_id}
                            glowColor="135 99 229"
                            backgroundColor="#120F17"
                            borderRadius={24}
                            glowRadius={80}
                            glowIntensity={1.5}
                            className="relative flex flex-col justify-between gap-5 p-5 md:p-6 border-none transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_15px_40px_rgba(135,99,229,0.12)] group bg-gradient-to-br from-[#17151f] to-[#120F17]"
                          >
                            <div className="flex gap-5">
                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0 flex items-center justify-center relative shadow-inner">
                                {thumbnail ? (
                                  isVideoThumb ? (
                                    <div className="w-full h-full flex items-center justify-center bg-black/40 text-[#8763e5] group-hover:scale-105 transition-transform duration-500">
                                      <Video size={24} />
                                    </div>
                                  ) : (
                                    <img src={thumbnail} alt="Poster preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                  )
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center opacity-30">
                                    <ImageIcon size={24} />
                                  </div>
                                )}
                              </div>
                              <div className="overflow-hidden flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[11px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-md shadow-sm" style={{ backgroundColor: `${PLATFORM_COLORS[session.platform]}20`, color: PLATFORM_COLORS[session.platform], fontFamily: "'Inter', sans-serif" }}>
                                    {session.platform}
                                  </span>
                                  <span className="text-[11px] text-[#8A8780] font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                                    {formatDate(session.created_at)}
                                  </span>
                                </div>
                                <h4 className="text-base font-bold text-[#F4F1EC] mt-1 truncate" title={sData.topic || "Draft Package"} style={{ fontFamily: "'Inter', sans-serif" }}>
                                  {sData.topic || "Draft Package"}
                                </h4>
                              </div>
                            </div>

                            {/* Status Chips */}
                            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/[0.04]">
                              {session.status === "generating" ? (
                                <span className="flex items-center gap-1.5 text-xs font-bold text-[#fcd34d] bg-[#f59e0b]/10 border border-[#f59e0b]/30 px-3 py-1 rounded-full animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.1)]" style={{ fontFamily: "'Inter', sans-serif" }}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#fcd34d] animate-ping" /> Generating...
                                </span>
                              ) : session.status === "failed" ? (
                                <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.1)]" style={{ fontFamily: "'Inter', sans-serif" }}>
                                  ✕ Failed
                                </span>
                              ) : (
                                <>
                                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${hasScript ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : "text-neutral-500 border-white/5 bg-white/[0.02]"}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                                    Script {hasScript && <span className="ml-0.5 text-emerald-300">✓</span>}
                                  </span>
                                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${hasVisual ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : "text-neutral-500 border-white/5 bg-white/[0.02]"}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                                    Visual {hasVisual && <span className="ml-0.5 text-emerald-300">✓</span>}
                                  </span>
                                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${hasHashtags ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : "text-neutral-500 border-white/5 bg-white/[0.02]"}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                                    Tags {hasHashtags && <span className="ml-0.5 text-emerald-300">✓</span>}
                                  </span>
                                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${hasCalendar ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : "text-neutral-500 border-white/5 bg-white/[0.02]"}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                                    Calendar {hasCalendar && <span className="ml-0.5 text-emerald-300">✓</span>}
                                  </span>
                                </>
                              )}
                            </div>
                          </BorderGlow>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Column Breakdown & Insights */}
                <div className="space-y-8">
                  {/* Today's Generations */}
                  <div className="space-y-4">
                    <div className="text-sm font-bold text-neutral-900 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Today's Generations</div>
                    <div className="relative p-5 rounded-[18px] bg-[#120F17] border border-white/[0.06] space-y-4">

                      {/* Progress bar — today's posts+videos share per platform */}
                      {(() => {
                        const todayStr = new Date().toISOString().split("T")[0];
                        const todayCounts: Record<string, number> = { instagram: 0, youtube: 0, linkedin: 0, twitter: 0 };
                        sessions.forEach(s => {
                          if (!s.created_at?.startsWith(todayStr)) return;
                          const plat = s.platform;
                          if (!todayCounts.hasOwnProperty(plat)) return;
                          const d = s.session_data || {};
                          const posts = (d.rendered_post_urls?.length || 0) + (d.generated_images?.length || 0);
                          const videos = (d.generated_video?.url ? 1 : 0) + (d.language_videos ? Object.keys(d.language_videos).length : 0);
                          todayCounts[plat] += posts + videos;
                        });
                        const todayTotal = Object.values(todayCounts).reduce((a, b) => a + b, 0);

                        const PLAT_CONFIG = [
                          { key: "instagram", label: "Instagram", color: "#d075d8", svgIcon: "/instagram.svg", invert: false },
                          { key: "youtube",   label: "Youtube",   color: "#ef4444", svgIcon: "/youtube.svg",   invert: false },
                          { key: "linkedin",  label: "Linkedin",  color: "#2d8cff", svgIcon: "/linkedin.svg",  invert: false },
                          { key: "twitter",   label: "Twitter",   color: "#efc844", svgIcon: "",               invert: true  },
                        ];

                        return (
                          <>
                            {/* Bar */}
                            <div className="w-full h-1.5 rounded-full overflow-hidden bg-neutral-800 flex">
                              {PLAT_CONFIG.map(({ key, color }) => {
                                const pct = todayTotal > 0 ? (todayCounts[key] / todayTotal) * 100 : 0;
                                if (pct === 0) return null;
                                return <div key={key} style={{ width: `${pct}%`, backgroundColor: color }} className="h-full" />;
                              })}
                              {todayTotal === 0 && <div className="w-full h-full bg-white/5 rounded-full" />}
                            </div>

                            {/* Legend — platform icon + name + today count */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-1">
                              {PLAT_CONFIG.map(({ key, label, color, svgIcon, invert }) => (
                                <div key={key} className="flex items-center gap-2">
                                  {key === "twitter" ? (
                                    <svg viewBox="0 0 300 300" className="w-3.5 h-3.5 shrink-0" fill="white" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66" />
                                    </svg>
                                  ) : (
                                    <img
                                      src={svgIcon}
                                      alt={label}
                                      className="w-3.5 h-3.5 object-contain shrink-0"
                                      style={invert ? { filter: "invert(1)", opacity: 0.7 } : undefined}
                                    />
                                  )}
                                  <span className="text-xs text-[#D8D3CB] font-medium">{label}</span>
                                  <span className="text-[10px] font-mono ml-auto" style={{ color }}>{todayCounts[key]}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>


                  {/* Research Insights & Pain Points */}
                  <div className="space-y-4">
                    <div className="text-sm font-bold text-[#F4F1EC] tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Research Insights & Pain Points</div>
                    <div className="space-y-3">
                      {sessions
                        .filter(s => s.session_data?.trends?.length || s.session_data?.pain_points?.length || s.session_data?.competitor_insights)
                        .slice(0, 4)
                        .map((s, idx) => (
                          <div
                            key={idx}
                            className="relative p-5 rounded-[18px] bg-[#120F17] border border-white/[0.06] flex flex-col gap-4 hover:border-white/[0.12] transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded font-mono shadow-sm" style={{ backgroundColor: `${PLATFORM_COLORS[s.platform]}20`, color: PLATFORM_COLORS[s.platform] }}>
                                {s.platform}
                              </span>
                              <span className="text-[10px] text-[#8A8780] font-mono">
                                {formatDate(s.created_at)}
                              </span>
                            </div>

                            {/* Trends */}
                            {s.session_data?.trends?.length > 0 && (
                              <div className="flex items-start gap-3">
                                <TrendingUp size={16} className="text-[#d4a24c] shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif", color: '#d4a24c' }}>
                                    Emerging Trend
                                  </div>
                                  <p className="text-xs text-[#e0ddd6] mt-1 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                                    {s.session_data.trends[0]}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Pain Points */}
                            {s.session_data?.pain_points?.length > 0 && (
                              <div className="flex items-start gap-3 border-t border-white/[0.04] pt-3 mt-1">
                                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif", color: '#ef4444' }}>
                                    Audience Pain Point
                                  </div>
                                  <p className="text-xs text-[#e0ddd6] mt-1 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                                    {s.session_data.pain_points[0]}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Competitor Insights */}
                            {s.session_data?.competitor_insights && (
                              <div className="flex items-start gap-3 border-t border-white/[0.04] pt-3 mt-1">
                                <Search size={16} className="text-[#8763e5] shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif", color: '#8763e5' }}>
                                    Competitor Insight
                                  </div>
                                  <p className="text-xs text-[#e0ddd6] mt-1 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                                    {s.session_data.competitor_insights}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      {sessions.filter(s => s.session_data?.trends?.length || s.session_data?.pain_points?.length).length === 0 && (
                        <div className="p-5 rounded-[18px] bg-[#120F17] border border-white/[0.06]">
                          <p className="text-sm text-[#8A8780] italic text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
                            No research insights generated yet. <span className="text-[#8763e5] font-semibold">Craft a brief</span> to begin.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3.2 GENERATED POSTS TAB */}
            {activeTab === "posts" && (
              <div className="space-y-6">
                {/* Filters & Actions Panel */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-[#1a1721] border border-[#8763e5]/20 rounded-xl overflow-hidden p-1 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]">
                      <button 
                        onClick={() => setPlatformFilter("all")}
                        className={`text-[13px] px-5 py-2 rounded-lg font-bold transition-all duration-300 ${platformFilter === "all" ? "bg-white text-black shadow-lg shadow-white/10" : "text-neutral-400 hover:text-white hover:bg-white/5"}`}
                      >
                        All
                      </button>
                      {PLATFORMS.map(p => (
                        <button
                          key={p}
                          onClick={() => setPlatformFilter(p)}
                          className={`px-5 py-2 rounded-lg transition-all duration-300 flex items-center justify-center ${platformFilter === p ? "bg-white shadow-lg shadow-white/10" : "hover:bg-white/5"}`}
                          title={p}
                        >
                          <img 
                            src={PLATFORM_SVGS[p]} 
                            alt={p} 
                            className={`transition-all duration-300 ${p === 'twitter' ? 'w-5 h-5 scale-150' : 'w-5 h-5'} ${p === 'twitter' && platformFilter !== 'twitter' ? 'invert opacity-70' : ''} ${p === 'twitter' && platformFilter === 'twitter' ? 'opacity-100' : ''}`} 
                            style={p !== 'twitter' ? { opacity: platformFilter === p ? 1 : 0.5, filter: platformFilter === p ? 'brightness(1.1)' : 'grayscale(100%)' } : {}} 
                          />
                        </button>
                      ))}
                    </div>

                    <select
                      className="cf-input bg-[#111110] border border-white/5 text-xs py-2 px-3 rounded-xl max-w-[150px] outline-none"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSessions.flatMap(s => {
                    const sData = s.session_data || {};
                    const rendered = Array.isArray(sData.rendered_post_urls) ? sData.rendered_post_urls : [];
                    const generated = Array.isArray(sData.generated_images) ? sData.generated_images : [];
                    // Safely extract URLs and filter out invalid/empty ones
                    const allUrls = [...rendered, ...generated.map((img: any) => typeof img === 'string' ? img : img?.url)].filter(url => typeof url === 'string' && url.trim().length > 5 && url.startsWith('http'));

                    return allUrls.map((url, imgIdx) => (
                      <BorderGlow
                        key={`${s.session_id}-${imgIdx}`}
                        glowColor="256 73 64"
                        backgroundColor="#120F17"
                        borderRadius={16}
                        glowRadius={70}
                        glowIntensity={1.3}
                        className="relative overflow-hidden border-none flex flex-col justify-between group bg-[#0A0A0A]"
                      >
                        {/* Thumbnail view */}
                        <div className="aspect-square relative w-full overflow-hidden flex items-center justify-center bg-black/40 border-b border-white/5">
                          <img 
                            src={url} 
                            alt="Poster" 
                            className="w-full h-full object-cover transition duration-500 group-hover:scale-105" 
                          />
                        </div>
                        <div className="p-4 space-y-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded font-mono" style={{ backgroundColor: `${PLATFORM_COLORS[s.platform]}20`, color: PLATFORM_COLORS[s.platform] }}>
                                {s.platform}
                              </span>
                              <span className="text-[10px] text-[#8A8780] font-mono">
                                {formatDate(s.created_at)}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-[#F4F1EC] mt-2 truncate" title={sData.topic}>
                              {sData.topic || "Post Image"}
                            </h4>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <button
                              onClick={() => handlePublish(s, url)}
                              disabled={publishing === url}
                              className={`flex flex-1 items-center justify-center gap-2 py-2 px-3 mr-2 rounded-lg transition-all text-xs font-medium border ${publishing === url ? "bg-[#8763e5]/20 text-[#8763e5] border-[#8763e5]/30" : "bg-[#8763e5] hover:bg-[#7a59cc] text-white border-transparent"}`}
                            >
                              {publishing === url ? (
                                <>
                                  <RefreshCw size={14} className="animate-spin" />
                                  <span>Posting...</span>
                                </>
                              ) : (
                                <>
                                  <Send size={14} />
                                  <span>Post to {s.platform === "twitter" ? "X" : "Social"}</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                // Default pick first tone and 3 tags if opening modal
                                const sData = s.session_data || {};
                                let defaultCap = "";
                                if (sData.captions && typeof sData.captions === "object") {
                                  const keys = Object.keys(sData.captions);
                                  if (keys.length > 0) defaultCap = sData.captions[keys[0]];
                                } else if (sData.captions && typeof sData.captions === "string") {
                                  defaultCap = sData.captions;
                                }
                                setSelectedCaptionModal(defaultCap);
                                const mix = Array.isArray(sData.hashtags?.recommended_mix) 
                                  ? sData.hashtags.recommended_mix 
                                  : (typeof sData.hashtags?.recommended_mix === 'string' ? sData.hashtags.recommended_mix.split(' ').filter(Boolean) : []);
                                setSelectedHashtagsModal(mix.slice(0, 3));
                                setActiveImageModal({ url, session: s });
                              }}
                              className="flex items-center justify-center p-2 mr-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#e0ddd6] hover:text-white transition-all border border-white/5"
                              title="View & Edit"
                            >
                              <ImageIcon size={14} />
                            </button>
                            <button
                              onClick={() => handleDownload(url, `contentforge-${s.platform}-${formatDate(s.created_at).replace(/\s/g, "")}.png`)}
                              className="flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#8A8780] hover:text-white transition-all border border-white/5"
                              title="Download"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </div>
                      </BorderGlow>
                    ));
                  })}

                  {filteredSessions.filter(s => s.session_data?.rendered_post_urls?.length || s.session_data?.generated_images?.length).length === 0 && (
                    <div className="col-span-full py-16 text-center text-[#8A8780] font-mono text-xs">
                      NO GENERATED IMAGES FOUND IN THIS DIRECTORY
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3.3 GENERATED VIDEOS TAB */}
            {activeTab === "videos" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSessions
                    .filter(s => s.session_data?.generated_video?.url || s.session_data?.language_videos)
                    .map(s => {
                      const sData = s.session_data || {};
                      const videoUrl = sData.generated_video?.url || (sData.language_videos ? Object.values(sData.language_videos)[0] : "");

                      if (!videoUrl) return null;

                      return (
                        <BorderGlow
                          key={s.session_id}
                          glowColor="256 73 64"
                          backgroundColor="#120F17"
                          borderRadius={16}
                          glowRadius={70}
                          glowIntensity={1.3}
                          className="relative overflow-hidden border-none flex flex-col justify-between group"
                        >
                          {/* Autoplay preview on hover */}
                          <div className="aspect-video relative w-full overflow-hidden bg-black border-b border-white/5 flex items-center justify-center cursor-pointer" onClick={() => {
                            const sData = s.session_data || {};
                            let defaultCap = "";
                            if (sData.captions && typeof sData.captions === "object") {
                              const keys = Object.keys(sData.captions);
                              if (keys.length > 0) defaultCap = sData.captions[keys[0]];
                            } else if (sData.captions && typeof sData.captions === "string") {
                              defaultCap = sData.captions;
                            }
                            setSelectedCaptionModal(defaultCap);
                            const mix = Array.isArray(sData.hashtags?.recommended_mix) 
                              ? sData.hashtags.recommended_mix 
                              : (typeof sData.hashtags?.recommended_mix === 'string' ? sData.hashtags.recommended_mix.split(' ').filter(Boolean) : []);
                            setSelectedHashtagsModal(mix.slice(0, 3));
                            setActiveVideoModal({ url: videoUrl, session: s });
                          }}>
                            <video
                              src={videoUrl}
                              muted
                              loop
                              playsInline
                              onMouseEnter={(e) => e.currentTarget.play()}
                              onMouseLeave={(e) => {
                                e.currentTarget.pause();
                                e.currentTarget.currentTime = 0;
                              }}
                              className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                            />
                            {/* Professional Glassmorphic Play Button */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                              <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
                                <Play size={24} className="text-white ml-1 shadow-lg" fill="currentColor" />
                              </div>
                            </div>
                          </div>

                          <div className="p-4 space-y-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded font-mono" style={{ backgroundColor: `${PLATFORM_COLORS[s.platform]}20`, color: PLATFORM_COLORS[s.platform] }}>
                                  {s.platform}
                                </span>
                                <span className="text-[10px] text-[#8A8780] font-mono">
                                  {formatDate(s.created_at)}
                                </span>
                              </div>
                              <h4 className="text-sm font-semibold text-[#F4F1EC] mt-2 truncate" title={sData.topic}>
                                {sData.topic || "Generated Video ad"}
                              </h4>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                              <button
                                onClick={() => handlePublish(s, videoUrl)}
                                disabled={publishing === videoUrl}
                                className={`flex flex-1 items-center justify-center gap-2 py-2 px-3 mr-2 rounded-lg transition-all text-xs font-medium border ${publishing === videoUrl ? "bg-[#8763e5]/20 text-[#8763e5] border-[#8763e5]/30" : "bg-[#8763e5] hover:bg-[#7a59cc] text-white border-transparent"}`}
                              >
                                {publishing === videoUrl ? (
                                  <>
                                    <RefreshCw size={14} className="animate-spin" />
                                    <span>Posting...</span>
                                  </>
                                ) : (
                                  <>
                                    <Send size={14} />
                                    <span>Post to {s.platform === "twitter" ? "X" : "Social"}</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  const sData = s.session_data || {};
                                  let defaultCap = "";
                                  if (sData.captions && typeof sData.captions === "object") {
                                    const keys = Object.keys(sData.captions);
                                    if (keys.length > 0) defaultCap = sData.captions[keys[0]];
                                  } else if (sData.captions && typeof sData.captions === "string") {
                                    defaultCap = sData.captions;
                                  }
                                  setSelectedCaptionModal(defaultCap);
                                  const mix = Array.isArray(sData.hashtags?.recommended_mix) 
                                    ? sData.hashtags.recommended_mix 
                                    : (typeof sData.hashtags?.recommended_mix === 'string' ? sData.hashtags.recommended_mix.split(' ').filter(Boolean) : []);
                                  setSelectedHashtagsModal(mix.slice(0, 3));
                                  setActiveVideoModal({ url: videoUrl, session: s });
                                }}
                                className="flex items-center justify-center p-2 mr-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#e0ddd6] hover:text-white transition-all border border-white/5"
                                title="View & Edit"
                              >
                                <Play size={14} />
                              </button>
                              <button
                                onClick={() => handleDownload(videoUrl, `contentforge-${s.platform}-${formatDate(s.created_at).replace(/\s/g, "")}.mp4`)}
                                className="flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#8A8780] hover:text-white transition-all border border-white/5"
                                title="Download"
                              >
                                <Download size={14} />
                              </button>
                            </div>
                          </div>
                        </BorderGlow>
                      );
                    })}

                  {filteredSessions.filter(s => s.session_data?.generated_video?.url || s.session_data?.language_videos).length === 0 && (
                    <div className="col-span-full py-16 text-center text-[#8A8780] font-mono text-xs">
                      NO GENERATED VIDEOS FOUND IN THIS DIRECTORY
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3.4 CAPTIONS TAB */}
            {activeTab === "captions" && (
              <div className="space-y-4">
                {filteredSessions.map(s => {
                  const sData = s.session_data || {};
                  const captions = sData.captions || {};

                  if (Object.keys(captions).length === 0) return null;

                  return (
                    <BorderGlow
                      key={s.session_id}
                      glowColor="135 99 229"
                      backgroundColor="#120F17"
                      borderRadius={16}
                      glowRadius={60}
                      glowIntensity={1.2}
                      className="border border-white/[0.06] p-6 space-y-5"
                    >
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded font-mono shadow-sm" style={{ backgroundColor: `${PLATFORM_COLORS[s.platform]}20`, color: PLATFORM_COLORS[s.platform] }}>
                            {s.platform}
                          </span>
                          <span className="text-xs text-[#8A8780] font-mono">
                            {formatDate(s.created_at)} · {sData.topic}
                          </span>
                        </div>
                      </div>

                      {/* Display each tone script */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {Object.entries(captions).map(([tone, text]: [string, any]) => (
                          <div key={tone} className="bg-[#17151f] p-5 rounded-xl border border-white/[0.04] space-y-3 hover:border-white/[0.12] transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase tracking-wider text-[#b38840] font-mono font-bold">
                                {tone} tone
                              </span>
                              <button
                                onClick={() => copyToClipboard(text, "Caption")}
                                className="text-[10px] text-[#8763e5] hover:text-[#d79de4] transition-colors uppercase font-bold tracking-wider"
                              >
                                [Copy]
                              </button>
                            </div>
                            <p className="text-[13px] text-[#e0ddd6] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                              {text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </BorderGlow>
                  );
                })}

                {filteredSessions.filter(s => s.session_data?.captions && Object.keys(s.session_data.captions).length).length === 0 && (
                  <div className="py-16 text-center text-[#8A8780] font-mono text-xs">
                    NO WRITTEN CAPTIONS FOUND IN THIS WORKSPACE
                  </div>
                )}
              </div>
            )}

            {/* 3.5 HASHTAGS TAB */}
            {activeTab === "hashtags" && (
              <div className="space-y-8">
                {/* tag cloud pill mix */}
                <div className="bg-[#120F17] border border-white/[0.06] p-6 rounded-[20px] space-y-5 shadow-sm text-[#F4F1EC]">
                  <div className="text-[10px] uppercase tracking-widest text-[#8A8780] font-bold font-mono">Top row: Most-used hashtags</div>
                  <div className="flex flex-wrap gap-2.5 items-center">
                    {getCompiledHashtags().map(({ tag, count }) => {
                      const scaleSize = 10 + Math.min(count * 2.5, 12);
                      return (
                        <span
                          key={tag}
                          style={{ fontSize: `${scaleSize}px` }}
                          className="px-3.5 py-1.5 rounded-full bg-[#1A1821] border border-white/[0.06] text-[#8763e5] font-mono font-bold hover:border-[#8763e5]/50 transition select-all cursor-pointer shadow-inner"
                        >
                          {tag}
                        </span>
                      );
                    })}
                    {getCompiledHashtags().length === 0 && (
                      <span className="text-xs text-[#8A8780] font-mono italic">No hashtags saved yet.</span>
                    )}
                  </div>
                </div>

                {/* list per package */}
                <div className="space-y-4">
                  <div className="text-[10px] uppercase tracking-widest text-[#8A8780] font-bold font-mono">Workspace Lists</div>
                  {filteredSessions.map(s => {
                    const mix = s.session_data?.hashtags?.recommended_mix;
                    if (!mix) return null;

                    return (
                      <div key={s.session_id} className="bg-[#120F17] border border-white/[0.06] p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition hover:border-white/10">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded font-mono shadow-sm" style={{ backgroundColor: `${PLATFORM_COLORS[s.platform]}20`, color: PLATFORM_COLORS[s.platform] }}>
                              {s.platform}
                            </span>
                            <span className="text-[10px] text-[#8A8780] font-mono">
                              {formatDate(s.created_at)} · {s.session_data.topic}
                            </span>
                          </div>
                          <p className="text-[13px] font-mono text-[#d79de4] select-text leading-relaxed font-bold">
                            {mix}
                          </p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(mix, "Package Tags")}
                          className="border border-white/10 text-[#F4F1EC] hover:bg-white/5 font-semibold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shrink-0 self-start md:self-center transition-colors"
                        >
                          <Copy size={14} />
                          <span>Copy all</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3.6 CALENDAR TAB */}
            {activeTab === "calendar" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Month grid view */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow text-xs text-[#8A8780]">
                      {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                  </div>

                  <div className="bg-[#120F17] border border-white/[0.06] p-5 rounded-2xl shadow-sm text-[#F4F1EC]">
                    <div className="grid grid-cols-7 gap-2 mb-3 text-center text-[10px] font-mono text-[#8A8780] tracking-wider uppercase font-bold">
                      <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((day, idx) => {
                        if (!day) return <div key={`pad-${idx}`} className="aspect-square bg-transparent" />;

                        const isToday = new Date().getDate() === day.dayNum;
                        const hasItems = day.daySessions.length > 0;
                        const isSelected = selectedCalendarDay?.dateStr === day.dateStr;

                        const cellBg = isToday ? "bg-[#8763e5]/10 border-[#8763e5]/30 shadow-[0_0_15px_rgba(135,99,229,0.1)]" : "bg-[#1A1821] border-white/5 hover:border-white/20 hover:bg-[#221f2e]";
                        const cellSelected = isSelected ? "ring-2 ring-[#d4a24c] ring-offset-2 ring-offset-[#120F17]" : "";

                        return (
                          <div
                            key={day.dateStr}
                            onClick={() => setSelectedCalendarDay(day)}
                            className={`aspect-square rounded-xl p-2 flex flex-col justify-between border cursor-pointer transition-all ${cellBg} ${cellSelected}`}
                          >
                            <span className={`text-xs font-mono font-bold ${isToday ? "text-[#d4a24c]" : "text-[#8A8780]"}`}>
                              {day.dayNum}
                            </span>
                            {/* colored dots for platforms */}
                            <div className="flex flex-wrap gap-1 mt-auto">
                              {day.daySessions.map((s: any) => (
                                <span
                                  key={s.session_id}
                                  className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm"
                                  style={{ backgroundColor: PLATFORM_COLORS[s.platform] }}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Day schedules side panel */}
                <div>
                  <div className="eyebrow text-xs text-[#8A8780] mb-4">Schedules & Drafts</div>
                  {selectedCalendarDay ? (
                    <div className="bg-[#120F17] border border-white/[0.06] p-5 rounded-2xl shadow-sm space-y-5 text-[#F4F1EC]">
                      <div>
                        <h4 className="text-lg font-bold text-[#F4F1EC] tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {new Date(selectedCalendarDay.dateStr).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                        </h4>
                        <p className="text-[10px] text-[#8763e5] uppercase tracking-widest font-mono mt-1 font-bold">
                          {selectedCalendarDay.daySessions.length} Campaign Packages
                        </p>
                      </div>

                      <div className="space-y-3">
                        {selectedCalendarDay.daySessions.map((s: any) => (
                          <div key={s.session_id} className="p-4 bg-[#1A1821] rounded-xl border border-white/[0.04] space-y-3 hover:border-white/10 transition">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded font-mono shadow-sm" style={{ backgroundColor: `${PLATFORM_COLORS[s.platform]}20`, color: PLATFORM_COLORS[s.platform] }}>
                                {s.platform}
                              </span>
                              <span className={`text-[10px] font-mono uppercase font-bold ${s.status === "completed" ? "text-emerald-400" : "text-[#d4a24c]"}`}>
                                {s.status === "completed" ? "✓ Done" : s.status}
                              </span>
                            </div>
                            <h5 className="text-sm font-bold text-[#F4F1EC] truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
                              {s.session_data?.topic || s.session_data?.purpose || `${s.brand_name || 'Brand'} Campaign`}
                            </h5>
                          </div>
                        ))}

                        {selectedCalendarDay.daySessions.length === 0 && (
                          <p className="text-xs text-[#8A8780] italic p-4 bg-[#1A1821] rounded-xl border border-white/[0.04] text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
                            No campaigns generated or scheduled for this date.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#120F17] border border-white/[0.06] border-dashed p-8 rounded-2xl text-center flex flex-col items-center justify-center min-h-[160px] text-[#8A8780]">
                      <Calendar size={24} className="text-[#8763e5] mb-3 opacity-60" />
                      <p className="text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                        Select a calendar day cell to view campaign schedules.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3.7 RESEARCH INSIGHTS TAB */}
            {activeTab === "insights" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredSessions
                  .filter(s => s.session_data?.trends?.length)
                  .map(s => {
                    const sData = s.session_data || {};
                    return (
                      <BorderGlow
                        key={s.session_id}
                        glowColor="212 162 76"
                        backgroundColor="#120F17"
                        borderRadius={24}
                        glowRadius={70}
                        glowIntensity={1.2}
                        className="border border-white/[0.06] p-6 flex flex-col justify-between gap-6"
                      >
                        <div className="space-y-5">
                          <div>
                            <span className="eyebrow text-[10px] font-bold font-mono uppercase tracking-widest text-[#d4a24c]">
                              Topic: {sData.topic || "Brief"}
                            </span>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded font-mono shadow-sm" style={{ backgroundColor: `${PLATFORM_COLORS[s.platform]}20`, color: PLATFORM_COLORS[s.platform] }}>
                                {s.platform}
                              </span>
                              <span className="text-xs text-[#8A8780] font-mono">
                                Generated {formatDate(s.created_at)}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <span className="text-[10px] font-bold text-[#8A8780] font-mono uppercase tracking-wider block">Key Findings:</span>
                            <ul className="space-y-3">
                              {sData.trends.slice(0, 4).map((trend: string, idx: number) => (
                                <li key={idx} className="text-sm text-[#F4F1EC] flex items-start gap-2.5 leading-relaxed font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                                  <span className="text-[#d4a24c] mt-1 shrink-0 text-xs">▸</span>
                                  {trend}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <button
                          onClick={() => handleReGenerate(s)}
                          className="border border-white/10 text-[#F4F1EC] hover:bg-white/5 font-semibold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 self-start transition-colors"
                        >
                          [Regenerate]
                        </button>
                      </BorderGlow>
                    );
                  })}

                {filteredSessions.filter(s => s.session_data?.trends?.length).length === 0 && (
                  <div className="col-span-full py-16 text-center text-[#8A8780] font-mono text-xs">
                    NO SEARCH INSIGHTS SAVED FOR THESE CAMPAIGNS
                  </div>
                )}
              </div>
            )}

            {/* 3.8 AUDIENCE PAINPOINTS TAB */}
            {activeTab === "painpoints" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredSessions
                  .filter(s => s.session_data?.pain_points?.length)
                  .map(s => {
                    const sData = s.session_data || {};
                    return (
                      <BorderGlow
                        key={s.session_id}
                        glowColor="239 68 68"
                        backgroundColor="#120F17"
                        borderRadius={24}
                        glowRadius={70}
                        glowIntensity={1.2}
                        className="border border-white/[0.06] p-6 flex flex-col justify-between gap-6"
                      >
                        <div className="space-y-5">
                          <div>
                            <span className="eyebrow text-[10px] font-bold font-mono uppercase tracking-widest text-[#ef4444]">
                              AUDIENCE: {sData.target_audience || "Indie creators"}
                            </span>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded font-mono shadow-sm" style={{ backgroundColor: `${PLATFORM_COLORS[s.platform]}20`, color: PLATFORM_COLORS[s.platform] }}>
                                {s.platform}
                              </span>
                              <span className="text-xs text-[#8A8780] font-mono">
                                Sourced {formatDate(s.created_at)}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <span className="text-[10px] font-bold text-[#8A8780] font-mono uppercase tracking-wider block">Painpoints Identified:</span>
                            <ul className="space-y-3">
                              {sData.pain_points.slice(0, 4).map((pt: string, idx: number) => (
                                <li key={idx} className="text-sm text-[#F4F1EC] flex items-start gap-2.5 leading-relaxed font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                                  <span className="text-red-400 mt-1 shrink-0 text-xs">⚠</span>
                                  {pt}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {sData.purpose && (
                            <div className="pt-3 border-t border-white/[0.04]">
                              <span className="text-[10px] font-bold text-[#8A8780] font-mono uppercase tracking-wider block">Suggested Angle:</span>
                              <p className="text-sm text-[#d79de4] mt-1.5 capitalize font-medium animate-pulse" style={{ fontFamily: "'Inter', sans-serif" }}>
                                {sData.purpose.replace("_", " ")} marketing alignment
                              </p>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setActiveTab("overview")}
                          className="text-xs text-[#8A8780] hover:text-[#F4F1EC] transition font-medium self-start"
                        >
                          [View source package →]
                        </button>
                      </BorderGlow>
                    );
                  })}

                {filteredSessions.filter(s => s.session_data?.pain_points?.length).length === 0 && (
                  <div className="col-span-full py-16 text-center text-[#8A8780] font-mono text-xs">
                    NO AUDIENCE PAINPOINTS REGISTERED IN CURRENT SESSIONS
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end pointer-events-none">
        <AnimatePresence>
          {copyFeedback && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#0a0a0b] text-[#F4F1EC] border border-white/10 px-5 py-3 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 pointer-events-auto">
              <Check size={14} className="text-emerald-400" />
              {copyFeedback} copied to clipboard!
            </motion.div>
          )}
          {publishFeedback && (
            <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`text-[#F4F1EC] border px-5 py-4 rounded-2xl text-sm font-semibold shadow-2xl flex items-center gap-3 max-w-sm pointer-events-auto ${publishFeedback.type === 'success' ? 'bg-[#120F17] border-[#8763e5]/40 shadow-[0_0_20px_rgba(135,99,229,0.15)]' : 'bg-[#1a0f0f] border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.1)]'}`}>
              {publishFeedback.type === "success" ? <Check size={18} className="text-[#8763e5]" /> : <AlertCircle size={18} className="text-red-400" />}
              <span style={{ fontFamily: "'Inter', sans-serif" }}>{publishFeedback.message}</span>
              <button onClick={() => setPublishFeedback(null)} className="ml-2 text-neutral-500 hover:text-white transition">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Slide-over Drawer Panel (+ New Generation) */}
      <AnimatePresence>
        {showDrawer && (
          <>
            {/* Drawer overlay */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer body container */}
            <motion.div
              variants={slideOverVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white border-l border-neutral-200 p-6 md:p-8 overflow-y-auto shadow-2xl select-none"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Wand2 size={16} className="text-[#8763e5]" />
                  <span className="text-sm font-bold tracking-tight text-neutral-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Campaign Brief Form</span>
                </div>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 transition"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Steps Brief Form */}
              <form className="space-y-6" onSubmit={handleFormSubmit}>
                {/* 1. Purpose */}
                <div className="space-y-3">
                  <label className="text-sm font-bold tracking-tight text-neutral-900 flex items-center gap-2 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    <span className="text-[#8763e5] font-black">01</span> Purpose
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "general", label: "General", Icon: FileText },
                      { id: "app", label: "App Promo", Icon: Smartphone },
                      { id: "website", label: "Website", Icon: Globe },
                    ].map((p) => {
                      const Icon = p.Icon;
                      const active = form.purpose === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setForm({ ...form, purpose: p.id })}
                          className={`flex flex-col items-center justify-center gap-1.5 p-3 h-20 text-center rounded-2xl transition ${active ? "border border-black bg-neutral-950 text-white shadow-md" : "border border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 hover:shadow-sm"}`}
                        >
                          <Icon size={16} />
                          <span className="text-[10px] font-bold tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Platform */}
                <div className="space-y-3">
                  <label className="text-sm font-bold tracking-tight text-neutral-900 flex items-center gap-2 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    <span className="text-[#8763e5] font-black">02</span> Platform
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {PLATFORMS.map((p) => {
                      const active = form.platform === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setForm({ ...form, platform: p })}
                          className={`flex flex-col items-center justify-center gap-2.5 p-2 h-[84px] text-center rounded-2xl transition-all duration-300 ${active ? "border-2 border-[#8763e5] bg-[#120F17] text-white shadow-[0_0_15px_rgba(135,99,229,0.2)] scale-105" : "border border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-white hover:text-neutral-900 hover:shadow-md hover:border-neutral-300"}`}
                        >
                          <img src={PLATFORM_SVGS[p]} alt={p} className={`transition-all duration-300 ${p === 'twitter' ? 'w-6 h-6 scale-[1.7]' : 'w-6 h-6'} ${active && p === 'twitter' ? 'invert' : ''}`} style={active && p !== 'twitter' ? { filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' } : undefined} />
                          <span className="text-[11px] font-bold capitalize tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>{p}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2.5 Media Type */}
                <div className="space-y-3">
                  <label className="text-sm font-bold tracking-tight text-neutral-900 flex items-center gap-2 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    <span className="text-[#8763e5] font-black">02.5</span> Media Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "single_post", label: "Image Post", Icon: ImageIcon },
                      { id: "video", label: "Video Ad", Icon: Video },
                    ].map((m) => {
                      const Icon = m.Icon;
                      const active = form.post_type === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setForm({ ...form, post_type: m.id })}
                          className={`flex flex-col items-center justify-center gap-2 p-3 h-20 text-center rounded-2xl transition-all duration-300 ${active ? "border-2 border-[#8763e5] bg-[#120F17] text-white shadow-[0_0_15px_rgba(135,99,229,0.2)] scale-105" : "border border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-white hover:text-neutral-900 hover:shadow-md hover:border-neutral-300"}`}
                        >
                          <Icon size={20} className={active ? "text-white" : "text-neutral-400"} />
                          <span className="text-[11px] font-bold capitalize tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Topic */}
                <div className="space-y-2">
                  <label className="text-sm font-bold tracking-tight text-neutral-900 flex items-center gap-2 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    <span className="text-[#8763e5] font-black">03</span> Topic
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400 focus:bg-white transition text-sm font-medium"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    placeholder="e.g. The art of AI-assisted writing"
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  />
                </div>

                {/* 4. Target Audience */}
                <div className="space-y-2">
                  <label className="text-sm font-bold tracking-tight text-neutral-900 flex items-center gap-2 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    <span className="text-[#8763e5] font-black">04</span> Target Audience
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400 focus:bg-white transition text-sm font-medium"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    placeholder="e.g. Indie creators & founders"
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  />
                </div>

                {/* 5. Suggestions */}
                <div className="space-y-2">
                  <label className="text-sm font-bold tracking-tight text-neutral-900 flex items-center gap-2 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    <span className="text-[#8763e5] font-black">05</span> Generation Suggestions
                  </label>
                  <textarea
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400 focus:bg-white transition text-sm font-medium resize-none min-h-[96px]"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    placeholder="e.g. Use dark aesthetic with purple accent, or mention the 30% discount specifically..."
                    value={form.user_suggestion}
                    onChange={(e) => setForm({ ...form, user_suggestion: e.target.value })}
                  />
                </div>

                {/* 6. Upload Logo */}
                <div className="space-y-2">
                  <label className="text-sm font-bold tracking-tight text-neutral-900 flex items-center gap-2 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    <span className="text-[#8763e5] font-black">06</span> Brand Assets
                  </label>
                  <label className="flex items-center gap-4 px-4 py-4 border border-dashed border-neutral-300 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition cursor-pointer">
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      className="hidden" 
                      accept="image/png, image/jpeg, image/svg+xml" 
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)} 
                    />
                    <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 shrink-0">
                      <ImageIcon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {logoFile ? logoFile.name : "Upload Logo"}
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-0.5 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {logoFile ? `${(logoFile.size / 1024 / 1024).toFixed(2)} MB` : "PNG, SVG, or JPG (max 2MB)"}
                      </p>
                    </div>
                  </label>
                </div>

                {/* 7. Scraper / Context block (conditional) */}
                {form.purpose !== "general" && (
                  <div className="space-y-4 border-t border-neutral-100 pt-5 mt-2">
                    <label className="text-sm font-bold tracking-tight text-neutral-900 flex items-center gap-2 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      <span className="text-[#8763e5] font-black">07</span> Context Scraper
                    </label>
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase block mb-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>URL (Website / App Store)</span>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400 focus:bg-white transition text-sm font-medium"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                          placeholder="https://..."
                          value={form.app_context_url}
                          onChange={(e) => setForm({ ...form, app_context_url: e.target.value })}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase block mb-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>Paste Marketing Text</span>
                        <textarea
                          className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400 focus:bg-white transition text-sm font-medium resize-none min-h-[96px]"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                          placeholder="Paste release notes, specs, features..."
                          value={form.app_context_file_content}
                          onChange={(e) => setForm({ ...form, app_context_file_content: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isGenerating}
                  className={`w-full py-4 mt-8 shadow-lg flex items-center justify-center gap-2 rounded-full font-semibold text-sm transition tracking-wide ${
                    isGenerating
                      ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                      : "bg-[#120F17] hover:bg-neutral-800 text-white"
                  }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Generating... please wait</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Generate content package</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      <AnimatePresence>
        {activeImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 overflow-y-auto"
          >
            {/* Inner modal panel */}
            <div className="bg-[#111110] border border-white/10 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
              {/* Left Column: Image */}
              <div className="w-full md:w-1/2 bg-black flex items-center justify-center relative aspect-square md:aspect-auto p-4">
                <img src={activeImageModal.url} alt="Expanded Poster" className="w-full h-full object-contain max-h-[600px]" />
              </div>

              {/* Right Column: Captions */}
              <div className="w-full md:w-1/2 p-6 md:p-8 space-y-6 overflow-y-auto max-h-[600px] border-l border-white/5 select-text">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-[#8763e5] font-bold font-mono uppercase tracking-wider block">CONTENT WORKFLOW</span>
                    <h3 className="text-xl font-bold text-[#F4F1EC] mt-1 font-sans">Generated Captions</h3>
                  </div>
                  <button
                    onClick={() => setActiveImageModal(null)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>

                <div className="space-y-6">
                  {activeImageModal.session?.session_data?.captions ? (
                    typeof activeImageModal.session.session_data.captions === "object" ? (
                      Object.entries(activeImageModal.session.session_data.captions).map(([style, text]) => (
                        <div 
                          key={style} 
                          onClick={() => setSelectedCaptionModal(String(text))}
                          className={`space-y-2 border p-4 rounded-xl cursor-pointer transition ${selectedCaptionModal === String(text) ? "bg-[#8763e5]/10 border-[#8763e5]/50 shadow-[0_0_15px_rgba(135,99,229,0.15)]" : "border-white/5 hover:bg-white/5"}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-[#d4a24c] font-mono tracking-wider">{style}</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedCaptionModal === String(text) ? "border-[#8763e5] bg-[#8763e5]" : "border-white/20"}`}>
                              {selectedCaptionModal === String(text) && <Check size={10} className="text-white" />}
                            </div>
                          </div>
                          <p className="text-sm text-[#D8D3CB] leading-relaxed font-sans whitespace-pre-wrap">{String(text)}</p>
                        </div>
                      ))
                    ) : (
                      <div 
                        onClick={() => setSelectedCaptionModal(String(activeImageModal.session.session_data.captions))}
                        className={`space-y-2 border p-4 rounded-xl cursor-pointer transition ${selectedCaptionModal === String(activeImageModal.session.session_data.captions) ? "bg-[#8763e5]/10 border-[#8763e5]/50 shadow-[0_0_15px_rgba(135,99,229,0.15)]" : "border-white/5 hover:bg-white/5"}`}
                      >
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-[#d4a24c] font-mono tracking-wider">CAPTION</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedCaptionModal === String(activeImageModal.session.session_data.captions) ? "border-[#8763e5] bg-[#8763e5]" : "border-white/20"}`}>
                              {selectedCaptionModal === String(activeImageModal.session.session_data.captions) && <Check size={10} className="text-white" />}
                            </div>
                          </div>
                        <p className="text-sm text-[#D8D3CB] leading-relaxed font-sans whitespace-pre-wrap">{String(activeImageModal.session.session_data.captions)}</p>
                      </div>
                    )
                  ) : (
                    <p className="text-sm text-neutral-500 italic">No captions generated for this post.</p>
                  )}

                  {/* Hashtags section */}
                  {activeImageModal.session?.session_data?.hashtags?.recommended_mix && (
                    <div className="mt-8">
                      <span className="text-[10px] text-[#8763e5] font-bold font-mono uppercase tracking-wider block mb-4">HASHTAGS (Select up to 3)</span>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(activeImageModal.session.session_data.hashtags.recommended_mix) 
                          ? activeImageModal.session.session_data.hashtags.recommended_mix 
                          : (typeof activeImageModal.session.session_data.hashtags.recommended_mix === 'string' 
                              ? activeImageModal.session.session_data.hashtags.recommended_mix.split(' ').filter(Boolean) 
                              : [])
                        ).map((tag: string) => {
                          const isSelected = selectedHashtagsModal.includes(tag);
                          return (
                            <button
                              key={tag}
                              onClick={() => {
                                if (isSelected) setSelectedHashtagsModal(selectedHashtagsModal.filter(t => t !== tag));
                                else if (selectedHashtagsModal.length < 3) setSelectedHashtagsModal([...selectedHashtagsModal, tag]);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition border ${isSelected ? "bg-[#8763e5] text-white border-transparent" : "bg-white/5 text-[#8A8780] border-white/10 hover:text-white"}`}
                            >
                              {tag.startsWith('#') ? tag : `#${tag}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Post Button in Modal */}
                  {activeImageModal.session?.platform === "twitter" && (
                    <div className="pt-6 border-t border-white/5 mt-6">
                      <button
                        onClick={() => handlePublish(activeImageModal.session, activeImageModal.url, selectedCaptionModal, selectedHashtagsModal)}
                        disabled={publishing === activeImageModal.url || !selectedCaptionModal}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#8763e5] hover:bg-[#7a59cc] text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {publishing === activeImageModal.url ? (
                          <>
                            <RefreshCw size={18} className="animate-spin" />
                            <span>Posting to X...</span>
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            <span>Post Selected to X</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {activeVideoModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActiveVideoModal(null)} />
            <BorderGlow glowColor="256 73 64" backgroundColor="#120F17" borderRadius={24} glowRadius={100} glowIntensity={1.5} className="relative w-full max-w-[900px] max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
              
              {/* Video side */}
              <div className="w-full bg-black flex items-center justify-center relative shrink-0 aspect-video border-b border-white/5">
                <video src={activeVideoModal.url} controls autoPlay className="w-full h-full object-contain max-h-[600px]" />
                <button onClick={() => setActiveVideoModal(null)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white/50 hover:bg-black/80 hover:text-white transition-all border border-white/10 backdrop-blur z-10">
                  <X size={20} />
                </button>
              </div>

              {/* Content side */}
              <div className="w-full bg-[#120F17] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded font-mono shadow-sm" style={{ backgroundColor: `${PLATFORM_COLORS[activeVideoModal.session.platform]}20`, color: PLATFORM_COLORS[activeVideoModal.session.platform] }}>
                      {activeVideoModal.session.platform}
                    </span>
                    <span className="text-xs text-[#8A8780] font-mono">
                      {formatDate(activeVideoModal.session.created_at)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#F4F1EC] leading-snug">
                    {activeVideoModal.session.session_data?.topic || "Generated Content"}
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                  
                  {/* Descriptions / Captions */}
                  {activeVideoModal.session?.session_data?.captions ? (
                    typeof activeVideoModal.session.session_data.captions === "object" ? (
                      Object.entries(activeVideoModal.session.session_data.captions).map(([style, text]) => (
                        <div key={style} className="space-y-3">
                          <span className="text-[10px] text-[#8A8780] font-bold font-mono uppercase tracking-wider">{style} caption</span>
                          <div
                            onClick={() => setSelectedCaptionModal(String(text))}
                            className={`space-y-2 border p-4 rounded-xl cursor-pointer transition ${selectedCaptionModal === String(text) ? "bg-[#8763e5]/10 border-[#8763e5]/50 shadow-[0_0_15px_rgba(135,99,229,0.15)]" : "border-white/5 hover:bg-white/5"}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#F4F1EC]">Select this copy</span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedCaptionModal === String(text) ? "border-[#8763e5] bg-[#8763e5]" : "border-white/20"}`}>
                                {selectedCaptionModal === String(text) && <Check size={10} className="text-white" />}
                              </div>
                            </div>
                            <p className="text-sm text-[#D8D3CB] leading-relaxed font-sans whitespace-pre-wrap">{String(text)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="space-y-3">
                        <span className="text-[10px] text-[#8A8780] font-bold font-mono uppercase tracking-wider">Caption</span>
                        <div
                          onClick={() => setSelectedCaptionModal(String(activeVideoModal.session.session_data.captions))}
                          className={`space-y-2 border p-4 rounded-xl cursor-pointer transition ${selectedCaptionModal === String(activeVideoModal.session.session_data.captions) ? "bg-[#8763e5]/10 border-[#8763e5]/50 shadow-[0_0_15px_rgba(135,99,229,0.15)]" : "border-white/5 hover:bg-white/5"}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#F4F1EC]">Select this copy</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedCaptionModal === String(activeVideoModal.session.session_data.captions) ? "border-[#8763e5] bg-[#8763e5]" : "border-white/20"}`}>
                              {selectedCaptionModal === String(activeVideoModal.session.session_data.captions) && <Check size={10} className="text-white" />}
                            </div>
                          </div>
                          <p className="text-sm text-[#D8D3CB] leading-relaxed font-sans whitespace-pre-wrap">{String(activeVideoModal.session.session_data.captions)}</p>
                        </div>
                      </div>
                    )
                  ) : null}

                  {/* Hashtags */}
                  {activeVideoModal.session?.session_data?.hashtags?.recommended_mix && (
                    <div className="space-y-3">
                      <span className="text-[10px] text-[#8A8780] font-bold font-mono uppercase tracking-wider">Select up to 3 hashtags</span>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(activeVideoModal.session.session_data.hashtags.recommended_mix) 
                          ? activeVideoModal.session.session_data.hashtags.recommended_mix 
                          : (typeof activeVideoModal.session.session_data.hashtags.recommended_mix === 'string' 
                              ? activeVideoModal.session.session_data.hashtags.recommended_mix.split(' ').filter(Boolean) 
                              : []))
                        .slice(0, 15).map((tag: any) => {
                          const isSelected = selectedHashtagsModal.includes(tag);
                          return (
                            <button
                              key={tag}
                              onClick={() => {
                                if (isSelected) setSelectedHashtagsModal(selectedHashtagsModal.filter(t => t !== tag));
                                else if (selectedHashtagsModal.length < 3) setSelectedHashtagsModal([...selectedHashtagsModal, tag]);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition border ${isSelected ? "bg-[#8763e5] text-white border-transparent" : "bg-white/5 text-[#8A8780] border-white/10 hover:text-white"}`}
                            >
                              {tag.startsWith('#') ? tag : `#${tag}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Post Button in Modal */}
                  {activeVideoModal.session?.platform === "twitter" && (
                    <div className="pt-6 border-t border-white/5 mt-6">
                      <button
                        onClick={() => handlePublish(activeVideoModal.session, activeVideoModal.url, selectedCaptionModal, selectedHashtagsModal)}
                        disabled={publishing === activeVideoModal.url || !selectedCaptionModal}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#8763e5] hover:bg-[#7a59cc] text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {publishing === activeVideoModal.url ? (
                          <>
                            <RefreshCw size={18} className="animate-spin" />
                            <span>Posting to X...</span>
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            <span>Post Video to X</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </BorderGlow>
          </div>
        )}
      </AnimatePresence>

      {/* Video Script side-by-side Modal */}
      <AnimatePresence>
        {activeScriptModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 overflow-y-auto"
          >
            {/* Inner modal panel */}
            <div className="bg-[#111110] border border-white/10 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
              {/* Left Column: Video player */}
              <div className="w-full md:w-1/2 bg-black flex items-center justify-center relative aspect-video md:aspect-auto">
                <video src={activeScriptModal.video} controls className="w-full h-full object-contain max-h-[500px]" />
              </div>

              {/* Right Column: Script details */}
              <div className="w-full md:w-1/2 p-6 md:p-8 space-y-6 overflow-y-auto max-h-[500px] border-l border-white/5 select-text">
                <div>
                  <span className="text-[10px] text-[#8763e5] font-bold font-mono uppercase tracking-wider block">SCRIPT WORKFLOW</span>
                  <h3 className="text-xl font-bold text-[#F4F1EC] mt-1 font-sans">Video Script Overlay</h3>
                </div>

                <div className="space-y-4">
                  {/* Hook */}
                  {activeScriptModal.script.hook && (
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-teal-400 font-mono tracking-wider">Hook</span>
                      <p className="text-sm text-[#D8D3CB] leading-relaxed font-sans">{activeScriptModal.script.hook}</p>
                    </div>
                  )}
                  {/* Value */}
                  {activeScriptModal.script.value && (
                    <div className="space-y-1 border-t border-white/5 pt-3">
                      <span className="text-[9px] uppercase font-bold text-emerald-400 font-mono tracking-wider">Value</span>
                      <p className="text-sm text-[#D8D3CB] leading-relaxed font-sans">{activeScriptModal.script.value}</p>
                    </div>
                  )}
                  {/* CTA */}
                  {activeScriptModal.script.cta && (
                    <div className="space-y-1 border-t border-white/5 pt-3">
                      <span className="text-[9px] uppercase font-bold text-purple-400 font-mono tracking-wider">CTA</span>
                      <p className="text-sm text-[#D8D3CB] leading-relaxed font-sans">{activeScriptModal.script.cta}</p>
                    </div>
                  )}
                  {/* Full Script */}
                  {activeScriptModal.script.full_script && (
                    <div className="space-y-1 border-t border-white/5 pt-3">
                      <span className="text-[9px] uppercase font-bold text-[#d4a24c] font-mono tracking-wider">Full Text script</span>
                      <p className="text-xs text-[#8A8780] leading-relaxed font-sans whitespace-pre-wrap">{activeScriptModal.script.full_script}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setActiveScriptModal(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/10 hover:bg-black/90 transition"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Drawer animation variants
const slideOverVariants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: { type: "tween", duration: 0.3 } },
  exit: { x: "100%", transition: { type: "tween", duration: 0.25 } }
};
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.5 },
  exit: { opacity: 0 }
};
