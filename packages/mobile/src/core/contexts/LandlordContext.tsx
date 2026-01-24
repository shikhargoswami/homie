import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { AxiosResponse } from 'axios';
import { apiClient } from '../services/api';
import { landlordEvents, LANDLORD_EVENTS } from './LandlordEvents';

// API Response types
interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: any;
}

/**
 * LandlordContext - Centralized state management for landlord flow
 * 
 * Manages:
 * - Dashboard statistics
 * - Interested tenants (matches needing response)
 * - Mutual matches (both parties swiped right)
 * - Pending viewing requests
 * - Properties list
 */

// Types
export interface DashboardStats {
  activeListings: number;
  rentedProperties: number;
  totalMatches: number;
  interestedTenants: number;
  totalTenantLikes: number;
  pendingViewings: number;
  confirmedViewings: number;
  responseRate: number;
}

export interface InterestedTenant {
  id: string;
  matchId: string;
  tenant: {
    id: string;
    name: string;
    phone?: string;
    photo?: string;
    occupation?: string;
    age?: number;
  };
  property: {
    id: string;
    address: string;
    neighborhood: string;
    rent?: number;
  };
  matchedAt: string;
  matchScore?: number;
}

export interface MutualMatch {
  id: string;
  tenant: {
    id: string;
    name: string;
    phone?: string;
    photo?: string;
  };
  property: {
    id: string;
    address: string;
    neighborhood: string;
  };
  matchedAt: string;
  hasConversation: boolean;
}

export interface ViewingRequest {
  id: string;
  date: string | null;
  time: string | null;
  status: string;
  notes?: string;
  property: {
    id: string;
    address: string;
    neighborhood: string;
  };
  tenant: {
    id: string;
    name: string;
    photo?: string;
  };
}

export interface Property {
  id: string;
  address: string;
  neighborhood: string;
  city: string;
  configuration: string;
  rent: number;
  status: string;
  photos?: string[];
}

interface LandlordContextType {
  // State
  stats: DashboardStats | null;
  interestedTenants: InterestedTenant[];
  mutualMatches: MutualMatch[];
  viewingRequests: ViewingRequest[];
  properties: Property[];
  
  // Loading states
  isLoadingStats: boolean;
  isLoadingInterestedTenants: boolean;
  isLoadingMutualMatches: boolean;
  isLoadingViewings: boolean;
  isLoadingProperties: boolean;
  
  // Actions
  refreshStats: () => Promise<void>;
  refreshInterestedTenants: () => Promise<void>;
  refreshMutualMatches: () => Promise<void>;
  refreshViewingRequests: () => Promise<void>;
  refreshProperties: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Match actions
  acceptTenant: (matchId: string) => Promise<boolean>;
  declineTenant: (matchId: string) => Promise<boolean>;
  
  // Viewing actions
  respondToViewing: (viewingId: string, accept: boolean, counterTime?: string) => Promise<boolean>;
}

const defaultStats: DashboardStats = {
  activeListings: 0,
  rentedProperties: 0,
  totalMatches: 0,
  interestedTenants: 0,
  totalTenantLikes: 0,
  pendingViewings: 0,
  confirmedViewings: 0,
  responseRate: 0,
};

const LandlordContext = createContext<LandlordContextType | undefined>(undefined);

export const LandlordProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [interestedTenants, setInterestedTenants] = useState<InterestedTenant[]>([]);
  const [mutualMatches, setMutualMatches] = useState<MutualMatch[]>([]);
  const [viewingRequests, setViewingRequests] = useState<ViewingRequest[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  
  // Loading states
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingInterestedTenants, setIsLoadingInterestedTenants] = useState(false);
  const [isLoadingMutualMatches, setIsLoadingMutualMatches] = useState(false);
  const [isLoadingViewings, setIsLoadingViewings] = useState(false);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);

  /**
   * Refresh dashboard statistics
   */
  const refreshStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const response: AxiosResponse<ApiResponse> = await apiClient.get('/api/landlord/stats');
      const data = response.data?.data || response.data;
      
      if (data) {
        setStats({
          activeListings: data.activeListings || 0,
          rentedProperties: data.rentedProperties || 0,
          totalMatches: data.totalMatches || 0,
          interestedTenants: data.interestedTenants || 0,
          totalTenantLikes: data.totalTenantLikes || 0,
          pendingViewings: data.pendingViewings || 0,
          confirmedViewings: data.confirmedViewings || 0,
          responseRate: data.responseRate || 0,
        });
        console.log('[LandlordContext] Stats refreshed:', data);
      }
    } catch (error) {
      console.error('[LandlordContext] Failed to refresh stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  /**
   * Refresh interested tenants (matches where landlord hasn't responded)
   */
  const refreshInterestedTenants = useCallback(async () => {
    setIsLoadingInterestedTenants(true);
    try {
      const response: AxiosResponse<ApiResponse> = await apiClient.get('/api/matches/interested-tenants');
      const data = response.data?.data || response.data;
      
      // API returns { tenants: [...] } not { matches: [...] }
      const tenantsArray = data?.tenants || data?.matches || [];
      if (tenantsArray.length > 0 || data?.tenants) {
        const tenants = tenantsArray.map((m: any) => ({
          id: m.matchId || m.id,
          matchId: m.matchId || m.id,
          tenant: {
            id: m.tenant?.id || m.tenantId,
            name: m.tenant?.name || 'Unknown',
            phone: m.tenant?.phone,
            photo: m.tenant?.photo,
            occupation: m.tenant?.employment || m.tenant?.occupation,
            company: m.tenant?.company,
            age: m.tenant?.age,
          },
          property: {
            id: m.property?.id || m.propertyId,
            address: m.property?.address || '',
            neighborhood: m.property?.neighborhood || '',
            rent: m.property?.rent,
            configuration: m.property?.configuration,
          },
          matchedAt: m.interestedAt || m.matchedAt || m.created_at,
          matchScore: m.matchScore,
        }));
        setInterestedTenants(tenants);
        console.log('[LandlordContext] Interested tenants refreshed:', tenants.length);
      } else {
        setInterestedTenants([]);
        console.log('[LandlordContext] No interested tenants found');
      }
    } catch (error) {
      console.error('[LandlordContext] Failed to refresh interested tenants:', error);
    } finally {
      setIsLoadingInterestedTenants(false);
    }
  }, []);

  /**
   * Refresh mutual matches (both parties swiped right)
   */
  const refreshMutualMatches = useCallback(async () => {
    setIsLoadingMutualMatches(true);
    try {
      const response: AxiosResponse<ApiResponse> = await apiClient.get('/api/matches/mutual');
      const data = response.data?.data || response.data;
      
      if (data?.matches) {
        const matches = data.matches.map((m: any) => ({
          id: m.id,
          tenant: {
            id: m.tenant?.id || m.tenant_id || m.tenantId,
            name: m.tenant?.name || m.tenant_name || m.tenantName || 'Unknown',
            phone: m.tenant?.phone || m.tenant_phone,
            photo: m.tenant?.photo,
          },
          property: {
            id: m.property?.id || m.property_id || m.propertyId,
            address: m.property?.address || m.address || m.propertyAddress || '',
            neighborhood: m.property?.neighborhood || m.neighborhood || '',
          },
          matchedAt: m.matchedAt || m.updated_at || m.created_at,
          hasConversation: m.hasConversation || false,
        }));
        setMutualMatches(matches);
        console.log('[LandlordContext] Mutual matches refreshed:', matches.length);
      }
    } catch (error) {
      console.error('[LandlordContext] Failed to refresh mutual matches:', error);
    } finally {
      setIsLoadingMutualMatches(false);
    }
  }, []);

  /**
   * Refresh pending viewing requests
   */
  const refreshViewingRequests = useCallback(async () => {
    setIsLoadingViewings(true);
    try {
      const response: AxiosResponse<ApiResponse> = await apiClient.get('/api/landlord/pending-requests');
      const data = response.data?.data || response.data;
      
      if (data?.requests) {
        setViewingRequests(data.requests);
        console.log('[LandlordContext] Viewing requests refreshed:', data.requests.length);
      }
    } catch (error) {
      console.error('[LandlordContext] Failed to refresh viewing requests:', error);
    } finally {
      setIsLoadingViewings(false);
    }
  }, []);

  /**
   * Refresh landlord's properties
   */
  const refreshProperties = useCallback(async () => {
    setIsLoadingProperties(true);
    try {
      const response: AxiosResponse<ApiResponse> = await apiClient.get('/api/landlord/properties');
      const data = response.data?.data || response.data;
      
      if (data?.properties || Array.isArray(data)) {
        const props = data.properties || data;
        setProperties(props);
        console.log('[LandlordContext] Properties refreshed:', props.length);
      }
    } catch (error) {
      console.error('[LandlordContext] Failed to refresh properties:', error);
    } finally {
      setIsLoadingProperties(false);
    }
  }, []);

  /**
   * Refresh all data
   */
  const refreshAll = useCallback(async () => {
    console.log('[LandlordContext] Refreshing all data...');
    await Promise.all([
      refreshStats(),
      refreshInterestedTenants(),
      refreshMutualMatches(),
      refreshViewingRequests(),
      refreshProperties(),
    ]);
    console.log('[LandlordContext] All data refreshed');
  }, [refreshStats, refreshInterestedTenants, refreshMutualMatches, refreshViewingRequests, refreshProperties]);

  /**
   * Listen for events from LandlordSwipeContext
   * This enables real-time updates across all landlord screens
   */
  useEffect(() => {
    console.log('[LandlordContext] Setting up event listeners');
    
    // Subscribe to stats refresh events
    const unsubscribeStats = landlordEvents.on(LANDLORD_EVENTS.REFRESH_STATS, () => {
      console.log('[LandlordContext] Received REFRESH_STATS event');
      refreshStats();
    });
    
    // Subscribe to interested tenants changes
    const unsubscribeInterested = landlordEvents.on(LANDLORD_EVENTS.INTERESTED_TENANTS_CHANGED, () => {
      console.log('[LandlordContext] Received INTERESTED_TENANTS_CHANGED event');
      refreshInterestedTenants();
    });
    
    // Subscribe to mutual matches changes
    const unsubscribeMutual = landlordEvents.on(LANDLORD_EVENTS.MUTUAL_MATCHES_CHANGED, () => {
      console.log('[LandlordContext] Received MUTUAL_MATCHES_CHANGED event');
      refreshMutualMatches();
    });
    
    // Cleanup on unmount
    return () => {
      console.log('[LandlordContext] Cleaning up event listeners');
      unsubscribeStats();
      unsubscribeInterested();
      unsubscribeMutual();
    };
  }, [refreshStats, refreshInterestedTenants, refreshMutualMatches]);

  /**
   * Accept an interested tenant (create mutual match)
   */
  const acceptTenant = useCallback(async (matchId: string): Promise<boolean> => {
    try {
      console.log('[LandlordContext] Accepting tenant for match:', matchId);
      const response: AxiosResponse<ApiResponse> = await apiClient.post(`/api/matches/${matchId}/respond`, {
        action: 'accept',
      });
      
      if (response.data?.success !== false) {
        // Remove from interested, add to mutual
        const acceptedTenant = interestedTenants.find(t => t.matchId === matchId);
        if (acceptedTenant) {
          setInterestedTenants(prev => prev.filter(t => t.matchId !== matchId));
          setMutualMatches(prev => [...prev, {
            id: acceptedTenant.matchId,
            tenant: acceptedTenant.tenant,
            property: acceptedTenant.property,
            matchedAt: new Date().toISOString(),
            hasConversation: false,
          }]);
        }
        
        // Refresh stats
        await refreshStats();
        console.log('[LandlordContext] Tenant accepted successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[LandlordContext] Failed to accept tenant:', error);
      return false;
    }
  }, [interestedTenants, refreshStats]);

  /**
   * Decline an interested tenant
   */
  const declineTenant = useCallback(async (matchId: string): Promise<boolean> => {
    try {
      console.log('[LandlordContext] Declining tenant for match:', matchId);
      const response: AxiosResponse<ApiResponse> = await apiClient.post(`/api/matches/${matchId}/respond`, {
        action: 'decline',
      });
      
      if (response.data?.success !== false) {
        // Remove from interested tenants
        setInterestedTenants(prev => prev.filter(t => t.matchId !== matchId));
        
        // Refresh stats
        await refreshStats();
        console.log('[LandlordContext] Tenant declined successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[LandlordContext] Failed to decline tenant:', error);
      return false;
    }
  }, [refreshStats]);

  /**
   * Respond to a viewing request
   */
  const respondToViewing = useCallback(async (
    viewingId: string, 
    accept: boolean, 
    counterTime?: string
  ): Promise<boolean> => {
    try {
      console.log('[LandlordContext] Responding to viewing:', viewingId, accept ? 'accept' : 'decline');
      const response: AxiosResponse<ApiResponse> = await apiClient.patch(`/api/viewings/${viewingId}/respond`, {
        action: accept ? 'confirm' : 'cancel',
        counterDatetime: counterTime,
      });
      
      if (response.data?.success !== false) {
        // Remove from pending
        setViewingRequests(prev => prev.filter(v => v.id !== viewingId));
        
        // Refresh stats
        await refreshStats();
        console.log('[LandlordContext] Viewing response recorded');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[LandlordContext] Failed to respond to viewing:', error);
      return false;
    }
  }, [refreshStats]);

  const value: LandlordContextType = {
    // State
    stats,
    interestedTenants,
    mutualMatches,
    viewingRequests,
    properties,
    
    // Loading states
    isLoadingStats,
    isLoadingInterestedTenants,
    isLoadingMutualMatches,
    isLoadingViewings,
    isLoadingProperties,
    
    // Actions
    refreshStats,
    refreshInterestedTenants,
    refreshMutualMatches,
    refreshViewingRequests,
    refreshProperties,
    refreshAll,
    
    // Match actions
    acceptTenant,
    declineTenant,
    
    // Viewing actions
    respondToViewing,
  };

  return (
    <LandlordContext.Provider value={value}>
      {children}
    </LandlordContext.Provider>
  );
};

/**
 * Hook to use landlord context
 */
export const useLandlord = (): LandlordContextType => {
  const context = useContext(LandlordContext);
  if (context === undefined) {
    throw new Error('useLandlord must be used within a LandlordProvider');
  }
  return context;
};

export default LandlordContext;
