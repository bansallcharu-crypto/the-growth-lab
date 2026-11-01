import {
  UserProfile,
  DailyWorkoutPrompt,
  CareerTrack,
  BrandObservation,
  CuratedResource,
  MBASubject,
  Assignment,
  CommunicationExercise,
  IdeaCard,
  LinkedInDraft,
  ThoughtBuilderEntry,
  AICoachMessage,
} from '../types';
import {
  initialProfile,
  sevenDayWorkoutPrompts,
  sixCareerTracks,
  initialBrandObservations,
  initialCuratedResources,
  initialMBASubjects,
  initialAssignments,
  initialIdeaCards,
  initialLinkedInDrafts,
  sampleCommunicationExercises,
} from '../data/initialData';

const STORAGE_KEYS = {
  PROFILE: 'tgl_user_profile',
  WORKOUTS: 'tgl_daily_workouts',
  TRACKS: 'tgl_career_tracks',
  BRANDS: 'tgl_brand_observations',
  RESOURCES: 'tgl_curated_resources',
  MBA_SUBJECTS: 'tgl_mba_subjects',
  ASSIGNMENTS: 'tgl_assignments',
  IDEAS: 'tgl_idea_cards',
  LINKEDIN: 'tgl_linkedin_drafts',
  COMMUNICATION: 'tgl_communication_exercises',
  THOUGHTS: 'tgl_thought_builder',
  AI_CHAT: 'tgl_ai_coach_messages',
  VOICE_CHAT: 'tgl_voice_studio_messages',
  LAST_REFRESHED: 'tgl_learning_last_refreshed',
  COMPANIONS: 'tgl_companions_enabled',
};

function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    // Persist to server SQLite database
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: data }),
    }).catch(() => {});
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

export const StorageService = {
  getProfile(): UserProfile {
    return getFromStorage<UserProfile>(STORAGE_KEYS.PROFILE, initialProfile);
  },
  saveProfile(profile: UserProfile): void {
    saveToStorage(STORAGE_KEYS.PROFILE, profile);
  },

  getWorkouts(): DailyWorkoutPrompt[] {
    return getFromStorage<DailyWorkoutPrompt[]>(STORAGE_KEYS.WORKOUTS, sevenDayWorkoutPrompts);
  },
  saveWorkouts(workouts: DailyWorkoutPrompt[]): void {
    saveToStorage(STORAGE_KEYS.WORKOUTS, workouts);
  },

  getTracks(): CareerTrack[] {
    return getFromStorage<CareerTrack[]>(STORAGE_KEYS.TRACKS, sixCareerTracks);
  },
  saveTracks(tracks: CareerTrack[]): void {
    saveToStorage(STORAGE_KEYS.TRACKS, tracks);
  },

  getBrands(): BrandObservation[] {
    return getFromStorage<BrandObservation[]>(STORAGE_KEYS.BRANDS, initialBrandObservations);
  },
  saveBrands(brands: BrandObservation[]): void {
    saveToStorage(STORAGE_KEYS.BRANDS, brands);
  },

  getResources(): CuratedResource[] {
    const raw = getFromStorage<CuratedResource[]>(STORAGE_KEYS.RESOURCES, initialCuratedResources);
    let mutated = false;
    
    // Auto-repair known legacy broken URLs or missing IDs while keeping bookmarks & notes
    const repaired = raw.map((r) => {
      // Fix broken YouTube IDs
      if (r.youtubeId === 'kYJc7K-yRz0') {
        mutated = true;
        return {
          ...r,
          title: 'Amul’s Genius Marketing Strategy: How a Co-operative Won India',
          youtubeId: 'hy2TaHKyklM',
          url: 'https://www.youtube.com/watch?v=hy2TaHKyklM',
          status: 'available' as const,
        };
      }
      if (r.youtubeId === '1xNqXq3qG3U') {
        mutated = true;
        return {
          ...r,
          title: 'Zomato’s Secret Plan to Become Profitable: Hyperpure Case Study',
          youtubeId: '-NtB3rf8paE',
          url: 'https://www.youtube.com/watch?v=-NtB3rf8paE',
          status: 'available' as const,
        };
      }
      // Fix 404 articles
      if (r.url.includes('mark-ritson-marketing-strategy')) {
        mutated = true;
        return {
          ...r,
          title: 'Starbucks Looks to Pivot Away from Seasonality Reliance',
          url: 'https://www.marketingweek.com/starbucks-reliance-seasonality/',
          status: 'available' as const,
        };
      }
      if (r.url.includes('brand-positioning-definition-guide')) {
        mutated = true;
        return {
          ...r,
          title: 'What to Learn from Tropicana’s Packaging Redesign Failure',
          url: 'https://www.thebrandingjournal.com/2015/05/what-to-learn-from-tropicanas-packaging-redesign-failure/',
          status: 'available' as const,
        };
      }
      if (r.url.includes('the-psychology-behind-why-we-buy-luxury-goods')) {
        mutated = true;
        return {
          ...r,
          title: 'The Hallmark Dilemma: Emotional Reassurance vs Commodity',
          url: 'https://seths.blog/2026/10/the-hallmark-dilemma/',
          status: 'available' as const,
        };
      }
      if (r.url === 'https://landor.com/' || r.url.includes('landor.com')) {
        mutated = true;
        return {
          ...r,
          title: 'The Radical Jaguar Rebrand: Risk, Polarisation & Modern Identity',
          url: 'https://www.thebrandingjournal.com/2024/11/jaguar-rebrand/',
          status: 'available' as const,
        };
      }
      return r;
    });

    if (mutated) {
      saveToStorage(STORAGE_KEYS.RESOURCES, repaired);
    }
    return repaired;
  },
  saveResources(resources: CuratedResource[]): void {
    saveToStorage(STORAGE_KEYS.RESOURCES, resources);
  },

  getLastRefreshedAt(): string {
    return getFromStorage<string>(STORAGE_KEYS.LAST_REFRESHED, new Date().toISOString());
  },
  saveLastRefreshedAt(isoString: string): void {
    saveToStorage(STORAGE_KEYS.LAST_REFRESHED, isoString);
  },

  getCompanionsEnabled(): boolean {
    return getFromStorage<boolean>(STORAGE_KEYS.COMPANIONS, true);
  },
  saveCompanionsEnabled(enabled: boolean): void {
    saveToStorage(STORAGE_KEYS.COMPANIONS, enabled);
  },

  getMBASubjects(): MBASubject[] {
    return getFromStorage<MBASubject[]>(STORAGE_KEYS.MBA_SUBJECTS, initialMBASubjects);
  },
  saveMBASubjects(subjects: MBASubject[]): void {
    saveToStorage(STORAGE_KEYS.MBA_SUBJECTS, subjects);
  },

  getAssignments(): Assignment[] {
    return getFromStorage<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, initialAssignments);
  },
  saveAssignments(assignments: Assignment[]): void {
    saveToStorage(STORAGE_KEYS.ASSIGNMENTS, assignments);
  },

  getIdeas(): IdeaCard[] {
    return getFromStorage<IdeaCard[]>(STORAGE_KEYS.IDEAS, initialIdeaCards);
  },
  saveIdeas(ideas: IdeaCard[]): void {
    saveToStorage(STORAGE_KEYS.IDEAS, ideas);
  },

  getLinkedInDrafts(): LinkedInDraft[] {
    return getFromStorage<LinkedInDraft[]>(STORAGE_KEYS.LINKEDIN, initialLinkedInDrafts);
  },
  saveLinkedInDrafts(drafts: LinkedInDraft[]): void {
    saveToStorage(STORAGE_KEYS.LINKEDIN, drafts);
  },

  getCommunicationExercises(): CommunicationExercise[] {
    return getFromStorage<CommunicationExercise[]>(STORAGE_KEYS.COMMUNICATION, sampleCommunicationExercises);
  },
  saveCommunicationExercises(exercises: CommunicationExercise[]): void {
    saveToStorage(STORAGE_KEYS.COMMUNICATION, exercises);
  },

  getThoughtBuilderEntries(): ThoughtBuilderEntry[] {
    return getFromStorage<ThoughtBuilderEntry[]>(STORAGE_KEYS.THOUGHTS, []);
  },
  saveThoughtBuilderEntries(entries: ThoughtBuilderEntry[]): void {
    saveToStorage(STORAGE_KEYS.THOUGHTS, entries);
  },

  getAICoachMessages(): AICoachMessage[] {
    return getFromStorage<AICoachMessage[]>(STORAGE_KEYS.AI_CHAT, [
      {
        id: 'msg-init',
        sender: 'coach',
        text: "Hi Charu! I'm your Growth Coach. Whether you want to practice your 60-second brand speaking prompt, organize raw thoughts into Point-Reason-Example, or break down a tough PM2 or Microeconomics concept in simple English—I'm here for you.",
        timestamp: new Date().toISOString(),
      },
    ]);
  },
  saveAICoachMessages(messages: AICoachMessage[]): void {
    saveToStorage(STORAGE_KEYS.AI_CHAT, messages);
  },

  getVoiceMessages(): Array<{ id: string; role: 'user' | 'assistant'; text: string; audioUrl?: string; timestamp: string }> {
    return getFromStorage(STORAGE_KEYS.VOICE_CHAT, [
      {
        id: 'voice-intro',
        role: 'assistant',
        text: "Hey Charu! Press the big blue mic to speak naturally. Whatever you say will appear below as text, and you can send it to me for an open-ended conversational reply—just like ChatGPT. No pressure, no forced scoring.",
        timestamp: new Date().toISOString(),
      },
    ]);
  },
  saveVoiceMessages(messages: Array<{ id: string; role: 'user' | 'assistant'; text: string; audioUrl?: string; timestamp: string }>): void {
    saveToStorage(STORAGE_KEYS.VOICE_CHAT, messages);
  },

  exportAllData(): string {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      workouts: this.getWorkouts(),
      tracks: this.getTracks(),
      brands: this.getBrands(),
      resources: this.getResources(),
      mbaSubjects: this.getMBASubjects(),
      assignments: this.getAssignments(),
      ideas: this.getIdeas(),
      linkedIn: this.getLinkedInDrafts(),
      communication: this.getCommunicationExercises(),
      thoughts: this.getThoughtBuilderEntries(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackupData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) this.saveProfile(data.profile);
      if (data.workouts) this.saveWorkouts(data.workouts);
      if (data.tracks) this.saveTracks(data.tracks);
      if (data.brands) this.saveBrands(data.brands);
      if (data.resources) this.saveResources(data.resources);
      if (data.mbaSubjects) this.saveMBASubjects(data.mbaSubjects);
      if (data.assignments) this.saveAssignments(data.assignments);
      if (data.ideas) this.saveIdeas(data.ideas);
      if (data.linkedIn) this.saveLinkedInDrafts(data.linkedIn);
      if (data.communication) this.saveCommunicationExercises(data.communication);
      if (data.thoughts) this.saveThoughtBuilderEntries(data.thoughts);
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  },

  resetAllToDefaults(): void {
    localStorage.clear();
    this.saveProfile(initialProfile);
    this.saveWorkouts(sevenDayWorkoutPrompts);
    this.saveTracks(sixCareerTracks);
    this.saveBrands(initialBrandObservations);
    this.saveResources(initialCuratedResources);
    this.saveMBASubjects(initialMBASubjects);
    this.saveAssignments(initialAssignments);
    this.saveIdeas(initialIdeaCards);
    this.saveLinkedInDrafts(initialLinkedInDrafts);
    this.saveCommunicationExercises(sampleCommunicationExercises);
    this.saveThoughtBuilderEntries([]);
  },
};
