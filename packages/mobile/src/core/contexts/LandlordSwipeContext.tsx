import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AxiosResponse } from 'axios';
import { apiClient } from '../services/api';
import { landlordEvents, LANDLORD_EVENTS } from './LandlordEvents';

/**
 * LandlordSwipeContext - State management for landlord tenant swipe feature
 * 
 * Two-sided matching: Landlords swipe on tenant profiles
 * - Photo, work location, lifestyle tags, budget
 * - Match score: "82% Match - Works nearby, pet-friendly"
 * - Swipe right: "Interested" → Tenant notified
 * - Swipe left: "Not suitable"
 * - Mutual match = Unlock chat
 */

// API Response types
interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: any;
}

// Tenant card displayed in swipe feed
export interface TenantCard {
  tenantId: string;
  matchId: string;
  name: string;
  photo?: string;
  age?: number;
  
  // Work info
  workLocationName?: string;
  company?: string;
  occupationType?: string;
  
  // Budget
  budgetMin: number;
  budgetMax: number;
  
  // Income
  annualIncome?: number;
  
  // Lifestyle
  lifestyleTags: string[];
  
  // Match info
  matchScore: number;
  matchReason: string;
  matchHighlights: string[];
  
  // Property they're interested in
  property: {
    id: string;
    address: string;
    neighborhood: string;
    rent: number;
  };
  
  interestedAt: string;
  
  // Enhanced profile data
  isVerified: boolean;
  employmentVerified: boolean;
  incomeVerified: boolean;
  policeVerification: boolean;
  previousLandlordVerified: boolean;
  
  // Couple/Family info
  isCouple: boolean;
  partnerName?: string;
  familySize: number;
  hasChildren: boolean;
  
  // Location
  currentLocation?: string;
  
  // Rental preferences
  preferredMoveIn?: string;
  preferredLeaseMonths: number;
  lookingForDescription?: string;
  interestMessage?: string;
  
  // Rental history
  rentalHistory?: {
    landlordName: string;
    durationMonths: number;
    rating: number;
    review?: string;
    isVerified: boolean;
  };
}

// Swipe result
export interface SwipeResult {
  success: boolean;
  isMutualMatch: boolean;
  matchId: string;
  chatUnlocked?: boolean;
  message: string;
}

interface LandlordSwipeContextType {
  // State
  tenantFeed: TenantCard[];
  currentIndex: number;
  totalPending: number;
  
  // Loading states
  isLoadingFeed: boolean;
  isSwiping: boolean;
  
  // Actions
  loadTenantFeed: () => Promise<void>;
  swipeRight: (matchId: string) => Promise<SwipeResult | null>;
  swipeLeft: (matchId: string) => Promise<SwipeResult | null>;
  nextCard: () => void;
  resetFeed: () => void;
  
  // Current card
  currentCard: TenantCard | null;
  hasMoreCards: boolean;
  
  // Match state
  lastSwipeResult: SwipeResult | null;
  clearLastResult: () => void;
}

const LandlordSwipeContext = createContext<LandlordSwipeContextType | undefined>(undefined);

export const LandlordSwipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [tenantFeed, setTenantFeed] = useState<TenantCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [lastSwipeResult, setLastSwipeResult] = useState<SwipeResult | null>(null);
  
  // Loading states
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);

  /**
   * Load tenant swipe feed
   * Gets tenants who swiped right on landlord's properties
   */
  const loadTenantFeed = useCallback(async () => {
    setIsLoadingFeed(true);
    try {
      const response: AxiosResponse<ApiResponse> = await apiClient.get('/api/landlord/swipe/feed');
      const data = response.data?.data || response.data;
      
      if (data?.tenants) {
        setTenantFeed(data.tenants);
        setTotalPending(data.totalPending || data.tenants.length);
        setCurrentIndex(0);
        console.log('[LandlordSwipeContext] Loaded tenant feed:', data.tenants.length, 'tenants');
      }
    } catch (error) {
      console.error('[LandlordSwipeContext] Failed to load tenant feed:', error);
      setTenantFeed([]);
      setTotalPending(0);
    } finally {
      setIsLoadingFeed(false);
    }
  }, []);

  /**
   * Swipe right on a tenant (interested)
   * - Tenant gets notified
   * - If mutual match, chat is unlocked
   */
  const swipeRight = useCallback(async (matchId: string): Promise<SwipeResult | null> => {
    setIsSwiping(true);
    try {
      const response: AxiosResponse<ApiResponse> = await apiClient.post('/api/landlord/swipe', {
        matchId,
        direction: 'right',
      });
      
      const data = response.data?.data || response.data;
      
      const result: SwipeResult = {
        success: true,
        isMutualMatch: data.isMutualMatch || false,
        matchId: data.matchId || matchId,
        chatUnlocked: data.chatUnlocked || false,
        message: data.message || 'Interest recorded',
      };
      
      setLastSwipeResult(result);
      console.log('[LandlordSwipeContext] Swiped right:', result);
      
      // Remove from feed
      setTenantFeed(prev => prev.filter(t => t.matchId !== matchId));
      setTotalPending(prev => Math.max(0, prev - 1));
      
      // Emit events for cross-context communication
      landlordEvents.emit(LANDLORD_EVENTS.SWIPE_COMPLETED, { matchId, direction: 'right', result });
      landlordEvents.emit(LANDLORD_EVENTS.INTERESTED_TENANTS_CHANGED);
      landlordEvents.emit(LANDLORD_EVENTS.REFRESH_STATS);
      
      if (result.isMutualMatch) {
        landlordEvents.emit(LANDLORD_EVENTS.MUTUAL_MATCH_CREATED, { matchId });
        landlordEvents.emit(LANDLORD_EVENTS.MUTUAL_MATCHES_CHANGED);
      }
      
      return result;
    } catch (error: any) {
      console.error('[LandlordSwipeContext] Swipe right failed:', error);
      const errorResult: SwipeResult = {
        success: false,
        isMutualMatch: false,
        matchId,
        message: error.response?.data?.error?.message || 'Failed to record swipe',
      };
      setLastSwipeResult(errorResult);
      return errorResult;
    } finally {
      setIsSwiping(false);
    }
  }, []);

  /**
   * Swipe left on a tenant (not suitable)
   */
  const swipeLeft = useCallback(async (matchId: string): Promise<SwipeResult | null> => {
    setIsSwiping(true);
    try {
      const response: AxiosResponse<ApiResponse> = await apiClient.post('/api/landlord/swipe', {
        matchId,
        direction: 'left',
      });
      
      const data = response.data?.data || response.data;
      
      const result: SwipeResult = {
        success: true,
        isMutualMatch: false,
        matchId: data.matchId || matchId,
        message: data.message || 'Tenant declined',
      };
      
      setLastSwipeResult(result);
      console.log('[LandlordSwipeContext] Swiped left:', result);
      
      // Remove from feed
      setTenantFeed(prev => prev.filter(t => t.matchId !== matchId));
      setTotalPending(prev => Math.max(0, prev - 1));
      
      // Emit events for cross-context communication
      landlordEvents.emit(LANDLORD_EVENTS.SWIPE_COMPLETED, { matchId, direction: 'left', result });
      landlordEvents.emit(LANDLORD_EVENTS.INTERESTED_TENANTS_CHANGED);
      landlordEvents.emit(LANDLORD_EVENTS.REFRESH_STATS);
      
      return result;
    } catch (error: any) {
      console.error('[LandlordSwipeContext] Swipe left failed:', error);
      const errorResult: SwipeResult = {
        success: false,
        isMutualMatch: false,
        matchId,
        message: error.response?.data?.error?.message || 'Failed to record swipe',
      };
      setLastSwipeResult(errorResult);
      return errorResult;
    } finally {
      setIsSwiping(false);
    }
  }, []);

  /**
   * Move to next card in feed
   */
  const nextCard = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, tenantFeed.length));
  }, [tenantFeed.length]);

  /**
   * Reset feed and reload
   */
  const resetFeed = useCallback(() => {
    setTenantFeed([]);
    setCurrentIndex(0);
    setTotalPending(0);
    setLastSwipeResult(null);
  }, []);

  /**
   * Clear last swipe result
   */
  const clearLastResult = useCallback(() => {
    setLastSwipeResult(null);
  }, []);

  // Computed values
  const currentCard = currentIndex < tenantFeed.length ? tenantFeed[currentIndex] : null;
  const hasMoreCards = currentIndex < tenantFeed.length;

  const value: LandlordSwipeContextType = {
    // State
    tenantFeed,
    currentIndex,
    totalPending,
    
    // Loading states
    isLoadingFeed,
    isSwiping,
    
    // Actions
    loadTenantFeed,
    swipeRight,
    swipeLeft,
    nextCard,
    resetFeed,
    
    // Current card
    currentCard,
    hasMoreCards,
    
    // Match state
    lastSwipeResult,
    clearLastResult,
  };

  return (
    <LandlordSwipeContext.Provider value={value}>
      {children}
    </LandlordSwipeContext.Provider>
  );
};

/**
 * Hook to use landlord swipe context
 */
export const useLandlordSwipe = (): LandlordSwipeContextType => {
  const context = useContext(LandlordSwipeContext);
  if (context === undefined) {
    throw new Error('useLandlordSwipe must be used within a LandlordSwipeProvider');
  }
  return context;
};

/**
 * Format lifestyle tags for display
 */
export const formatLifestyleTag = (tag: string): string => {
  const tagLabels: Record<string, string> = {
    'pet_owner_dog': '🐕 Dog Owner',
    'pet_owner_cat': '🐱 Cat Owner',
    'sunlight_lover': '☀️ Loves Sunlight',
    'quiet_mornings': '🌅 Early Riser',
    'gym_nearby': '💪 Fitness Enthusiast',
    'cook_frequently': '👨‍🍳 Home Cook',
    'nightlife': '🌙 Night Owl',
    'wfh_heavy': '💻 Works from Home',
    'non_smoker': '🚭 Non-Smoker',
  };
  return tagLabels[tag] || tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Format occupation type for display
 */
export const formatOccupationType = (type: string): string => {
  const occupationLabels: Record<string, string> = {
    'it_professional': 'IT Professional',
    'student': 'Student',
    'healthcare': 'Healthcare',
    'freelancer': 'Freelancer',
    'creative': 'Creative Professional',
    'corporate': 'Corporate Employee',
    'startup': 'Startup Employee',
    'doctor': 'Doctor',
    'teacher': 'Teacher',
    'government': 'Government Employee',
  };
  return occupationLabels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Format budget range for display
 */
export const formatBudgetRange = (min: number, max: number): string => {
  const formatK = (n: number) => n >= 1000 ? `₹${(n/1000).toFixed(0)}K` : `₹${n}`;
  return `${formatK(min)} - ${formatK(max)}`;
};

/**
 * Format annual income for display
 */
export const formatAnnualIncome = (income: number): string => {
  if (income >= 10000000) {
    return `₹${(income / 10000000).toFixed(1)}Cr/year`;
  } else if (income >= 100000) {
    return `₹${(income / 100000).toFixed(1)}L/year`;
  } else {
    return `₹${income.toLocaleString('en-IN')}/year`;
  }
};

/**
 * Format move-in date for display
 */
export const formatMoveInDate = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

/**
 * Format lease duration for display
 */
export const formatLeaseDuration = (months: number): string => {
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    }
    return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  }
  return `${months} month${months > 1 ? 's' : ''}`;
};

/**
 * Get verification status count
 */
export const getVerificationCount = (card: TenantCard): number => {
  let count = 0;
  if (card.employmentVerified) count++;
  if (card.incomeVerified) count++;
  if (card.policeVerification) count++;
  if (card.previousLandlordVerified) count++;
  return count;
};

export default LandlordSwipeContext;
