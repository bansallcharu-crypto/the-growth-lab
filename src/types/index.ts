export type NavigationTab = 'home' | 'skill-studio' | 'explore' | 'mba-hub' | 'my-growth' | 'assignments';

export interface UserProfile {
  name: string;
  email: string;
  location: string;
  college: string;
  degree: string;
  year: string;
  streakDays: number;
  lastActiveDate: string;
  preferredDailyMinutes: number;
  targetRoles: string[];
  reducedMotion: boolean;
  geminiApiKey?: string;
  selectedFramework: string;
  companionsEnabled?: boolean;
}

export interface DailyWorkoutPrompt {
  dayOfWeek: string;
  dayNumber: number;
  title: string;
  question: string;
  whyItMatters: string;
  guidance: string;
  fiveMinRoutine: {
    speak: string;
    learn: string;
    reflect: string;
  };
  twentyMinWorkout: {
    readWatch: string;
    explain: string;
    organize: string;
    recordReflect: string;
  };
  completed: boolean;
  userSpokenNote?: string;
  userReflection?: string;
}

export interface CommunicationExercise {
  id: string;
  title: string;
  category: 'impromptu' | 'presentation' | 'interview' | 'storytelling' | 'business-concept' | 'structured-answer';
  prompt: string;
  contextHint: string;
  audioBlobUrl?: string;
  transcript: string;
  durationSeconds: number;
  createdAt: string;
  feedback?: {
    clarity: string;
    structure: string;
    relevance: string;
    examples: string;
    conciseness: string;
    logicalFlow: string;
    keyTakeaway: string;
    polishedVersion: string;
  };
}

export type ThoughtFrameworkType = 'PRE' | 'PAS' | 'SAR' | 'CEC';

export interface ThoughtBuilderEntry {
  id: string;
  rawThought: string;
  framework: ThoughtFrameworkType;
  mainIdea: string;
  supportingPoints: string[];
  missingReasoning: string[];
  structuredOutput: string;
  savedToCanvas?: boolean;
  createdAt: string;
}

export interface SkillModule {
  id: string;
  title: string;
  duration: string;
  summary: string;
  coreConcepts: string[];
  practiceExercise: string;
  reflectionQuestion: string;
  completed: boolean;
  userNotes?: string;
}

export interface CareerTrack {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  bgSoft: string;
  borderColor: string;
  iconName: string;
  summary: string;
  modules: SkillModule[];
}

export interface BrandObservation {
  id: string;
  brandName: string;
  industry: string;
  brandColor: string;
  observation: string;
  targetAudience: string;
  positioning: string;
  consumerPsychology: string;
  competitors: string;
  strategicViability: string;
  aiChallenge?: string;
  createdAt: string;
}

export interface CuratedResource {
  id: string;
  title: string;
  source: string;
  url: string;
  type: 'article' | 'video';
  durationMinutes: number;
  trackId: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  summary: string;
  takeaway: string;
  youtubeId?: string;
  saved: boolean;
  completed: boolean;
  userNotes?: string;
  publishedAt?: string;
  status?: 'available' | 'unavailable' | 'unverified';
  isFresh?: boolean;
  suggestedAlternativeUrl?: string;
  channelTitle?: string;
}

export interface IdeaCard {
  id: string;
  title: string;
  content: string;
  tag: 'Brand Insight' | 'Consumer Behavior' | 'Strategy' | 'Observation' | 'Lecture Note';
  color: 'amber' | 'coral' | 'cobalt' | 'emerald' | 'sky' | 'pink' | 'lime' | 'yellow';
  sourceRef?: string;
  connectedCardIds: string[];
  createdAt: string;
}

export interface LinkedInDraft {
  id: string;
  title: string;
  format: 'Personal Learning' | 'Brand Observation' | 'Business Case' | 'Educational Insight' | 'Story';
  content: string;
  originalNotes: string;
  hashtags: string[];
  sourceReference: string;
  characterCount: number;
  createdAt: string;
  status: 'draft' | 'ready';
}

export interface MBADocument {
  id: string;
  title: string;
  fileName: string;
  sessionNumber?: number;
  fileType: 'pptx' | 'pdf' | 'md' | 'docx';
  fileSize: string;
  summary: string;
  keyTopics: string[];
  contentSnippet: string;
  bookmarked: boolean;
  completed: boolean;
  notes?: string;
  downloadUrl?: string;
}

export interface MBASubject {
  id: string;
  code: string;
  name: string;
  instructor?: string;
  color: string;
  bgSoft: string;
  borderColor: string;
  iconName: string;
  description: string;
  status: 'active' | 'upcoming';
  documents: MBADocument[];
}

export interface Assignment {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  description: string;
  attachedFile?: string;
}

export interface WeeklyGrowthReview {
  weekNumber: number;
  startDate: string;
  endDate: string;
  learnedSummary: string[];
  practicedSummary: string[];
  improvedAreas: string[];
  needsWorkAreas: string[];
  recommendedFocus: string;
}

export interface AICoachMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  contextTag?: string;
  timestamp: string;
}
