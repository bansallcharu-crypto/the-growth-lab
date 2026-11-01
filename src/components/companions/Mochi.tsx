import React, { useState, useEffect } from 'react';

export type MochiState = 'idle' | 'walking' | 'waving' | 'jumping' | 'celebrating' | 'curious';

interface MochiProps {
  state?: MochiState;
  size?: number; // width in px (default: 80)
  className?: string;
  onClick?: () => void;
  showBubble?: boolean;
  bubbleText?: string;
}

export const Mochi: React.FC<MochiProps> = ({
  state = 'idle',
  size = 80,
  className = '',
  onClick,
  showBubble = false,
  bubbleText = 'Ready to learn! ✨',
}) => {
  const [internalState, setInternalState] = useState<MochiState>(state);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [localBubble, setLocalBubble] = useState<string | null>(null);

  // Sync prop changes
  useEffect(() => {
    setInternalState(state);
  }, [state]);

  // Natural blinking interval every 4-5 seconds
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 4200 + Math.random() * 1500);

    return () => clearInterval(blinkInterval);
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (internalState === 'idle') {
      setInternalState('waving');
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (internalState === 'waving') {
      setInternalState('idle');
    }
  };

  const handleClick = () => {
    setInternalState('jumping');
    const cheers = ['You got this, Charu! 🌟', 'Keep growing! ✨', 'Brilliant thought! 💡', 'Let’s crush Term II! 🚀'];
    const pick = cheers[Math.floor(Math.random() * cheers.length)];
    setLocalBubble(pick);

    setTimeout(() => {
      setInternalState('idle');
    }, 1200);

    setTimeout(() => {
      setLocalBubble(null);
    }, 3200);

    onClick?.();
  };

  // SVG viewBox is 100 x 100 for scalable crisp vector rendering
  const height = size;
  const width = size;

  const activeState = isHovered && internalState === 'idle' ? 'waving' : internalState;

  return (
    <div
      className={`relative inline-block select-none cursor-pointer group transition-transform ${className}`}
      style={{ width, height }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role="img"
      aria-label="Mochi the fluffy white plush companion"
      title="Mochi: Click to say hi!"
    >
      {/* Speech / Reaction Bubble */}
      {(showBubble || localBubble) && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap px-3 py-1 bg-white text-ink-900 border-2 border-ink-900 rounded-2xl text-[11px] font-black shadow-pop-sm animate-bounce">
          {localBubble || bubbleText}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-ink-900 rotate-45" />
        </div>
      )}

      {/* Celebratory Confetti / Stars */}
      {(activeState === 'celebrating' || activeState === 'jumping') && (
        <div className="absolute inset-0 pointer-events-none -top-4 -bottom-4 -left-4 -right-4 flex items-center justify-center">
          <span className="absolute -top-2 left-1 text-xs animate-ping">✨</span>
          <span className="absolute -top-3 right-2 text-xs animate-ping delay-100">🌟</span>
          <span className="absolute top-2 -right-3 text-xs animate-ping delay-200">💛</span>
        </div>
      )}

      {/* SVG Canvas for Mochi */}
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full overflow-visible ${
          activeState === 'jumping'
            ? 'animate-mochi-jump'
            : activeState === 'walking'
            ? 'animate-mochi-walk'
            : activeState === 'celebrating'
            ? 'animate-bounce'
            : 'animate-mochi-idle'
        }`}
      >
        <defs>
          {/* Subtle plush shading gradient */}
          <radialGradient id="mochiPlushGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </radialGradient>

          {/* Eye gloss highlight */}
          <radialGradient id="mochiEyeGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="60%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          {/* Soft inner ear pink */}
          <radialGradient id="mochiEarPink" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDA4AF" />
            <stop offset="100%" stopColor="#F472B6" />
          </radialGradient>

          {/* Cheeks blush gradient */}
          <radialGradient id="mochiBlush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F472B6" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#F472B6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft Drop Shadow under Mochi */}
        <ellipse
          cx="50"
          cy="92"
          rx={activeState === 'jumping' ? 24 : 32}
          ry="5.5"
          fill="#1E293B"
          opacity={activeState === 'jumping' ? 0.12 : 0.22}
          className="transition-all duration-300"
        />

        {/* Back Feet / Stubby Paws */}
        <ellipse cx="38" cy="88" rx="7" ry="5.5" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.5" />
        <ellipse cx="62" cy="88" rx="7" ry="5.5" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.5" />

        {/* Ears (Pointy Plush Ears on top) */}
        {/* Left Ear */}
        <g className={activeState === 'waving' ? 'origin-[32px_28px] animate-wiggle' : ''}>
          <polygon
            points="24,32 32,10 44,26"
            fill="url(#mochiPlushGrad)"
            stroke="#0F172A"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Left Inner Ear Pink */}
          <polygon points="27,30 33,16 40,26" fill="url(#mochiEarPink)" opacity="0.85" />
        </g>

        {/* Right Ear */}
        <g className={activeState === 'waving' ? 'origin-[68px_28px] animate-wiggle' : ''}>
          <polygon
            points="56,26 68,10 76,32"
            fill="url(#mochiPlushGrad)"
            stroke="#0F172A"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Right Inner Ear Pink */}
          <polygon points="60,26 67,16 73,30" fill="url(#mochiEarPink)" opacity="0.85" />
        </g>

        {/* Fluffy Round Spherical Body with Cloud Tufts (Exact reference look) */}
        <g id="mochi-body">
          {/* Main sphere with fluffy outer cloud contour */}
          <path
            d="
              M 50,22
              C 62,21 74,26 80,35
              C 87,44 89,56 86,67
              C 83,77 73,86 62,88
              C 54,89 46,89 38,88
              C 27,86 17,77 14,67
              C 11,56 13,44 20,35
              C 26,26 38,21 50,22 Z
            "
            fill="url(#mochiPlushGrad)"
            stroke="#0F172A"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Fluffy side fur tufts for plush texture */}
          {/* Left fluff tufts */}
          <path d="M 17,45 Q 11,48 16,53" fill="none" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 15,55 Q 8,59 14,64" fill="none" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
          {/* Right fluff tufts */}
          <path d="M 83,45 Q 89,48 84,53" fill="none" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 85,55 Q 92,59 86,64" fill="none" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Rosy Pink Cheek Blush Circles */}
        <circle cx="33" cy="58" r="7" fill="url(#mochiBlush)" />
        <circle cx="67" cy="58" r="7" fill="url(#mochiBlush)" />

        {/* Eyes (Big, Expressive Black Glossy Eyes with Highlights) */}
        {isBlinking ? (
          // Blinking Eyelid Slits
          <g stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <path d="M 32,54 Q 37,58 42,54" />
            <path d="M 58,54 Q 63,58 68,54" />
          </g>
        ) : (
          <g id="mochi-eyes">
            {/* Left Eye */}
            <circle cx="37" cy="52" r="6" fill="url(#mochiEyeGrad)" stroke="#0F172A" strokeWidth="1" />
            {/* Left Catchlights (Big sparkly glint & tiny glint) */}
            <circle cx="35" cy="50" r="2.2" fill="#FFFFFF" />
            <circle cx="39" cy="54" r="1.1" fill="#FFFFFF" />

            {/* Right Eye */}
            <circle cx="63" cy="52" r="6" fill="url(#mochiEyeGrad)" stroke="#0F172A" strokeWidth="1" />
            {/* Right Catchlights */}
            <circle cx="61" cy="50" r="2.2" fill="#FFFFFF" />
            <circle cx="65" cy="54" r="1.1" fill="#FFFFFF" />
          </g>
        )}

        {/* Cute Little Button Nose & Kitty Mouth */}
        <g id="mochi-face-center">
          {/* Nose */}
          <ellipse cx="50" cy="55" rx="2" ry="1.5" fill="#0F172A" />
          {/* W-Shaped Kitty Mouth */}
          <path
            d="M 46,58 Q 48,61 50,59 Q 52,61 54,58"
            fill="none"
            stroke="#0F172A"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>

        {/* Front Hands / Waving Paw */}
        {activeState === 'waving' ? (
          <g className="origin-[72px_68px] animate-mochi-paw-wave">
            <ellipse cx="76" cy="62" rx="5.5" ry="4.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.6" />
            {/* Other Paw Rested */}
            <ellipse cx="36" cy="68" rx="5" ry="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.6" />
          </g>
        ) : (
          <g id="mochi-paws-resting">
            <ellipse cx="36" cy="68" rx="5" ry="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.6" />
            <ellipse cx="64" cy="68" rx="5" ry="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.6" />
          </g>
        )}
      </svg>
    </div>
  );
};