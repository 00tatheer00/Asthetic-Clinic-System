'use client';

import React, { useEffect, useRef } from 'react';

interface AmbientParticlesProps {
  mood: 'twilight' | 'daylight';
}

export function AmbientParticles({ mood }: AmbientParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // High performance particle count (ultra-lightweight, 28 particles max)
    const particleCount = width < 768 ? 16 : 28;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.8,
      speedY: Math.random() * 0.35 + 0.15,
      speedX: (Math.random() - 0.5) * 0.25,
      opacity: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    let isVisible = true;
    const handleVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const colorBase =
        mood === 'twilight'
          ? '251, 191, 36' // Golden amber warm ember
          : '254, 215, 170'; // Soft warm peach sunbeam

      const secondaryBase =
        mood === 'twilight'
          ? '244, 63, 94' // Rose starlight
          : '255, 255, 255'; // Pure pearlescent

      particles.forEach((p, index) => {
        p.y -= p.speedY;
        p.x += Math.sin(p.pulse) * 0.2 + p.speedX;
        p.pulse += 0.02;

        // Wrap around boundaries
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentOpacity =
          p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle =
          index % 2 === 0
            ? `rgba(${colorBase}, ${currentOpacity})`
            : `rgba(${secondaryBase}, ${currentOpacity * 0.85})`;
        ctx.shadowBlur = mood === 'twilight' ? 8 : 4;
        ctx.shadowColor = `rgba(${colorBase}, 0.5)`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mood]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none z-[2] opacity-80"
    />
  );
}
