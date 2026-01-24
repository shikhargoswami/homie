import React, { useState, useCallback } from 'react';
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
import { useLandlord } from '../../contexts/LandlordContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper functions for viewing status
const formatViewingStatus = (status: string): string => {
  switch (status) {
    case 'proposed': return 'Pending';
    case 'confirmed': return 'Confirmed';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    case 'rescheduled': return 'Rescheduled';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

const getViewingStatusStyle = (status: string) => {
  switch (status) {
    case 'proposed': return { backgroundColor: '#FEF3C7' };
    case 'confirmed': return { backgroundColor: '#D1FAE5' };
    case 'completed': return { backgroundColor: '#EEF2FF' };
    case 'cancelled': return { backgroundColor: '#FEE2E2' };
    case 'rescheduled': return { backgroundColor: '#FCE7F3' };
    default: return { backgroundColor: '#F3F4F6' };
  }
};

const getViewingStatusTextStyle = (status: string) => {
  switch (status) {
    case 'proposed': return { color: '#D97706' };
    case 'confirmed': return { color: '#059669' };
    case 'completed': return { color: '#6366f1' };
    case 'cancelled': return { color: '#DC2626' };
    case 'rescheduled': return { color: '#DB2777' };
    default: return { color: '#6B7280' };
  }
};

/**
 * Landlord Dashboard Screen
 * 
 * Shows:
 * - Property statistics (clickable cards)
 * - Viewing requests section
 * - Quick actions
 * 
 * Uses LandlordContext for centralized state management
 */

interface Props {
  navigation: any;
}

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  // Use centralized landlord context
  const {
    stats,
    interestedTenants,
    mutualMatches,
    viewingRequests,
    isLoadingStats,
    refreshAll,
  } = useLandlord();
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load data on screen focus
  useFocusEffect(
    useCallback(() => {
      console.log('[DashboardScreen] Screen focused - loading data via context');
      refreshAll();
    }, [refreshAll])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshAll();
    setIsRefreshing(false);
  };

  // Show loading only on initial load (no stats yet)
  if (!stats && isLoadingStats) {
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
          {(interestedTenants.length > 0 || viewingRequests.length > 0) && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{interestedTenants.length + viewingRequests.length}</Text>
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
        {/* Stats Cards - Clickable */}
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}
            onPress={() => navigation.navigate('Properties', { filter: 'available' })}
            activeOpacity={0.7}
          >
            <Ionicons name="home-outline" size={24} color="#6366f1" />
            <Text style={styles.statValue}>{stats?.activeListings || 0}</Text>
            <Text style={styles.statLabel}>Active Listings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}
            onPress={() => navigation.navigate('LandlordMatches', { tab: 'interested' })}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={24} color="#D97706" />
            <Text style={styles.statValue}>{interestedTenants.length}</Text>
            <Text style={styles.statLabel}>Interested Tenants</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}
            onPress={() => navigation.navigate('LandlordMatches', { tab: 'matches' })}
            activeOpacity={0.7}
          >
            <Ionicons name="heart-outline" size={24} color="#059669" />
            <Text style={styles.statValue}>{mutualMatches.length}</Text>
            <Text style={styles.statLabel}>Mutual Matches</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: '#FCE7F3' }]}
            onPress={() => navigation.navigate('Viewings', { userRole: 'landlord' })}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={24} color="#DB2777" />
            <Text style={styles.statValue}>{viewingRequests.length}</Text>
            <Text style={styles.statLabel}>Viewing Requests</Text>
          </TouchableOpacity>
        </View>

        {/* Response Rate */}
        <View style={styles.responseRateCard}>
          <View style={styles.responseRateHeader}>
            <Text style={styles.responseRateTitle}>Response Rate</Text>
            <Text style={styles.responseRateValue}>{stats?.responseRate || 0}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${stats?.responseRate || 0}%` }]} />
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
              onPress={() => navigation.navigate('Properties', { filter: 'all' })}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="list-outline" size={24} color="#059669" />
              </View>
              <Text style={styles.actionText}>My Properties</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Viewings', { userRole: 'landlord' })}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="calendar-outline" size={24} color="#D97706" />
              </View>
              <Text style={styles.actionText}>Viewings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Viewing Requests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Viewing Requests</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Viewings', { userRole: 'landlord' })}>
              <Text style={styles.seeAll}>See All ({viewingRequests.length})</Text>
            </TouchableOpacity>
          </View>
          
          {viewingRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#ddd" />
              <Text style={styles.emptyText}>No viewing requests</Text>
              <Text style={styles.emptySubtext}>
                Tenants will request viewings after matching with your properties
              </Text>
            </View>
          ) : (
            viewingRequests.slice(0, 3).map((viewing) => (
              <TouchableOpacity
                key={viewing.id}
                style={styles.viewingCard}
                onPress={() => navigation.navigate('ViewingDetail', { viewingId: viewing.id })}
              >
                <View style={styles.viewingIconContainer}>
                  <Ionicons name="calendar" size={24} color="#DB2777" />
                </View>
                <View style={styles.viewingInfo}>
                  <Text style={styles.viewingTenant}>{viewing.tenant.name}</Text>
                  <Text style={styles.viewingProperty}>
                    {viewing.property.address || viewing.property.neighborhood}
                  </Text>
                  {viewing.date && (
                    <Text style={styles.viewingDateTime}>
                      {new Date(viewing.date).toLocaleDateString()}{viewing.time ? ` at ${viewing.time}` : ''}
                    </Text>
                  )}
                </View>
                <View style={[styles.viewingStatusBadge, getViewingStatusStyle(viewing.status)]}>
                  <Text style={[styles.viewingStatusText, getViewingStatusTextStyle(viewing.status)]}>
                    {formatViewingStatus(viewing.status)}
                  </Text>
                </View>
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
  // Viewing Request Styles
  viewingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  viewingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FCE7F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  viewingInfo: {
    flex: 1,
  },
  viewingTenant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  viewingProperty: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  viewingDateTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  viewingStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewingStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default DashboardScreen;
