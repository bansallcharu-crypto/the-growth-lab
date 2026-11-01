import React from 'react';

// ==========================================
// 1. WASHI TAPE STRIP
// ==========================================
export interface WashiTapeProps {
  color?: 'yellow' | 'pink' | 'blue' | 'cyan' | 'lime' | 'striped';
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-right' | 'bottom-left';
  rotation?: string;
  className?: string;
  width?: string;
}

export const WashiTape: React.FC<WashiTapeProps> = ({
  color = 'yellow',
  position = 'top-left',
  rotation,
  className = '',
  width = 'w-24',
}) => {
  const colorMap = {
    yellow: 'washi-yellow',
    pink: 'washi-pink',
    blue: 'washi-blue',
    cyan: 'washi-cyan',
    lime: 'washi-lime',
    striped: 'washi-striped',
  };

  const posMap = {
    'top-left': '-top-2.5 -left-2 rotate-[-5deg]',
    'top-right': '-top-2.5 -right-2 rotate-[5deg]',
    'top-center': '-top-2.5 left-1/2 -translate-x-1/2 rotate-[-1deg]',
    'bottom-right': '-bottom-2.5 -right-2 rotate-[-4deg]',
    'bottom-left': '-bottom-2.5 -left-2 rotate-[4deg]',
  };

  const rotationStyle = rotation ? { transform: `rotate(${rotation})` } : {};

  return (
    <div
      style={rotationStyle}
      className={`washi-tape ${width} ${colorMap[color]} ${posMap[position]} ${className}`}
      aria-hidden="true"
    />
  );
};

// ==========================================
// 2. TACTILE POP ART PAPER CLIP
// ==========================================
export interface PaperClipProps {
  color?: 'silver' | 'cobalt' | 'pink' | 'yellow' | 'lime';
  position?: 'top-left' | 'top-right' | 'top-center' | 'left' | 'right';
  className?: string;
}

export const PaperClip: React.FC<PaperClipProps> = ({
  color = 'silver',
  position = 'top-left',
  className = '',
}) => {
  const strokeColorMap = {
    silver: '#94A3B8',
    cobalt: '#2563EB',
    pink: '#F43F5E',
    yellow: '#EAB308',
    lime: '#84CC16',
  };

  const posClasses = {
    'top-left': '-top-4 left-6 rotate-[-12deg]',
    'top-right': '-top-4 right-6 rotate-[12deg]',
    'top-center': '-top-4 left-1/2 -translate-x-1/2 rotate-[-4deg]',
    'left': 'top-6 -left-3 rotate-[-85deg]',
    'right': 'top-6 -right-3 rotate-[85deg]',
  };

  return (
    <div
      className={`absolute z-20 pointer-events-none drop-shadow-sm transition-transform hover:scale-110 ${posClasses[position]} ${className}`}
      aria-hidden="true"
    >
      <svg width="22" height="40" viewBox="0 0 24 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M6 14V34C6 37.3137 8.68629 40 12 40C15.3137 40 18 37.3137 18 34V10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10V33"
          stroke={strokeColorMap[color]}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

// ==========================================
// 3. POP ART STAMP
// ==========================================
export interface PopStampProps {
  label: string;
  variant?: 'blue' | 'emerald' | 'pink' | 'yellow' | 'red';
  rotation?: string;
  animate?: boolean;
  className?: string;
}

export const PopStamp: React.FC<PopStampProps> = ({
  label,
  variant = 'blue',
  rotation = '-3deg',
  animate = false,
  className = '',
}) => {
  const variantStyles = {
    blue: 'text-cobalt-600 border-cobalt-600 bg-cobalt-50/60',
    emerald: 'text-emerald-700 border-emerald-600 bg-emerald-50/60',
    pink: 'text-pink-600 border-pink-600 bg-pink-50/60',
    yellow: 'text-amber-700 border-amber-600 bg-amber-50/60',
    red: 'text-red-600 border-red-600 bg-red-50/60',
  };

  return (
    <span
      style={{ transform: `rotate(${rotation})` }}
      className={`pop-stamp text-[10px] sm:text-[11px] font-black tracking-widest ${variantStyles[variant]} ${
        animate ? 'animate-stamp' : ''
      } ${className}`}
    >
      {label}
    </span>
  );
};

// ==========================================
// 4. POP ART STICKER BADGE
// ==========================================
export interface StickerBadgeProps {
  text: string;
  icon?: React.ReactNode;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  rotation?: string;
  className?: string;
}

export const StickerBadge: React.FC<StickerBadgeProps> = ({
  text,
  icon,
  bg = 'bg-yellow-300',
  textColor = 'text-ink-950',
  borderColor = 'border-ink-900',
  rotation = 'rotate-[-2deg]',
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border-2 shadow-pop-sm hover-wiggle cursor-default transition-all ${bg} ${textColor} ${borderColor} ${rotation} ${className}`}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
};

// ==========================================
// 5. PUSHPIN (SCRAPBOOK PINBOARD)
// ==========================================
export interface PushPinProps {
  color?: 'red' | 'blue' | 'yellow' | 'pink' | 'emerald';
  position?: 'top-left' | 'top-right' | 'top-center';
  className?: string;
}

export const PushPin: React.FC<PushPinProps> = ({
  color = 'red',
  position = 'top-center',
  className = '',
}) => {
  const pinColors = {
    red: 'bg-red-500 ring-red-300',
    blue: 'bg-cobalt-600 ring-cobalt-300',
    yellow: 'bg-amber-400 ring-amber-200',
    pink: 'bg-pink-500 ring-pink-300',
    emerald: 'bg-emerald-500 ring-emerald-300',
  };

  const posClasses = {
    'top-center': '-top-2.5 left-1/2 -translate-x-1/2',
    'top-left': '-top-2.5 left-4',
    'top-right': '-top-2.5 right-4',
  };

  return (
    <div
      className={`absolute z-20 pointer-events-none ${posClasses[position]} ${className}`}
      aria-hidden="true"
    >
      <div className={`w-3.5 h-3.5 rounded-full shadow-md ring-2 ${pinColors[color]} flex items-center justify-center`}>
        <div className="w-1.5 h-1.5 bg-white/70 rounded-full" />
      </div>
    </div>
  );
};

// ==========================================
// 6. NOTEBOOK SPIRAL BINDER STRIP
// ==========================================
export const NotebookBinder: React.FC<{ count?: number; className?: string }> = ({
  count = 6,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-around w-full py-1.5 border-b border-cream-200 bg-cream-100/80 px-4 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="binder-ring" aria-hidden="true" />
      ))}
    </div>
  );
};
