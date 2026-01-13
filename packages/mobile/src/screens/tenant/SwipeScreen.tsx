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
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Swiper from 'react-native-deck-swiper';
import { Ionicons } from '@expo/vector-icons';
import { useRecommendations, useSwipe, useMatchStats } from '@hooks/useMatching';
import { Property } from '@services/matching.service';

// Create animated version of ImageBackground for smooth photo transitions
const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);

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
          renderCard={(property, cardIndex) => (
            <PropertyCard 
              property={property} 
              onPress={() => handleCardPress(property)}
              stats={stats}
              isActive={cardIndex === currentIndex}
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

        {/* Floating Action Buttons - Overlaying the Card */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.passButton]}
            onPress={() => swiperRef.current?.swipeLeft()}
            disabled={isSwiping}
            activeOpacity={0.7}
          >
            <View style={styles.passButtonInner}>
              <Ionicons name="close" size={32} color="#fff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.superButton]}
            onPress={() => swiperRef.current?.swipeTop()}
            disabled={isSwiping}
            activeOpacity={0.7}
          >
            <View style={styles.superButtonInner}>
              <Ionicons name="star" size={28} color="#fff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => swiperRef.current?.swipeRight()}
            disabled={isSwiping}
            activeOpacity={0.7}
          >
            <View style={styles.likeButtonInner}>
              <Ionicons name="heart" size={32} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

/**
 * Property Card Component - Full Screen Immersive Design
 * 
 * Features:
 * - Auto-cycling photos: Images automatically rotate every 3 seconds
 * - Shows all 3-4 property images in sequence while viewing card
 * - Photo indicators: Dots at top showing current photo (Instagram Stories style)
 * - Photo counter: Shows "2/4" in top-right corner
 * - Centered content layout with semi-transparent backdrops
 * - Increases engagement time per card
 */
interface PropertyCardProps {
  property: Property;
  onPress: () => void;
  stats?: any;
  isActive?: boolean; // Track if card is currently visible
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress, stats, isActive = false }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = React.useState(0);
  const [nextPhotoIndex, setNextPhotoIndex] = React.useState(1);
  const fadeAnim1 = React.useRef(new Animated.Value(1)).current; // Current photo
  const fadeAnim2 = React.useRef(new Animated.Value(0)).current; // Next photo
  const photoIndexRef = React.useRef(0); // Track index without re-renders
  const isAnimatingRef = React.useRef(false); // Prevent overlapping animations
  
  // Early return if property is undefined
  if (!property) {
    return (
      <View style={styles.card}>
        <View style={[styles.cardImage, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#6C5CE7" />
        </View>
      </View>
    );
  }
  
  // Safely handle potentially null/undefined values
  const amenities = property.amenities || [];
  const configuration = property.configuration || 'N/A';
  const address = property.address || 'Address not available';
  const neighborhood = property.neighborhood || '';
  
  // Get photos array with fallback
  const photos = property.photos && property.photos.length > 0 
    ? property.photos 
    : ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'];
  
  const totalPhotos = photos.length;
  
  // DEBUG: Log property photos on mount
  React.useEffect(() => {
    console.log(`🏠 Property ${property.id} loaded with:`, {
      photosArray: property.photos,
      photosCount: property.photos?.length,
      totalPhotos,
      photos: photos.slice(0, 2), // Show first 2 URLs
    });
  }, [property.id]);
  
  // Auto-cycle through photos every 5 seconds with crossfade animation
  React.useEffect(() => {
    // Only run animation if this card is active/visible
    if (!isActive || totalPhotos <= 1) {
      return; // Don't cycle if not active or only one photo
    }
    
    const interval = setInterval(() => {
      // Skip if animation already running
      if (isAnimatingRef.current) {
        return;
      }
      
      const currentIdx = photoIndexRef.current;
      const nextIdx = (currentIdx + 1) % totalPhotos;
      
      isAnimatingRef.current = true;
      
      // Set next photo for the second layer
      setNextPhotoIndex(nextIdx);
      
      // Wait for image to load, then crossfade
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim1, {
            toValue: 0,
            duration: 1500, // Slow 1.5 second fade out
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim2, {
            toValue: 1,
            duration: 1500, // Slow 1.5 second fade in
            useNativeDriver: true,
          }),
        ]).start(() => {
          // After crossfade, update to next photo
          photoIndexRef.current = nextIdx;
          setCurrentPhotoIndex(nextIdx);
          
          // Reset animations for next cycle
          fadeAnim1.setValue(1);
          fadeAnim2.setValue(0);
          
          // Animation complete
          isAnimatingRef.current = false;
        });
      }, 100);
    }, 5000); // Change photo every 5 seconds (longer viewing time)
    
    return () => {
      clearInterval(interval);
      isAnimatingRef.current = false;
    };
  }, [totalPhotos, property.id, fadeAnim1, fadeAnim2, isActive]);
  
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.98} onPress={onPress}>
      {/* Background Image Layers with Crossfade */}
      {/* Base layer - current photo */}
      <Animated.Image
        source={{ uri: photos[currentPhotoIndex] }}
        style={[StyleSheet.absoluteFill, styles.cardImageStyle, { opacity: fadeAnim1 }]}
        resizeMode="cover"
      />
      {/* Top layer - next photo (fades in during transition) */}
      {totalPhotos > 1 && (
        <Animated.Image
          source={{ uri: photos[nextPhotoIndex] }}
          style={[StyleSheet.absoluteFill, styles.cardImageStyle, { opacity: fadeAnim2 }]}
          resizeMode="cover"
        />
      )}
      
      {/* Content Overlay (stays visible) */}
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]}>
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

        {/* Photo Indicators - Top Center */}
        {totalPhotos > 1 && (
          <View style={styles.photoIndicators}>
            {photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.photoIndicator,
                  index === currentPhotoIndex && styles.photoIndicatorActive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Photo Counter Badge - Top Right (below match badge if exists) */}
        {totalPhotos > 1 && (
          <View style={[
            styles.photoCounter,
            property.matchScore && { top: 80 }
          ]}>
            <Ionicons name="images" size={14} color="#fff" />
            <Text style={styles.photoCounterText}>
              {currentPhotoIndex + 1}/{totalPhotos}
            </Text>
          </View>
        )}

        {/* Center Gradient Overlay - Subtle vignette effect */}
        <LinearGradient
          colors={['rgba(0,0,0,0.2)', 'transparent', 'rgba(0,0,0,0.3)']}
          locations={[0, 0.5, 1]}
          style={styles.gradientOverlay}
        />

        {/* Property Details - Center Overlay with Blend Effect */}
        <View style={styles.cardContent}>
          {/* Price - Large and prominent */}
          <View style={styles.priceContainer}>
            <View style={styles.priceBackdrop} />
            <Text style={styles.rent}>₹{(property.rent || 0).toLocaleString()}</Text>
            <Text style={styles.rentPeriod}>/month</Text>
          </View>

          {/* Config - Below price */}
          <View style={styles.configContainer}>
            <View style={styles.infoBackdrop} />
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
          </View>

          {/* Location - Below config */}
          <View style={styles.locationContainer}>
            <View style={styles.infoBackdrop} />
            <View style={styles.locationRow}>
              <Ionicons name="location" size={18} color="#fff" />
              <Text style={styles.address} numberOfLines={2}>
                {neighborhood ? `${neighborhood}, ` : ''}{address}
              </Text>
            </View>
          </View>

          {/* Match Reason - Bottom */}
          {property.matchReason ? (
            <View style={styles.matchReasonWrapper}>
              <View style={styles.matchReasonBackdrop} />
              <Text style={styles.matchReason} numberOfLines={2}>
                💡 {property.matchReason}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
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
    position: 'relative',
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
    borderRadius: 20,
  },
  matchBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#10b981',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 3,
    borderColor: '#fff',
  },
  matchScore: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  matchLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    marginTop: -2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  swipesBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backdropFilter: 'blur(10px)',
  },
  swipesBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  photoIndicators: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  photoIndicator: {
    height: 3,
    flex: 1,
    maxWidth: 60,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
  },
  photoIndicatorActive: {
    backgroundColor: '#fff',
  },
  photoCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoCounterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  cardContent: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 16,
  },
  priceContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  priceBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 16,
    marginHorizontal: -20,
    marginVertical: -8,
  },
  configContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  locationContainer: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  infoBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    marginHorizontal: -16,
    marginVertical: -8,
  },
  matchReasonWrapper: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  matchReasonBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 12,
    marginHorizontal: -12,
    marginVertical: -6,
  },
  rent: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
    textAlign: 'center',
  },
  rentPeriod: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    marginTop: -4,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  configBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  configText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  furnishingBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  furnishingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '90%',
  },
  address: {
    fontSize: 15,
    color: '#fff',
    marginLeft: 6,
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  matchReason: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenityTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amenityText: {
    fontSize: 11,
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
    paddingHorizontal: 30,
    gap: 18,
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  passButton: {
    width: 64,
    height: 64,
  },
  passButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  superButton: {
    width: 54,
    height: 54,
  },
  superButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  likeButton: {
    width: 64,
    height: 64,
  },
  likeButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
});
