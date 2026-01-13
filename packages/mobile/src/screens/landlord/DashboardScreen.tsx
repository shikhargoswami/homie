import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '@services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Landlord Dashboard Screen
 * 
 * Shows:
 * - Property statistics
 * - Pending tenant requests
 * - Recent matches
 * - Quick actions
 */

interface DashboardStats {
  totalProperties: number;
  activeListings: number;
  pendingRequests: number;
  totalMatches: number;
  viewingsThisWeek: number;
  responseRate: number;
}

interface PendingRequest {
  id: string;
  tenantName: string;
  tenantPhone: string;
  propertyTitle: string;
  propertyId: string;
  requestedAt: string;
  type: 'viewing' | 'application';
}

interface RecentMatch {
  id: string;
  tenantName: string;
  propertyTitle: string;
  matchedAt: string;
  hasUnreadMessages: boolean;
}

interface Props {
  navigation: any;
}

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeListings: 0,
    pendingRequests: 0,
    totalMatches: 0,
    viewingsThisWeek: 0,
    responseRate: 0,
  });
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);

  const loadDashboardData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    
    try {
      const [statsRes, requestsRes, matchesRes] = await Promise.all([
        apiClient.get('/api/landlord/stats'),
        apiClient.get('/api/landlord/pending-requests'),
        apiClient.get('/api/landlord/recent-matches'),
      ]);

      if (statsRes.data?.success && statsRes.data?.data) {
        // Map API response to expected stats format
        const apiStats = statsRes.data.data;
        setStats({
          totalProperties: (apiStats.activeListings || 0) + (apiStats.rentedProperties || 0),
          activeListings: apiStats.activeListings || 0,
          pendingRequests: apiStats.pendingViewings || 0,
          totalMatches: apiStats.totalMatches || 0,
          viewingsThisWeek: apiStats.confirmedViewings || 0,
          responseRate: apiStats.responseRate || 0,
        });
      }
      if (requestsRes.data?.success) setPendingRequests(requestsRes.data.data?.requests || []);
      if (matchesRes.data?.success) setRecentMatches(matchesRes.data.data?.matches || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Use mock data for demo
      setStats({
        totalProperties: 3,
        activeListings: 2,
        pendingRequests: 5,
        totalMatches: 12,
        viewingsThisWeek: 3,
        responseRate: 85,
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = () => loadDashboardData(true);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.headerTitle}>Landlord Dashboard</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => Alert.alert('Coming Soon', 'Notifications feature is coming soon!')}
        >
          <Ionicons name="notifications-outline" size={24} color="#1a1a1a" />
          {stats.pendingRequests > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{stats.pendingRequests}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="home-outline" size={24} color="#6366f1" />
            <Text style={styles.statValue}>{stats.activeListings}</Text>
            <Text style={styles.statLabel}>Active Listings</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="time-outline" size={24} color="#D97706" />
            <Text style={styles.statValue}>{stats.pendingRequests}</Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="heart-outline" size={24} color="#059669" />
            <Text style={styles.statValue}>{stats.totalMatches}</Text>
            <Text style={styles.statLabel}>Total Matches</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#FCE7F3' }]}>
            <Ionicons name="calendar-outline" size={24} color="#DB2777" />
            <Text style={styles.statValue}>{stats.viewingsThisWeek}</Text>
            <Text style={styles.statLabel}>Viewings This Week</Text>
          </View>
        </View>

        {/* Response Rate */}
        <View style={styles.responseRateCard}>
          <View style={styles.responseRateHeader}>
            <Text style={styles.responseRateTitle}>Response Rate</Text>
            <Text style={styles.responseRateValue}>{stats.responseRate}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${stats.responseRate}%` }]} />
          </View>
          <Text style={styles.responseRateHint}>
            Respond quickly to tenant inquiries to improve your visibility
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AddProperty')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="add-circle-outline" size={24} color="#6366f1" />
              </View>
              <Text style={styles.actionText}>Add Property</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('MyProperties')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="list-outline" size={24} color="#059669" />
              </View>
              <Text style={styles.actionText}>My Properties</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Viewings')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="calendar-outline" size={24} color="#D97706" />
              </View>
              <Text style={styles.actionText}>Viewings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Requests</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Requests')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {pendingRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#ddd" />
              <Text style={styles.emptyText}>No pending requests</Text>
            </View>
          ) : (
            pendingRequests.slice(0, 3).map((request) => (
              <TouchableOpacity
                key={request.id}
                style={styles.requestCard}
                onPress={() => navigation.navigate('RequestDetail', { requestId: request.id })}
              >
                <View style={styles.requestInfo}>
                  <Text style={styles.requestTenant}>{request.tenantName}</Text>
                  <Text style={styles.requestProperty}>{request.propertyTitle}</Text>
                  <Text style={styles.requestTime}>
                    {new Date(request.requestedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[
                  styles.requestBadge,
                  request.type === 'viewing' ? styles.viewingBadge : styles.applicationBadge
                ]}>
                  <Text style={styles.requestBadgeText}>
                    {request.type === 'viewing' ? 'Viewing' : 'Application'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Matches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Matches</Text>
            <TouchableOpacity onPress={() => navigation.navigate('LandlordMatches')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {recentMatches.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={48} color="#ddd" />
              <Text style={styles.emptyText}>No matches yet</Text>
              <Text style={styles.emptySubtext}>
                Matches will appear here when tenants like your properties
              </Text>
            </View>
          ) : (
            recentMatches.slice(0, 3).map((match) => (
              <TouchableOpacity
                key={match.id}
                style={styles.matchCard}
                onPress={() => navigation.navigate('Chat', { conversationId: match.id })}
              >
                <View style={styles.matchAvatar}>
                  <Text style={styles.matchAvatarText}>
                    {match.tenantName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.matchInfo}>
                  <Text style={styles.matchTenant}>{match.tenantName}</Text>
                  <Text style={styles.matchProperty}>{match.propertyTitle}</Text>
                </View>
                {match.hasUnreadMessages && <View style={styles.unreadDot} />}
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  responseRateCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  responseRateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  responseRateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  responseRateValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  responseRateHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  seeAll: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  requestInfo: {
    flex: 1,
  },
  requestTenant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  requestProperty: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  requestTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  requestBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewingBadge: {
    backgroundColor: '#EEF2FF',
  },
  applicationBadge: {
    backgroundColor: '#D1FAE5',
  },
  requestBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  matchAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  matchAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  matchInfo: {
    flex: 1,
  },
  matchTenant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  matchProperty: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366f1',
    marginRight: 8,
  },
});

export default DashboardScreen;
