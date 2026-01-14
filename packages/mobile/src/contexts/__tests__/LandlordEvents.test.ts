/**
 * LandlordEvents Tests
 * 
 * Tests for the event emitter that enables cross-context communication
 * between LandlordSwipeContext and LandlordContext
 */

import { LandlordEventEmitter, landlordEvents, LANDLORD_EVENTS } from '../LandlordEvents';

describe('LandlordEvents', () => {
  describe('LandlordEventEmitter', () => {
    let emitter: LandlordEventEmitter;

    beforeEach(() => {
      emitter = new LandlordEventEmitter();
    });

    afterEach(() => {
      emitter.clear();
    });

    describe('on', () => {
      it('should register a listener for an event', () => {
        const listener = jest.fn();
        emitter.on(LANDLORD_EVENTS.SWIPE_COMPLETED, listener);
        
        emitter.emit(LANDLORD_EVENTS.SWIPE_COMPLETED, { tenantId: '123' });
        
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ tenantId: '123' });
      });

      it('should allow multiple listeners for the same event', () => {
        const listener1 = jest.fn();
        const listener2 = jest.fn();
        
        emitter.on(LANDLORD_EVENTS.SWIPE_COMPLETED, listener1);
        emitter.on(LANDLORD_EVENTS.SWIPE_COMPLETED, listener2);
        
        emitter.emit(LANDLORD_EVENTS.SWIPE_COMPLETED, { tenantId: '123' });
        
        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledTimes(1);
      });

      it('should return an unsubscribe function', () => {
        const listener = jest.fn();
        const unsubscribe = emitter.on(LANDLORD_EVENTS.SWIPE_COMPLETED, listener);
        
        // First emit - listener should be called
        emitter.emit(LANDLORD_EVENTS.SWIPE_COMPLETED, {});
        expect(listener).toHaveBeenCalledTimes(1);
        
        // Unsubscribe
        unsubscribe();
        
        // Second emit - listener should NOT be called
        emitter.emit(LANDLORD_EVENTS.SWIPE_COMPLETED, {});
        expect(listener).toHaveBeenCalledTimes(1);
      });
    });

    describe('emit', () => {
      it('should pass data to all listeners', () => {
        const listener = jest.fn();
        const testData = { tenantId: '123', propertyId: '456', isMutualMatch: true };
        
        emitter.on(LANDLORD_EVENTS.MUTUAL_MATCH_CREATED, listener);
        emitter.emit(LANDLORD_EVENTS.MUTUAL_MATCH_CREATED, testData);
        
        expect(listener).toHaveBeenCalledWith(testData);
      });

      it('should not throw when emitting to non-existent event', () => {
        expect(() => {
          emitter.emit('NON_EXISTENT_EVENT' as any, {});
        }).not.toThrow();
      });

      it('should emit without data', () => {
        const listener = jest.fn();
        
        emitter.on(LANDLORD_EVENTS.REFRESH_STATS, listener);
        emitter.emit(LANDLORD_EVENTS.REFRESH_STATS);
        
        expect(listener).toHaveBeenCalledTimes(1);
        // Called with no arguments
        expect(listener.mock.calls[0]).toHaveLength(0);
      });
    });

    describe('off', () => {
      it('should remove a specific listener', () => {
        const listener1 = jest.fn();
        const listener2 = jest.fn();
        
        emitter.on(LANDLORD_EVENTS.SWIPE_COMPLETED, listener1);
        emitter.on(LANDLORD_EVENTS.SWIPE_COMPLETED, listener2);
        
        emitter.off(LANDLORD_EVENTS.SWIPE_COMPLETED, listener1);
        emitter.emit(LANDLORD_EVENTS.SWIPE_COMPLETED, {});
        
        expect(listener1).not.toHaveBeenCalled();
        expect(listener2).toHaveBeenCalledTimes(1);
      });

      it('should handle removing non-existent listener gracefully', () => {
        const listener = jest.fn();
        
        expect(() => {
          emitter.off(LANDLORD_EVENTS.SWIPE_COMPLETED, listener);
        }).not.toThrow();
      });
    });

    describe('clear', () => {
      it('should remove all listeners for all events', () => {
        const listener1 = jest.fn();
        const listener2 = jest.fn();
        
        emitter.on(LANDLORD_EVENTS.SWIPE_COMPLETED, listener1);
        emitter.on(LANDLORD_EVENTS.REFRESH_STATS, listener2);
        
        emitter.clear();
        
        emitter.emit(LANDLORD_EVENTS.SWIPE_COMPLETED, {});
        emitter.emit(LANDLORD_EVENTS.REFRESH_STATS, {});
        
        expect(listener1).not.toHaveBeenCalled();
        expect(listener2).not.toHaveBeenCalled();
      });
    });
  });

  describe('LANDLORD_EVENTS', () => {
    it('should have all required event constants', () => {
      expect(LANDLORD_EVENTS.SWIPE_COMPLETED).toBe('swipe_completed');
      expect(LANDLORD_EVENTS.MUTUAL_MATCH_CREATED).toBe('mutual_match_created');
      expect(LANDLORD_EVENTS.REFRESH_STATS).toBe('refresh_stats');
      expect(LANDLORD_EVENTS.INTERESTED_TENANTS_CHANGED).toBe('interested_tenants_changed');
      expect(LANDLORD_EVENTS.MUTUAL_MATCHES_CHANGED).toBe('mutual_matches_changed');
    });
  });

  describe('landlordEvents singleton', () => {
    beforeEach(() => {
      // Clear the singleton before each test to avoid interference
      landlordEvents.clear();
    });

    it('should be a shared instance', () => {
      const listener = jest.fn();
      
      landlordEvents.on(LANDLORD_EVENTS.SWIPE_COMPLETED, listener);
      landlordEvents.emit(LANDLORD_EVENTS.SWIPE_COMPLETED, { test: true });
      
      expect(listener).toHaveBeenCalledWith({ test: true });
    });

    it('should support cross-module communication', () => {
      // Simulate LandlordContext subscribing
      const statsRefreshHandler = jest.fn();
      const interestedHandler = jest.fn();
      const mutualHandler = jest.fn();
      
      landlordEvents.on(LANDLORD_EVENTS.REFRESH_STATS, statsRefreshHandler);
      landlordEvents.on(LANDLORD_EVENTS.INTERESTED_TENANTS_CHANGED, interestedHandler);
      landlordEvents.on(LANDLORD_EVENTS.MUTUAL_MATCHES_CHANGED, mutualHandler);
      
      // Simulate LandlordSwipeContext emitting on swipe right (mutual match)
      landlordEvents.emit(LANDLORD_EVENTS.SWIPE_COMPLETED, { tenantId: '123', direction: 'right' });
      landlordEvents.emit(LANDLORD_EVENTS.MUTUAL_MATCH_CREATED, { tenantId: '123', matchId: '456' });
      landlordEvents.emit(LANDLORD_EVENTS.INTERESTED_TENANTS_CHANGED);
      landlordEvents.emit(LANDLORD_EVENTS.MUTUAL_MATCHES_CHANGED);
      landlordEvents.emit(LANDLORD_EVENTS.REFRESH_STATS);
      
      expect(statsRefreshHandler).toHaveBeenCalledTimes(1);
      expect(interestedHandler).toHaveBeenCalledTimes(1);
      expect(mutualHandler).toHaveBeenCalledTimes(1);
    });

    it('should support cleanup on component unmount pattern', () => {
      const handler = jest.fn();
      
      // Simulate useEffect setup
      const unsubscribe = landlordEvents.on(LANDLORD_EVENTS.REFRESH_STATS, handler);
      
      // First emit works
      landlordEvents.emit(LANDLORD_EVENTS.REFRESH_STATS);
      expect(handler).toHaveBeenCalledTimes(1);
      
      // Simulate useEffect cleanup (component unmount)
      unsubscribe();
      
      // Subsequent emit should not call handler
      landlordEvents.emit(LANDLORD_EVENTS.REFRESH_STATS);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
