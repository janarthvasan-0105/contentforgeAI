"use client";
import React, { useEffect, useRef } from 'react';

// Brand colors: Vibrant Purple, Vibrant Fuchsia, Light Pink/Purple
const colors = ['#9333EA', '#D946EF', '#E879F9'];

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

const colorRgbs = colors.map(hexToRgb);

export default function Antigravity({ hoverActive = false, targetX = 0 }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const animState = useRef({
    currentHover: 0,
    currentTargetX: 0,
    leftAlpha: 0,
    rightAlpha: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let leftParticles: any[] = [];
    let rightParticles: any[] = [];
    let backgroundParticles: any[] = [];
    
    let animationFrameId: number;
    let width = 0;
    let height = 0;

    let targetMouse = { x: 0, y: 0 };
    let currentMouse = { x: 0, y: 0 };

    const gaussianRand = () => {
      let u = 0, v = 0;
      while (u === 0) u = Math.random(); 
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    const init = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      backgroundParticles = [];
      const ambientCount = 150;
      for (let i = 0; i < ambientCount; i++) {
        backgroundParticles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 0.5 + Math.random() * 1.5,
          opacity: 0.15 + Math.random() * 0.2,
          vx: (Math.random() - 0.5) * 0.4, // Flow velocity X
          vy: (Math.random() - 0.5) * 0.4, // Flow velocity Y
          color: colorRgbs[Math.floor(Math.random() * colorRgbs.length)]
        });
      }

      // --- Left Shape: Curly Braces ---
      const offscreen = document.createElement('canvas');
      const octx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!octx) return;

      const fontSize = Math.min(height * 0.7, 700);
      offscreen.width = fontSize * 1.5;
      offscreen.height = fontSize * 2;

      octx.font = `${fontSize}px "Times New Roman", Georgia, serif`;
      octx.textBaseline = 'middle';
      octx.textAlign = 'center';

      const sampleGlyph = (glyph: string, offsetX: number, targetArray: any[]) => {
        octx.clearRect(0, 0, offscreen.width, offscreen.height);
        octx.fillStyle = 'black';
        octx.fillText(glyph, offscreen.width / 2, offscreen.height / 2);

        const imgData = octx.getImageData(0, 0, offscreen.width, offscreen.height);
        const data = imgData.data;

        const rawPoints = [];
        const stride = 3; 
        
        let minX = Infinity; let maxX = -Infinity;
        let minY = Infinity; let maxY = -Infinity;

        for (let y = 0; y < offscreen.height; y += stride) {
          for (let x = 0; x < offscreen.width; x += stride) {
            const alpha = data[(y * offscreen.width + x) * 4 + 3];
            if (alpha > 128) {
              minX = Math.min(minX, x); maxX = Math.max(maxX, x);
              minY = Math.min(minY, y); maxY = Math.max(maxY, y);
              rawPoints.push({ x, y });
            }
          }
        }

        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;

        const points = rawPoints.map(p => ({ x: p.x - cx, y: p.y - cy }));

        const budget = 1200;
        const sampledPoints = [];
        
        const step = points.length / budget;
        for (let i = 0; i < budget; i++) {
          const index = Math.floor(i * step);
          if (index < points.length) {
            sampledPoints.push(points[index]);
          }
        }

        sampledPoints.forEach((p, i) => {
          const z = (Math.random() - 0.5) * 80;
          const size = 1.2 + ((z + 40) / 80) * 2.3;
          const opacity = 0.15 + ((z + 40) / 80) * 0.75;
          
          let color = colorRgbs[0];
          const hash = (i * 9973) % 100;
          if (hash < 30) color = colorRgbs[1];
          else if (hash < 50) color = colorRgbs[2];

          targetArray.push({
            baseX: offsetX + p.x,
            baseY: height / 2 + p.y,
            z: z, size: size, opacity: opacity, color: color,
            phase: Math.random() * Math.PI * 2,
            jitterX: (Math.random() - 0.5) * 4, jitterY: (Math.random() - 0.5) * 4,
            scatterX: (Math.random() - 0.5) * width, scatterY: (Math.random() - 0.5) * height
          });
        });
      };

      leftParticles = [];
      const gap = Math.min(width * 0.35, 450); 
      sampleGlyph('{', width * 0.25 - gap / 2, leftParticles); 
      sampleGlyph('}', width * 0.25 + gap / 2, leftParticles);
      leftParticles.sort((a, b) => a.z - b.z);

      // --- Right Shape: 6 Circles ---
      rightParticles = [];
      const generateCircle = (cx: number, cy: number, baseRadius: number) => {
        const count = 160;
        const R = baseRadius * (0.9 + Math.random() * 0.2); // vary slightly per circle
        const sigma = R * 0.05; // 5% jitter

        const ringSpeed = (Math.random() > 0.5 ? 1 : -1) * (0.001 + Math.random() * 0.002);

        for (let i = 0; i < count; i++) {
          const theta = Math.random() * Math.PI * 2;
          const r = R + gaussianRand() * sigma;
          
          const z = (Math.random() - 0.5) * 80;
          const size = 1.2 + ((z + 40) / 80) * 2.3;
          const opacity = 0.15 + ((z + 40) / 80) * 0.75;
          
          let color = colorRgbs[0];
          const hash = (i * 9973) % 100;
          if (hash < 30) color = colorRgbs[1];
          else if (hash < 50) color = colorRgbs[2];

          rightParticles.push({
            isRing: true,
            cx: cx, cy: cy, r: r, theta: theta,
            speed: ringSpeed * (0.8 + Math.random() * 0.4), 
            baseX: cx + r * Math.cos(theta),
            baseY: cy + r * Math.sin(theta),
            z: z, size: size, opacity: opacity, color: color,
            phase: Math.random() * Math.PI * 2,
            jitterX: (Math.random() - 0.5) * 4, jitterY: (Math.random() - 0.5) * 4,
            scatterX: (Math.random() - 0.5) * width, scatterY: (Math.random() - 0.5) * height
          });
        }
      };

      const rightCenterX = width * 0.75;
      const rightCenterY = height / 2;
      
      const hexRadius = Math.min(width * 0.20, 270); 
      const circleRadius = hexRadius * 0.38; 

      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2; 
        const cx = rightCenterX + hexRadius * Math.cos(angle);
        const cy = rightCenterY + hexRadius * Math.sin(angle);
        generateCircle(cx, cy, circleRadius);
      }
      rightParticles.sort((a, b) => a.z - b.z);
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      targetMouse.x = (x / width) * 2 - 1;
      targetMouse.y = (y / height) * 2 - 1;
    };

    let time = 0;
    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      const isLeft = hoverActive && targetX < 0;
      const isRight = hoverActive && targetX > 0;

      animState.current.leftAlpha += ((isLeft ? 1 : 0) - animState.current.leftAlpha) * 0.025;
      animState.current.rightAlpha += ((isRight ? 1 : 0) - animState.current.rightAlpha) * 0.025;

      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.05;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.05;

      // Draw flowing background particles
      backgroundParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = `rgb(${p.color.r}, ${p.color.g}, ${p.color.b})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      const drawParticles = (particlesArray: any[], alphaFactor: number) => {
        const easeOut = 1 - Math.pow(1 - alphaFactor, 3);
        
        particlesArray.forEach(p => {
          if (p.isRing) {
             p.theta += p.speed;
             p.baseX = p.cx + p.r * Math.cos(p.theta);
             p.baseY = p.cy + p.r * Math.sin(p.theta);
          }

          const driftX = Math.sin(time * 0.2 + p.phase) * 3 + Math.cos(time * 0.1 + p.phase * 2) * 2;
          const driftY = Math.cos(time * 0.2 + p.phase) * 3 + Math.sin(time * 0.1 + p.phase * 2) * 2;
          
          const parallaxStrength = 15;
          const parallaxX = currentMouse.x * (p.z / 40) * parallaxStrength;
          const parallaxY = currentMouse.y * (p.z / 40) * parallaxStrength;

          const finalX = p.baseX + p.jitterX + driftX + parallaxX;
          const finalY = p.baseY + p.jitterY + driftY + parallaxY;

          const dispersedX = finalX + p.scatterX * (1 - easeOut);
          const dispersedY = finalY + p.scatterY * (1 - easeOut);

          // Slightly higher ambient opacity when completely scattered so they are a bit more visible
          ctx.globalAlpha = p.opacity * (0.30 + 0.70 * easeOut);
          
          ctx.fillStyle = `rgb(${p.color.r}, ${p.color.g}, ${p.color.b})`;
          ctx.beginPath();
          ctx.arc(dispersedX, dispersedY, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
      };

      drawParticles(leftParticles, animState.current.leftAlpha);
      drawParticles(rightParticles, animState.current.rightAlpha);

      animationFrameId = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(() => init());
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
    window.addEventListener('mousemove', handlePointerMove);
    
    init();
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      resizeObserver.disconnect();
    };
  }, [hoverActive, targetX]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} 
    />
  );
}
