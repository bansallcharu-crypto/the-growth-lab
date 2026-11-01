import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Clock,
  Mic,
  Calendar,
  Layers,
  Compass,
  CheckCircle2,
  Flame,
  Zap,
  BookOpen,
  Check,
} from 'lucide-react';
import {
  UserProfile,
  DailyWorkoutPrompt,
  Assignment,
  NavigationTab,
} from '../types';
import { NotificationService } from '../services/notificationService';
import {
  WashiTape,
  PaperClip,
  PopStamp,
  StickerBadge,
} from '../components/ScrapbookElements';
import { MochiAndPikoDesk } from '../components/companions/MochiAndPikoDesk';

interface HomeViewProps {
  profile: UserProfile;
  dailyWorkouts: DailyWorkoutPrompt[];
  assignments: Assignment[];
  onNavigate: (tab: NavigationTab) => void;
  onStartSpeakingWorkout: (prompt: DailyWorkoutPrompt) => void;
  onMarkWorkoutDone: (dayNumber: number) => void;
  companionsEnabled?: boolean;
  onToggleCompanions?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  profile,
  dailyWorkouts,
  assignments,
  onNavigate,
  onStartSpeakingWorkout,
  onMarkWorkoutDone,
  companionsEnabled = true,
  onToggleCompanions,
}) => {
  // Current active daily prompt
  const currentPrompt =
    dailyWorkouts.find((w) => !w.completed) || dailyWorkouts[2] || dailyWorkouts[0];
  const [selectedRoutine, setSelectedRoutine] = useState<'5min' | '20min'>('5min');
  const [justCompleted, setJustCompleted] = useState(false);

  const pendingDeadlines = assignments
    .filter((a) => a.status !== 'completed')
    .slice(0, 3);

  const completedCount = dailyWorkouts.filter((w) => w.completed).length;

  const handleCompleteToday = () => {
    onMarkWorkoutDone(currentPrompt.dayNumber);
    setJustCompleted(true);
    NotificationService.triggerCelebration();
    setTimeout(() => setJustCompleted(false), 2400);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-14">
      {/* ========================================================= */}
      {/* 1. SHORT PERSONALIZED WELCOME & STAMP SNAPSHOT */}
      {/* ========================================================= */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <StickerBadge
              text={`Day ${currentPrompt.dayNumber} · ${currentPrompt.dayOfWeek}`}
              icon={<Sparkles className="w-3.5 h-3.5 text-cobalt-600" />}
              bg="bg-yellow-300"
              borderColor="border-ink-900"
              rotation="rotate-[-1deg]"
            />
            <span className="text-xs font-bold text-ink-500 tracking-wide uppercase">
              Creative Desk
            </span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-ink-900 tracking-tight">
            Welcome back, {profile.name.split(' ')[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-ink-600 font-medium max-w-xl">
            One sharp spoken thought today beats hours of passive scrolling.
          </p>
        </div>

        {/* Scrapbook Passport / Streak Widget */}
        <div className="relative bg-white px-4 py-3 rounded-2xl border-2 border-ink-900 shadow-pop-sm flex items-center gap-3.5 hover-wiggle">
          <WashiTape color="pink" position="top-right" width="w-16" />
          <div className="w-11 h-11 rounded-xl bg-yellow-300 border-2 border-ink-900 flex items-center justify-center text-amber-900 shadow-sm">
            <Flame className="w-6 h-6 fill-amber-500 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-ink-900 text-base leading-none">
                {profile.streakDays} Days
              </span>
              <PopStamp label="ON FIRE" variant="red" rotation="rotate-[3deg]" />
            </div>
            <p className="text-[11px] text-ink-500 font-bold mt-1">
              {completedCount} of 7 drills completed
            </p>
          </div>
        </div>
      </section>

      {/* Mochi & Piko Creative Companions Desk Stage */}
      <MochiAndPikoDesk
        companionsEnabled={companionsEnabled}
        onToggleCompanions={onToggleCompanions}
      />

      {/* ========================================================= */}
      {/* 2. PROMINENT DAILY ACTIVITY CARD (LIVING SCRAPBOOK HERO) */}
      {/* ========================================================= */}
      <section className="relative bg-white rounded-3xl border-2 border-ink-900 p-6 sm:p-8 shadow-pop transition-all overflow-hidden scrapbook-card">
        {/* Living Scrapbook Tape across top */}
        <WashiTape color="yellow" position="top-left" width="w-28" />
        <WashiTape color="cyan" position="top-right" width="w-20" />

        <div className="relative z-10 max-w-3xl space-y-4">
          {/* Header Tag & Stamp */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cobalt-100 text-cobalt-800 text-xs font-black uppercase tracking-wider border border-cobalt-300">
                Today's Inquiry · {currentPrompt.title}
              </span>
              <span className="text-xs font-bold text-ink-400">
                ~5–20 Mins
              </span>
            </div>

            {currentPrompt.completed && (
              <PopStamp label="COMPLETED ★" variant="emerald" rotation="rotate-[2deg]" animate />
            )}
          </div>

          {/* Big, Clear Inquiry Question */}
          <h2 className="font-display font-black text-xl sm:text-2xl lg:text-3xl text-ink-900 leading-snug tracking-tight">
            "{currentPrompt.question}"
          </h2>

          <p className="text-xs sm:text-sm text-ink-600 leading-relaxed font-medium">
            {currentPrompt.guidance}
          </p>

          {/* Routine Mode Switcher (5 Min vs 20 Min) */}
          <div className="pt-2">
            <div className="inline-flex p-1.5 rounded-2xl bg-cream-100 border-2 border-cream-200 shadow-inner">
              <button
                onClick={() => setSelectedRoutine('5min')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  selectedRoutine === '5min'
                    ? 'bg-yellow-300 text-ink-950 border-2 border-ink-900 shadow-pop-sm scale-102'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-700" />
                <span>5-Min Quick Win</span>
              </button>
              <button
                onClick={() => setSelectedRoutine('20min')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  selectedRoutine === '20min'
                    ? 'bg-cobalt-600 text-white border-2 border-ink-900 shadow-pop-sm scale-102'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>20-Min Deep Workout</span>
              </button>
            </div>
          </div>

          {/* Time-boxed Steps with Scrapbook Notebook Cards */}
          <div className="p-4 rounded-2xl bg-cream-50 border-2 border-cream-200/90 text-xs font-bold text-ink-800 animate-page-flip">
            {selectedRoutine === '5min' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 bg-white rounded-xl border border-cream-200 flex items-center gap-2.5 shadow-sm">
                  <span className="w-6 h-6 rounded-lg bg-cobalt-600 text-white font-black flex items-center justify-center text-xs shrink-0 border border-ink-900">
                    1m
                  </span>
                  <span className="text-ink-700">Speak 60s without notes</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-cream-200 flex items-center gap-2.5 shadow-sm">
                  <span className="w-6 h-6 rounded-lg bg-yellow-300 text-ink-950 font-black flex items-center justify-center text-xs shrink-0 border border-ink-900">
                    3m
                  </span>
                  <span className="text-ink-700">Read consumer insight</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-cream-200 flex items-center gap-2.5 shadow-sm">
                  <span className="w-6 h-6 rounded-lg bg-emerald-400 text-ink-950 font-black flex items-center justify-center text-xs shrink-0 border border-ink-900">
                    1m
                  </span>
                  <span className="text-ink-700">State 1 core takeaway</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2 bg-white rounded-xl border border-cream-200 flex items-center gap-2 shadow-sm">
                  <span className="w-5 h-5 rounded-lg bg-cobalt-600 text-white font-black flex items-center justify-center text-[10px] shrink-0">
                    5m
                  </span>
                  <span className="text-[11px] text-ink-700">Read / Watch</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-cream-200 flex items-center gap-2 shadow-sm">
                  <span className="w-5 h-5 rounded-lg bg-yellow-300 text-ink-950 font-black flex items-center justify-center text-[10px] shrink-0">
                    5m
                  </span>
                  <span className="text-[11px] text-ink-700">Explain in words</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-cream-200 flex items-center gap-2 shadow-sm">
                  <span className="w-5 h-5 rounded-lg bg-cyan-400 text-ink-950 font-black flex items-center justify-center text-[10px] shrink-0">
                    5m
                  </span>
                  <span className="text-[11px] text-ink-700">Structure P-R-E</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-cream-200 flex items-center gap-2 shadow-sm">
                  <span className="w-5 h-5 rounded-lg bg-emerald-400 text-ink-950 font-black flex items-center justify-center text-[10px] shrink-0">
                    5m
                  </span>
                  <span className="text-[11px] text-ink-700">Record & Reflect</span>
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartSpeakingWorkout(currentPrompt)}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-cobalt-600 text-white font-black text-xs sm:text-sm border-2 border-ink-900 shadow-pop hover:bg-cobalt-700 hover:-translate-y-0.5 active:translate-y-0.5 transition-all"
            >
              <Mic className="w-4 h-4" />
              <span>Start Voice Practice</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {!currentPrompt.completed ? (
              <button
                onClick={handleCompleteToday}
                className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white border-2 border-ink-900 text-ink-800 font-extrabold text-xs sm:text-sm shadow-pop-sm hover:bg-cream-100 hover:-translate-y-0.5 active:translate-y-0.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mark as Done</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-100 border-2 border-emerald-600 text-emerald-800 text-xs font-black">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Daily Drill Completed!</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. STUDIO SHORTCUTS & ACADEMIC DEADLINES */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Studio Tools (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-ink-900 text-base">Studio Tools</h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-yellow-200 text-ink-900 border border-ink-900">
                4 Desks
              </span>
            </div>
            <span className="text-xs text-ink-400 font-semibold">One-click jump</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Voice Communication Studio Tile */}
            <div
              onClick={() => onNavigate('skill-studio')}
              className="relative group p-5 rounded-2xl bg-white border-2 border-ink-900 shadow-pop-sm hover:shadow-pop hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between scrapbook-card"
            >
              <WashiTape color="pink" position="top-right" width="w-16" />
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-cobalt-600 text-white flex items-center justify-center border-2 border-ink-900 shadow-sm group-hover:scale-105 transition-transform">
                  <Mic className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-ink-400 group-hover:text-cobalt-600 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4">
                <h4 className="font-display font-black text-ink-900 text-sm group-hover:text-cobalt-600 transition-colors">
                  Voice Studio
                </h4>
                <p className="text-xs text-ink-500 font-medium mt-1">
                  Speak naturally with speech-to-text dictation & open ChatGPT feedback.
                </p>
              </div>
            </div>

            {/* Brand Lab Tile */}
            <div
              onClick={() => onNavigate('skill-studio')}
              className="relative group p-5 rounded-2xl bg-white border-2 border-ink-900 shadow-pop-sm hover:shadow-pop hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between scrapbook-card"
            >
              <WashiTape color="yellow" position="top-left" width="w-16" />
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-yellow-300 text-ink-950 flex items-center justify-center border-2 border-ink-900 shadow-sm group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-ink-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4">
                <h4 className="font-display font-black text-ink-900 text-sm group-hover:text-amber-600 transition-colors">
                  Brand Lab
                </h4>
                <p className="text-xs text-ink-500 font-medium mt-1">
                  Deconstruct Amul, Starbucks, and Zomato with Socratic AI critiques.
                </p>
              </div>
            </div>

            {/* MBA Hub Tile */}
            <div
              onClick={() => onNavigate('mba-hub')}
              className="relative group p-5 rounded-2xl bg-white border-2 border-ink-900 shadow-pop-sm hover:shadow-pop hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between scrapbook-card"
            >
              <WashiTape color="cyan" position="top-right" width="w-16" />
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-cyan-400 text-ink-950 flex items-center justify-center border-2 border-ink-900 shadow-sm group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-ink-400 group-hover:text-cyan-700 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4">
                <h4 className="font-display font-black text-ink-900 text-sm group-hover:text-cyan-700 transition-colors">
                  MBA Study Notebook
                </h4>
                <p className="text-xs text-ink-500 font-medium mt-1">
                  Term II PM2 slides, Microeconomics formulas & MRM research briefs.
                </p>
              </div>
            </div>

            {/* Idea Canvas & LinkedIn Tile */}
            <div
              onClick={() => onNavigate('explore')}
              className="relative group p-5 rounded-2xl bg-white border-2 border-ink-900 shadow-pop-sm hover:shadow-pop hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between scrapbook-card"
            >
              <WashiTape color="lime" position="top-left" width="w-16" />
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-lime-400 text-ink-950 flex items-center justify-center border-2 border-ink-900 shadow-sm group-hover:scale-105 transition-transform">
                  <Compass className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-ink-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4">
                <h4 className="font-display font-black text-ink-900 text-sm group-hover:text-emerald-700 transition-colors">
                  Inspiration & Canvas
                </h4>
                <p className="text-xs text-ink-500 font-medium mt-1">
                  Idea pins, curated case studies, and 5-step LinkedIn post drafter.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Upcoming Deadlines Memo (1 col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-ink-900 text-base">Deadlines Memo</h3>
            <button
              onClick={() => onNavigate('assignments')}
              className="text-xs font-black text-cobalt-600 hover:underline"
            >
              Open Planner →
            </button>
          </div>

          <div className="relative bg-white rounded-2xl border-2 border-ink-900 p-5 shadow-pop-sm space-y-3 scrapbook-card">
            {/* Paper clip fastened at top */}
            <PaperClip color="cobalt" position="top-right" />

            {pendingDeadlines.map((asg) => (
              <div
                key={asg.id}
                onClick={() => onNavigate('assignments')}
                className="p-3 rounded-xl bg-cream-50 hover:bg-yellow-50 transition-colors cursor-pointer border border-cream-200"
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-black text-ink-700 uppercase">{asg.subjectName}</span>
                  <span className="font-bold text-cobalt-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(asg.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h5 className="font-bold text-xs text-ink-900 line-clamp-1">
                  {asg.title}
                </h5>
              </div>
            ))}

            <button
              onClick={() => onNavigate('assignments')}
              className="w-full py-2.5 rounded-xl bg-cream-100 hover:bg-yellow-300 text-ink-900 text-xs font-black uppercase tracking-wider transition-all border border-ink-900 shadow-sm text-center"
            >
              Review All Deadlines
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
