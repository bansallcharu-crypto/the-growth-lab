type CompanionEventType = 'activity_completed' | 'note_saved' | 'resource_completed' | 'milestone_reached';

type Listener = (type: CompanionEventType, details?: any) => void;

class CompanionEventManager {
  private listeners: Listener[] = [];

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify(type: CompanionEventType, details?: any): void {
    this.listeners.forEach((l) => {
      try {
        l(type, details);
      } catch (e) {
        console.error('Companion event error:', e);
      }
    });
  }

  activityCompleted(title?: string): void {
    this.notify('activity_completed', { title });
  }

  noteSaved(source?: string): void {
    this.notify('note_saved', { source });
  }

  resourceCompleted(resourceId?: string): void {
    this.notify('resource_completed', { resourceId });
  }

  milestoneReached(milestone?: string): void {
    this.notify('milestone_reached', { milestone });
  }
}

export const companionEvents = new CompanionEventManager();