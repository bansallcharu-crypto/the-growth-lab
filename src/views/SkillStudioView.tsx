import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Send,
  Plus,
  Trash2,
  Share2,
  HelpCircle,
  TrendingUp,
  Users,
  Compass,
  Layers,
  ChevronRight,
  ShieldAlert,
  Save,
  MessageSquare,
  Bot,
  Volume2,
} from 'lucide-react';
import {
  UserProfile,
  CommunicationExercise,
  ThoughtBuilderEntry,
  ThoughtFrameworkType,
  CareerTrack,
  BrandObservation,
  DailyWorkoutPrompt,
  IdeaCard,
} from '../types';
import { AudioRecorderService } from '../services/audioService';
import { AudioWaveform } from '../components/AudioWaveform';
import { AIService, CommunicationFeedback, ThoughtStructureResult, ChatMessage } from '../services/aiService';
import { StorageService } from '../services/storage';
import { NotificationService } from '../services/notificationService';
import { WashiTape, PaperClip, PopStamp, StickerBadge, PushPin } from '../components/ScrapbookElements';
import { Mochi, MochiState } from '../components/companions/Mochi';
import { companionEvents } from '../components/companions/CompanionEvents';

interface SkillStudioViewProps {
  profile: UserProfile;
  careerTracks: CareerTrack[];
  onUpdateTracks: (tracks: CareerTrack[]) => void;
  brandObservations: BrandObservation[];
  onUpdateBrands: (brands: BrandObservation[]) => void;
  onAddIdeaCard: (card: Omit<IdeaCard, 'id' | 'createdAt'>) => void;
  onOpenAICoach: (context: string) => void;
  activeSubTab?: 'communication' | 'thought-builder' | 'tracks' | 'brand-lab';
  companionsEnabled?: boolean;
}

export const SkillStudioView: React.FC<SkillStudioViewProps> = ({
  profile,
  careerTracks,
  onUpdateTracks,
  brandObservations,
  onUpdateBrands,
  onAddIdeaCard,
  onOpenAICoach,
  activeSubTab = 'communication',
  companionsEnabled = true,
}) => {
  const [subTab, setSubTab] = useState<'communication' | 'thought-builder' | 'tracks' | 'brand-lab'>(activeSubTab);
  const [mochiState, setMochiState] = useState<MochiState>('idle');

  // ==========================================
  // A. VOICE-FIRST COMMUNICATION STUDIO STATE
  // ==========================================
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [waveformFrequencies, setWaveformFrequencies] = useState<number[]>([]);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isWhisperTranscribing, setIsWhisperTranscribing] = useState(false);

  // Conversation thread in Voice Studio
  const [voiceMessages, setVoiceMessages] = useState<
    Array<{ id: string; role: 'user' | 'assistant'; text: string; audioUrl?: string; timestamp: string }>
  >(() => StorageService.getVoiceMessages());
  const [sendingToAI, setSendingToAI] = useState(false);

  // Optional explicitly requested feedback
  const [showOptionalFeedback, setShowOptionalFeedback] = useState(false);
  const [requestingFeedback, setRequestingFeedback] = useState(false);
  const [communicationFeedback, setCommunicationFeedback] = useState<CommunicationFeedback | null>(null);

  // Guided challenge presets
  const [showGuidedPresets, setShowGuidedPresets] = useState(false);
  const [selectedPromptCategory, setSelectedPromptCategory] = useState<CommunicationExercise['category']>('impromptu');
  const [activeGuidedPrompt, setActiveGuidedPrompt] = useState(
    'Why do consumers pay a ₹300 premium for Starbucks coffee over a local café?'
  );

  const recorderRef = useRef<AudioRecorderService | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    recorderRef.current = new AudioRecorderService();
    recorderRef.current.onTimeUpdate = (secs) => setRecordDuration(secs);
    recorderRef.current.onWaveformUpdate = (freqs) => setWaveformFrequencies(freqs);
    recorderRef.current.onTranscriptUpdate = (liveText) => {
      setTranscript(liveText);
    };
  }, []);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [voiceMessages, sendingToAI]);

  // Handle Recording Toggle
  const handleToggleVoiceRecording = async () => {
    if (!recorderRef.current) return;

    if (!isRecording) {
      setTranscript('');
      setAudioUrl(null);
      setAudioBlob(null);
      setCommunicationFeedback(null);
      setShowOptionalFeedback(false);

      const ok = await recorderRef.current.startRecording();
      if (ok) {
        setIsRecording(true);
      } else {
        alert('Microphone access was denied or is not supported. You can still type below to chat!');
      }
    } else {
      setIsRecording(false);
      try {
        const { audioUrl, blob } = await recorderRef.current.stopRecording();
        setAudioUrl(audioUrl);
        setAudioBlob(blob);

        // Run Whisper if key configured and transcript is light
        if (blob && blob.size > 3000) {
          setIsWhisperTranscribing(true);
          const whisperRes = await AIService.transcribeAudioWithWhisper(blob);
          setIsWhisperTranscribing(false);
          if (whisperRes.ok && whisperRes.text) {
            setTranscript(whisperRes.text);
          }
        }
      } catch (err) {
        console.warn('Stop recording err:', err);
      }
    }
  };

  // Send Transcript to OpenAI Assistant
  const handleSendVoiceMessage = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : transcript).trim();
    if (!textToSend || sendingToAI) return;

    const userEntry = {
      id: `voice-${Date.now()}`,
      role: 'user' as const,
      text: textToSend,
      audioUrl: audioUrl || undefined,
      timestamp: new Date().toISOString(),
    };

    const newThread = [...voiceMessages, userEntry];
    setVoiceMessages(newThread);
    setTranscript('');
    setSendingToAI(true);

    try {
      const history: ChatMessage[] = newThread.map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await AIService.sendMessage(history, 'communication');
      let reply = '';
      if (res.ok && res.reply) {
        reply = res.reply;
      } else if (res.error === 'OPENAI_KEY_REQUIRED') {
        reply = 'Please enter your OpenAI API key in Settings to enable natural ChatGPT responses.';
      } else {
        reply = res.message || 'I had an issue connecting to OpenAI. Please check your network or key.';
      }

      const updatedThread = [
        ...newThread,
        {
          id: `voice-reply-${Date.now()}`,
          role: 'assistant' as const,
          text: reply,
          timestamp: new Date().toISOString(),
        },
      ];
      setVoiceMessages(updatedThread);
      StorageService.saveVoiceMessages(updatedThread);

      // Trigger Mochi reaction
      setMochiState('jumping');
      companionEvents.activityCompleted('Spoken Dialogue Continued');
      setTimeout(() => setMochiState('idle'), 2200);
    } catch (e: any) {
      const errThread = [
        ...newThread,
        {
          id: `voice-err-${Date.now()}`,
          role: 'assistant' as const,
          text: `Connection error: ${e.message}`,
          timestamp: new Date().toISOString(),
        },
      ];
      setVoiceMessages(errThread);
      StorageService.saveVoiceMessages(errThread);
    } finally {
      setSendingToAI(false);
    }
  };

  // Optional explicitly requested speaking feedback
  const handleExplicitFeedback = async () => {
    const lastUserMessage = [...voiceMessages].reverse().find((m) => m.role === 'user');
    const textToReview = transcript.trim() || lastUserMessage?.text;
    if (!textToReview) {
      alert('Speak or type your thoughts first before requesting feedback!');
      return;
    }

    setRequestingFeedback(true);
    setShowOptionalFeedback(true);
    try {
      const fb = await AIService.evaluateCommunication(
        textToReview,
        activeGuidedPrompt || 'Spontaneous Speaking'
      );
      setCommunicationFeedback(fb);
      NotificationService.triggerCelebration();
    } catch (e) {
      console.error(e);
    } finally {
      setRequestingFeedback(false);
    }
  };

  // Guided preset lists
  const promptPresets: Record<CommunicationExercise['category'], string[]> = {
    impromptu: [
      'Why do consumers pay a ₹300 premium for Starbucks coffee over a local café?',
      'If you could reposition Tata Nano today for Gen Z, what would you change?',
      'Can a brand be too transparent with its customers?',
      'Why does Fevicol use humor rather than adhesive chemical specifications?',
    ],
    presentation: [
      'Deliver a 90-second executive summary of why our e-commerce platform should adopt microservices.',
      'Present a 2-minute pitch for launching high-protein Greek yogurt in tier-2 Indian cities.',
      'Explain why our product development team must reserve 20% bandwidth for technical debt.',
    ],
    interview: [
      'Tell me about a time you had to persuade cross-functional teammates without formal authority.',
      'How would you prioritize three competing feature requests from Sales, Engineering, and Design?',
      'Walk me through a marketing campaign you observed recently that failed, and explain why.',
    ],
    storytelling: [
      'Tell the story of how Amul mobilized millions of Indian dairy farmers against global monopolies.',
      'Describe a personal experience where an everyday product delightfully solved an unstated problem.',
      'Narrate how a college event you organized overcame unexpected logistical chaos.',
    ],
    'business-concept': [
      'Explain Price Elasticity of Demand to a software developer who knows no economics.',
      'What is the difference between a REST API and a Webhook in simple terms?',
      'Explain Customer Acquisition Cost (CAC) vs Lifetime Value (LTV) using a gym membership.',
    ],
    'structured-answer': [
      'Should startups invest in brand building before product-market fit? (Use Point-Reason-Example)',
      'How should a brand respond to a viral customer complaint on Twitter? (Use Problem-Analysis-Solution)',
    ],
  };

  // ==========================================
  // B. THOUGHT BUILDER STATE
  // ==========================================
  const [rawThoughts, setRawThoughts] = useState('');
  const [selectedFramework, setSelectedFramework] = useState<ThoughtFrameworkType>(
    (profile.selectedFramework as ThoughtFrameworkType) || 'PRE'
  );
  const [structuring, setStructuring] = useState(false);
  const [structuredResult, setStructuredResult] = useState<ThoughtStructureResult | null>(null);

  const handleStructureThoughts = async () => {
    if (!rawThoughts.trim()) {
      alert('Please enter your thoughts first!');
      return;
    }
    setStructuring(true);
    try {
      const res = await AIService.structureThoughts(rawThoughts, selectedFramework);
      setStructuredResult(res);
      NotificationService.triggerCelebration();
    } catch (e) {
      console.error(e);
    } finally {
      setStructuring(false);
    }
  };

  const handleSaveThoughtToCanvas = () => {
    if (!structuredResult) return;
    onAddIdeaCard({
      title: structuredResult.mainIdea.slice(0, 60),
      content: structuredResult.structuredOutput,
      tag: 'Strategy',
      color: 'amber',
      sourceRef: `Thought Builder (${selectedFramework})`,
      connectedCardIds: [],
    });
    alert('Saved to your Idea Canvas in Explore!');
  };

  // ==========================================
  // C. BRAND LAB STATE
  // ==========================================
  const [selectedBrand, setSelectedBrand] = useState<BrandObservation>(brandObservations[0]);
  const [isCreatingNewBrand, setIsCreatingNewBrand] = useState(false);
  const [newBrandForm, setNewBrandForm] = useState({
    brandName: '',
    industry: '',
    observation: '',
    targetAudience: '',
    positioning: '',
    consumerPsychology: '',
    competitors: '',
    strategicViability: '',
  });
  const [aiDevilAdvocate, setAiDevilAdvocate] = useState<string | null>(null);
  const [critiquingBrand, setCritiquingBrand] = useState(false);

  const handleChallengeBrand = async () => {
    setCritiquingBrand(true);
    try {
      const challenge = await AIService.critiqueBrandObservation(
        selectedBrand.brandName,
        selectedBrand.observation,
        selectedBrand.positioning
      );
      setAiDevilAdvocate(challenge);
    } catch (e) {
      console.error(e);
    } finally {
      setCritiquingBrand(false);
    }
  };

  const handleSaveNewBrand = () => {
    if (!newBrandForm.brandName || !newBrandForm.observation) {
      alert('Please fill in brand name and your observation!');
      return;
    }
    const newBrand: BrandObservation = {
      id: `brand-${Date.now()}`,
      brandName: newBrandForm.brandName,
      industry: newBrandForm.industry || 'Consumer Product',
      brandColor: '#2563EB',
      observation: newBrandForm.observation,
      targetAudience: newBrandForm.targetAudience || 'General Indian Consumers',
      positioning: newBrandForm.positioning || 'Positioning under evaluation',
      consumerPsychology: newBrandForm.consumerPsychology || 'Habit & trust',
      competitors: newBrandForm.competitors || 'Direct and indirect market rivals',
      strategicViability: newBrandForm.strategicViability || 'Viable with proper distribution',
      createdAt: new Date().toISOString(),
    };

    const updated = [newBrand, ...brandObservations];
    onUpdateBrands(updated);
    StorageService.saveBrands(updated);
    setSelectedBrand(newBrand);
    setIsCreatingNewBrand(false);
    setNewBrandForm({
      brandName: '',
      industry: '',
      observation: '',
      targetAudience: '',
      positioning: '',
      consumerPsychology: '',
      competitors: '',
      strategicViability: '',
    });
    NotificationService.triggerCelebration();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Sub-navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-cream-200 pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <StickerBadge
              text="Practice Board"
              icon={<Mic className="w-3.5 h-3.5 text-cobalt-600" />}
              bg="bg-yellow-300"
              rotation="rotate-[-1deg]"
            />
            <span className="text-xs text-ink-500 font-bold uppercase tracking-wider">Voice-First Experience</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-ink-900 tracking-tight mt-1.5">
            Skill Studio
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Practice Coach Mochi */}
          {companionsEnabled && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border-2 border-ink-900 shadow-pop-sm">
              <Mochi state={mochiState} size={42} bubbleText="Ready to speak! 🎙️" />
              <div className="hidden sm:block text-left">
                <span className="text-[10px] font-black uppercase text-ink-900 block leading-tight">
                  Mochi
                </span>
                <span className="text-[9px] text-ink-500 font-bold">Cheering your voice!</span>
              </div>
            </div>
          )}

          {/* Studio Sub-tabs */}
          <div className="flex items-center gap-1.5 bg-cream-100 p-1.5 rounded-2xl border-2 border-cream-200 self-start sm:self-auto shadow-inner">
          <button
            onClick={() => setSubTab('communication')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              subTab === 'communication'
                ? 'bg-cobalt-600 text-white border-2 border-ink-900 shadow-pop-sm scale-102'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Studio</span>
          </button>
          <button
            onClick={() => setSubTab('thought-builder')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              subTab === 'thought-builder'
                ? 'bg-yellow-300 text-ink-950 border-2 border-ink-900 shadow-pop-sm scale-102'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            Thought Builder
          </button>
          <button
            onClick={() => setSubTab('brand-lab')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              subTab === 'brand-lab'
                ? 'bg-cyan-400 text-ink-950 border-2 border-ink-900 shadow-pop-sm scale-102'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            Brand Lab
          </button>
            <button
              onClick={() => setSubTab('tracks')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                subTab === 'tracks'
                  ? 'bg-lime-400 text-ink-950 border-2 border-ink-900 shadow-pop-sm scale-102'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              6 Career Tracks
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: VOICE-FIRST COMMUNICATION STUDIO */}
      {/* ========================================================= */}
      {subTab === 'communication' && (
        <div className="space-y-6">
          {/* Hero Microphone & Live Voice Dictation Stage */}
          <div className="relative bg-white rounded-3xl border-2 border-ink-900 p-6 sm:p-8 shadow-pop space-y-6 scrapbook-card overflow-hidden">
            <WashiTape color="blue" position="top-left" width="w-24" />
            <WashiTape color="pink" position="top-right" width="w-20" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-cream-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-black text-xl sm:text-2xl text-ink-900">
                    Voice Studio
                  </h2>
                  <PopStamp label="MIC 01 · ACTIVE" variant="blue" rotation="rotate-[-2deg]" />
                </div>
                <p className="text-xs text-ink-600 font-semibold mt-1">
                  Speak naturally. Words appear live below. Chat open-endedly with ChatGPT or request optional feedback.
                </p>
              </div>

              {/* Guided Prompts Drawer Toggle */}
              <button
                onClick={() => setShowGuidedPresets(!showGuidedPresets)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-ink-950 text-xs font-black uppercase tracking-wider border-2 border-ink-900 shadow-pop-sm transition-all self-start sm:self-auto hover-wiggle"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{showGuidedPresets ? 'Hide Prompts' : 'Need a Speaking Topic?'}</span>
              </button>
            </div>

            {/* Optional Guided Prompts Accordion */}
            {showGuidedPresets && (
              <div className="p-4 rounded-2xl bg-cream-50 border-2 border-cream-200 space-y-3 animate-fadeIn">
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ['impromptu', 'Impromptu'],
                      ['presentation', 'Presentation'],
                      ['interview', 'Interview'],
                      ['storytelling', 'Storytelling'],
                      ['business-concept', 'Explain Concept'],
                      ['structured-answer', 'P-R-E Practice'],
                    ] as const
                  ).map(([catKey, label]) => (
                    <button
                      key={catKey}
                      onClick={() => {
                        setSelectedPromptCategory(catKey);
                        setActiveGuidedPrompt(promptPresets[catKey][0]);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        selectedPromptCategory === catKey
                          ? 'bg-cobalt-600 text-white border-2 border-ink-900 shadow-pop-sm'
                          : 'bg-white text-ink-700 hover:bg-cream-100 border border-cream-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="p-3 bg-white rounded-xl border-2 border-ink-900 text-xs font-bold text-ink-900 flex items-center justify-between shadow-sm">
                  <span>"{activeGuidedPrompt}"</span>
                  <button
                    onClick={() => {
                      const presets = promptPresets[selectedPromptCategory];
                      const next = presets[(presets.indexOf(activeGuidedPrompt) + 1) % presets.length];
                      setActiveGuidedPrompt(next);
                    }}
                    className="text-cobalt-600 font-black hover:underline flex items-center gap-1 shrink-0 ml-2"
                  >
                    <RotateCcw className="w-3 h-3" /> Next Prompt
                  </button>
                </div>
              </div>
            )}

            {/* Central Prominent Microphone Interface */}
            <div className="flex flex-col items-center justify-center py-6 px-4 bg-cream-50/80 rounded-3xl border-2 border-cream-200 space-y-5">
              {/* Audio Waveform */}
              <div className="w-full max-w-sm">
                <AudioWaveform
                  frequencies={waveformFrequencies}
                  isRecording={isRecording}
                  barColor="#2563EB"
                />
              </div>

              {/* Live Timer */}
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isRecording ? 'bg-red-500 animate-ping' : 'bg-ink-300'
                  }`}
                />
                <span className="font-mono font-black text-xl text-ink-900">
                  {Math.floor(recordDuration / 60)
                    .toString()
                    .padStart(2, '0')}
                  :{(recordDuration % 60).toString().padStart(2, '0')}
                </span>
                {isWhisperTranscribing && (
                  <span className="text-xs text-cobalt-600 font-bold animate-pulse ml-2">
                    Whisper AI transcribing audio...
                  </span>
                )}
              </div>

              {/* Prominent High-Energy Pop Art Microphone Button */}
              <button
                onClick={handleToggleVoiceRecording}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center font-black text-white border-4 border-ink-900 shadow-pop transform transition-all active:scale-95 ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 ring-8 ring-red-100 animate-pulse'
                    : 'bg-cobalt-600 hover:bg-cobalt-700 ring-8 ring-cobalt-100 hover:scale-105 hover:-translate-y-1'
                }`}
              >
                {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
              </button>
              <span className="text-xs font-black uppercase tracking-wider text-ink-600">
                {isRecording ? '● Listening... Tap to Stop' : 'Tap to Start Speaking'}
              </span>

              {/* Audio Playback if recorded */}
              {audioUrl && (
                <div className="w-full max-w-md pt-2 flex items-center justify-center">
                  <audio ref={audioPlayerRef} src={audioUrl} controls className="w-full h-9 accent-cobalt-600" />
                </div>
              )}
            </div>

            {/* Live Editable Transcript Area */}
            <div className="relative space-y-2">
              <PaperClip color="cobalt" position="top-right" />
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-ink-900 flex items-center gap-1.5">
                  <span>Spoken Transcript (Editable Pad)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
                    Live Dictation
                  </span>
                </label>
                <span className="text-[11px] text-ink-400 font-medium">
                  Edit or add thoughts freely before sending
                </span>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Your spoken words will appear here automatically while speaking. You can also type freely or polish your thoughts..."
                rows={4}
                className="w-full bg-yellow-50/40 border-2 border-ink-900 rounded-2xl p-4 text-sm font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 shadow-sm"
              />

              {/* Dual Action Buttons: Send to AI vs Optional Feedback */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleExplicitFeedback}
                  disabled={requestingFeedback || (!transcript.trim() && voiceMessages.length <= 1)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-ink-950 font-black text-xs border-2 border-ink-900 shadow-pop-sm transition-all hover-wiggle disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4 text-amber-800" />
                  <span>{requestingFeedback ? 'Evaluating...' : 'Request Speaking Feedback (Optional)'}</span>
                </button>

                <button
                  onClick={() => handleSendVoiceMessage()}
                  disabled={sendingToAI || !transcript.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cobalt-600 hover:bg-cobalt-700 text-white font-black text-xs border-2 border-ink-900 shadow-pop-sm transition-all active:translate-y-0.5 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendingToAI ? 'ChatGPT Responding...' : 'Send to AI Speaking Partner'}</span>
                </button>
              </div>
            </div>

            {/* Optional Explicit Feedback Card (Only shown upon request) */}
            {showOptionalFeedback && communicationFeedback && (
              <div className="relative p-6 rounded-3xl bg-yellow-50 border-2 border-ink-900 shadow-pop-sm space-y-4 animate-fadeIn">
                <WashiTape color="yellow" position="top-left" width="w-20" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    <h4 className="font-display font-black text-ink-900 text-base">
                      Constructive Communication Critique
                    </h4>
                    <PopStamp label="VERIFIED" variant="emerald" animate />
                  </div>
                  <button
                    onClick={() => setShowOptionalFeedback(false)}
                    className="text-xs text-ink-500 hover:text-ink-800 font-black uppercase"
                  >
                    Hide
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border-2 border-cream-200">
                    <span className="font-black text-ink-800 block mb-1">Clarity & Pacing:</span>
                    <p className="text-ink-600 font-medium">{communicationFeedback.clarity}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border-2 border-cream-200">
                    <span className="font-black text-ink-800 block mb-1">Opening & Structure:</span>
                    <p className="text-ink-600 font-medium">{communicationFeedback.structure}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border-2 border-cream-200">
                    <span className="font-black text-ink-800 block mb-1">Concrete Examples:</span>
                    <p className="text-ink-600 font-medium">{communicationFeedback.examples}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border-2 border-cream-200">
                    <span className="font-black text-ink-800 block mb-1">Conciseness:</span>
                    <p className="text-ink-600 font-medium">{communicationFeedback.conciseness}</p>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border-2 border-ink-900 shadow-sm space-y-1.5 text-xs">
                  <span className="font-black text-cobalt-600 block uppercase tracking-wider text-[11px]">
                    Polished Conversational Version (Your Natural Voice)
                  </span>
                  <p className="text-ink-900 font-semibold italic leading-relaxed">
                    "{communicationFeedback.polishedVersion}"
                  </p>
                  <p className="text-[11px] text-ink-600 pt-1 font-medium">
                    <strong>Coach Rule:</strong> {communicationFeedback.keyTakeaway}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Ongoing Conversational Speaking Thread */}
          <div className="relative bg-white rounded-3xl border-2 border-ink-900 p-6 shadow-pop-sm space-y-4 scrapbook-card">
            <WashiTape color="yellow" position="top-right" width="w-16" />
            <div className="flex items-center justify-between border-b-2 border-cream-200 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cobalt-600" />
                <h3 className="font-display font-black text-sm text-ink-900 uppercase tracking-wide">
                  Voice Dialogue Thread (Persistent)
                </h3>
              </div>
              <button
                onClick={() => {
                  const reset = [
                    {
                      id: `v-${Date.now()}`,
                      role: 'assistant' as const,
                      text: "Conversation refreshed. Ready whenever you want to speak!",
                      timestamp: new Date().toISOString(),
                    },
                  ];
                  setVoiceMessages(reset);
                  StorageService.saveVoiceMessages(reset);
                }}
                className="text-xs text-ink-500 hover:text-ink-900 flex items-center gap-1 font-bold uppercase tracking-wider"
              >
                <RotateCcw className="w-3 h-3" /> Clear Thread
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {voiceMessages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                    <div
                      className={`max-w-[85%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed border-2 ${
                        isUser
                          ? 'bg-cobalt-600 text-white border-ink-900 rounded-br-sm shadow-pop-sm'
                          : 'bg-cream-50 text-ink-900 border-ink-900 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-line font-medium">{msg.text}</p>
                      {msg.audioUrl && (
                        <div className="pt-2">
                          <audio src={msg.audioUrl} controls className="h-7 w-48 accent-cobalt-600" />
                        </div>
                      )}
                      <span
                        className={`block mt-1 text-[10px] font-bold ${
                          isUser ? 'text-cobalt-200' : 'text-ink-400'
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              {sendingToAI && (
                <div className="flex justify-start">
                  <div className="bg-cream-50 border border-cream-200 rounded-2xl px-4 py-2 text-xs text-ink-500 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cobalt-600 animate-spin" />
                    Assistant is replying...
                  </div>
                </div>
              )}
              <div ref={chatScrollRef} />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: THOUGHT BUILDER */}
      {/* ========================================================= */}
      {subTab === 'thought-builder' && (
        <div className="space-y-6">
          <div className="relative bg-white rounded-3xl border-2 border-ink-900 p-6 sm:p-8 shadow-pop space-y-5 scrapbook-card overflow-hidden">
            <WashiTape color="yellow" position="top-left" width="w-28" />
            <WashiTape color="cyan" position="top-right" width="w-20" />

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-xl sm:text-2xl text-ink-900">
                  Thought Builder
                </h2>
                <PopStamp label="ARGUMENT STUDIO" variant="yellow" rotation="rotate-[2deg]" />
              </div>
              <p className="text-xs text-ink-600 font-semibold mt-1">
                Type or speak your unorganized thoughts. AI separates the main point, isolates supporting evidence, flags missing logic, and formats with a business framework.
              </p>
            </div>

            {/* Framework Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                {
                  id: 'PRE' as ThoughtFrameworkType,
                  name: 'Point → Reason → Example',
                  desc: 'Meetings & quick verbal answers',
                  color: 'bg-yellow-100 hover:bg-yellow-200 border-ink-900',
                  activeColor: 'bg-yellow-300 text-ink-950 border-ink-900 shadow-pop-sm scale-102',
                },
                {
                  id: 'PAS' as ThoughtFrameworkType,
                  name: 'Problem → Analysis → Solution',
                  desc: 'Product strategy & memos',
                  color: 'bg-pink-100 hover:bg-pink-200 border-ink-900',
                  activeColor: 'bg-pink-400 text-white border-ink-900 shadow-pop-sm scale-102',
                },
                {
                  id: 'SAR' as ThoughtFrameworkType,
                  name: 'Situation → Action → Result',
                  desc: 'Behavioral interviews & leadership',
                  color: 'bg-cyan-100 hover:bg-cyan-200 border-ink-900',
                  activeColor: 'bg-cyan-400 text-ink-950 border-ink-900 shadow-pop-sm scale-102',
                },
                {
                  id: 'CEC' as ThoughtFrameworkType,
                  name: 'Claim → Evidence → Conclusion',
                  desc: 'Analytical case debates',
                  color: 'bg-lime-100 hover:bg-lime-200 border-ink-900',
                  activeColor: 'bg-lime-400 text-ink-950 border-ink-900 shadow-pop-sm scale-102',
                },
              ].map((fw) => (
                <button
                  key={fw.id}
                  onClick={() => setSelectedFramework(fw.id)}
                  className={`p-3.5 rounded-2xl text-left border-2 transition-all ${
                    selectedFramework === fw.id
                      ? `${fw.activeColor} font-black`
                      : `${fw.color} text-ink-700`
                  }`}
                >
                  <div className="font-black text-sm uppercase tracking-wide">{fw.id}</div>
                  <div className="text-xs font-bold text-ink-900 mt-0.5">{fw.name}</div>
                  <div className="text-[10px] text-ink-500 font-semibold mt-1">{fw.desc}</div>
                </button>
              ))}
            </div>

            {/* Raw Thought Input */}
            <div className="relative space-y-2">
              <PaperClip color="pink" position="top-right" />
              <label className="text-xs font-black uppercase tracking-wider text-ink-900 flex items-center gap-2">
                <span>Your Unstructured Thoughts</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cream-200 text-ink-700">
                  Brain-dump freely
                </span>
              </label>
              <textarea
                value={rawThoughts}
                onChange={(e) => setRawThoughts(e.target.value)}
                placeholder="e.g. I'm thinking about how quick commerce apps like Zepto and Blinkit are charging delivery fees now. People used to say Indians never pay for convenience, but here everyone is paying it without flinching. I feel like habit loops and dark store density made it impossible to go back to local kirana store trips..."
                rows={5}
                className="w-full bg-yellow-50/40 border-2 border-ink-900 rounded-2xl p-4 text-sm font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 shadow-sm"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={handleStructureThoughts}
                  disabled={structuring || !rawThoughts.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cobalt-600 text-white font-black text-xs border-2 border-ink-900 shadow-pop-sm hover:bg-cobalt-700 disabled:opacity-40 transition-all active:translate-y-0.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{structuring ? 'Structuring Logic...' : 'Organize with ' + selectedFramework}</span>
                </button>
              </div>
            </div>

            {/* Side-by-Side Comparative View */}
            {structuredResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t-2 border-cream-200 animate-fadeIn">
                {/* Left: Original Stream of Consciousness */}
                <div className="relative p-5 rounded-2xl bg-yellow-50/60 border-2 border-ink-900 shadow-pop-sm space-y-2">
                  <WashiTape color="pink" position="top-left" width="w-20" />
                  <span className="text-xs font-black text-ink-800 uppercase tracking-wider block">
                    Original Raw Thoughts
                  </span>
                  <p className="text-xs text-ink-700 leading-relaxed italic whitespace-pre-line font-medium">
                    "{rawThoughts}"
                  </p>
                </div>

                {/* Right: Organized Structure */}
                <div className="relative p-5 rounded-2xl bg-white border-2 border-ink-900 shadow-pop space-y-4">
                  <WashiTape color="lime" position="top-right" width="w-20" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-cobalt-700 uppercase tracking-wider">
                        Structured ({selectedFramework})
                      </span>
                      <PopStamp label="VERIFIED" variant="emerald" />
                    </div>
                    <button
                      onClick={handleSaveThoughtToCanvas}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-yellow-300 text-ink-950 border border-ink-900 text-xs font-black hover:bg-yellow-400 transition-colors shadow-sm"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save to Canvas</span>
                    </button>
                  </div>

                  <div>
                    <span className="text-xs font-black text-ink-800 block">Main Idea:</span>
                    <p className="text-sm font-bold text-cobalt-700">
                      {structuredResult.mainIdea}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-black text-ink-800 block">Supporting Points:</span>
                    <ul className="list-disc pl-4 text-xs text-ink-700 space-y-1 font-medium">
                      {structuredResult.supportingPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl space-y-1">
                    <span className="text-[11px] font-black text-red-700 block flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Missing Logic / Assumptions to Test:
                    </span>
                    <ul className="list-disc pl-4 text-[11px] text-red-700 space-y-0.5 font-medium">
                      {structuredResult.missingReasoning.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-cream-200">
                    <span className="text-xs font-black text-ink-800 block mb-1">Formatted Output:</span>
                    <div className="text-xs text-ink-800 font-medium whitespace-pre-line leading-relaxed bg-cream-50 p-3 rounded-xl border border-cream-200">
                      {structuredResult.structuredOutput}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: BRAND LAB */}
      {/* ========================================================= */}
      {subTab === 'brand-lab' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-xl sm:text-2xl text-ink-900">
                  Brand Lab: Deconstruct Iconic Brands
                </h2>
                <PopStamp label="MARKET TEAR-SHEET" variant="pink" />
              </div>
              <p className="text-xs text-ink-600 font-medium mt-1">
                Analyze target audience, positioning, consumer psychology & test strategic viability.
              </p>
            </div>
            <button
              onClick={() => setIsCreatingNewBrand(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cobalt-600 text-white font-black text-xs border-2 border-ink-900 shadow-pop-sm hover:bg-cobalt-700 transition-all self-start sm:self-auto hover-wiggle"
            >
              <Plus className="w-4 h-4" />
              <span>New Brand Observation</span>
            </button>
          </div>

          {/* New Brand Modal Form */}
          {isCreatingNewBrand && (
            <div className="relative p-6 rounded-3xl bg-white border-2 border-ink-900 shadow-pop space-y-4 animate-fadeIn">
              <WashiTape color="pink" position="top-right" width="w-20" />
              <h3 className="font-display font-black text-ink-900 text-base uppercase tracking-wide">
                Record a New Brand Observation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Brand Name (e.g. Paper Boat, Epigamia, Nykaa)"
                  value={newBrandForm.brandName}
                  onChange={(e) => setNewBrandForm({ ...newBrandForm, brandName: e.target.value })}
                  className="bg-cream-50 border-2 border-cream-200 rounded-xl px-3 py-2 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 font-medium"
                />
                <input
                  type="text"
                  placeholder="Industry / Category (e.g. D2C Beverages, Beauty)"
                  value={newBrandForm.industry}
                  onChange={(e) => setNewBrandForm({ ...newBrandForm, industry: e.target.value })}
                  className="bg-cream-50 border-2 border-cream-200 rounded-xl px-3 py-2 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 font-medium"
                />
              </div>
              <textarea
                placeholder="What interesting behavior, packaging choice, pricing move, or campaign did you notice?"
                value={newBrandForm.observation}
                onChange={(e) => setNewBrandForm({ ...newBrandForm, observation: e.target.value })}
                rows={3}
                className="w-full bg-cream-50 border-2 border-cream-200 rounded-xl p-3 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 font-medium"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Target Audience (e.g. Gen Z college students in metro cities)"
                  value={newBrandForm.targetAudience}
                  onChange={(e) => setNewBrandForm({ ...newBrandForm, targetAudience: e.target.value })}
                  className="bg-cream-50 border-2 border-cream-200 rounded-xl px-3 py-2 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 font-medium"
                />
                <input
                  type="text"
                  placeholder="Core Positioning (Why do they claim to be different?)"
                  value={newBrandForm.positioning}
                  onChange={(e) => setNewBrandForm({ ...newBrandForm, positioning: e.target.value })}
                  className="bg-cream-50 border-2 border-cream-200 rounded-xl px-3 py-2 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 font-medium"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsCreatingNewBrand(false)}
                  className="px-4 py-2 rounded-xl text-xs font-black text-ink-500 hover:bg-cream-100 uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNewBrand}
                  className="px-5 py-2.5 rounded-xl bg-cobalt-600 text-white font-black text-xs border-2 border-ink-900 shadow-pop-sm hover:bg-cobalt-700 transition-all uppercase tracking-wide"
                >
                  Save Observation
                </button>
              </div>
            </div>
          )}

          {/* Brand Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Brand Selector List */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-ink-600">
                Observed Brands
              </span>
              <div className="space-y-2.5">
                {brandObservations.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBrand(b);
                      setAiDevilAdvocate(null);
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer scrapbook-card ${
                      selectedBrand.id === b.id
                        ? 'bg-yellow-100/70 border-ink-900 shadow-pop-sm scale-102 font-bold'
                        : 'bg-white border-cream-200 hover:border-ink-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display font-black text-sm text-ink-900">
                        {b.brandName}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cream-200 text-ink-800 uppercase">
                        {b.industry}
                      </span>
                    </div>
                    <p className="text-xs text-ink-500 line-clamp-2">{b.observation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Brand Inspection & Socratic Teardown */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-cream-200 p-6 shadow-soft space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-cobalt-600 uppercase tracking-wider">
                    {selectedBrand.industry}
                  </span>
                  <h3 className="font-display font-extrabold text-2xl text-ink-900 mt-0.5">
                    {selectedBrand.brandName}
                  </h3>
                </div>
                <button
                  onClick={handleChallengeBrand}
                  disabled={critiquingBrand}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-cobalt-50 text-cobalt-700 font-bold text-xs hover:bg-cobalt-100 transition-colors shadow-soft"
                >
                  <Sparkles className="w-4 h-4 text-cobalt-600" />
                  <span>{critiquingBrand ? 'Challenging...' : 'Socratic Challenge'}</span>
                </button>
              </div>

              {/* Observation Detail Grid */}
              <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-3 text-xs leading-relaxed">
                <div>
                  <span className="font-bold text-ink-900 block mb-0.5">Tactical Observation:</span>
                  <p className="text-ink-700">{selectedBrand.observation}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-cream-200">
                  <div>
                    <span className="font-bold text-ink-900 block mb-0.5">Target Audience:</span>
                    <p className="text-ink-600">{selectedBrand.targetAudience}</p>
                  </div>
                  <div>
                    <span className="font-bold text-ink-900 block mb-0.5">Brand Positioning:</span>
                    <p className="text-ink-600">{selectedBrand.positioning}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-cream-200">
                  <div>
                    <span className="font-bold text-ink-900 block mb-0.5">Consumer Psychology:</span>
                    <p className="text-ink-600">{selectedBrand.consumerPsychology}</p>
                  </div>
                  <div>
                    <span className="font-bold text-ink-900 block mb-0.5">Competitor Landscape:</span>
                    <p className="text-ink-600">{selectedBrand.competitors}</p>
                  </div>
                </div>
              </div>

              {/* Socratic Devil's Advocate Feedback Box */}
              {(aiDevilAdvocate || selectedBrand.aiChallenge) && (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                      Socratic Devil's Advocate
                    </span>
                  </div>
                  <p className="text-xs text-ink-800 leading-relaxed whitespace-pre-line font-medium">
                    {aiDevilAdvocate || selectedBrand.aiChallenge}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 4: SIX CAREER TRACKS */}
      {/* ========================================================= */}
      {subTab === 'tracks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {careerTracks.map((track) => {
              const completedCount = track.modules.filter((m) => m.completed).length;
              const totalCount = track.modules.length;
              const percent = Math.round((completedCount / totalCount) * 100);

              return (
                <div
                  key={track.id}
                  className="relative bg-white rounded-3xl border-2 border-ink-900 p-6 shadow-pop-sm flex flex-col justify-between hover:shadow-pop hover:-translate-y-1 transition-all space-y-4 scrapbook-card"
                >
                  <WashiTape color={track.id === 'track-1' ? 'yellow' : track.id === 'track-2' ? 'pink' : track.id === 'track-3' ? 'cyan' : 'lime'} position="top-right" width="w-16" />
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-2xl bg-cobalt-600 border-2 border-ink-900 flex items-center justify-center font-bold text-white shadow-sm">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      {percent === 100 ? (
                        <PopStamp label="MASTERED ★" variant="emerald" />
                      ) : (
                        <span className="text-xs font-black text-ink-600 bg-cream-100 px-2 py-0.5 rounded-full border border-ink-900">
                          {completedCount}/{totalCount} Done
                        </span>
                      )}
                    </div>

                    <h3 className="font-display font-black text-base text-ink-900">
                      {track.title}
                    </h3>
                    <p className="text-xs text-cobalt-600 font-bold mt-0.5">
                      {track.subtitle}
                    </p>
                    <p className="text-xs text-ink-600 font-medium mt-2 line-clamp-3 leading-relaxed">
                      {track.summary}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t-2 border-cream-200">
                    {/* Progress Bar */}
                    <div className="w-full bg-cream-200 rounded-full h-2.5 overflow-hidden border border-ink-900">
                      <div
                        className="h-full rounded-full transition-all duration-300 bg-cobalt-600"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Modules Checklist */}
                    <div className="space-y-1.5">
                      {track.modules.map((mod) => (
                        <div
                          key={mod.id}
                          onClick={() => {
                            const updated = careerTracks.map((t) => {
                              if (t.id === track.id) {
                                return {
                                  ...t,
                                  modules: t.modules.map((m) =>
                                    m.id === mod.id ? { ...m, completed: !m.completed } : m
                                  ),
                                };
                              }
                              return t;
                            });
                            onUpdateTracks(updated);
                            StorageService.saveTracks(updated);
                            if (!mod.completed) NotificationService.triggerCelebration();
                          }}
                          className="flex items-center justify-between p-2 rounded-xl bg-cream-50 hover:bg-cream-100 cursor-pointer text-xs transition-colors"
                        >
                          <span
                            className={`line-clamp-1 ${
                              mod.completed ? 'line-through text-ink-400 font-medium' : 'text-ink-800 font-semibold'
                            }`}
                          >
                            {mod.title}
                          </span>
                          <CheckCircle2
                            className={`w-4 h-4 shrink-0 ${
                              mod.completed ? 'text-emerald-500 fill-emerald-100' : 'text-cream-300'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
