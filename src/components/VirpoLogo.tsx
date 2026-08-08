import React from 'react';

export function VirpoLogo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer Glowing Liquid Backdrop Halo */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500 via-cyan-400 to-blue-600 blur-md opacity-60 animate-pulse"></div>

      {/* Main Glassmorphism Logo Shield */}
      <div className="relative w-full h-full rounded-2xl bg-white/10 backdrop-blur-xl border border-white/30 shadow-2xl flex items-center justify-center overflow-hidden">
        {/* Internal Liquid Glass Reflection Highlight */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none"></div>

        {/* Vector Liquid "V" + Acoustic Wave Glyph */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
        >
          <defs>
            <linearGradient id="virpoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <linearGradient id="virpoWave" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>

          {/* Liquid Glass V stroke */}
          <path
            d="M 22 24 L 50 78 L 78 24"
            stroke="url(#virpoGradient)"
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Internal Acoustic Wave Nodes */}
          <circle cx="50" cy="36" r="4.5" fill="url(#virpoWave)" />
          <circle cx="36" cy="46" r="3.5" fill="#ffffff" opacity="0.9" />
          <circle cx="64" cy="46" r="3.5" fill="#ffffff" opacity="0.9" />
        </svg>
      </div>
    </div>
  );
}
