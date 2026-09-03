"use client";
import Link from 'next/link';

export default function Home() {
    return (
        <div className="relative min-h-[calc(100vh-72px)] w-full overflow-hidden bg-white">
            <style>{`
                @keyframes scatter-1 { 
                    0% { transform: translate(30vw, 30vh) scale(0.4) rotate(0deg); opacity: 0; } 
                    100% { transform: translate(0, 0) scale(1) rotate(-6deg); opacity: 0.9; } 
                }
                @keyframes scatter-2 { 
                    0% { transform: translate(0vw, 30vh) scale(0.4) rotate(0deg); opacity: 0; } 
                    100% { transform: translate(0, 0) scale(1) rotate(2deg); opacity: 1; } 
                }
                @keyframes scatter-3 { 
                    0% { transform: translate(-30vw, 30vh) scale(0.4) rotate(0deg); opacity: 0; } 
                    100% { transform: translate(0, 0) scale(1) rotate(-3deg); opacity: 0.9; } 
                }
                @keyframes scatter-4 { 
                    0% { transform: translate(-30vw, -10vh) scale(0.4) rotate(0deg); opacity: 0; } 
                    100% { transform: translate(0, 0) scale(1) rotate(4deg); opacity: 1; } 
                }
            `}</style>

            {/* Background Pattern mimicking the ridged diagonal lines in white and grey */}
            <div 
                className="absolute inset-0 z-0 opacity-100" 
                style={{ 
                    backgroundImage: `repeating-linear-gradient(-45deg, #ffffff, #ffffff 18px, #f2f2f2 18px, #f2f2f2 22px, #e5e5e5 22px, #e5e5e5 23px)` 
                }}
            ></div>
            
            {/* Soft gradient overlay to ensure text is perfectly readable in the bottom left */}
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-white via-white/40 to-transparent opacity-90"></div>
            <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-white via-white/60 to-transparent"></div>

            {/* Images scattered across the entire background */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                
                {/* Far Left Edge */}
                <div 
                    className="absolute top-[20%] left-[-25%] w-[35vw] max-w-[500px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-xl overflow-hidden pointer-events-auto hover:!scale-105 hover:-translate-y-2 hover:z-50 transition-all duration-300 ease-out" 
                    style={{ animation: 'scatter-1 1s cubic-bezier(0.16, 1, 0.3, 1) forwards', opacity: 0, animationDelay: '0.1s' }}
                >
                    <img src="/images/layouts/1.jpg" alt="Layout 1" className="w-full h-auto border-[6px] border-white rounded-xl" />
                </div>
                
                {/* Center Left (Above Text) */}
                <div 
                    className="absolute top-[5%] left-[0%] w-[30vw] max-w-[450px] shadow-[0_25px_60px_rgba(0,0,0,0.2)] rounded-xl overflow-hidden pointer-events-auto hover:!scale-105 hover:-translate-y-2 hover:z-50 transition-all duration-300 ease-out" 
                    style={{ animation: 'scatter-2 1s cubic-bezier(0.16, 1, 0.3, 1) forwards', opacity: 0, animationDelay: '0.2s' }}
                >
                    <img src="/images/layouts/5.jpg" alt="Layout 5" className="w-full h-auto border-[6px] border-white rounded-xl" />
                </div>
                
                {/* Top Middle */}
                <div 
                    className="absolute top-[-5%] left-[45%] w-[35vw] max-w-[500px] shadow-[0_20px_50px_rgba(0,0,0,0.18)] rounded-xl overflow-hidden pointer-events-auto hover:!scale-105 hover:-translate-y-2 hover:z-50 transition-all duration-300 ease-out" 
                    style={{ animation: 'scatter-3 1s cubic-bezier(0.16, 1, 0.3, 1) forwards', opacity: 0, animationDelay: '0.3s' }}
                >
                    <img src="/images/layouts/2.jpg" alt="Layout 2" className="w-full h-auto border-[6px] border-white rounded-xl" />
                </div>

                {/* Top Right */}
                <div 
                    className="absolute top-[5%] right-[5%] w-[45vw] max-w-[650px] shadow-[0_15px_40px_rgba(0,0,0,0.12)] rounded-xl overflow-hidden pointer-events-auto hover:!scale-105 hover:-translate-y-2 hover:z-50 transition-all duration-300 ease-out" 
                    style={{ animation: 'scatter-3 1s cubic-bezier(0.16, 1, 0.3, 1) forwards', opacity: 0, animationDelay: '0.4s' }}
                >
                    <img src="/images/layouts/6.jpg" alt="Layout 6" className="w-full h-auto border-[6px] border-white rounded-xl" />
                </div>
                
                {/* Bottom Right */}
                <div 
                    className="absolute bottom-[-15%] right-[10%] w-[40vw] max-w-[600px] shadow-[0_30px_70px_rgba(0,0,0,0.2)] rounded-xl overflow-hidden pointer-events-auto hover:!scale-105 hover:-translate-y-2 hover:z-50 transition-all duration-300 ease-out" 
                    style={{ animation: 'scatter-4 1s cubic-bezier(0.16, 1, 0.3, 1) forwards', opacity: 0, animationDelay: '0.5s' }}
                >
                    <img src="/images/layouts/4.jpg" alt="Layout 4" className="w-full h-auto border-[6px] border-white rounded-xl" />
                </div>

                {/* Far Right Edge */}
                <div 
                    className="absolute bottom-[10%] right-[-5%] w-[40vw] max-w-[600px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-xl overflow-hidden pointer-events-auto hover:!scale-105 hover:-translate-y-2 hover:z-50 transition-all duration-300 ease-out" 
                    style={{ animation: 'scatter-4 1s cubic-bezier(0.16, 1, 0.3, 1) forwards', opacity: 0, animationDelay: '0.6s' }}
                >
                    <img src="/images/layouts/3.jpg" alt="Layout 3" className="w-full h-auto border-[6px] border-white rounded-xl" />
                </div>

            </div>

            {/* Text Content (Bottom Center-Left) */}
            <div className="absolute bottom-[10%] left-[10%] lg:left-[25%] xl:left-[30%] z-20 w-full max-w-2xl text-left pointer-events-auto animate-float-up">
                <h1 className="text-6xl sm:text-7xl lg:text-[96px] font-sans font-black text-neutral-900 tracking-tight leading-[0.95] mb-2 drop-shadow-sm">
                    Amazing<br />Blog Layouts
                </h1>
                <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-sans font-medium text-neutral-600 mb-6">
                    Inspiration
                </h2>
                <p className="text-lg text-neutral-600 font-sans mb-10 max-w-md leading-relaxed">
                    Create premium, editorial-grade content instantly. An AI-powered generation platform that researches, writes, optimizes, and publishes SEO-friendly blogs.
                </p>
                <Link href="/blog-generator/generator">
                    <button className="bg-[#8763e5] hover:bg-[#704ec2] text-white font-sans font-bold text-lg px-8 py-4 rounded-full transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center group">
                        Enter the Studio
                        <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                        </svg>
                    </button>
                </Link>
            </div>
        </div>
    );
}
