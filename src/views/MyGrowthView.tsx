import React, { useState } from 'react';
import {
  BarChart3,
  Flame,
  Clock,
  Mic,
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Download,
  Share2,
  Award,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  UserProfile,
  CareerTrack,
  CommunicationExercise,
  BrandObservation,
  CuratedResource,
  IdeaCard,
  LinkedInDraft,
  WeeklyGrowthReview,
} from '../types';
import { StorageService } from '../services/storage';
import { NotificationService } from '../services/notificationService';
import { WashiTape, PaperClip, PopStamp, StickerBadge } from '../components/ScrapbookElements';
import { Mochi } from '../components/companions/Mochi';
import { Piko } from '../components/companions/Piko';

interface MyGrowthViewProps {
  profile: UserProfile;
  careerTracks: CareerTrack[];
  exercises: CommunicationExercise[];
  brandObservations: BrandObservation[];
  resources: CuratedResource[];
  ideaCards: IdeaCard[];
  linkedInDrafts: LinkedInDraft[];
  companionsEnabled?: boolean;
}

export const MyGrowthView: React.FC<MyGrowthViewProps> = ({
  profile,
  careerTracks,
  exercises,
  brandObservations,
  resources,
  ideaCards,
  linkedInDrafts,
  companionsEnabled = true,
}) => {
  const [weeklyReview, setWeeklyReview] = useState<WeeklyGrowthReview | null>({
    weekNumber: 44,
    startDate: 'Oct 25',
    endDate: 'Oct 31',
    learnedSummary: [
      'Byron Sharp’s mental availability and distinctive brand memory cues.',
      'Unit economics: Contribution margin 1 vs 3 in quick commerce.',
      'REST vs Webhook event push architectures in Product Management II.',
      'Price Elasticity of Demand application to FMCG and telecom tariffs.',
    ],
    practicedSummary: [
      'Completed 4 spontaneous speaking attempts with P-R-E framework.',
      'Recorded 60-second Brand Lab observation on Amul protein lassi.',
      'Drafted LinkedIn reflection on Tata Nano positioning lessons.',
    ],
    improvedAreas: [
      'Sentence conciseness: Reduced conversational filler repetitions by 35%.',
      'Opening with the verdict (Point) in under 7 seconds during speaking practice.',
      'Grounding business opinions with concrete market examples.',
    ],
    needsWorkAreas: [
      'Retrieving structured thoughts under spontaneous time pressure without freezing.',
      'Interpreting Usage & Attitude (U&A) quantitative survey tables.',
    ],
    recommendedFocus:
      'Practice 2 impromptu speaking drills on Friday and review Microeconomics supply & demand equilibrium slides.',
  });

  const [generatingReview, setGeneratingReview] = useState(false);

  const handleRegenerateReview = () => {
    setGeneratingReview(true);
    setTimeout(() => {
      setGeneratingReview(false);
      NotificationService.triggerCelebration();
    }, 1000);
  };

  const completedModulesCount = careerTracks.reduce(
    (acc, t) => acc + t.modules.filter((m) => m.completed).length,
    0
  );
  const totalModulesCount = careerTracks.reduce((acc, t) => acc + t.modules.length, 0);
  const completedResourcesCount = resources.filter((r) => r.completed).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-cream-200 pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <StickerBadge
              text="Progress Scrapbook"
              icon={<Award className="w-3.5 h-3.5 text-cobalt-600" />}
              bg="bg-yellow-300"
              rotation="rotate-[-1deg]"
            />
            <span className="text-xs text-ink-500 font-bold uppercase tracking-wider">
              Measurable Milestone Album
            </span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-ink-900 tracking-tight mt-1.5">
            Personal Growth Tracker
          </h1>
        </div>

        <button
          onClick={handleRegenerateReview}
          disabled={generatingReview}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cobalt-600 text-white font-black text-xs border-2 border-ink-900 shadow-pop-sm hover:bg-cobalt-700 transition-all self-start sm:self-auto active:translate-y-0.5 hover-wiggle"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${generatingReview ? 'animate-spin' : ''}`} />
          <span>{generatingReview ? 'Synthesizing Scrapbook...' : 'Generate Weekly Review'}</span>
        </button>
      </div>

      {/* Snapshot Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Habit Streak */}
        <div className="relative p-5 rounded-3xl bg-yellow-100/80 border-2 border-ink-900 shadow-pop-sm flex items-center gap-3.5 scrapbook-card">
          <WashiTape color="yellow" position="top-right" width="w-14" />
          <div className="w-11 h-11 rounded-2xl bg-yellow-300 border-2 border-ink-900 flex items-center justify-center font-black shadow-sm">
            <Flame className="w-6 h-6 fill-amber-500 text-amber-600" />
          </div>
          <div>
            <div className="font-display font-black text-xl text-ink-950">
              {profile.streakDays} Days
            </div>
            <div className="text-xs text-ink-700 font-bold">Daily Streak</div>
          </div>
        </div>

        {/* Spoken Practices */}
        <div className="relative p-5 rounded-3xl bg-blue-100/80 border-2 border-ink-900 shadow-pop-sm flex items-center gap-3.5 scrapbook-card">
          <WashiTape color="blue" position="top-right" width="w-14" />
          <div className="w-11 h-11 rounded-2xl bg-cobalt-600 text-white border-2 border-ink-900 flex items-center justify-center font-black shadow-sm">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <div className="font-display font-black text-xl text-ink-950">
              {exercises.length} Drills
            </div>
            <div className="text-xs text-ink-700 font-bold">Voice Recordings</div>
          </div>
        </div>

        {/* Brand Observations */}
        <div className="relative p-5 rounded-3xl bg-pink-100/80 border-2 border-ink-900 shadow-pop-sm flex items-center gap-3.5 scrapbook-card">
          <WashiTape color="pink" position="top-right" width="w-14" />
          <div className="w-11 h-11 rounded-2xl bg-pink-400 text-white border-2 border-ink-900 flex items-center justify-center font-black shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="font-display font-black text-xl text-ink-950">
              {brandObservations.length} Brands
            </div>
            <div className="text-xs text-ink-700 font-bold">Case Observations</div>
          </div>
        </div>

        {/* Learning Library Completed */}
        <div className="relative p-5 rounded-3xl bg-lime-100/80 border-2 border-ink-900 shadow-pop-sm flex items-center gap-3.5 scrapbook-card">
          <WashiTape color="lime" position="top-right" width="w-14" />
          <div className="w-11 h-11 rounded-2xl bg-lime-400 text-ink-950 border-2 border-ink-900 flex items-center justify-center font-black shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="font-display font-black text-xl text-ink-950">
              {completedResourcesCount}/{resources.length}
            </div>
            <div className="text-xs text-ink-700 font-bold">Resources Mastered</div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* COLLECTED SCRAPBOOK STAMPS ALBUM SHELF */}
      {/* ========================================================= */}
      <div className="relative bg-white rounded-3xl border-2 border-ink-900 p-6 sm:p-7 shadow-pop space-y-4 scrapbook-card">
        <div className="flex items-center justify-between border-b-2 border-cream-200 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-cobalt-600" />
            <h3 className="font-display font-black text-base text-ink-900 uppercase tracking-wide">
              Collected Scrapbook Stamps Album
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {companionsEnabled && (
              <div className="hidden sm:flex items-center gap-1.5 bg-yellow-100/80 px-2.5 py-1 rounded-2xl border border-ink-900/40">
                <Mochi state="waving" size={32} />
                <Piko state="peeking" size={28} />
                <span className="text-[10px] font-black text-ink-800">Cheering Milestones</span>
              </div>
            )}
            <span className="text-xs font-black text-ink-500 uppercase tracking-wider">
              6 Official Seals
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          <div className="p-3 bg-yellow-50 rounded-2xl border-2 border-dashed border-amber-500 text-center flex flex-col items-center justify-center gap-1.5 hover-wiggle">
            <PopStamp label="7-DAY STREAK" variant="yellow" rotation="rotate-[-2deg]" />
            <span className="text-[10px] font-bold text-amber-900">Habit Consistency</span>
          </div>

          <div className="p-3 bg-blue-50 rounded-2xl border-2 border-dashed border-cobalt-600 text-center flex flex-col items-center justify-center gap-1.5 hover-wiggle">
            <PopStamp label="VOICE CHAMP" variant="blue" rotation="rotate-[3deg]" />
            <span className="text-[10px] font-bold text-cobalt-900">Speech Studio</span>
          </div>

          <div className="p-3 bg-emerald-50 rounded-2xl border-2 border-dashed border-emerald-600 text-center flex flex-col items-center justify-center gap-1.5 hover-wiggle">
            <PopStamp label="P-R-E MASTER" variant="emerald" rotation="rotate-[-1deg]" />
            <span className="text-[10px] font-bold text-emerald-900">Logic Structure</span>
          </div>

          <div className="p-3 bg-pink-50 rounded-2xl border-2 border-dashed border-pink-500 text-center flex flex-col items-center justify-center gap-1.5 hover-wiggle">
            <PopStamp label="BRAND CRITIC" variant="pink" rotation="rotate-[2deg]" />
            <span className="text-[10px] font-bold text-pink-900">Market Teardowns</span>
          </div>

          <div className="p-3 bg-cyan-50 rounded-2xl border-2 border-dashed border-cyan-600 text-center flex flex-col items-center justify-center gap-1.5 hover-wiggle">
            <PopStamp label="TERM II READY" variant="blue" rotation="rotate-[-3deg]" />
            <span className="text-[10px] font-bold text-cyan-900">MBA Academics</span>
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border-2 border-dashed border-amber-600 text-center flex flex-col items-center justify-center gap-1.5 hover-wiggle">
            <PopStamp label="CREATOR PIN" variant="yellow" rotation="rotate-[1deg]" />
            <span className="text-[10px] font-bold text-amber-900">LinkedIn Drafter</span>
          </div>
        </div>
      </div>

      {/* Meaningful Skill Development Matrix (6 Career Tracks) */}
      <div className="bg-white rounded-3xl border-2 border-ink-900 p-6 sm:p-7 shadow-pop-sm space-y-5 scrapbook-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-black text-base text-ink-900 uppercase tracking-wide">
              Career Tracks Mastery Matrix
            </h3>
            <p className="text-xs text-ink-600 font-medium">
              Progress evaluated against actual conceptual comprehension and real business exercises.
            </p>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-yellow-300 text-ink-950 border border-ink-900 shadow-sm">
            {completedModulesCount}/{totalModulesCount} Mastered
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {careerTracks.map((track) => {
            const completed = track.modules.filter((m) => m.completed).length;
            const pct = Math.round((completed / track.modules.length) * 100);

            return (
              <div
                key={track.id}
                className="p-4 rounded-2xl bg-cream-50/90 border-2 border-cream-200 space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-display font-black text-ink-900">{track.title}</span>
                  <span className="font-mono font-black text-cobalt-600">{pct}%</span>
                </div>

                <div className="w-full bg-cream-200 rounded-full h-2.5 overflow-hidden border border-ink-900/40">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: track.color }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-ink-600 font-bold">
                  <span>{track.subtitle}</span>
                  <span>{completed}/{track.modules.length} lessons</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Growth Review Panel */}
      {weeklyReview && (
        <div className="relative p-6 sm:p-8 rounded-3xl bg-yellow-50/70 border-2 border-ink-900 shadow-pop space-y-5 animate-fadeIn scrapbook-card">
          <PaperClip color="cobalt" position="top-right" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-ink-900/20 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-700" />
              <h3 className="font-display font-black text-base text-ink-900">
                Weekly Growth Review · Week {weeklyReview.weekNumber} ({weeklyReview.startDate} – {weeklyReview.endDate})
              </h3>
            </div>
            <PopStamp label="SYNTHESIS VERIFIED" variant="emerald" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* What you learned */}
            <div className="p-4 rounded-2xl bg-white border-2 border-ink-900/40 space-y-2 shadow-sm">
              <span className="font-black text-ink-900 block text-xs uppercase tracking-wider">
                What You Learned This Week:
              </span>
              <ul className="space-y-1.5 text-ink-700 pl-2 font-medium">
                {weeklyReview.learnedSummary.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-black">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What you practiced */}
            <div className="p-4 rounded-2xl bg-white border-2 border-ink-900/40 space-y-2 shadow-sm">
              <span className="font-black text-ink-900 block text-xs uppercase tracking-wider">
                What You Practiced & Produced:
              </span>
              <ul className="space-y-1.5 text-ink-700 pl-2 font-medium">
                {weeklyReview.practicedSummary.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-cobalt-600 font-black">★</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas Improved */}
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 space-y-2 shadow-sm">
              <span className="font-black text-emerald-950 block text-xs uppercase tracking-wider">
                Demonstrated Improvements:
              </span>
              <ul className="space-y-1 text-emerald-800 pl-2 font-semibold">
                {weeklyReview.improvedAreas.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>

            {/* Areas Needing Work */}
            <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 space-y-2 shadow-sm">
              <span className="font-black text-red-950 block text-xs uppercase tracking-wider">
                Deliberate Practice Priorities:
              </span>
              <ul className="space-y-1 text-red-800 pl-2 font-semibold">
                {weeklyReview.needsWorkAreas.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-ink-900/30 text-xs shadow-sm">
            <span className="font-black text-ink-900 block mb-1 uppercase tracking-wider">
              🎯 Suggested Focus for Next Week:
            </span>
            <p className="text-ink-700 leading-relaxed font-semibold">
              {weeklyReview.recommendedFocus}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
