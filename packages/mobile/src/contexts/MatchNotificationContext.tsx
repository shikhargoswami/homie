/**
 * Match Notification Context
 * 
 * Provides global state for match notifications and badge animations.
 * Used to trigger UI effects when a new match occurs:
 * - Bottom tab badge pop animation
 * - Badge count increment
 * - Celebration effects
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { appEvents, AppEventTypes } from '../utils/appEvents';

interface MatchNotification {
  id: string;
  propertyTitle: string;
  landlordName?: string;
  timestamp: Date;
}

interface MatchNotificationContextType {
  // Match count for badge
  newMatchCount: number;
  
  // Animation values for bottom tab
  matchBadgeScale: Animated.Value;
  matchBadgeRotate: Animated.Value;
  
  // Trigger a new match notification
  notifyNewMatch: (notification: Omit<MatchNotification, 'timestamp'>) => void;
  
  // Clear match count (when user views matches)
  clearMatchCount: () => void;
  
  // Recent match for celebration modal
  recentMatch: MatchNotification | null;
  clearRecentMatch: () => void;
  
  // Message badge
  newMessageCount: number;
  incrementMessageCount: () => void;
  clearMessageCount: () => void;
  messageBadgeScale: Animated.Value;
  
  // Generic badge pulse for any tab
  pulseTab: (tabName: string) => void;
  getTabPulseAnim: (tabName: string) => Animated.Value;
}

const MatchNotificationContext = createContext<MatchNotificationContextType | undefined>(undefined);

export const MatchNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [newMatchCount, setNewMatchCount] = useState(0);
  const [recentMatch, setRecentMatch] = useState<MatchNotification | null>(null);
  const [newMessageCount, setNewMessageCount] = useState(0);
  
  // Animation values
  const matchBadgeScale = useRef(new Animated.Value(1)).current;
  const matchBadgeRotate = useRef(new Animated.Value(0)).current;
  const messageBadgeScale = useRef(new Animated.Value(1)).current;
  
  // Tab pulse animations
  const tabPulseAnims = useRef<Record<string, Animated.Value>>({
    Explore: new Animated.Value(1),
    Messages: new Animated.Value(1),
    Matches: new Animated.Value(1),
    Profile: new Animated.Value(1),
    Dashboard: new Animated.Value(1),
    Properties: new Animated.Value(1),
  }).current;

  const runBadgeAnimation = useCallback((scaleAnim: Animated.Value, rotateAnim?: Animated.Value) => {
    // Reset values
    scaleAnim.setValue(1);
    if (rotateAnim) rotateAnim.setValue(0);

    // Create bounce + wiggle animation
    const animations = [
      // Pop up
      Animated.spring(scaleAnim, {
        toValue: 1.5,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
      // Settle down with slight overshoot
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
    ];

    if (rotateAnim) {
      // Add wiggle effect
      animations.push(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 50,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -1,
            duration: 100,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 50,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );
    }

    Animated.parallel(animations).start();
  }, []);

  const pulseTab = useCallback((tabName: string) => {
    const anim = tabPulseAnims[tabName];
    if (!anim) return;

    anim.setValue(1);
    
    Animated.sequence([
      // Pop up
      Animated.spring(anim, {
        toValue: 1.3,
        friction: 3,
        tension: 300,
        useNativeDriver: true,
      }),
      // Settle
      Animated.spring(anim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [tabPulseAnims]);

  const getTabPulseAnim = useCallback((tabName: string): Animated.Value => {
    if (!tabPulseAnims[tabName]) {
      tabPulseAnims[tabName] = new Animated.Value(1);
    }
    return tabPulseAnims[tabName];
  }, [tabPulseAnims]);

  const notifyNewMatch = useCallback((notification: Omit<MatchNotification, 'timestamp'>) => {
    const fullNotification: MatchNotification = {
      ...notification,
      timestamp: new Date(),
    };
    
    setNewMatchCount(prev => prev + 1);
    setRecentMatch(fullNotification);
    
    // Trigger badge animation
    runBadgeAnimation(matchBadgeScale, matchBadgeRotate);
    
    // Also pulse the Matches tab
    pulseTab('Matches');
  }, [runBadgeAnimation, matchBadgeScale, matchBadgeRotate, pulseTab]);

  const clearMatchCount = useCallback(() => {
    setNewMatchCount(0);
  }, []);

  const clearRecentMatch = useCallback(() => {
    setRecentMatch(null);
  }, []);

  const incrementMessageCount = useCallback(() => {
    setNewMessageCount(prev => prev + 1);
    runBadgeAnimation(messageBadgeScale);
    pulseTab('Messages');
  }, [runBadgeAnimation, messageBadgeScale, pulseTab]);

  const clearMessageCount = useCallback(() => {
    setNewMessageCount(0);
  }, []);

  // Listen for app events from other contexts
  useEffect(() => {
    const unsubMessage = appEvents.on(AppEventTypes.NEW_MESSAGE, () => {
      incrementMessageCount();
    });

    return () => {
      unsubMessage();
    };
  }, [incrementMessageCount]);

  return (
    <MatchNotificationContext.Provider
      value={{
        newMatchCount,
        matchBadgeScale,
        matchBadgeRotate,
        notifyNewMatch,
        clearMatchCount,
        recentMatch,
        clearRecentMatch,
        newMessageCount,
        incrementMessageCount,
        clearMessageCount,
        messageBadgeScale,
        pulseTab,
        getTabPulseAnim,
      }}
    >
      {children}
    </MatchNotificationContext.Provider>
  );
};

export const useMatchNotification = (): MatchNotificationContextType => {
  const context = useContext(MatchNotificationContext);
  if (!context) {
    throw new Error('useMatchNotification must be used within a MatchNotificationProvider');
  }
  return context;
};

export default MatchNotificationContext;
