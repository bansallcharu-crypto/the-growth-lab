import React, { useState, useEffect } from 'react';
import {
  NavigationTab,
  UserProfile,
  DailyWorkoutPrompt,
  CareerTrack,
  BrandObservation,
  CuratedResource,
  MBASubject,
  Assignment,
  IdeaCard,
  LinkedInDraft,
} from './types';
import { StorageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { AICoachModal } from './components/AICoachModal';
import { SettingsModal } from './components/SettingsModal';
import { HomeView } from './views/HomeView';
import { SkillStudioView } from './views/SkillStudioView';
import { ExploreView } from './views/ExploreView';
import { MBAHubView } from './views/MBAHubView';
import { AssignmentsView } from './views/AssignmentsView';
import { MyGrowthView } from './views/MyGrowthView';
import { Bot, Sparkles, Flame } from 'lucide-react';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getProfile());
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [skillStudioSubTab, setSkillStudioSubTab] = useState<
    'communication' | 'thought-builder' | 'tracks' | 'brand-lab'
  >('communication');

  // App data states
  const [dailyWorkouts, setDailyWorkouts] = useState<DailyWorkoutPrompt[]>(() =>
    StorageService.getWorkouts()
  );
  const [careerTracks, setCareerTracks] = useState<CareerTrack[]>(() =>
    StorageService.getTracks()
  );
  const [brandObservations, setBrandObservations] = useState<BrandObservation[]>(() =>
    StorageService.getBrands()
  );
  const [resources, setResources] = useState<CuratedResource[]>(() =>
    StorageService.getResources()
  );
  const [mbaSubjects, setMbaSubjects] = useState<MBASubject[]>(() =>
    StorageService.getMBASubjects()
  );
  const [assignments, setAssignments] = useState<Assignment[]>(() =>
    StorageService.getAssignments()
  );
  const [ideaCards, setIdeaCards] = useState<IdeaCard[]>(() =>
    StorageService.getIdeas()
  );
  const [linkedInDrafts, setLinkedInDrafts] = useState<LinkedInDraft[]>(() =>
    StorageService.getLinkedInDrafts()
  );
  const [communicationExercises, setCommunicationExercises] = useState(() =>
    StorageService.getCommunicationExercises()
  );

  // Mochi & Piko Companions global toggle
  const [companionsEnabled, setCompanionsEnabled] = useState<boolean>(() =>
    StorageService.getCompanionsEnabled()
  );

  const handleToggleCompanions = () => {
    const next = !companionsEnabled;
    setCompanionsEnabled(next);
    StorageService.saveCompanionsEnabled(next);
  };

  const handleUseInBrandLab = (brandName: string, observation: string) => {
    const newBrand: BrandObservation = {
      id: `bo-${Date.now()}`,
      brandName,
      industry: 'Branding & Consumer Case Study',
      brandColor: '#2563EB',
      observation,
      targetAudience: 'Target consumer segment analyzed in study',
      positioning: 'Distinctive positioning angle',
      consumerPsychology: 'Behavioral friction point and psychological anchor',
      competitors: 'Category incumbents and direct rivals',
      strategicViability: 'High relevance for MBA portfolio',
      createdAt: new Date().toISOString(),
    };
    const updated = [newBrand, ...brandObservations];
    setBrandObservations(updated);
    StorageService.saveBrands(updated);
    setSkillStudioSubTab('brand-lab');
    setActiveTab('skill-studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Modals
  const [isAICoachOpen, setIsAICoachOpen] = useState(false);
  const [aiCoachContext, setAICoachContext] = useState('General Learning');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const pendingAssignmentsCount = assignments.filter((a) => a.status !== 'completed').length;

  const handleOpenAICoachWithContext = (context: string) => {
    setAICoachContext(context);
    setIsAICoachOpen(true);
  };

  const handleStartSpeakingWorkout = (prompt: DailyWorkoutPrompt) => {
    setSkillStudioSubTab('communication');
    setActiveTab('skill-studio');
  };

  const handleMarkWorkoutDone = (dayNumber: number) => {
    const updated = dailyWorkouts.map((w) =>
      w.dayNumber === dayNumber ? { ...w, completed: true } : w
    );
    setDailyWorkouts(updated);
    StorageService.saveWorkouts(updated);

    // Increment streak
    const updatedProf = { ...profile, streakDays: profile.streakDays + 1 };
    setProfile(updatedProf);
    StorageService.saveProfile(updatedProf);
  };

  const handleAddIdeaCard = (card: Omit<IdeaCard, 'id' | 'createdAt'>) => {
    const newCard: IdeaCard = {
      ...card,
      id: `idea-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newCard, ...ideaCards];
    setIdeaCards(updated);
    StorageService.saveIdeas(updated);
  };

  return (
    <div className={`min-h-screen bg-dot-grid flex flex-col text-ink-900 ${profile.reducedMotion ? 'motion-reduce' : ''}`}>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        profile={profile}
        onOpenAICoach={() => handleOpenAICoachWithContext('Active Dashboard')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        pendingAssignmentsCount={pendingAssignmentsCount}
        companionsEnabled={companionsEnabled}
        onToggleCompanions={handleToggleCompanions}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {activeTab === 'home' && (
          <HomeView
            profile={profile}
            dailyWorkouts={dailyWorkouts}
            assignments={assignments}
            onNavigate={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onStartSpeakingWorkout={handleStartSpeakingWorkout}
            onMarkWorkoutDone={handleMarkWorkoutDone}
            companionsEnabled={companionsEnabled}
            onToggleCompanions={handleToggleCompanions}
          />
        )}

        {activeTab === 'skill-studio' && (
          <SkillStudioView
            profile={profile}
            careerTracks={careerTracks}
            onUpdateTracks={setCareerTracks}
            brandObservations={brandObservations}
            onUpdateBrands={setBrandObservations}
            onAddIdeaCard={handleAddIdeaCard}
            onOpenAICoach={handleOpenAICoachWithContext}
            activeSubTab={skillStudioSubTab}
            companionsEnabled={companionsEnabled}
          />
        )}

        {activeTab === 'explore' && (
          <ExploreView
            profile={profile}
            resources={resources}
            onUpdateResources={setResources}
            ideaCards={ideaCards}
            onUpdateIdeaCards={setIdeaCards}
            linkedInDrafts={linkedInDrafts}
            onUpdateLinkedInDrafts={setLinkedInDrafts}
            onOpenAICoach={handleOpenAICoachWithContext}
            onNavigateToTab={(tab, subTab) => {
              setActiveTab(tab);
              if (subTab) setSkillStudioSubTab(subTab as any);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onAddIdeaCard={handleAddIdeaCard}
            onUseInBrandLab={handleUseInBrandLab}
            companionsEnabled={companionsEnabled}
          />
        )}

        {activeTab === 'mba-hub' && (
          <MBAHubView
            subjects={mbaSubjects}
            onUpdateSubjects={setMbaSubjects}
            onOpenAICoach={handleOpenAICoachWithContext}
            geminiApiKey={profile.geminiApiKey}
          />
        )}

        {activeTab === 'assignments' && (
          <AssignmentsView
            assignments={assignments}
            onUpdateAssignments={setAssignments}
            subjects={mbaSubjects}
          />
        )}

        {activeTab === 'my-growth' && (
          <MyGrowthView
            profile={profile}
            careerTracks={careerTracks}
            exercises={communicationExercises}
            brandObservations={brandObservations}
            resources={resources}
            ideaCards={ideaCards}
            linkedInDrafts={linkedInDrafts}
            companionsEnabled={companionsEnabled}
          />
        )}
      </main>

      {/* Floating Quick Action AI Coach Trigger (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => handleOpenAICoachWithContext(`${activeTab.toUpperCase()} context`)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-ink-900 text-white font-bold text-xs sm:text-sm shadow-soft-lg hover:bg-cobalt-500 hover:scale-105 active:scale-95 transition-all"
        >
          <Bot className="w-4 h-4 text-cobalt-400" />
          <span className="hidden sm:inline">Ask AI Coach</span>
        </button>
      </div>

      {/* AI Coach Dialog Modal */}
      <AICoachModal
        isOpen={isAICoachOpen}
        onClose={() => setIsAICoachOpen(false)}
        profile={profile}
        currentContextHint={aiCoachContext}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSaveProfile={setProfile}
        onDataReset={() => {
          setProfile(StorageService.getProfile());
          setDailyWorkouts(StorageService.getWorkouts());
          setCareerTracks(StorageService.getTracks());
          setBrandObservations(StorageService.getBrands());
          setResources(StorageService.getResources());
          setMbaSubjects(StorageService.getMBASubjects());
          setAssignments(StorageService.getAssignments());
        }}
      />
    </div>
  );
};
