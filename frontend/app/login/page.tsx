"use client";

import { useState } from "react";
import { login, register } from "@/lib/api";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        window.location.href = "/generate"; // Force full reload to pick up session
      } else {
        await register(username, email, password);
        // After register, you usually need to verify email or we can just login
        await login(email, password);
        window.location.href = "/generate";
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white p-6 relative z-10 overflow-hidden">
      <div className="w-full max-w-[980px] rounded-[28px] overflow-hidden border border-black/5 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.1)] flex flex-col md:flex-row bg-white relative z-10">
        
        {/* Left — video panel */}
        <div className="relative w-full md:w-[48%] aspect-square md:aspect-auto md:min-h-[640px] overflow-hidden">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/videos/login-bg.mp4"
            poster="/videos/login-bg.jpg"
            autoPlay
            muted
            loop
            playsInline
          />
          {/* subtle vignette so the form side reads clean at the seam */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0a0a0d]/40" />
        </div>

        {/* Right — form panel */}
        <div className="w-full md:w-[52%] flex flex-col justify-center px-8 py-14 sm:px-14">
          <h1 className="text-black text-[32px] font-medium tracking-tight mb-2">
            {isLogin ? "Sign in" : "Create account"}
          </h1>
          <p className="text-black/50 text-[14px] leading-relaxed mb-10">
            {isLogin 
              ? "Welcome back to ContentForge AI. Sign in to your workspace to keep shipping content." 
              : "Join the swarm. Create an account to start forging your content pipeline."}
          </p>

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="flex flex-col gap-2">
                <label htmlFor="username" className="text-black/70 text-[13px]">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. content_god"
                  className="h-12 rounded-xl bg-black/[0.02] border border-black/5 px-4 text-black text-[14px] placeholder:text-black/30 outline-none focus:border-[#0A5CFF] focus:ring-1 focus:ring-[#0A5CFF]/60 transition"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-black/70 text-[13px]">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="h-12 rounded-xl bg-black/[0.02] border border-black/5 px-4 text-black text-[14px] placeholder:text-black/30 outline-none focus:border-[#0A5CFF] focus:ring-1 focus:ring-[#0A5CFF]/60 transition"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-black/70 text-[13px]">
                  Password
                </label>
                {isLogin && (
                  <Link
                    href="/forgot-password"
                    className="text-[13px] text-[#0A5CFF] hover:text-[#0A5CFF]/80 transition"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl bg-black/[0.02] border border-black/5 px-4 pr-12 text-black text-[14px] placeholder:text-black/30 outline-none focus:border-[#0A5CFF] focus:ring-1 focus:ring-[#0A5CFF]/60 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/70 text-[12px] transition"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {isLogin && (
              <label className="flex items-center gap-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-black/20 bg-black/[0.02] accent-black"
                />
                <span className="text-black/60 text-[13px]">Remember me</span>
              </label>
            )}

            {error && (
              <div className="text-[13px] text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-12 flex justify-center items-center gap-2 rounded-xl bg-black hover:bg-black/85 text-white text-[14px] font-medium transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="text-black/50 text-[13px] mt-10">
            {isLogin ? "New to ContentForge? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }} 
              className="text-[#0A5CFF] hover:text-[#0A5CFF]/80 transition font-medium"
            >
              {isLogin ? "Create account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
