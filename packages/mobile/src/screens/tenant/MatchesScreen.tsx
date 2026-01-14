import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutualMatches } from '@hooks/useMatching';
import { useChat } from '../../hooks/useChat';

interface Props {
  navigation: any;
}

interface Match {
  id: string;
  property_id: string;
  match_score: number;
  match_status: string;
  property_status?: string;
  created_at: string;
  updated_at: string;
  // Property details
  address: string;
  neighborhood: string;
  configuration: string;
  rent: number;
  photos: string[];
  // Landlord details
  landlord_name: string;
  landlord_phone: string;
}

/**
 * Matches Screen
 * 
 * Shows mutual matches where both tenant and landlord expressed interest
 */
export const MatchesScreen: React.FC<Props> = ({ navigation }) => {
  const { data: matches, isLoading, refetch, isRefetching } = useMutualMatches();
  const { startConversation } = useChat();
  const [startingChat, setStartingChat] = useState<string | null>(null);

  const handleMatchPress = (match: Match) => {
    // Navigate to chat or property detail
    navigation.navigate('PropertyDetail', { 
      property: {
        id: match.property_id,
        address: match.address,
        neighborhood: match.neighborhood,
        configuration: match.configuration,
        rent: match.rent,
        photos: match.photos || [],
        landlord_name: match.landlord_name,
        matchScore: match.match_score,
      },
      isMatched: true,
    });
  };

  const handleStartChat = async (match: Match) => {
    if (startingChat) return; // Prevent multiple clicks
    
    setStartingChat(match.id);
    try {
      const conversation = await startConversation(match.property_id);
      if (conversation) {
        navigation.navigate('Chat', { 
          conversation: {
            ...conversation,
            property_title: `${match.address || match.neighborhood}`,
            other_user_name: match.landlord_name,
          }
        });
      } else {
        Alert.alert('Error', 'Could not start conversation. Please try again.');
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
      Alert.alert('Error', 'Could not start conversation. Please try again.');
    } finally {
      setStartingChat(null);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="heart-outline" size={64} color="#ccc" />
      </View>
      <Text style={styles.emptyTitle}>No Matches Yet</Text>
      <Text style={styles.emptyText}>
        When you and a landlord both like each other, you'll see your matches here
      </Text>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => navigation.navigate('Explore')}
      >
        <Text style={styles.exploreButtonText}>Start Exploring</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMatchItem = ({ item }: { item: Match }) => (
    <TouchableOpacity 
      style={styles.matchCard}
      onPress={() => handleMatchPress(item)}
      activeOpacity={0.7}
    >
      {/* Property Image */}
      <View style={styles.imageContainer}>
        {item.photos && item.photos.length > 0 ? (
          <Image source={{ uri: item.photos[0] }} style={styles.propertyImage} />
        ) : (
          <View style={[styles.propertyImage, styles.placeholderImage]}>
            <Ionicons name="home-outline" size={32} color="#ccc" />
          </View>
        )}
        <View style={styles.matchBadge}>
          <Text style={styles.matchBadgeText}>{item.match_score}%</Text>
        </View>
      </View>

      {/* Match Info */}
      <View style={styles.matchInfo}>
        <Text style={styles.propertyConfig}>
          {(item.configuration || 'N/A').toUpperCase()}
        </Text>
        <Text style={styles.propertyAddress} numberOfLines={1}>
          {item.address || item.neighborhood || 'Address not available'}
        </Text>
        <Text style={styles.propertyRent}>
          ₹{(item.rent || 0).toLocaleString()}/mo
        </Text>
        
        {/* Landlord Info */}
        <View style={styles.landlordRow}>
          <View style={styles.landlordAvatar}>
            <Ionicons name="person" size={14} color="#fff" />
          </View>
          <Text style={styles.landlordName}>{item.landlord_name || 'Landlord'}</Text>
        </View>
      </View>

      {/* Chat Button */}
      <TouchableOpacity 
        style={[styles.chatButton, startingChat === item.id && styles.chatButtonLoading]}
        onPress={() => handleStartChat(item)}
        disabled={startingChat === item.id}
      >
        {startingChat === item.id ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="chatbubble" size={20} color="#fff" />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading matches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matches</Text>
        {matches && matches.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{matches.length}</Text>
          </View>
        )}
      </View>

      {/* Matches List */}
      <FlatList
        data={matches || []}
        renderItem={renderMatchItem}
        keyExtractor={(item) => item.id || item.property_id}
        contentContainerStyle={[
          styles.listContent,
          (!matches || matches.length === 0) && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#6366f1"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  countBadge: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 12,
  },
  countText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  matchCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
  },
  propertyImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  matchBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  matchInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  propertyConfig: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 15,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  propertyRent: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  landlordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  landlordAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  landlordName: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  chatButtonLoading: {
    opacity: 0.7,
  },
});
