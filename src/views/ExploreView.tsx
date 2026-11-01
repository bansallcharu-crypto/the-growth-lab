import React, { useState, useEffect } from 'react';
import {
  Compass,
  BookOpen,
  Video,
  FileText,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Plus,
  Sparkles,
  Share2,
  Copy,
  Briefcase,
  Check,
  Search,
  Filter,
  Play,
  Lightbulb,
  ArrowRight,
  Target,
  FileCheck,
  RefreshCw,
  StickyNote,
  Send,
  Clock,
  Radio,
} from 'lucide-react';
import {
  UserProfile,
  CuratedResource,
  IdeaCard,
  LinkedInDraft,
} from '../types';
import { AIService } from '../services/aiService';
import { StorageService } from '../services/storage';
import { NotificationService } from '../services/notificationService';
import { WashiTape, PaperClip, PopStamp, StickerBadge, PushPin } from '../components/ScrapbookElements';
import { Piko } from '../components/companions/Piko';
import { companionEvents } from '../components/companions/CompanionEvents';

interface ExploreViewProps {
  profile: UserProfile;
  resources: CuratedResource[];
  onUpdateResources: (res: CuratedResource[]) => void;
  ideaCards: IdeaCard[];
  onUpdateIdeaCards: (cards: IdeaCard[]) => void;
  linkedInDrafts: LinkedInDraft[];
  onUpdateLinkedInDrafts: (drafts: LinkedInDraft[]) => void;
  onOpenAICoach: (context: string) => void;
  onNavigateToTab?: (tab: 'home' | 'skill-studio' | 'explore' | 'mba-hub' | 'my-growth' | 'assignments', subTab?: string) => void;
  onAddIdeaCard?: (card: Omit<IdeaCard, 'id' | 'createdAt'>) => void;
  onUseInBrandLab?: (brandName: string, observation: string) => void;
  companionsEnabled?: boolean;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  profile,
  resources,
  onUpdateResources,
  ideaCards,
  onUpdateIdeaCards,
  linkedInDrafts,
  onUpdateLinkedInDrafts,
  onOpenAICoach,
  onNavigateToTab,
  onAddIdeaCard,
  onUseInBrandLab,
  companionsEnabled = true,
}) => {
  const [subTab, setSubTab] = useState<'library' | 'canvas' | 'linkedin' | 'career'>('library');

  // ==========================================
  // A. CURATED & LIVE LEARNING LIBRARY STATE
  // ==========================================
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'all' | 'article' | 'video'>('all');
  const [activeVideoModal, setActiveVideoModal] = useState<CuratedResource | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(() =>
    StorageService.getLastRefreshedAt()
  );
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pikoCelebrationId, setPikoCelebrationId] = useState<string | null>(null);

  // Fetch live resources from server on mount
  useEffect(() => {
    fetch('/api/learning/resources')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.resources) && data.resources.length > 0) {
          // Merge while strictly preserving user saved status, completion, and personal notes
          const merged = data.resources.map((serverItem: CuratedResource) => {
            const local = resources.find(
              (r) => r.id === serverItem.id || r.url === serverItem.url
            );
            return {
              ...serverItem,
              saved: local ? local.saved : serverItem.saved,
              completed: local ? local.completed : serverItem.completed,
              userNotes: (local && local.userNotes) || serverItem.userNotes || '',
            };
          });

          onUpdateResources(merged);
          StorageService.saveResources(merged);
          if (data.meta?.lastRefreshedAt) {
            setLastRefreshedAt(data.meta.lastRefreshedAt);
            StorageService.saveLastRefreshedAt(data.meta.lastRefreshedAt);
          }
        }
      })
      .catch((err) => console.warn('Could not sync live resources from backend:', err));
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setToastMessage('Fetching latest discoveries from Think School, Marketing Week, Seth Godin...');
    try {
      const res = await fetch('/api/learning/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.ok && Array.isArray(data.resources)) {
        onUpdateResources(data.resources);
        StorageService.saveResources(data.resources);
        if (data.meta?.lastRefreshedAt) {
          setLastRefreshedAt(data.meta.lastRefreshedAt);
          StorageService.saveLastRefreshedAt(data.meta.lastRefreshedAt);
        }
        setToastMessage(`✨ Fresh Discoveries Updated! (${data.meta?.freshCount || 0} live items ready)`);
        NotificationService.triggerCelebration();
      }
    } catch (err) {
      console.error('Refresh failed:', err);
      setToastMessage('Retaining last verified collection.');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const filteredResources = resources.filter((res) => {
    const matchesQuery =
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFormat = selectedFormat === 'all' || res.type === selectedFormat;
    return matchesQuery && matchesFormat;
  });

  const freshDiscoveries = resources.filter((res) => res.isFresh);

  const handleToggleResourceDone = (id: string) => {
    const updated = resources.map((r) =>
      r.id === id ? { ...r, completed: !r.completed } : r
    );
    onUpdateResources(updated);
    StorageService.saveResources(updated);
    companionEvents.resourceCompleted(id);
    NotificationService.triggerCelebration();

    // Trigger on-card celebration
    setPikoCelebrationId(id);
    setTimeout(() => setPikoCelebrationId(null), 2400);

    // Sync to backend
    const target = updated.find((r) => r.id === id);
    if (target) {
      fetch('/api/learning/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'complete', value: target.completed }),
      }).catch(() => {});
    }
  };

  const handleToggleBookmark = (id: string) => {
    const updated = resources.map((r) =>
      r.id === id ? { ...r, saved: !r.saved } : r
    );
    onUpdateResources(updated);
    StorageService.saveResources(updated);

    const target = updated.find((r) => r.id === id);
    if (target) {
      fetch('/api/learning/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'save', value: target.saved }),
      }).catch(() => {});
    }
  };

  const handleSaveNote = (id: string) => {
    const draftText = noteDrafts[id];
    if (draftText === undefined) return;

    const updated = resources.map((r) =>
      r.id === id ? { ...r, userNotes: draftText } : r
    );
    onUpdateResources(updated);
    StorageService.saveResources(updated);

    // Trigger companion celebration and event
    const targetRes = resources.find((r) => r.id === id);
    companionEvents.noteSaved(targetRes?.title || 'Learning Resource');
    setPikoCelebrationId(id);
    setTimeout(() => setPikoCelebrationId(null), 2500);

    setToastMessage('Personal note pinned to scrapbook! 📝');
    setTimeout(() => setToastMessage(null), 2500);

    // Sync to backend
    fetch('/api/learning/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'note', value: draftText }),
    }).catch(() => {});
  };

  const handleSendToIdeaCanvas = (res: CuratedResource) => {
    const noteContent = res.userNotes || res.takeaway;
    const newCard: Omit<IdeaCard, 'id' | 'createdAt'> = {
      title: `${res.source} · Note`,
      content: noteContent,
      tag: 'Brand Insight',
      color: 'yellow',
      sourceRef: res.title,
      connectedCardIds: [],
    };

    if (onAddIdeaCard) {
      onAddIdeaCard(newCard);
    } else {
      const card: IdeaCard = {
        ...newCard,
        id: `idea-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [card, ...ideaCards];
      onUpdateIdeaCards(updated);
      StorageService.saveIdeas(updated);
    }

    setToastMessage('Sent note to Idea Canvas! 📌 Switched to Canvas');
    setSubTab('canvas');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUseInBrandLab = (res: CuratedResource) => {
    // Extract brand name from title (e.g. "Amul", "Starbucks", "Zomato", etc.)
    let brandName = res.title.split(/[:|’'–—-]/)[0].trim();
    if (brandName.length > 25) {
      brandName = res.source;
    }

    if (onUseInBrandLab) {
      onUseInBrandLab(brandName, `${res.title} — ${res.summary}`);
    } else if (onNavigateToTab) {
      onNavigateToTab('skill-studio', 'brand-lab');
    }
  };

  const handleDraftLinkedInFromResource = (res: CuratedResource) => {
    setPipelineState({
      source: `${res.source}: ${res.title}`,
      notes: `${res.summary}\n\nCore Takeaway: ${res.takeaway}${
        res.userNotes ? `\n\nPersonal Reflection: ${res.userNotes}` : ''
      }`,
      personalOpinion: `In marketing and product strategy, consistency and distinctive asset protection beat vanity redesigns every single time.`,
      format: 'Brand Observation',
    });
    setSubTab('linkedin');
    setLiStep(1);
    setToastMessage('Resource notes sent to LinkedIn Drafter! 💼');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ==========================================
  // B. IDEA CANVAS STATE
  // ==========================================
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardForm, setNewCardForm] = useState<{
    title: string;
    content: string;
    tag: IdeaCard['tag'];
    color: IdeaCard['color'];
  }>({
    title: '',
    content: '',
    tag: 'Brand Insight',
    color: 'amber',
  });

  const handleSaveCard = () => {
    if (!newCardForm.title || !newCardForm.content) return;
    const card: IdeaCard = {
      id: `idea-${Date.now()}`,
      title: newCardForm.title,
      content: newCardForm.content,
      tag: newCardForm.tag,
      color: newCardForm.color,
      connectedCardIds: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [card, ...ideaCards];
    onUpdateIdeaCards(updated);
    StorageService.saveIdeas(updated);
    setIsAddingCard(false);
    setNewCardForm({ title: '', content: '', tag: 'Brand Insight', color: 'amber' });
    NotificationService.triggerCelebration();
  };

  // ==========================================
  // C. LEARNING TO LINKEDIN PIPELINE STATE
  // ==========================================
  const [liStep, setLiStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [pipelineState, setPipelineState] = useState({
    source: 'Think School Case Study on Tata Nano',
    notes: 'The Tata Nano had groundbreaking frugal engineering and cost-reduction patents. However, calling it the "cheapest car" alienated Indian middle-class families who buy cars for prestige and status.',
    personalOpinion: 'Product specifications get customers to look, but emotional identity gets them to buy. Never sacrifice human aspiration for cost minimization.',
    format: 'Personal Learning' as LinkedInDraft['format'],
  });
  const [generatedDraftText, setGeneratedDraftText] = useState(linkedInDrafts[0]?.content || '');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const handleGenerateLinkedInPost = async () => {
    setIsGeneratingDraft(true);
    try {
      const combinedNotes = `${pipelineState.notes}\nPersonal Perspective: ${pipelineState.personalOpinion}`;
      const post = await AIService.generateLinkedInPost(
        combinedNotes,
        pipelineState.format,
        pipelineState.source
      );
      setGeneratedDraftText(post);
      setLiStep(5); // Go to review / share step
      NotificationService.triggerCelebration();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleCopyPost = () => {
    navigator.clipboard.writeText(generatedDraftText);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleOpenInLinkedIn = () => {
    // Open LinkedIn feed share in new tab
    const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(
      generatedDraftText
    )}`;
    window.open(url, '_blank');
  };

  // ==========================================
  // D. CAREER COMPASS STATE
  // ==========================================
  const [selectedTargetRole, setSelectedTargetRole] = useState('Brand Manager');
  const [sampleJDText, setSampleJDText] = useState(
    `Role: Associate Brand Manager (FMCG / D2C)
Requirements:
- MBA in Marketing or Product Management.
- Strong grasp of consumer insights, qualitative research design, and brand positioning.
- Proven experience running digital campaigns, social media strategy, or influencer collaborations.
- Ability to analyze market share telemetry, price elasticities, and campaign ROI.
- Exceptional structured communication and presentation skills.`
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-14">
      {/* Header & Sub-tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-cream-200 pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <StickerBadge
              text="Inspiration & Canvas"
              icon={<Compass className="w-3.5 h-3.5 text-cobalt-600" />}
              bg="bg-yellow-300"
              rotation="rotate-[-1deg]"
            />
            <span className="text-xs text-ink-500 font-bold uppercase tracking-wider">
              Creative Thinking Board
            </span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-ink-900 tracking-tight mt-1.5">
            Explore & Create
          </h1>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 bg-cream-100 p-1.5 rounded-2xl border-2 border-cream-200 self-start sm:self-auto shadow-inner">
          <button
            onClick={() => setSubTab('library')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              subTab === 'library'
                ? 'bg-cobalt-600 text-white border-2 border-ink-900 shadow-pop-sm scale-102'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            Inspiration Wall
          </button>
          <button
            onClick={() => setSubTab('canvas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              subTab === 'canvas'
                ? 'bg-yellow-300 text-ink-950 border-2 border-ink-900 shadow-pop-sm scale-102'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            Idea Canvas
          </button>
          <button
            onClick={() => setSubTab('linkedin')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              subTab === 'linkedin'
                ? 'bg-cyan-400 text-ink-950 border-2 border-ink-900 shadow-pop-sm scale-102'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            LinkedIn Drafter
          </button>
          <button
            onClick={() => setSubTab('career')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              subTab === 'career'
                ? 'bg-lime-400 text-ink-950 border-2 border-ink-900 shadow-pop-sm scale-102'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            Career Compass
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. CURATED & LIVE LEARNING LIBRARY */}
      {/* ========================================================= */}
      {subTab === 'library' && (
        <div className="space-y-6">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-3 bg-yellow-300 text-ink-950 border-2 border-ink-900 rounded-2xl text-xs font-black shadow-pop-sm flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cobalt-700" />
                <span>{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage(null)} className="text-ink-600 hover:text-ink-900 text-xs">
                ✕
              </button>
            </div>
          )}

          {/* Library Subheader with Live Status & 24h Refresh Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border-2 border-ink-900 shadow-pop-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cobalt-600 text-white flex items-center justify-center border-2 border-ink-900 shadow-sm shrink-0">
                <Radio className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-sm text-ink-900">
                    Live Knowledge Feeds
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Live Updates
                  </span>
                </div>
                <p className="text-xs text-ink-500 font-semibold flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-cobalt-600" />
                  <span>
                    Last verified:{' '}
                    {new Date(lastRefreshedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    · {new Date(lastRefreshedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-yellow-300 text-ink-950 font-black text-xs border-2 border-ink-900 shadow-pop-sm hover:bg-yellow-400 active:translate-y-0.5 transition-all disabled:opacity-50"
                title="Fetch latest discoveries from RSS and YouTube"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-ink-900 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing Feeds...' : 'Refresh Discoveries'}</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* FRESH DISCOVERIES SHELF (Recently Published Resources) */}
          {/* ========================================================= */}
          {freshDiscoveries.length > 0 && (
            <div className="relative p-5 sm:p-6 rounded-3xl bg-cobalt-50/70 border-2 border-ink-900 shadow-pop-sm space-y-4 scrapbook-card overflow-hidden">
              <WashiTape color="cyan" position="top-right" width="w-24" />

              <div className="flex items-center justify-between border-b-2 border-ink-900/10 pb-3">
                <div className="flex items-center gap-3">
                  {companionsEnabled && (
                    <div className="relative -mt-2">
                      <Piko state="peeking" size={46} bubbleText="Fresh discovery! ⚡" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <StickerBadge
                        text="Fresh Discoveries"
                        icon={<Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                        bg="bg-amber-300"
                        rotation="rotate-[-1deg]"
                      />
                      <span className="text-[11px] font-bold text-cobalt-800 hidden sm:inline">
                        Auto-refreshed every 24h
                      </span>
                    </div>
                    <p className="text-xs text-ink-600 font-semibold mt-1">
                      Newest case studies and brand intelligence pulled from live feeds.
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white text-ink-900 border-2 border-ink-900 shadow-pop-sm">
                  {freshDiscoveries.length} Fresh
                </span>
              </div>

              {/* Horizontal Scroll / Grid for Fresh Discoveries */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {freshDiscoveries.slice(0, 3).map((res) => (
                  <div
                    key={`fresh-${res.id}`}
                    className="relative p-4 rounded-2xl bg-white border-2 border-ink-900 shadow-pop-sm flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-yellow-200 text-ink-900 border border-ink-900/40">
                          {res.source}
                        </span>
                        <span className="text-[10px] font-bold text-ink-500">
                          {res.durationMinutes}m {res.type}
                        </span>
                      </div>
                      <h4 className="font-display font-black text-xs text-ink-900 line-clamp-2 leading-snug">
                        {res.title}
                      </h4>
                      <p className="text-[11px] text-ink-600 line-clamp-2 font-medium">
                        {res.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-cream-200">
                      {res.type === 'video' ? (
                        <button
                          onClick={() => setActiveVideoModal(res)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cobalt-600 text-white font-black text-[11px] border border-ink-900 shadow-xs hover:bg-cobalt-700"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Watch</span>
                        </button>
                      ) : (
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cream-100 text-ink-900 font-black text-[11px] border border-ink-900 hover:bg-yellow-200"
                        >
                          <span>Read Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      <button
                        onClick={() => handleToggleBookmark(res.id)}
                        className={`p-1 rounded-lg ${
                          res.saved ? 'text-pink-600' : 'text-cream-400 hover:text-ink-700'
                        }`}
                        title="Bookmark"
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search branding, FMCG, Think School..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-ink-900 rounded-2xl pl-10 pr-4 py-2 text-xs text-ink-900 font-semibold focus:outline-none focus:ring-2 focus:ring-cobalt-500 shadow-pop-sm"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setSelectedFormat('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 border-ink-900 transition-all ${
                  selectedFormat === 'all'
                    ? 'bg-ink-900 text-white shadow-pop-sm'
                    : 'bg-white text-ink-600 hover:text-ink-900'
                }`}
              >
                All Sources
              </button>
              <button
                onClick={() => setSelectedFormat('video')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 border-ink-900 transition-all flex items-center gap-1 ${
                  selectedFormat === 'video'
                    ? 'bg-cobalt-600 text-white shadow-pop-sm'
                    : 'bg-white text-ink-600 hover:text-ink-900'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Videos</span>
              </button>
              <button
                onClick={() => setSelectedFormat('article')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 border-ink-900 transition-all flex items-center gap-1 ${
                  selectedFormat === 'article'
                    ? 'bg-yellow-300 text-ink-950 shadow-pop-sm'
                    : 'bg-white text-ink-600 hover:text-ink-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Articles</span>
              </button>
            </div>
          </div>

          {/* Cards Grid (Inspiration Wall) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((res, idx) => {
              const isNoteOpen = expandedNoteId === res.id;
              const currentNoteVal =
                noteDrafts[res.id] !== undefined ? noteDrafts[res.id] : res.userNotes || '';

              return (
                <div
                  key={res.id}
                  className="relative bg-white rounded-3xl border-2 border-ink-900 p-6 shadow-pop-sm flex flex-col justify-between hover:shadow-pop hover:-translate-y-1 transition-all space-y-4 scrapbook-card overflow-hidden"
                >
                  <WashiTape
                    color={res.type === 'video' ? 'pink' : idx % 2 === 0 ? 'yellow' : 'cyan'}
                    position="top-right"
                    width="w-20"
                  />

                  {/* Card Content Top */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cream-200 text-ink-900 border border-ink-900">
                          {res.source}
                        </span>

                        {/* Status Verification Pill */}
                        {res.status === 'available' ? (
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                            ✓ Verified
                          </span>
                        ) : res.status === 'unavailable' ? (
                          <span className="text-[9px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-300">
                            ⚠ Unavailable
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-ink-600 bg-cream-100 px-2 py-0.5 rounded-full border border-cream-300">
                            ℹ Live
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleBookmark(res.id)}
                        className={`p-1.5 rounded-xl transition-transform hover:scale-110 ${
                          res.saved ? 'text-pink-600' : 'text-cream-400 hover:text-ink-600'
                        }`}
                        title={res.saved ? 'Bookmarked in Scrapbook' : 'Bookmark resource'}
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <h3 className="font-display font-black text-sm text-ink-900 leading-snug">
                      {res.title}
                    </h3>

                    <p className="text-xs text-ink-600 leading-relaxed line-clamp-3 font-medium">
                      {res.summary}
                    </p>
                  </div>

                  {/* Card Bottom: Core Takeaway & Functional Actions */}
                  <div className="space-y-3 pt-3 border-t-2 border-cream-200">
                    <div className="p-3 rounded-2xl bg-yellow-50 border border-ink-900/30 text-xs text-ink-900 font-medium leading-relaxed shadow-sm">
                      💡 <strong>Takeaway:</strong> {res.takeaway}
                    </div>

                    {/* Action Row 1: Read/Watch + Completed Stamp */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {res.type === 'video' ? (
                          <button
                            onClick={() => setActiveVideoModal(res)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cobalt-600 text-white font-black text-xs border-2 border-ink-900 shadow-pop-sm hover:bg-cobalt-700 transition-all active:translate-y-0.5"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>Watch Video</span>
                          </button>
                        ) : (
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cream-100 text-ink-900 font-black text-xs border-2 border-ink-900 hover:bg-yellow-200 transition-all shadow-pop-sm"
                          >
                            <span>Read Source</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleResourceDone(res.id)}
                        className="flex items-center gap-1 text-xs font-black transition-transform hover:scale-105"
                      >
                        {res.completed ? (
                          <PopStamp label="READ ★" variant="emerald" />
                        ) : (
                          <span className="text-ink-500 hover:text-ink-900 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Mark Done</span>
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Action Row 2: Note Drawer Toggle & Quick Actions */}
                    <div className="pt-2 border-t border-cream-200 flex items-center justify-between text-xs">
                      <button
                        onClick={() => setExpandedNoteId(isNoteOpen ? null : res.id)}
                        className={`flex items-center gap-1.5 font-black text-xs px-2.5 py-1 rounded-xl transition-all ${
                          isNoteOpen || res.userNotes
                            ? 'bg-yellow-200 text-ink-900 border border-ink-900'
                            : 'text-ink-500 hover:text-ink-900'
                        }`}
                      >
                        <StickyNote className="w-3.5 h-3.5" />
                        <span>{res.userNotes ? 'Personal Notes (Saved)' : 'Add Note'}</span>
                      </button>

                      {/* On-Card Piko celebration badge */}
                      {pikoCelebrationId === res.id && companionsEnabled && (
                        <div className="flex items-center gap-1 text-[11px] font-black text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full border border-pink-400 animate-bounce">
                          <span>Piko celebrated! 🌸</span>
                        </div>
                      )}
                    </div>

                    {/* Expandable Personal Note Drawer & Cross-Tool Integrations */}
                    {isNoteOpen && (
                      <div className="p-3.5 rounded-2xl bg-cream-50 border-2 border-ink-900/40 space-y-3 animate-fadeIn text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-ink-900 text-[11px] uppercase tracking-wider">
                            My Scrapbook Notes
                          </span>
                          <span className="text-[10px] text-ink-500 font-semibold">Auto-saved to portfolio</span>
                        </div>

                        <textarea
                          rows={3}
                          value={currentNoteVal}
                          onChange={(e) =>
                            setNoteDrafts({ ...noteDrafts, [res.id]: e.target.value })
                          }
                          placeholder="What did you learn from this resource? What is the product or branding lesson?"
                          className="w-full p-2.5 bg-white border border-ink-900/30 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-400"
                        />

                        {/* Save Note & Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <button
                            onClick={() => handleSaveNote(res.id)}
                            className="px-3 py-1 rounded-xl bg-cobalt-600 text-white font-black text-xs border border-ink-900 shadow-xs hover:bg-cobalt-700"
                          >
                            Save Note ✨
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSendToIdeaCanvas(res)}
                              className="px-2.5 py-1 rounded-xl bg-yellow-200 text-ink-900 font-black text-[11px] border border-ink-900/50 hover:bg-yellow-300"
                              title="Pin this insight to Idea Canvas"
                            >
                              📌 To Canvas
                            </button>
                            <button
                              onClick={() => handleUseInBrandLab(res)}
                              className="px-2.5 py-1 rounded-xl bg-pink-100 text-pink-900 font-black text-[11px] border border-pink-400 hover:bg-pink-200"
                              title="Analyze brand in Brand Lab"
                            >
                              🏷️ Brand Lab
                            </button>
                            <button
                              onClick={() => handleDraftLinkedInFromResource(res)}
                              className="px-2.5 py-1 rounded-xl bg-cyan-100 text-cyan-950 font-black text-[11px] border border-cyan-400 hover:bg-cyan-200"
                              title="Draft LinkedIn post from this resource"
                            >
                              💼 LinkedIn
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Video Modal Player with Verified Embed & Direct YouTube Fallback */}
          {activeVideoModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-cream-50 w-full max-w-2xl rounded-3xl overflow-hidden shadow-pop border-2 border-ink-900 p-5 space-y-4">
                <div className="flex items-center justify-between border-b-2 border-cream-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cobalt-100 text-cobalt-800">
                      {activeVideoModal.source}
                    </span>
                    <h3 className="font-display font-black text-sm text-ink-900 truncate max-w-md">
                      {activeVideoModal.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveVideoModal(null)}
                    className="p-1 px-2 rounded-xl text-ink-600 hover:bg-cream-200 text-xs font-black border border-ink-900/30"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner border border-ink-900">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${
                      activeVideoModal.youtubeId || 'hy2TaHKyklM'
                    }?autoplay=1&rel=0`}
                    title={activeVideoModal.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-ink-600 pt-1">
                  <div className="flex items-center gap-2 font-medium">
                    <span>If video is restricted:</span>
                    <a
                      href={activeVideoModal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cobalt-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Open on YouTube directly</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <button
                    onClick={() => {
                      handleToggleResourceDone(activeVideoModal.id);
                      setActiveVideoModal(null);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-emerald-500 text-white font-black text-xs border-2 border-ink-900 shadow-pop-sm hover:bg-emerald-600"
                  >
                    Mark as Watched ★
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. IDEA CANVAS (CREATIVE THINKING BOARD) */}
      {/* ========================================================= */}
      {subTab === 'canvas' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-xl sm:text-2xl text-ink-900">
                  Idea Canvas
                </h2>
                <PopStamp label="PINBOARD · THINKING" variant="yellow" />
              </div>
              <p className="text-xs text-ink-600 font-semibold mt-1">
                Collect observations, connect disparate ideas, and build stronger business arguments.
              </p>
            </div>
            <button
              onClick={() => setIsAddingCard(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cobalt-600 text-white font-black text-xs border-2 border-ink-900 shadow-pop-sm hover:bg-cobalt-700 transition-all self-start sm:self-auto hover-wiggle"
            >
              <Plus className="w-4 h-4" />
              <span>Add Idea Sticky</span>
            </button>
          </div>

          {/* New Card Modal */}
          {isAddingCard && (
            <div className="relative p-6 rounded-3xl bg-white border-2 border-ink-900 shadow-pop space-y-3.5 animate-fadeIn">
              <WashiTape color="pink" position="top-right" width="w-20" />
              <h3 className="font-display font-black text-sm text-ink-900 uppercase tracking-wide">
                Pin a New Idea to Canvas
              </h3>
              <input
                type="text"
                placeholder="Card Headline / Concept"
                value={newCardForm.title}
                onChange={(e) => setNewCardForm({ ...newCardForm, title: e.target.value })}
                className="w-full bg-cream-50 border-2 border-cream-200 rounded-xl px-3 py-2 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 font-bold"
              />
              <textarea
                placeholder="Write your observation, question, or strategic argument..."
                value={newCardForm.content}
                onChange={(e) => setNewCardForm({ ...newCardForm, content: e.target.value })}
                rows={3}
                className="w-full bg-cream-50 border-2 border-cream-200 rounded-xl p-3 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 font-medium"
              />
              <div className="flex items-center justify-between">
                <select
                  value={newCardForm.tag}
                  onChange={(e) => setNewCardForm({ ...newCardForm, tag: e.target.value as any })}
                  className="bg-cream-50 border-2 border-cream-200 rounded-xl px-2.5 py-1.5 text-xs text-ink-900 font-bold"
                >
                  <option value="Brand Insight">Brand Insight</option>
                  <option value="Consumer Behavior">Consumer Behavior</option>
                  <option value="Strategy">Strategy</option>
                  <option value="Observation">Observation</option>
                  <option value="Lecture Note">Lecture Note</option>
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAddingCard(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-black text-ink-500 hover:bg-cream-100 uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCard}
                    className="px-4 py-2 rounded-xl bg-cobalt-600 text-white font-black text-xs border-2 border-ink-900 shadow-pop-sm hover:bg-cobalt-700 transition-all uppercase tracking-wide"
                  >
                    Pin to Board
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Board Grid (Living Corkboard / Dot-Grid) */}
          <div className="bg-dot-grid-subtle rounded-3xl border-2 border-ink-900/40 p-5 sm:p-6 shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {ideaCards.map((card, idx) => {
                const bgStyles = [
                  'bg-yellow-200/90 text-ink-950',
                  'bg-pink-200/90 text-ink-950',
                  'bg-cyan-200/90 text-ink-950',
                  'bg-lime-200/90 text-ink-950',
                  'bg-blue-100/90 text-ink-950',
                ];
                const rotations = ['rotate-[-1.5deg]', 'rotate-[1.5deg]', 'rotate-[-0.5deg]', 'rotate-[1deg]'];
                const cardBg = bgStyles[idx % bgStyles.length];
                const cardRot = rotations[idx % rotations.length];

                return (
                  <div
                    key={card.id}
                    className={`relative p-5 rounded-3xl border-2 border-ink-900 shadow-pop-sm flex flex-col justify-between space-y-3 transition-all duration-200 hover:rotate-0 hover:-translate-y-2 hover:shadow-pop scrapbook-card ${cardBg} ${cardRot}`}
                  >
                    {/* Living Scrapbook Pushpin */}
                    <PushPin
                      color={idx % 3 === 0 ? 'red' : idx % 3 === 1 ? 'blue' : 'yellow'}
                      position="top-center"
                    />

                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 text-ink-900 border border-ink-900/60 shadow-sm">
                          {card.tag}
                        </span>
                        {card.sourceRef && (
                          <span className="text-[10px] text-ink-600 font-bold">
                            {card.sourceRef}
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-black text-sm text-ink-900 leading-snug">
                        {card.title}
                      </h4>
                      <p className="text-xs text-ink-800 font-medium leading-relaxed whitespace-pre-line">
                        {card.content}
                      </p>
                    </div>

                    <div className="pt-2 border-t-2 border-ink-900/10 flex items-center justify-between text-[11px] text-ink-600 font-semibold">
                      <span>
                        {new Date(card.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <button
                        onClick={() => onOpenAICoach(`Idea on "${card.title}": ${card.content}`)}
                        className="text-cobalt-800 font-black hover:underline flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded-md border border-ink-900/20 shadow-sm"
                      >
                        <Sparkles className="w-3 h-3 text-cobalt-600" />
                        <span>Deepen with AI</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. LEARNING TO LINKEDIN PIPELINE */}
      {/* ========================================================= */}
      {subTab === 'linkedin' && (
        <div className="space-y-6">
          {/* Step Progression Bar */}
          <div className="p-3.5 rounded-3xl bg-white border-2 border-ink-900 shadow-pop-sm">
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {[
                { step: 1, label: '1. Learn' },
                { step: 2, label: '2. Reflect' },
                { step: 3, label: '3. Organize' },
                { step: 4, label: '4. Format' },
                { step: 5, label: '5. Polish & Share' },
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => setLiStep(s.step as any)}
                  className={`py-2 rounded-xl font-black uppercase tracking-wider text-[11px] transition-all border-2 ${
                    liStep === s.step
                      ? 'bg-cobalt-600 text-white border-ink-900 shadow-sm scale-102'
                      : liStep > s.step
                      ? 'bg-emerald-200 text-emerald-950 border-emerald-600'
                      : 'bg-cream-100 text-ink-600 border-cream-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Workflow Steps Container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Inputs */}
            <div className="relative bg-white rounded-3xl border-2 border-ink-900 p-6 shadow-pop-sm space-y-4 scrapbook-card overflow-hidden">
              <WashiTape color="yellow" position="top-left" width="w-20" />
              <div className="flex items-center justify-between">
                <h3 className="font-display font-black text-base text-ink-900 uppercase tracking-wide">
                  Step-by-Step Thought Synthesis
                </h3>
                <PopStamp label="DRAFTING" variant="blue" />
              </div>

              {/* Step 1: Source */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-ink-800 block mb-1">
                  1. Source Article, Case, or Video
                </label>
                <input
                  type="text"
                  value={pipelineState.source}
                  onChange={(e) => setPipelineState({ ...pipelineState, source: e.target.value })}
                  placeholder="e.g. Think School Case Study, Mark Ritson Branding article"
                  className="w-full bg-cream-50 border-2 border-cream-200 rounded-xl px-3 py-2 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 font-medium"
                />
              </div>

              {/* Step 2: Key Observation */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-ink-800 block mb-1">
                  2. What Was the Core Business Insight?
                </label>
                <textarea
                  value={pipelineState.notes}
                  onChange={(e) => setPipelineState({ ...pipelineState, notes: e.target.value })}
                  rows={3}
                  className="w-full bg-cream-50 border-2 border-cream-200 rounded-xl p-3 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 font-medium"
                />
              </div>

              {/* Step 3: Personal Take / Example */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-ink-800 block mb-1">
                  3. Your Personal Perspective or Contrast
                </label>
                <textarea
                  value={pipelineState.personalOpinion}
                  onChange={(e) =>
                    setPipelineState({ ...pipelineState, personalOpinion: e.target.value })
                  }
                  rows={2}
                  className="w-full bg-cream-50 border-2 border-cream-200 rounded-xl p-3 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 font-medium"
                />
              </div>

              {/* Step 4: Post Archetype */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-ink-800 block mb-1.5">
                  4. Post Angle / Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Personal Learning',
                    'Brand Observation',
                    'Business Case',
                    'Educational Insight',
                  ].map((fmt) => (
                    <button
                      type="button"
                      key={fmt}
                      onClick={() =>
                        setPipelineState({ ...pipelineState, format: fmt as any })
                      }
                      className={`p-2.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 text-left transition-all ${
                        pipelineState.format === fmt
                          ? 'bg-yellow-300 text-ink-950 border-ink-900 shadow-pop-sm scale-102'
                          : 'bg-cream-50 border-cream-200 text-ink-700 hover:bg-cream-100'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateLinkedInPost}
                disabled={isGeneratingDraft}
                className="w-full py-3.5 rounded-2xl bg-cobalt-600 text-white font-black text-xs uppercase tracking-wider border-2 border-ink-900 shadow-pop-sm hover:bg-cobalt-700 transition-all flex items-center justify-center gap-2 active:translate-y-0.5 disabled:opacity-40"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isGeneratingDraft ? 'Synthesizing Professional Post...' : 'Generate LinkedIn Draft'}
                </span>
              </button>
            </div>

            {/* Right: LinkedIn Live Preview (Editorial Draft Sheet) */}
            <div className="relative bg-white rounded-3xl border-2 border-ink-900 p-6 shadow-pop space-y-4 flex flex-col justify-between scrapbook-card">
              <PaperClip color="cobalt" position="top-right" />
              <div>
                <div className="flex items-center justify-between pb-3 border-b-2 border-cream-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-ink-900 text-white font-black text-xs flex items-center justify-center border-2 border-ink-900 shadow-sm">
                      CB
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-ink-900">Charu Bansal</h4>
                      <p className="text-[11px] text-ink-500 font-semibold">MBA Product Management · Surat</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PopStamp label="PUBLISHING DESK" variant="blue" />
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cream-200 text-ink-800">
                      {generatedDraftText.length} chars
                    </span>
                  </div>
                </div>

                <div className="pt-4">
                  <textarea
                    value={generatedDraftText}
                    onChange={(e) => setGeneratedDraftText(e.target.value)}
                    rows={12}
                    className="w-full bg-cream-50/60 border-2 border-cream-200 rounded-2xl p-4 text-xs sm:text-sm text-ink-900 leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-cobalt-500 shadow-inner"
                  />
                </div>
              </div>

              {/* Share & Copy Actions */}
              <div className="pt-3 border-t-2 border-cream-200 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={handleCopyPost}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-ink-900 font-black text-xs border-2 border-ink-900 shadow-pop-sm hover:bg-yellow-200 transition-all uppercase tracking-wide"
                >
                  {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSuccess ? 'Copied to Clipboard!' : 'Copy Post'}</span>
                </button>

                <button
                  onClick={handleOpenInLinkedIn}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0A66C2] text-white font-black text-xs border-2 border-ink-900 shadow-pop-sm hover:bg-[#004182] transition-all uppercase tracking-wide hover-wiggle"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Open in LinkedIn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. CAREER COMPASS */}
      {/* ========================================================= */}
      {subTab === 'career' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-cream-200 p-6 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-lg text-ink-900">
                  Career Compass: Resume vs. Role Gap Analysis
                </h2>
                <p className="text-xs text-ink-500">
                  Target: {selectedTargetRole} · Verified against Charu Bansal’s verified profile & project evidence.
                </p>
              </div>

              {/* Target Role Selector */}
              <div className="flex items-center gap-1.5">
                {[
                  'Brand Manager',
                  'Brand Strategist',
                  'Product Marketing Manager',
                  'Consumer Insights',
                ].map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedTargetRole(role)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedTargetRole === role
                        ? 'bg-ink-900 text-white shadow-soft'
                        : 'bg-cream-100 text-ink-600 hover:bg-cream-200'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Snapshot & Evidence Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-cream-50 border border-cream-200 text-xs">
              <div>
                <span className="font-bold text-ink-800 block mb-1">Education & Background:</span>
                <p className="text-ink-600">
                  BBA (SDJ International College, Surat) → MBA Term II (Product Management & Marketing)
                </p>
              </div>
              <div>
                <span className="font-bold text-ink-800 block mb-1">Demonstrated Work Experience:</span>
                <p className="text-ink-600">
                  Social Media Manager at Erocare retails · Content writing intern · Music Community head
                </p>
              </div>
              <div>
                <span className="font-bold text-ink-800 block mb-1">Certifications & Competencies:</span>
                <p className="text-ink-600">
                  English for Career Development · Intermediate Business Excel · Event Management
                </p>
              </div>
            </div>

            {/* Skill Match Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Ready & Evidenced Skills */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Demonstrated Strengths in Resume
                </span>
                <ul className="text-xs text-emerald-900 space-y-1.5 pl-2">
                  <li>✓ Digital campaign execution & social media management (Erocare retails).</li>
                  <li>✓ Cross-functional event leadership & club organization.</li>
                  <li>✓ Content writing, audience storytelling & brand voice development.</li>
                  <li>✓ Intermediate business modeling in Excel & quantitative coursework.</li>
                </ul>
              </div>

              {/* Skills to Develop in Growth Lab */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-amber-600" />
                  Growth Lab Practice Priorities
                </span>
                <ul className="text-xs text-amber-900 space-y-1.5 pl-2">
                  <li>→ Synthesizing quantitative Usage & Attitude (U&A) market research tables.</li>
                  <li>→ Explaining microeconomic price elasticity in FMCG pricing strategy memos.</li>
                  <li>→ Delivering spontaneous 60-second executive briefings without filler words.</li>
                  <li>→ Documenting technical trade-offs (PM2 Build vs Buy) for senior leaders.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
