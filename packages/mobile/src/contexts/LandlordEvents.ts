/**
 * LandlordEvents - Simple event emitter for cross-context communication
 * 
 * Used to notify the LandlordContext when swipe actions happen in LandlordSwipeContext
 * This allows the dashboard to update stats in real-time when tenants are swiped.
 */

type EventCallback = (...args: any[]) => void;

export class LandlordEventEmitter {
  private listeners: Map<string, EventCallback[]> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`[LandlordEvents] Error in listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Remove a specific listener or all listeners for an event
   */
  off(event: string, callback?: EventCallback): void {
    if (callback) {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    } else {
      this.listeners.delete(event);
    }
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
  }
}

// Singleton instance
export const landlordEvents = new LandlordEventEmitter();

// Event types
export const LANDLORD_EVENTS = {
  // Fired when a swipe action is completed (right or left)
  SWIPE_COMPLETED: 'swipe_completed',
  // Fired when a mutual match is created
  MUTUAL_MATCH_CREATED: 'mutual_match_created',
  // Fired when stats need to be refreshed
  REFRESH_STATS: 'refresh_stats',
  // Fired when interested tenants list changes
  INTERESTED_TENANTS_CHANGED: 'interested_tenants_changed',
  // Fired when mutual matches list changes
  MUTUAL_MATCHES_CHANGED: 'mutual_matches_changed',
};

export default landlordEvents;
