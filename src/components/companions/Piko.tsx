import React, { useState, useEffect } from 'react';

export type PikoState = 'idle' | 'peeking' | 'hiding' | 'waving' | 'celebrating' | 'shy';

interface PikoProps {
  state?: PikoState;
  size?: number; // width in px (default: 80)
  className?: string;
  onClick?: () => void;
  peekDirection?: 'up' | 'side' | 'bottom';
  showBubble?: boolean;
  bubbleText?: string;
}

export const Piko: React.FC<PikoProps> = ({
  state = 'idle',
  size = 80,
  className = '',
  onClick,
  peekDirection = 'up',
  showBubble = false,
  bubbleText = 'Peek! 👀',
}) => {
  const [internalState, setInternalState] = useState<PikoState>(state);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [localBubble, setLocalBubble] = useState<string | null>(null);

  // Sync prop changes
  useEffect(() => {
    setInternalState(state);
  }, [state]);

  // Gentle, slow blinking interval every 5-6 seconds
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 5000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (internalState === 'idle' || internalState === 'peeking') {
      setInternalState('waving');
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (internalState === 'waving') {
      setInternalState(state);
    }
  };

  const handleClick = () => {
    setInternalState('celebrating');
    const whispers = ['Great work! 🤍', 'Note saved! 📝', 'I saw that! ✨', 'You’re doing great! 🌸'];
    const pick = whispers[Math.floor(Math.random() * whispers.length)];
    setLocalBubble(pick);

    setTimeout(() => {
      setInternalState(state === 'peeking' ? 'peeking' : 'idle');
    }, 1200);

    setTimeout(() => {
      setLocalBubble(null);
    }, 3000);

    onClick?.();
  };

  const height = size;
  const width = size;
  const activeState = isHovered && internalState === 'idle' ? 'waving' : internalState;

  return (
    <div
      className={`relative inline-block select-none cursor-pointer group transition-all duration-500 ${
        activeState === 'hiding' ? 'opacity-0 translate-y-8 scale-90' : 'opacity-100 translate-y-0 scale-100'
      } ${className}`}
      style={{ width, height }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role="img"
      aria-label="Piko the soft white marshmallow teardrop companion"
      title="Piko: Click to say hi!"
    >
      {/* Speech / Reaction Bubble */}
      {(showBubble || localBubble) && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap px-3 py-1 bg-white text-ink-900 border-2 border-ink-900 rounded-2xl text-[11px] font-black shadow-pop-sm animate-bounce">
          {localBubble || bubbleText}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-ink-900 rotate-45" />
        </div>
      )}

      {/* Subtle Mini Heart or Sparkle on Celebration */}
      {activeState === 'celebrating' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none text-base animate-ping">
          🤍
        </div>
      )}

      {/* SVG Canvas for Piko */}
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full overflow-visible ${
          activeState === 'peeking'
            ? 'animate-piko-peek'
            : activeState === 'waving'
            ? 'animate-piko-tilt'
            : activeState === 'celebrating'
            ? 'animate-bounce'
            : 'animate-piko-breathe'
        }`}
      >
        <defs>
          {/* Velvety marshmallow white-to-light-blue gradient (Matches reference 2) */}
          <radialGradient id="pikoBodyGrad" cx="45%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </radialGradient>

          {/* Pop-art ambient blue ground reflection */}
          <linearGradient id="pikoAmbientShadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0" />
            <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.25" />
          </linearGradient>

          {/* Minimal bead eye gradient */}
          <radialGradient id="pikoBeadEye" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0F172A" />
          </radialGradient>
        </defs>

        {/* Soft Drop Shadow under Piko */}
        <ellipse
          cx="50"
          cy="92"
          rx={activeState === 'peeking' ? 22 : 28}
          ry="5"
          fill="#0F172A"
          opacity="0.18"
          className="transition-all duration-300"
        />

        {/* Smooth Marshmallow Teardrop Gumdrop Body (Exact Face Oka/VELO silhouette) */}
        <g id="piko-marshmallow-body">
          <path
            d="
              M 50,22
              C 62,22 72,32 75,46
              C 78,59 86,74 80,84
              C 76,89 64,91 50,91
              C 36,91 24,89 20,84
              C 14,74 22,59 25,46
              C 28,32 38,22 50,22 Z
            "
            fill="url(#pikoBodyGrad)"
            stroke="#0F172A"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Ambient blue bottom glaze for tactile pop depth */}
          <path
            d="
              M 22,78
              C 28,88 40,91 50,91
              C 60,91 72,88 78,78
              C 72,84 60,86 50,86
              C 40,86 28,84 22,78 Z
            "
            fill="url(#pikoAmbientShadow)"
          />
        </g>

        {/* Minimalist Expressive Face (Two bead eyes + tiny slit mouth) */}
        <g id="piko-face" className={activeState === 'waving' ? 'origin-[50px_45px] -rotate-3 transition-transform' : ''}>
          {isBlinking ? (
            // Slow soft blink slits
            <g stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" fill="none">
              <line x1="42" y1="44" x2="47" y2="44" />
              <line x1="53" y1="44" x2="58" y2="44" />
            </g>
          ) : (
            <g id="piko-bead-eyes">
              {/* Left Bead Eye */}
              <ellipse cx="44.5" cy="43.5" rx="3" ry="3.2" fill="url(#pikoBeadEye)" />
              <circle cx="43.5" cy="42.5" r="0.9" fill="#FFFFFF" />

              {/* Right Bead Eye */}
              <ellipse cx="55.5" cy="43.5" rx="3" ry="3.2" fill="url(#pikoBeadEye)" />
              <circle cx="54.5" cy="42.5" r="0.9" fill="#FFFFFF" />
            </g>
          )}

          {/* Minimalist Subtle Mouth Line */}
          <path
            d={
              activeState === 'celebrating' || activeState === 'waving'
                ? 'M 48,50 Q 50,52 52,50' // Gentle sweet smile
                : 'M 48.5,49.5 L 51.5,49.5' // Calm subtle line
            }
            fill="none"
            stroke="#0F172A"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>

        {/* Shy Little Arm / Wave */}
        {activeState === 'waving' ? (
          <g className="origin-[75px_65px] animate-piko-shy-wave">
            <path
              d="M 72,66 Q 83,62 81,54 Q 75,54 70,60"
              fill="#FFFFFF"
              stroke="#0F172A"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </g>
        ) : null}
      </svg>
    </div>
  );
};