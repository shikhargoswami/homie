import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { Ionicons } from '@expo/vector-icons';
import { useRecommendations, useSwipe, useMatchStats } from '@hooks/useMatching';
import { Property } from '@services/matching.service';

/**
 * Swipe Screen (Tinder-style)
 * 
 * Features:
 * - Card-based property browsing
 * - Swipe gestures (left/right/up for super like)
 * - Match score display
 * - Property details on tap
 * - Empty state when no more properties
 */

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  navigation: any;
}

export const SwipeScreen: React.FC<Props> = ({ navigation }) => {
  const swiperRef = useRef<Swiper<Property>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const { data: properties, isLoading, refetch } = useRecommendations(20);
  const { mutate: swipe, isPending: isSwiping } = useSwipe();
  const { data: stats } = useMatchStats();

  const handleSwipe = (index: number, direction: 'right' | 'left') => {
    if (!properties || index >= properties.length) return;

    const property = properties[index];
    
    swipe(
      { propertyId: property.id, direction },
      {
        onSuccess: (data) => {
          if (data.data.isMutualMatch) {
            Alert.alert(
              '🎉 It\'s a Match!',
              'You and the landlord are interested. Start chatting now!',
              [
                { text: 'Later', style: 'cancel' },
                { text: 'Chat Now', onPress: () => navigation.navigate('Matches') },
              ]
            );
          }
        },
        onError: (error: any) => {
          Alert.alert(
            'Error',
            error.response?.data?.error?.message || 'Failed to record swipe'
          );
        },
      }
    );
  };

  const handleSwipeRight = (index: number) => {
    handleSwipe(index, 'right');
  };

  const handleSwipeLeft = (index: number) => {
    handleSwipe(index, 'left');
  };

  const handleSwipeTop = (index: number) => {
    if (!properties || index >= properties.length) return;
    
    const property = properties[index];
    
    swipe({ propertyId: property.id, direction: 'super' }, {
      onSuccess: () => {
        Alert.alert('Super Like Sent! ⭐', 'You\'ll be notified if it\'s a match');
      },
    });
  };

  const handleCardPress = (property: Property) => {
    navigation.navigate('PropertyDetail', { property });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Finding perfect homes for you...</Text>
      </View>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="home-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No More Properties</Text>
        <Text style={styles.emptyText}>
          Check back later for new listings or adjust your preferences
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={() => refetch()}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with stats */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle-outline" size={32} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Homie</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Matches')}>
          <View>
            <Ionicons name="chatbubbles-outline" size={32} color="#1a1a1a" />
            {stats && stats.mutualMatches > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.mutualMatches}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Swipe Cards */}
      <View style={styles.swiperContainer}>
        <Swiper
          ref={swiperRef}
          cards={properties}
          renderCard={(property) => <PropertyCard property={property} onPress={() => handleCardPress(property)} />}
          onSwipedLeft={handleSwipeLeft}
          onSwipedRight={handleSwipeRight}
          onSwipedTop={handleSwipeTop}
          cardIndex={currentIndex}
          backgroundColor="transparent"
          stackSize={3}
          stackScale={10}
          stackSeparation={14}
          disableBottomSwipe
          overlayLabels={{
            left: {
              title: 'PASS',
              style: {
                label: {
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontSize: 24,
                  fontWeight: 'bold',
                  borderRadius: 8,
                  padding: 10,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  marginTop: 30,
                  marginLeft: -30,
                },
              },
            },
            right: {
              title: 'LIKE',
              style: {
                label: {
                  backgroundColor: '#10b981',
                  color: '#fff',
                  fontSize: 24,
                  fontWeight: 'bold',
                  borderRadius: 8,
                  padding: 10,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  marginTop: 30,
                  marginLeft: 30,
                },
              },
            },
            top: {
              title: 'SUPER',
              style: {
                label: {
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  fontSize: 24,
                  fontWeight: 'bold',
                  borderRadius: 8,
                  padding: 10,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              },
            },
          }}
          animateOverlayLabelsOpacity
          animateCardOpacity
          onTapCard={(index) => handleCardPress(properties[index])}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={() => swiperRef.current?.swipeLeft()}
          disabled={isSwiping}
        >
          <Ionicons name="close" size={32} color="#ef4444" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.superButton]}
          onPress={() => swiperRef.current?.swipeTop()}
          disabled={isSwiping}
        >
          <Ionicons name="star" size={28} color="#3b82f6" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => swiperRef.current?.swipeRight()}
          disabled={isSwiping}
        >
          <Ionicons name="heart" size={32} color="#10b981" />
        </TouchableOpacity>
      </View>

      {/* Remaining swipes indicator */}
      {stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {stats.todayRemaining} swipes remaining today
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * Property Card Component
 */
interface PropertyCardProps {
  property: Property;
  onPress: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.95} onPress={onPress}>
      {/* Property Image */}
      <View style={styles.imageContainer}>
        {property.photos && property.photos.length > 0 ? (
          <Image source={{ uri: property.photos[0] }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Ionicons name="home-outline" size={64} color="#ccc" />
          </View>
        )}
        
        {/* Match Score Badge */}
        {property.matchScore && (
          <View style={styles.matchBadge}>
            <Text style={styles.matchScore}>{property.matchScore}%</Text>
            <Text style={styles.matchLabel}>Match</Text>
          </View>
        )}
      </View>

      {/* Property Details */}
      <View style={styles.cardContent}>
        <View style={styles.priceRow}>
          <Text style={styles.rent}>₹{property.rent.toLocaleString()}/mo</Text>
          {property.commuteTime && (
            <View style={styles.commuteTag}>
              <Ionicons name="car-outline" size={14} color="#666" />
              <Text style={styles.commuteText}>{property.commuteTime} min</Text>
            </View>
          )}
        </View>

        <Text style={styles.configuration}>{property.configuration.toUpperCase()}</Text>
        <Text style={styles.address} numberOfLines={2}>
          {property.address}
        </Text>

        {property.matchReason && (
          <Text style={styles.matchReason} numberOfLines={1}>
            💡 {property.matchReason}
          </Text>
        )}

        {/* Amenities */}
        <View style={styles.amenitiesRow}>
          {property.amenities.slice(0, 3).map((amenity, index) => (
            <View key={index} style={styles.amenityTag}>
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
          {property.amenities.length > 3 && (
            <Text style={styles.moreAmenities}>+{property.amenities.length - 3} more</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
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
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f5f5f5',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  swiperContainer: {
    flex: 1,
    paddingTop: 20,
  },
  card: {
    height: SCREEN_HEIGHT * 0.65,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    height: '60%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  matchScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  matchLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    marginTop: -2,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rent: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  commuteTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  commuteText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  configuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  matchReason: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '500',
    marginBottom: 12,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  amenityTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  amenityText: {
    fontSize: 12,
    color: '#666',
  },
  moreAmenities: {
    fontSize: 12,
    color: '#999',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 12,
  },
  passButton: {
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  superButton: {
    borderWidth: 2,
    borderColor: '#3b82f6',
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  likeButton: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  statsContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: '#999',
  },
});
