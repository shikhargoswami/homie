import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { useChat } from '../../hooks/useChat';
import { useLandlord, InterestedTenant, MutualMatch } from '../../contexts/LandlordContext';

type LandlordMatchesRouteParams = {
  LandlordMatches: { tab?: 'interested' | 'matches' };
};

interface Props {
  navigation: any;
}

type TabType = 'interested' | 'matches';

/**
 * Landlord Matches Screen
 * 
 * Shows:
 * - Interested Tenants tab: Tenants who swiped right (need landlord response)
 * - Mutual Matches tab: Active matches (both swiped right)
 * 
 * Uses LandlordContext for centralized state management
 */
export const LandlordMatchesScreen: React.FC<Props> = ({ navigation }) => {
  const route = useRoute<RouteProp<LandlordMatchesRouteParams, 'LandlordMatches'>>();
  const [activeTab, setActiveTab] = useState<TabType>(route.params?.tab || 'interested');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Update tab when route params change
  useEffect(() => {
    if (route.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route.params?.tab]);
  
  // Use centralized landlord context
  const {
    interestedTenants,
    mutualMatches,
    isLoadingInterestedTenants,
    isLoadingMutualMatches,
    refreshInterestedTenants,
    refreshMutualMatches,
    acceptTenant,
    declineTenant,
  } = useLandlord();
  
  const { startConversation } = useChat();

  // Load data on screen focus
  useFocusEffect(
    useCallback(() => {
      console.log('[LandlordMatchesScreen] Screen focused - refreshing data');
      refreshInterestedTenants();
      refreshMutualMatches();
    }, [refreshInterestedTenants, refreshMutualMatches])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshInterestedTenants(), refreshMutualMatches()]);
    setIsRefreshing(false);
  };

  const handleRespond = async (matchId: string, response: 'accept' | 'reject') => {
    setRespondingTo(matchId);
    
    try {
      const success = response === 'accept' 
        ? await acceptTenant(matchId)
        : await declineTenant(matchId);
      
      if (success) {
        Alert.alert(
          response === 'accept' ? '🎉 Match Created!' : 'Tenant Declined',
          response === 'accept' 
            ? 'You can now chat with this tenant!' 
            : 'The tenant has been declined.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to respond. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to respond. Please try again.');
    } finally {
      setRespondingTo(null);
    }
  };

  const handleStartChat = async (match: MutualMatch) => {
    if (startingChat) return;
    
    setStartingChat(match.id);
    try {
      // Pass tenant_id for landlord to start conversation
      const conversation = await startConversation(match.property.id, match.tenant.id);
      if (conversation) {
        navigation.navigate('Chat', {
          conversation: {
            ...conversation,
            property_title: `${match.property.address}, ${match.property.neighborhood}`,
            other_user_name: match.tenant.name,
          }
        });
      } else {
        Alert.alert('Error', 'Could not start conversation.');
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
      Alert.alert('Error', 'Could not start conversation.');
    } finally {
      setStartingChat(null);
    }
  };

  const renderInterestedTenant = ({ item }: { item: InterestedTenant }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.tenant.name.charAt(0)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.tenantName}>{item.tenant.name}</Text>
          <Text style={styles.propertyName}>{item.property.address || item.property.neighborhood}</Text>
          {item.matchScore && (
            <View style={styles.matchScoreBadge}>
              <Ionicons name="heart" size={12} color="#059669" />
              <Text style={styles.matchScoreText}>{item.matchScore}% match</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.tenantDetails}>
        {item.tenant.occupation && (
          <View style={styles.detailRow}>
            <Ionicons name="briefcase-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.tenant.occupation}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => handleRespond(item.matchId, 'reject')}
          disabled={respondingTo === item.matchId}
        >
          {respondingTo === item.matchId ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <>
              <Ionicons name="close" size={20} color="#DC2626" />
              <Text style={styles.rejectText}>Decline</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionBtn, styles.acceptBtn]}
          onPress={() => handleRespond(item.matchId, 'accept')}
          disabled={respondingTo === item.matchId}
        >
          {respondingTo === item.matchId ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.acceptText}>Accept</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMutualMatch = ({ item }: { item: MutualMatch }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => handleStartChat(item)}
      disabled={startingChat === item.id}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.tenant.name?.charAt(0) || 'T'}</Text>
      </View>
      <View style={styles.matchInfo}>
        <Text style={styles.tenantName}>{item.tenant.name}</Text>
        <Text style={styles.propertyName}>{item.property.address}, {item.property.neighborhood}</Text>
      </View>
      {startingChat === item.id ? (
        <ActivityIndicator size="small" color="#6366f1" />
      ) : (
        <View style={styles.chatButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#6366f1" />
          <Text style={styles.chatButtonText}>Chat</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Show loading on initial load
  const isLoading = isLoadingInterestedTenants && interestedTenants.length === 0 && 
                    isLoadingMutualMatches && mutualMatches.length === 0;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'interested' && styles.activeTab]}
          onPress={() => setActiveTab('interested')}
        >
          <Text style={[styles.tabText, activeTab === 'interested' && styles.activeTabText]}>
            Interested ({interestedTenants.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'matches' && styles.activeTab]}
          onPress={() => setActiveTab('matches')}
        >
          <Text style={[styles.tabText, activeTab === 'matches' && styles.activeTabText]}>
            Matches ({mutualMatches.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'interested' ? (
        <FlatList
          data={interestedTenants}
          renderItem={renderInterestedTenant}
          keyExtractor={(item) => item.matchId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#ddd" />
              <Text style={styles.emptyTitle}>No interested tenants yet</Text>
              <Text style={styles.emptySubtitle}>
                When tenants swipe right on your properties, they'll appear here
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={mutualMatches}
          renderItem={renderMutualMatch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={64} color="#ddd" />
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptySubtitle}>
                Accept interested tenants to create matches and start chatting
              </Text>
            </View>
          }
        />
      )}
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
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#6366f1',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  propertyName: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  matchScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  matchScoreText: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 4,
    fontWeight: '500',
  },
  tenantDetails: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  lifestyleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
    textTransform: 'capitalize',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
  },
  acceptBtn: {
    backgroundColor: '#6366f1',
  },
  rejectText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  acceptText: {
    color: '#fff',
    fontWeight: '600',
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  matchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatButton: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  chatButtonText: {
    fontSize: 11,
    color: '#6366f1',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
});

export default LandlordMatchesScreen;
