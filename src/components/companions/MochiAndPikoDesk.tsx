import React, { useState, useEffect } from 'react';
import { Mochi, MochiState } from './Mochi';
import { Piko, PikoState } from './Piko';
import { WashiTape, PaperClip } from '../ScrapbookElements';

interface MochiAndPikoDeskProps {
  onToggleCompanions?: () => void;
  companionsEnabled?: boolean;
  className?: string;
}

export const MochiAndPikoDesk: React.FC<MochiAndPikoDeskProps> = ({
  onToggleCompanions,
  companionsEnabled = true,
  className = '',
}) => {
  const [mochiState, setMochiState] = useState<MochiState>('idle');
  const [pikoState, setPikoState] = useState<PikoState>('peeking');
  const [interactionStep, setInteractionStep] = useState<number>(0);
  const [deskQuote, setDeskQuote] = useState<string>('Learn. Think. Create. Grow.');
  const [isResting, setIsResting] = useState<boolean>(!companionsEnabled);

  // Sync prop changes
  useEffect(() => {
    setIsResting(!companionsEnabled);
  }, [companionsEnabled]);

  // Coordinated Peekaboo interaction loop every 18 seconds (when active and not reduced motion)
  useEffect(() => {
    if (isResting) return;

    const peekabooTimer = setInterval(() => {
      // Step 1: Piko peeks out high and Mochi begins walking over
      setInteractionStep(1);
      setPikoState('peeking');
      setMochiState('walking');
      setDeskQuote('Piko is peeking out... 👀');

      // Step 2: Mochi arrives, Piko notices and gets shy/hides!
      setTimeout(() => {
        setInteractionStep(2);
        setPikoState('hiding');
        setMochiState('curious');
        setDeskQuote('Whoosh! Piko hid behind the memo card! 🙈');
      }, 3500);

      // Step 3: Mochi looks around and waves
      setTimeout(() => {
        setInteractionStep(3);
        setMochiState('waving');
        setDeskQuote('Mochi waves: "Where did you go, Piko?" 👋');
      }, 6000);

      // Step 4: Piko gently pops back up with a sweet smile
      setTimeout(() => {
        setInteractionStep(4);
        setPikoState('waving');
        setMochiState('idle');
        setDeskQuote('There you are! Ready to study with Charu! ✨');
      }, 8500);

      // Return to resting idle
      setTimeout(() => {
        setInteractionStep(0);
        setPikoState('peeking');
        setMochiState('idle');
        setDeskQuote('Learn. Think. Create. Grow.');
      }, 12000);
    }, 22000);

    return () => clearInterval(peekabooTimer);
  }, [isResting]);

  if (isResting) {
    return (
      <div className={`flex items-center justify-between p-3 rounded-2xl bg-cream-100 border-2 border-ink-900/40 text-xs font-bold text-ink-600 ${className}`}>
        <div className="flex items-center gap-2">
          <span>🐾 Mochi & Piko are napping peacefully.</span>
        </div>
        <button
          onClick={onToggleCompanions}
          className="px-3 py-1 rounded-xl bg-cobalt-600 text-white font-black text-xs hover:bg-cobalt-700 transition-colors shadow-sm"
        >
          Wake Companions ✨
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative p-5 rounded-3xl bg-cream-50 border-2 border-ink-900 shadow-pop-sm overflow-hidden select-none scrapbook-card ${className}`}
    >
      <WashiTape color="pink" position="top-right" width="w-20" />

      {/* Header bar with companion status & toggle */}
      <div className="flex items-center justify-between border-b-2 border-cream-200 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink-900">
            Creative Companions · Mochi & Piko
          </h4>
        </div>

        <button
          onClick={onToggleCompanions}
          className="text-[11px] font-bold text-ink-500 hover:text-ink-900 px-2 py-0.5 rounded-lg border border-ink-900/20 hover:border-ink-900 transition-all bg-white"
          title="Toggle companion animations"
        >
          Nap Mode 🌙
        </button>
      </div>

      {/* Desk Stage Canvas */}
      <div className="relative h-28 sm:h-32 bg-dot-grid-subtle rounded-2xl border-2 border-ink-900/20 flex items-end justify-between px-6 sm:px-10 pb-2 overflow-hidden bg-white/70">
        {/* Left Side: Mochi on his cozy desk cushion */}
        <div className="flex flex-col items-center">
          <div
            className={`transition-all duration-700 transform ${
              interactionStep === 1 ? 'translate-x-6 sm:translate-x-10' : 'translate-x-0'
            }`}
          >
            <Mochi state={mochiState} size={74} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-ink-800 bg-yellow-200/80 px-2 py-0.5 rounded-full border border-ink-900/30 -mt-1 shadow-xs">
            Mochi ☁️
          </span>
        </div>

        {/* Center: Live Desk Thought / Interaction Pill */}
        <div className="hidden sm:flex flex-col items-center pb-3">
          <span className="text-[11px] font-black text-cobalt-800 bg-cobalt-50 border-2 border-cobalt-300 px-3 py-1 rounded-2xl shadow-sm animate-fadeIn">
            {deskQuote}
          </span>
          <span className="text-[9px] font-bold text-ink-400 mt-1">Tap either companion to interact</span>
        </div>

        {/* Right Side: Scrapbook Paper Card with Piko Peeking Behind */}
        <div className="relative flex flex-col items-center">
          {/* Piko positioned behind card */}
          <div className="relative z-0">
            <Piko state={pikoState} size={68} />
          </div>

          {/* Overlapping Scrapbook Note Card (Piko peeks from behind it) */}
          <div className="relative z-10 -mt-6 w-20 sm:w-24 p-2 bg-yellow-100 rounded-xl border-2 border-ink-900 shadow-pop-sm text-center transform rotate-2">
            <PaperClip color="pink" position="top-left" />
            <span className="text-[9px] font-black uppercase tracking-wider text-ink-900 block pt-1">
              Piko 🤍
            </span>
          </div>
        </div>
      </div>

      {/* Mobile-only status quote */}
      <div className="sm:hidden text-center pt-2">
        <span className="text-[10px] font-bold text-cobalt-800 bg-cobalt-50 px-2.5 py-0.5 rounded-full border border-cobalt-200">
          {deskQuote}
        </span>
      </div>
    </div>
  );
};