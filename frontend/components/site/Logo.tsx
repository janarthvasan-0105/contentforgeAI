export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center font-medium tracking-[0.5px] text-[#2b2b3d] ${className}`} style={{ fontFamily: "'Poppins', sans-serif" }}>
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
      <span className="text-[#8a63e8] ml-[0.05em] font-light relative top-[0.03em]">AI</span>
    </div>
  );
}
