/**
 * App Events - Cross-context Event Emitter
 * 
 * Used to communicate between contexts that can't directly
 * access each other (like ChatContext -> MatchNotificationContext)
 */

type EventCallback = (...args: any[]) => void;

class AppEventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event: string, ...args: any[]) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`[AppEvents] Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  off(event: string, callback?: EventCallback) {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
    } else {
      this.listeners.delete(event);
    }
  }
}

// Singleton instance
export const appEvents = new AppEventEmitter();

// Event types
export const AppEventTypes = {
  NEW_MESSAGE: 'new_message',
  NEW_MATCH: 'new_match',
  VIEWING_SCHEDULED: 'viewing_scheduled',
  VIEWING_CONFIRMED: 'viewing_confirmed',
  PROPERTY_ADDED: 'property_added',
} as const;

export default appEvents;
