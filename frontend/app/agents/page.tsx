"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import Logo from "@/components/site/Logo";
import Footer from "@/components/site/Footer";

export default function AgentsPage() {
  useEffect(() => {
    // Intersection Observer for fade-up animations and SideNav tracking
    const sections = document.querySelectorAll('.agent-section, #hero');
    const navDots = document.querySelectorAll('.nav-dot');
    
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -40% 0px',
        threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Handle fade up
            const fadeElements = entry.target.querySelectorAll('.fade-up');
            if (entry.isIntersecting) {
                fadeElements.forEach(el => el.classList.add('is-visible'));
                
                // Update SideNav
                const id = entry.target.getAttribute('id');
                if (id && id !== 'hero') {
                    updateSideNav(id);
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // SideNav Update Logic based strictly on JSON provided styles
    const style_active_navigation = "flex items-center justify-center w-sm h-sm rounded-full bg-tertiary-container text-on-tertiary-container shadow-[0_0_20px_rgba(231,195,101,0.4)]".split(' ');
    const style_inactive_navigation = "flex items-center justify-center w-xs h-xs rounded-full bg-surface-variant text-on-surface-variant opacity-50 hover:opacity-100".split(' ');

    function updateSideNav(activeId: string) {
        navDots.forEach(dot => {
            const targetId = dot.getAttribute('data-target');
            
            // Remove both active and inactive base classes to reset cleanly
            dot.classList.remove(...style_active_navigation.filter(c => c !== 'flex' && c !== 'items-center' && c !== 'justify-center' && c !== 'rounded-full'));
            dot.classList.remove(...style_inactive_navigation.filter(c => c !== 'flex' && c !== 'items-center' && c !== 'justify-center' && c !== 'rounded-full'));
            
            if (targetId === activeId) {
                // Apply JSON Active Styles
                style_active_navigation.forEach(cls => {
                    if(cls) dot.classList.add(cls);
                });
                // Hide the icon tooltip logic on active if desired, or keep it.
            } else {
                // Apply JSON Inactive Styles
                style_inactive_navigation.forEach(cls => {
                    if(cls) dot.classList.add(cls);
                });
            }
        });
    }

    return () => {
      sections.forEach(section => {
          sectionObserver.unobserve(section);
      });
    };
  }, []);

  return (
    <div className="bg-white text-black antialiased overflow-x-hidden selection:bg-purple-200 selection:text-black min-h-screen relative">
      <div className="z-[-1] absolute inset-0 pointer-events-none opacity-50 overflow-hidden"><div className="aurora-blob aurora-blob-1" /><div className="aurora-blob aurora-blob-2" /></div>
      <style dangerouslySetInnerHTML={{__html: `
        /* Scrollytelling animations & utilities */
        .fade-up {
            opacity: 0;
            transform: translateY(40px);
            transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fade-up.is-visible {
            opacity: 1;
            transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
            .fade-up {
                transition: none;
                transform: none;
            }
        }
        
        /* Specific glowing accents based on prompt, mapped to CSS variables for clean inline usage */
        .agent-cato { --agent-accent: #4361EE; }
        .agent-vela { --agent-accent: #6D4AE8; }
        .agent-orin { --agent-accent: #8B3DF0; }
        .agent-iris { --agent-accent: #A93DE0; }
        .agent-kade { --agent-accent: #C230D6; }
        .agent-nova { --agent-accent: #DB2894; }

        .agent-glow-text {
            color: var(--agent-accent);
            text-shadow: 0 0 20px color-mix(in srgb, var(--agent-accent) 40%, transparent);
        }
        .agent-glow-bg {
            background-color: color-mix(in srgb, var(--agent-accent) 15%, transparent);
            border-color: color-mix(in srgb, var(--agent-accent) 30%, transparent);
        }
        .agent-glow-node {
            background: var(--agent-accent);
            box-shadow: 0 0 40px var(--agent-accent);
        }

        @keyframes gradient-pan {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
        }

        /* Hero text effect */
        .blur-gradient-text {
            background: linear-gradient(to right, #d79de4, #8763e5, #d79de4, #8763e5, #d79de4);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            position: relative;
            animation: gradient-pan 5s linear infinite;
        }
        .blur-gradient-text::after {
            content: "Six autonomous agents. One content pipeline.";
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to right, #d79de4, #8763e5, #d79de4, #8763e5, #d79de4);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: blur(20px);
            opacity: 0.5;
            z-index: -1;
            animation: gradient-pan 5s linear infinite;
        }
      `}} />

      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/20 transition-all duration-300 ease-in-out">
        <div className="flex justify-between items-center h-xl px-lg max-w-container-max mx-auto">
          <Link href="/" className="flex items-center hover:opacity-90 transition gap-2 text-black/50 opacity-80">
            <Sparkles size={18} className="text-[#8763e5]" />
            <Logo className="text-[17px]" />
          </Link>
          <nav className="hidden md:flex items-center gap-lg">
            <Link className="font-body-md text-body-md text-on-surface-variant font-medium hover:text-on-surface transition-colors hover:bg-surface-variant/10 px-sm py-xs rounded" href="#">Platform</Link>
            <Link className="font-body-md text-body-md text-primary font-semibold border-b-2 border-primary pb-1 hover:bg-surface-variant/10 px-sm py-xs rounded" href="#">Agents</Link>
            <Link className="font-body-md text-body-md text-on-surface-variant font-medium hover:text-on-surface transition-colors hover:bg-surface-variant/10 px-sm py-xs rounded" href="/#pricing">Pricing</Link>
            <Link className="font-body-md text-body-md text-on-surface-variant font-medium hover:text-on-surface transition-colors hover:bg-surface-variant/10 px-sm py-xs rounded" href="#">Company</Link>
          </nav>
          <div className="flex items-center">
            <Link href="/signup" className="font-body-md text-body-md bg-black text-white px-md py-sm rounded-full font-medium hover:bg-black/85 transition-colors">Get Started</Link>
          </div>
        </div>
      </header>

      {/* SideNavBar (Persistent Sticky Rail) */}
      <nav className="fixed right-md top-1/2 -translate-y-1/2 z-40 bg-transparent flex flex-col gap-md items-center hidden md:flex" id="side-nav">
        <div className="sr-only">
          <h2 className="">System Agents</h2>
          <p className="">Active Pipeline</p>
        </div>
        <a className="nav-dot flex items-center justify-center rounded-full hover:scale-110 transition-transform cursor-pointer transition-all duration-500 font-mono-label text-mono-label relative group w-sm h-sm bg-tertiary-container text-on-tertiary-container shadow-[0_0_20px_rgba(231,195,101,0.4)]" data-target="cato" href="#cato">
          <span className="material-symbols-outlined text-[10px] hidden group-hover:block absolute right-full mr-sm bg-surface-container px-sm py-xs rounded text-on-surface shadow-lg whitespace-nowrap">panorama</span>
        </a>
        <a className="nav-dot flex items-center justify-center rounded-full hover:scale-110 transition-transform cursor-pointer transition-all duration-500 font-mono-label text-mono-label relative group w-xs h-xs bg-surface-variant text-on-surface-variant opacity-50 hover:opacity-100" data-target="vela" href="#vela">
          <span className="material-symbols-outlined text-[10px] hidden group-hover:block absolute right-full mr-sm bg-surface-container px-sm py-xs rounded text-on-surface shadow-lg whitespace-nowrap">rocket_launch</span>
        </a>
        <a className="nav-dot flex items-center justify-center rounded-full hover:scale-110 transition-transform cursor-pointer transition-all duration-500 font-mono-label text-mono-label relative group w-xs h-xs bg-surface-variant text-on-surface-variant opacity-50 hover:opacity-100" data-target="orin" href="#orin">
          <span className="material-symbols-outlined text-[10px] hidden group-hover:block absolute right-full mr-sm bg-surface-container px-sm py-xs rounded text-on-surface shadow-lg whitespace-nowrap">crib</span>
        </a>
        <a className="nav-dot flex items-center justify-center rounded-full hover:scale-110 transition-transform cursor-pointer transition-all duration-500 font-mono-label text-mono-label relative group w-xs h-xs bg-surface-variant text-on-surface-variant opacity-50 hover:opacity-100" data-target="iris" href="#iris">
          <span className="material-symbols-outlined text-[10px] hidden group-hover:block absolute right-full mr-sm bg-surface-container px-sm py-xs rounded text-on-surface shadow-lg whitespace-nowrap">visibility</span>
        </a>
        <a className="nav-dot flex items-center justify-center rounded-full hover:scale-110 transition-transform cursor-pointer transition-all duration-500 font-mono-label text-mono-label relative group w-xs h-xs bg-surface-variant text-on-surface-variant opacity-50 hover:opacity-100" data-target="kade" href="#kade">
          <span className="material-symbols-outlined text-[10px] hidden group-hover:block absolute right-full mr-sm bg-surface-container px-sm py-xs rounded text-on-surface shadow-lg whitespace-nowrap">terminal</span>
        </a>
        <a className="nav-dot flex items-center justify-center rounded-full hover:scale-110 transition-transform cursor-pointer transition-all duration-500 font-mono-label text-mono-label relative group w-xs h-xs bg-surface-variant text-on-surface-variant opacity-50 hover:opacity-100" data-target="nova" href="#nova">
          <span className="material-symbols-outlined text-[10px] hidden group-hover:block absolute right-full mr-sm bg-surface-container px-sm py-xs rounded text-on-surface shadow-lg whitespace-nowrap">auto_awesome</span>
        </a>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center relative px-lg pt-xl" id="hero">
          <div className="max-w-6xl mx-auto text-center fade-up is-visible">
            <h1 className="text-[56px] md:text-[80px] lg:text-[100px] font-bold tracking-tight leading-[1.05] blur-gradient-text mb-lg">
                Six autonomous agents.<br/>One content pipeline.
            </h1>
            <p className="text-xl md:text-2xl text-on-surface-variant max-w-3xl mx-auto mb-xl leading-relaxed">
                Experience the precision of an orchestrated AI workforce. From raw data acquisition to finalized global rollout.
            </p>
          </div>
          <div className="absolute bottom-xl left-1/2 -translate-x-1/2 flex flex-col items-center gap-sm animate-bounce opacity-70">
            <span className="font-mono-label text-mono-label text-on-surface-variant tracking-widest uppercase">Scroll to explore</span>
            <span className="material-symbols-outlined text-on-surface">south</span>
          </div>
        </section>

        {/* 1. Cato */}
        <section className="agent-section agent-cato min-h-screen flex items-center py-xl relative border-t border-surface-container" id="cato">
          <div className="max-w-container-max mx-auto px-lg w-full grid md:grid-cols-2 gap-xl items-center">
            <div className="fade-up space-y-md is-visible">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-[48px] md:text-[56px] agent-glow-text">radar</span>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface">Cato <span className="text-on-surface-variant font-normal text-2xl md:text-3xl">— The Researcher</span></h2>
              </div>
              <p className="text-lg md:text-xl text-on-surface-variant max-w-lg leading-relaxed">
                  Data acquisition &amp; audience mapping. Cato autonomously scans global trends and competitive landscapes to establish the foundation of your campaign.
              </p>
              <div className="flex gap-sm py-sm">
                <span className="font-mono text-sm md:text-base font-medium bg-surface-container border border-outline-variant px-4 py-1.5 rounded-full text-on-surface">research_agent.py</span>
                <span className="font-mono text-sm md:text-base font-medium bg-surface-container border border-outline-variant px-4 py-1.5 rounded-full text-on-surface">scraper_agent.py</span>
              </div>
              <div className="agent-glow-bg border rounded-xl p-md mt-md flex flex-col gap-sm backdrop-blur-md">
                <div className="flex justify-between items-center font-mono text-sm md:text-base text-on-surface-variant tracking-widest">
                  <span className="uppercase">Receives</span>
                  <span className="material-symbols-outlined text-[24px] normal-case">arrow_forward</span>
                  <span className="uppercase">Sends</span>
                </div>
                <div className="flex justify-between items-center text-base md:text-lg text-on-surface font-medium">
                  <div className="bg-background/50 px-4 py-2 rounded-lg">topic</div>
                  <div className="bg-background/50 px-4 py-2 rounded-lg font-bold agent-glow-text">brand voice to Vela</div>
                </div>
              </div>
            </div>
            <div className="fade-up hidden md:flex justify-center items-center h-[500px] relative is-visible">
              <div className="absolute inset-0 border border-outline-variant/30 rounded-full animate-[spin_60s_linear_infinite] border-dashed"></div>
              <div className="absolute inset-md border border-outline-variant/50 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>
              <div className="w-32 h-32 rounded-full agent-glow-node flex items-center justify-center z-10">
                <span className="material-symbols-outlined text-on-primary text-[48px]">radar</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Vela */}
        <section className="agent-section agent-vela min-h-screen flex items-center py-xl relative border-t border-surface-container" id="vela">
          <div className="max-w-container-max mx-auto px-lg w-full grid md:grid-cols-2 gap-xl items-center">
            <div className="fade-up md:order-2 space-y-md is-visible">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-[48px] md:text-[56px] agent-glow-text">rocket_launch</span>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface">Vela <span className="text-on-surface-variant font-normal text-2xl md:text-3xl">— The Strategist</span></h2>
              </div>
              <p className="text-lg md:text-xl text-on-surface-variant max-w-lg leading-relaxed">
                  Campaign strategy &amp; angle selection. Processing raw data into structured, high-impact campaign blueprints optimized for conversion.
              </p>
              <div className="flex gap-sm py-sm">
                <span className="font-mono text-sm md:text-base font-medium bg-surface-container border border-outline-variant px-4 py-1.5 rounded-full text-on-surface">strategy_agent.py</span>
                <span className="font-mono text-sm md:text-base font-medium bg-surface-container border border-outline-variant px-4 py-1.5 rounded-full text-on-surface">idea_agent.py</span>
              </div>
              <div className="agent-glow-bg border rounded-xl p-md mt-md flex flex-col gap-sm backdrop-blur-md">
                <div className="flex justify-between items-center font-mono text-sm md:text-base text-on-surface-variant tracking-widest">
                  <span className="uppercase">Receives</span>
                  <span className="material-symbols-outlined text-[24px] normal-case">arrow_forward</span>
                  <span className="uppercase">Sends</span>
                </div>
                <div className="flex justify-between items-center text-base md:text-lg text-on-surface font-medium">
                  <div className="bg-background/50 px-4 py-2 rounded-lg">Cato</div>
                  <div className="bg-background/50 px-4 py-2 rounded-lg font-bold agent-glow-text">blueprint to Orin</div>
                </div>
              </div>
            </div>
            <div className="fade-up md:order-1 hidden md:flex justify-center items-center h-[500px] relative is-visible">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqNV6H_Hq5UTtwn7CePbMycxKTxCFcSoarCbgmfwUxXfozded2iA9J0YhECakZHWmuU8rlcFtH5MAHvMmAjAY99P6WwfakG6514CWxuO6YMezodvJoNnunV0HodBYIDxL4ZkiBPuIhPgJNRjr66O65VmC0tDejiqV-Mdp_jWXURmzuyQGejAP5Ky02aGr1YbU5xFwfi6Ej7LnY74UZZj7LrzF43csyj8lRzbCbZA7yoAGIyirIHUk" alt="High-tech campaign strategy interface for Vela the Strategist" className="w-full h-full object-cover rounded-xl border border-outline-variant shadow-2xl" />
            </div>
          </div>
        </section>

        {/* 3. Orin */}
        <section className="agent-section agent-orin min-h-screen flex items-center py-xl relative border-t border-surface-container" id="orin">
          <div className="max-w-container-max mx-auto px-lg w-full grid md:grid-cols-2 gap-xl items-center">
            <div className="fade-up space-y-md is-visible">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-[48px] md:text-[56px] agent-glow-text">hub</span>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface">Orin <span className="text-on-surface-variant font-normal text-2xl md:text-3xl">— The Copywriter</span></h2>
              </div>
              <p className="text-lg md:text-xl text-on-surface-variant max-w-lg leading-relaxed">
                  Scripting, copy &amp; captions. Orin translates strategic blueprints into compelling narratives, generating everything from long-form scripts to micro-copy.
              </p>
              <div className="flex gap-sm py-sm">
                <span className="font-mono text-sm md:text-base font-medium bg-surface-container border border-outline-variant px-4 py-1.5 rounded-full text-on-surface">script_agent.py</span>
                <span className="font-mono text-sm md:text-base font-medium bg-surface-container border border-outline-variant px-4 py-1.5 rounded-full text-on-surface">caption_agent.py</span>
              </div>
              <div className="agent-glow-bg border rounded-xl p-md mt-md flex flex-col gap-sm backdrop-blur-md">
                <div className="flex justify-between items-center font-mono text-sm md:text-base text-on-surface-variant tracking-widest">
                  <span className="uppercase">Receives</span>
                  <span className="material-symbols-outlined text-[24px] normal-case">call_split</span>
                  <span className="uppercase">Sends</span>
                </div>
                <div className="flex justify-between items-center text-base md:text-lg text-on-surface font-medium">
                  <div className="bg-background/50 px-4 py-2 rounded-lg">Vela</div>
                  <div className="flex flex-col gap-xs items-end">
                    <div className="bg-background/50 px-4 py-2 rounded-lg font-bold agent-glow-text">scripts to Iris</div>
                    <div className="bg-background/50 px-4 py-2 rounded-lg font-bold agent-glow-text">+ Kade</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="fade-up hidden md:flex justify-center items-center h-[500px] relative is-visible">
              <div className="flex flex-col gap-md items-center z-10">
                <div className="w-16 h-16 rounded border-2 border-outline-variant flex items-center justify-center bg-surface-container">Vela</div>
                <div className="w-1 h-16 agent-glow-node opacity-50"></div>
                <div className="w-24 h-24 rounded-full agent-glow-node flex items-center justify-center shadow-[0_0_50px_var(--agent-accent)]">
                  <span className="material-symbols-outlined text-on-primary text-[32px]">hub</span>
                </div>
                <div className="flex gap-xl mt-md">
                  <div className="flex flex-col items-center">
                    <div className="w-1 h-16 agent-glow-node opacity-50 mb-sm transform -rotate-45 origin-bottom"></div>
                    <div className="w-16 h-16 rounded border-2 border-outline-variant flex items-center justify-center bg-surface-container">Iris</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-1 h-16 agent-glow-node opacity-50 mb-sm transform rotate-45 origin-bottom"></div>
                    <div className="w-16 h-16 rounded border-2 border-outline-variant flex items-center justify-center bg-surface-container">Kade</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Iris */}
        <section className="agent-section agent-iris min-h-screen flex items-center py-xl relative border-t border-surface-container" id="iris">
          <div className="max-w-container-max mx-auto px-lg w-full grid md:grid-cols-2 gap-xl items-center">
            <div className="fade-up md:order-2 space-y-md is-visible">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-[48px] md:text-[56px] agent-glow-text">visibility</span>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface">Iris <span className="text-on-surface-variant font-normal text-2xl md:text-3xl">— The Art Director</span></h2>
              </div>
              <p className="text-lg md:text-xl text-on-surface-variant max-w-lg leading-relaxed">
                  Visual system &amp; image generation. Translating narrative scripts into high-fidelity image prompts and generating the core visual assets.
              </p>
              <div className="flex gap-sm py-sm">
                <span className="font-mono text-sm md:text-base font-medium bg-surface-container border border-outline-variant px-4 py-1.5 rounded-full text-on-surface">image_prompt_agent.py</span>
              </div>
              <div className="agent-glow-bg border rounded-xl p-md mt-md flex flex-col gap-sm backdrop-blur-md">
                <div className="flex justify-between items-center font-mono text-sm md:text-base text-on-surface-variant tracking-widest">
                  <span className="uppercase">Receives</span>
                  <span className="material-symbols-outlined text-[24px] normal-case">arrow_forward</span>
                  <span className="uppercase">Sends</span>
                </div>
                <div className="flex justify-between items-center text-base md:text-lg text-on-surface font-medium">
                  <div className="bg-background/50 px-4 py-2 rounded-lg">Orin</div>
                  <div className="bg-background/50 px-4 py-2 rounded-lg font-bold agent-glow-text">keyframes to Kade</div>
                </div>
              </div>
            </div>
            <div className="fade-up md:order-1 hidden md:grid grid-cols-2 gap-sm h-[500px] relative p-lg bg-surface-container-low rounded-xl border border-outline-variant/50 shadow-inner is-visible">
              <div className="bg-cover bg-center rounded-lg col-span-2 shadow-lg" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAiPAxVq77kbNZMlsY51W1Dt_MWEoQt7k5baB7uAuBkuOqwp9koxVKczZCXICcfK0AtDYb7YMZwbMq1zN9xdujgbRGvzdlfo8Y_zYVFGWtVTmqyf4Qvo5W9xhKZUWYAKTQXZRqtppIvS7i90kAKFty180JzVummwmdeVqW3QP863QBPLs2CCm2bdYzUPcu_T9C-OIWNrv7gG2zXhQnmKNBA2eNrN6cDuO0SblLf-KAgqhfVI2CIaRg')" }}></div>
              <div className="bg-cover bg-center rounded-lg shadow-lg" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBv3ymgt9BjlaRJq8Ul7S60U7lJD6ontTQQmxbL6eFKLIYHE1B4cETgETMUuqJWhNeMAiOQHjqpzJDqb9wpMRpZ9tatE0Ze0M7fLK1jSh7VZV5DFBrfjHIgQEp8nb8ZlnO57ffP74zgbv14jhknGrwZNmLsPmdKmeVJddf1L1hkRI0UUwzh6O5180OhEq1W5iwEnzbh40cIsVL1V_wsF8Wt74L8yY3i8RyzV_fVCAR4pHh1hvn9c4o')" }}></div>
              <div className="bg-cover bg-center rounded-lg shadow-lg" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAt63Ut-E3k4kq8XJxKxFf5m0HqnwvtI9eq4w98xTMqs8oel9pTzQqHjAEeSgFzSr94V7964ccpfV-vTuqR2Z01tpZUGm5uD7NhyrgWmrJBd5PlN5fVMbYKa40fVX72QTR0rGcI3fiR42f7PBwlR2lzor_sxWVx9QikvYV20qTMEYHwErPyLXNO34vtIOZ0tKQFAzRaZeBodeloY_yp7JQxCsDNV96tRv7EYDIY5xG_Acp3qTbO0as')" }}></div>
            </div>
          </div>
        </section>

        {/* 5. Kade */}
        <section className="agent-section agent-kade min-h-screen flex items-center py-xl relative border-t border-surface-container" id="kade">
          <div className="max-w-container-max mx-auto px-lg w-full grid md:grid-cols-2 gap-xl items-center">
            <div className="fade-up space-y-md is-visible">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-[48px] md:text-[56px] agent-glow-text">terminal</span>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface">Kade <span className="text-on-surface-variant font-normal text-2xl md:text-3xl">— The Video Producer</span></h2>
              </div>
              <p className="text-lg md:text-xl text-on-surface-variant max-w-lg leading-relaxed">
                  Motion &amp; assembly. Kade ingests audio scripts and static keyframes, applying motion interpolation and timeline assembly to output broadcast-ready video.
              </p>
              <div className="flex gap-sm py-sm">
                <span className="font-mono text-sm md:text-base font-medium bg-surface-container border border-outline-variant px-4 py-1.5 rounded-full text-on-surface">video_stitch_agent.py</span>
              </div>
              <div className="agent-glow-bg border rounded-xl p-md mt-md flex flex-col gap-sm backdrop-blur-md">
                <div className="flex justify-between items-center font-mono text-sm md:text-base text-on-surface-variant tracking-widest">
                  <span className="uppercase">Receives</span>
                  <span className="material-symbols-outlined text-[24px] normal-case">call_merge</span>
                  <span className="uppercase">Sends</span>
                </div>
                <div className="flex justify-between items-center text-base md:text-lg text-on-surface font-medium">
                  <div className="flex flex-col gap-xs">
                    <div className="bg-background/50 px-4 py-2 rounded-lg">Iris (keyframes)</div>
                    <div className="bg-background/50 px-4 py-2 rounded-lg">Orin (audio)</div>
                  </div>
                  <div className="bg-background/50 px-4 py-2 rounded-lg font-bold agent-glow-text">MP4 to Nova</div>
                </div>
              </div>
            </div>
            <div className="fade-up hidden md:flex flex-col justify-center gap-sm h-[500px] relative w-full is-visible">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-P1a7MU-9Mc_9a_6AvCf2pkMg6MYxJXx3Tbc2mef3m96bt7hwozhL0dzzBEr3nY5e3D-fSQErsPXswyDq1blscffw8xEJKdDSgbVGuj0yC76YW_PJEuVXxGk0Obt3rGUdW8E929CMV90wAgl3MyI7Y3h6fjDlQesBE_sogeGXyVixwzj0RH4_HvGYHppLcnYwEw8iWfjIH5Fe6s4gVlxO_gj4i8Y5pR7uZNsMxI3BPaOgmhQkmSg" alt="Advanced video editing timeline interface for Kade the Video Producer" className="w-full h-full object-cover rounded-xl border border-outline-variant shadow-2xl" />
            </div>
          </div>
        </section>

        {/* 6. Nova */}
        <section className="agent-section agent-nova min-h-screen flex items-center py-xl relative border-t border-surface-container" id="nova">
          <div className="max-w-container-max mx-auto px-lg w-full grid md:grid-cols-2 gap-xl items-center">
            <div className="fade-up md:order-2 space-y-md is-visible">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-[48px] md:text-[56px] agent-glow-text">auto_awesome</span>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface">Nova <span className="text-on-surface-variant font-normal text-2xl md:text-3xl">— The Distributor</span></h2>
              </div>
              <p className="text-lg md:text-xl text-on-surface-variant max-w-lg leading-relaxed">
                  Scheduling &amp; rollout. The final node in the pipeline. Nova handles multi-platform API distribution, calculating optimal posting windows based on global telemetry.
              </p>
              <div className="flex gap-sm py-sm">
                <span className="font-mono text-sm md:text-base font-medium bg-surface-container border border-outline-variant px-4 py-1.5 rounded-full text-on-surface">calendar_agent.py</span>
              </div>
              <div className="agent-glow-bg border rounded-xl p-md mt-md flex flex-col gap-sm backdrop-blur-md">
                <div className="flex justify-between items-center font-mono text-sm md:text-base text-on-surface-variant tracking-widest">
                  <span className="uppercase">Receives</span>
                  <span className="material-symbols-outlined text-[24px] normal-case">flight_takeoff</span>
                  <span className="uppercase">Sends</span>
                </div>
                <div className="flex justify-between items-center text-base md:text-lg text-on-surface font-medium">
                  <div className="bg-background/50 px-4 py-2 rounded-lg">Kade</div>
                  <div className="bg-background/50 px-4 py-2 rounded-lg font-bold agent-glow-text">published posts to X/LinkedIn</div>
                </div>
              </div>
            </div>
            <div className="fade-up md:order-1 hidden md:flex justify-center items-center h-[500px] relative is-visible">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlGqG5NXbmxeBZ6eAz46buoffV_htm4ZjubtoXeMv5zRir3PSzEepo5T0x03lQsR1hQwVMfqhn4EyKIttropN2Ood4Ob25fU-xr4pwByKWLteZBsuT33CpKbGd2NgXvitBCpcGCHjvTxo8ihBJWvpF66oK9S2N8dZKhM3rrsVxkM8hEaK2JYuhhKP9ylJBps9_HydIVRfbfriO9RAhZEYEQbh3_ujpQjUHvgbB7W79TtnDIoF3zlM" alt="Global distribution network visualization for Nova the Distributor" className="w-full h-full object-cover rounded-xl border border-outline-variant shadow-2xl" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
