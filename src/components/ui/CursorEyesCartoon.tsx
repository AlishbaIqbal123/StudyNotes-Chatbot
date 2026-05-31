'use client';

import React, { useCallback, useRef, useState } from 'react';

export type CartoonMood = 'sad' | 'confused' | 'sleepy' | 'worried' | 'oops' | 'happy';

interface CursorEyesCartoonProps {
  mood?: CartoonMood;
  className?: string;
}

function Mouth({ mood }: { mood: CartoonMood }) {
  if (mood === 'happy') {
    return (
      <path
        d="M 52 118 Q 80 138 108 118"
        fill="none"
        stroke="rgba(15,23,42,0.35)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    );
  }
  if (mood === 'sleepy') {
    return (
      <>
        <path d="M 58 120 Q 80 112 102 120" fill="none" stroke="rgba(15,23,42,0.3)" strokeWidth="3" strokeLinecap="round" />
        <text x="118" y="52" fontSize="18" fill="rgba(99,102,241,0.7)">z</text>
        <text x="132" y="38" fontSize="14" fill="rgba(99,102,241,0.5)">z</text>
      </>
    );
  }
  if (mood === 'worried') {
    return (
      <ellipse cx="80" cy="122" rx="14" ry="10" fill="rgba(15,23,42,0.12)" />
    );
  }
  if (mood === 'confused') {
    return (
      <path d="M 62 122 Q 80 115 98 122" fill="none" stroke="rgba(15,23,42,0.35)" strokeWidth="3" strokeLinecap="round" />
    );
  }
  if (mood === 'oops') {
    return (
      <circle cx="80" cy="122" r="8" fill="none" stroke="rgba(15,23,42,0.35)" strokeWidth="3" />
    );
  }
  // sad
  return (
    <path
      d="M 58 128 Q 80 112 102 128"
      fill="none"
      stroke="rgba(15,23,42,0.35)"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
  );
}

export default function CursorEyesCartoon({ mood = 'confused', className = '' }: CursorEyesCartoonProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.42;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const angle = Math.atan2(dy, dx);
    const dist = Math.min(7, Math.hypot(dx, dy) / 18);
    setOffset({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
  }, []);

  const browTilt = mood === 'worried' ? -8 : mood === 'sad' ? 6 : mood === 'sleepy' ? 4 : 0;

  return (
    <div
      className={`inline-flex ${className}`}
      onMouseMove={handleMouseMove}
      role="img"
      aria-hidden
    >
      <svg
        ref={ref}
        viewBox="0 0 160 160"
        className="w-36 h-36 md:w-44 md:h-44 drop-shadow-lg"
      >
        <defs>
          <linearGradient id="lumina-body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="55%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>
          <filter id="soft-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse cx="80" cy="88" rx="62" ry="58" fill="url(#lumina-body)" filter="url(#soft-glow)" />
        <ellipse cx="80" cy="96" rx="48" ry="44" fill="rgba(255,255,255,0.08)" />

        {/* Left eye */}
        <g transform={`translate(${browTilt * 0.3}, 0)`}>
          <ellipse cx="58" cy="72" rx="16" ry="18" fill="white" />
          <circle
            cx={58 + offset.x}
            cy={72 + offset.y}
            r="6.5"
            fill="#1e293b"
            className="transition-transform duration-75 ease-out"
          />
          <circle cx={55 + offset.x * 0.6} cy={69 + offset.y * 0.6} r="2" fill="white" opacity="0.9" />
        </g>

        {/* Right eye */}
        <g transform={`translate(${-browTilt * 0.3}, 0)`}>
          <ellipse cx="102" cy="72" rx="16" ry="18" fill="white" />
          <circle
            cx={102 + offset.x}
            cy={72 + offset.y}
            r="6.5"
            fill="#1e293b"
            className="transition-transform duration-75 ease-out"
          />
          <circle cx={99 + offset.x * 0.6} cy={69 + offset.y * 0.6} r="2" fill="white" opacity="0.9" />
        </g>

        {/* Blush */}
        <ellipse cx="42" cy="92" rx="10" ry="6" fill="rgba(244,114,182,0.25)" />
        <ellipse cx="118" cy="92" rx="10" ry="6" fill="rgba(244,114,182,0.25)" />

        <Mouth mood={mood} />
      </svg>
    </div>
  );
}
