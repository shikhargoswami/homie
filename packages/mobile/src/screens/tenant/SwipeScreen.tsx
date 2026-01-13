import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ImageBackground,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { Ionicons } from '@expo/vector-icons';
import { useRecommendations, useSwipe, useMatchStats } from '@hooks/useMatching';
import { Property } from '@services/matching.service';

/**
 * Swipe Screen (Tinder-style)
 * 
 * Features:
 * - Full-screen card-based property browsing
 * - Swipe gestures (left/right/up for super like)
 * - Match score display
 * - Property details overlay on image
 * - Floating action buttons
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
      {/* Full-screen Swipe Cards */}
      <View style={styles.swiperContainer}>
        <Swiper
          ref={swiperRef}
          cards={properties}
          renderCard={(property) => (
            <PropertyCard 
              property={property} 
              onPress={() => handleCardPress(property)}
              stats={stats}
            />
          )}
          onSwipedLeft={handleSwipeLeft}
          onSwipedRight={handleSwipeRight}
          onSwipedTop={handleSwipeTop}
          cardIndex={currentIndex}
          backgroundColor="transparent"
          stackSize={3}
          stackScale={5}
          stackSeparation={10}
          disableBottomSwipe
          cardVerticalMargin={0}
          cardHorizontalMargin={0}
          overlayLabels={{
            left: {
              title: 'NOPE',
              style: {
                label: {
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontSize: 32,
                  fontWeight: 'bold',
                  borderRadius: 12,
                  padding: 12,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  marginTop: 60,
                  marginLeft: -40,
                },
              },
            },
            right: {
              title: 'LIKE',
              style: {
                label: {
                  backgroundColor: '#10b981',
                  color: '#fff',
                  fontSize: 32,
                  fontWeight: 'bold',
                  borderRadius: 12,
                  padding: 12,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  marginTop: 60,
                  marginLeft: 40,
                },
              },
            },
            top: {
              title: 'SUPER LIKE',
              style: {
                label: {
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  fontSize: 32,
                  fontWeight: 'bold',
                  borderRadius: 12,
                  padding: 12,
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

      {/* Floating Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={() => swiperRef.current?.swipeLeft()}
          disabled={isSwiping}
        >
          <Ionicons name="close" size={36} color="#ef4444" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.superButton]}
          onPress={() => swiperRef.current?.swipeTop()}
          disabled={isSwiping}
        >
          <Ionicons name="star" size={30} color="#3b82f6" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => swiperRef.current?.swipeRight()}
          disabled={isSwiping}
        >
          <Ionicons name="heart" size={36} color="#10b981" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Property Card Component - Full Screen Immersive Design
 */
interface PropertyCardProps {
  property: Property;
  onPress: () => void;
  stats?: any;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress, stats }) => {
  // Safely handle potentially null/undefined values
  const amenities = property.amenities || [];
  const configuration = property.configuration || 'N/A';
  const address = property.address || 'Address not available';
  const neighborhood = property.neighborhood || '';
  
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.98} onPress={onPress}>
      {/* Full-screen Property Image with Gradient Overlay */}
      <ImageBackground
        source={{ uri: property.photos?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800' }}
        style={styles.cardImage}
        imageStyle={styles.cardImageStyle}
      >
        {/* Match Score Badge - Top Right */}
        {property.matchScore ? (
          <View style={styles.matchBadge}>
            <Text style={styles.matchScore}>{property.matchScore}%</Text>
            <Text style={styles.matchLabel}>Match</Text>
          </View>
        ) : null}

        {/* Swipes Remaining - Top Left */}
        {stats && (
          <View style={styles.swipesBadge}>
            <Text style={styles.swipesBadgeText}>{stats.todayRemaining} left</Text>
          </View>
        )}

        {/* Gradient Overlay for Text Readability */}
        <View style={styles.gradientOverlay} />

        {/* Property Details Overlay - Bottom */}
        <View style={styles.cardContent}>
          <View style={styles.priceRow}>
            <Text style={styles.rent}>₹{(property.rent || 0).toLocaleString()}</Text>
            <Text style={styles.rentPeriod}>/month</Text>
          </View>

          <View style={styles.configRow}>
            <View style={styles.configBadge}>
              <Text style={styles.configText}>{configuration.toUpperCase()}</Text>
            </View>
            {property.furnishing && (
              <View style={styles.furnishingBadge}>
                <Text style={styles.furnishingText}>{property.furnishing}</Text>
              </View>
            )}
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color="#fff" />
            <Text style={styles.address} numberOfLines={1}>
              {neighborhood ? `${neighborhood}, ` : ''}{address}
            </Text>
          </View>

          {property.matchReason ? (
            <View style={styles.matchReasonContainer}>
              <Text style={styles.matchReason} numberOfLines={1}>
                💡 {property.matchReason}
              </Text>
            </View>
          ) : null}

          {/* Amenities */}
          <View style={styles.amenitiesRow}>
            {amenities.slice(0, 3).map((amenity, index) => (
              <View key={index} style={styles.amenityTag}>
                <Text style={styles.amenityText}>{amenity.replace('_', ' ')}</Text>
              </View>
            ))}
            {amenities.length > 3 ? (
              <View style={styles.amenityTag}>
                <Text style={styles.amenityText}>+{amenities.length - 3}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  swiperContainer: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  cardImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardImageStyle: {
    borderRadius: 20,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderRadius: 20,
    // Gradient effect using multiple layers
    backgroundImage: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8) 100%)',
  },
  matchBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  matchScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  matchLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    marginTop: -2,
  },
  swipesBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  swipesBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  cardContent: {
    padding: 24,
    paddingBottom: 140,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  rent: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  rentPeriod: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  configBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  configText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  furnishingBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  furnishingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  address: {
    fontSize: 15,
    color: '#fff',
    marginLeft: 6,
    flex: 1,
  },
  matchReasonContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  matchReason: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  amenityText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: 16,
  },
  passButton: {
    borderWidth: 3,
    borderColor: '#ef4444',
  },
  superButton: {
    borderWidth: 3,
    borderColor: '#3b82f6',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  likeButton: {
    borderWidth: 3,
    borderColor: '#10b981',
  },
});
