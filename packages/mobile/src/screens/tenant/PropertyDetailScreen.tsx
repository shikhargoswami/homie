import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Animated,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Property } from '@services/matching.service';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Section IDs for accordion behavior
type SectionId = 'propertyDetails' | 'amenities' | 'neighborhood' | 'sunlight' | 'commute' | 'pet' | 'owner';

// Define navigation param list for this screen
type RootStackParamList = {
  PropertyDetail: { property: Property; isMatched?: boolean };
};

type Props = NativeStackScreenProps<RootStackParamList, 'PropertyDetail'>;

/**
 * Expandable Section Component (Accordion)
 * Only one section can be expanded at a time
 */
interface ExpandableSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({ 
  title, 
  icon, 
  children, 
  isExpanded,
  onToggle,
}) => {
  const [animation] = useState(new Animated.Value(isExpanded ? 1 : 0));

  React.useEffect(() => {
    Animated.timing(animation, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const rotateInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.expandableSection}>
      <TouchableOpacity style={styles.expandableHeader} onPress={onToggle}>
        <View style={styles.expandableTitle}>
          <Ionicons name={icon} size={20} color="#6366f1" />
          <Text style={styles.expandableTitleText}>{title}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </Animated.View>
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.expandableContent}>
          {children}
        </View>
      )}
    </View>
  );
};

/**
 * Property Detail Screen
 * 
 * Shows full property information when user taps on a card
 * with expandable sections for lifestyle data (accordion style)
 */
export const PropertyDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { property, isMatched = false } = route.params;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedSection, setExpandedSection] = useState<SectionId | null>('propertyDetails');
  const photos = property.photos || [];
  const imageListRef = useRef<FlatList>(null);

  // Toggle section - if clicking same section, collapse it; otherwise expand new one
  const toggleSection = (sectionId: SectionId) => {
    setExpandedSection(prev => prev === sectionId ? null : sectionId);
  };

  const handleContactLandlord = () => {
    // For now, just show an alert - in production, this would open chat
    alert('Chat feature coming soon!');
  };

  const handleViewOnMap = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`;
    Linking.openURL(url);
  };

  const handleScheduleVisit = () => {
    alert('Schedule visit feature coming soon!');
  };

  // Handle swipe scroll to update current image index
  const onScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (newIndex !== currentImageIndex && newIndex >= 0 && newIndex < photos.length) {
      setCurrentImageIndex(newIndex);
    }
  }, [currentImageIndex, photos.length]);

  // Render single photo item for FlatList
  const renderPhotoItem = useCallback(({ item }: { item: string }) => (
    <Image source={{ uri: item }} style={styles.mainImage} resizeMode="cover" />
  ), []);

  // Handle indicator tap to jump to specific image
  const scrollToImage = useCallback((index: number) => {
    imageListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentImageIndex(index);
  }, []);

  // Helper to get noise level description
  const getNoiseLevelDesc = (db: number | undefined): string => {
    if (!db) return 'Unknown';
    if (db < 30) return 'Very Quiet';
    if (db < 40) return 'Quiet';
    if (db < 50) return 'Moderate';
    if (db < 60) return 'Somewhat Noisy';
    return 'Noisy';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Property Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Carousel with Swipe */}
        <View style={styles.imageContainer}>
          {photos.length > 0 ? (
            <>
              <FlatList
                ref={imageListRef}
                data={photos}
                renderItem={renderPhotoItem}
                keyExtractor={(item, index) => `photo-${index}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onScrollEnd}
                getItemLayout={(_, index) => ({
                  length: SCREEN_WIDTH,
                  offset: SCREEN_WIDTH * index,
                  index,
                })}
                initialScrollIndex={0}
                bounces={false}
              />
              {/* Image Indicators */}
              {photos.length > 1 && (
                <View style={styles.imageIndicators}>
                  {photos.map((_, idx) => (
                    <TouchableOpacity 
                      key={idx}
                      onPress={() => scrollToImage(idx)}
                      hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                    >
                      <View 
                        style={[
                          styles.imageIndicator,
                          idx === currentImageIndex && styles.imageIndicatorActive
                        ]} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={[styles.mainImage, styles.placeholderImage]}>
              <Ionicons name="home-outline" size={80} color="#ccc" />
              <Text style={styles.placeholderText}>No photos available</Text>
            </View>
          )}
          
          {/* VR Tour Button */}
          {property.vr_tour_url && (
            <TouchableOpacity 
              style={styles.vrButton}
              onPress={() => Linking.openURL(property.vr_tour_url!)}
            >
              <Text style={styles.vrButtonText}>🥽 VR Tour</Text>
            </TouchableOpacity>
          )}
          
          {/* Match Badge */}
          {property.matchScore ? (
            <View style={styles.matchBadge}>
              <Text style={styles.matchScore}>{property.matchScore}%</Text>
              <Text style={styles.matchLabel}>Match</Text>
            </View>
          ) : null}
          
          {/* NEW Badge */}
          {property.is_new && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>

        {/* Price & Basic Info */}
        <View style={styles.section}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{(property.rent || 0).toLocaleString()}</Text>
            <Text style={styles.priceLabel}>/month</Text>
          </View>
          
          <Text style={styles.configuration}>
            {(property.configuration || 'N/A').toUpperCase()} • {property.size_sqft || 0} sq.ft
          </Text>
          
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={18} color="#666" />
            <Text style={styles.address}>{property.address || 'Address not available'}</Text>
          </View>

          {/* AI Match Highlights */}
          {(property.matchReason || property.match_highlights) ? (
            <View style={styles.matchHighlightsBox}>
              <Text style={styles.matchHighlightsTitle}>🎯 Why this matches you</Text>
              {property.match_highlights?.map((highlight, idx) => (
                <Text key={idx} style={styles.matchHighlightItem}>• {highlight}</Text>
              ))}
              {property.matchReason && !property.match_highlights && (
                <Text style={styles.matchHighlightItem}>• {property.matchReason}</Text>
              )}
            </View>
          ) : null}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="layers-outline" size={20} color="#6366f1" />
            <Text style={styles.statValue}>Floor {property.floor_number || 'N/A'}</Text>
            <Text style={styles.statLabel}>of {property.total_floors || 'N/A'}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="home-outline" size={20} color="#6366f1" />
            <Text style={styles.statValue}>{property.furnishing || 'N/A'}</Text>
            <Text style={styles.statLabel}>Furnishing</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={20} color="#6366f1" />
            <Text style={styles.statValue}>{property.min_lease_duration || 12}</Text>
            <Text style={styles.statLabel}>Min months</Text>
          </View>
        </View>

        {/* Expandable Sections (Accordion - only one open at a time) */}
        
        {/* Property Details */}
        <ExpandableSection 
          title="Property Details" 
          icon="home-outline" 
          isExpanded={expandedSection === 'propertyDetails'}
          onToggle={() => toggleSection('propertyDetails')}
        >
          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rent</Text>
              <Text style={styles.detailValue}>₹{(property.rent || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Security Deposit</Text>
              <Text style={styles.detailValue}>₹{(property.security_deposit || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Maintenance</Text>
              <Text style={styles.detailValue}>₹{(property.maintenance_charge || 0).toLocaleString()}/mo</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Area</Text>
              <Text style={styles.detailValue}>{property.size_sqft || 0} sq.ft</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Available From</Text>
              <Text style={styles.detailValue}>{property.available_from || 'Immediately'}</Text>
            </View>
          </View>
        </ExpandableSection>

        {/* Amenities */}
        <ExpandableSection 
          title="Amenities" 
          icon="grid-outline"
          isExpanded={expandedSection === 'amenities'}
          onToggle={() => toggleSection('amenities')}
        >
          <View style={styles.amenitiesGrid}>
            {(property.amenities || []).map((amenity, index) => (
              <View key={index} style={styles.amenityItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
            {(!property.amenities || property.amenities.length === 0) && (
              <Text style={styles.noDataText}>No amenities listed</Text>
            )}
          </View>
        </ExpandableSection>

        {/* Neighborhood Info */}
        <ExpandableSection 
          title="Neighborhood Info" 
          icon="map-outline"
          isExpanded={expandedSection === 'neighborhood'}
          onToggle={() => toggleSection('neighborhood')}
        >
          {property.neighborhood_pois ? (
            <View style={styles.neighborhoodGrid}>
              {property.neighborhood_pois.metro_distance_m && (
                <View style={styles.poiItem}>
                  <View style={styles.poiIcon}>
                    <Text style={styles.poiEmoji}>🚇</Text>
                  </View>
                  <View>
                    <Text style={styles.poiValue}>{property.neighborhood_pois.metro_distance_m}m</Text>
                    <Text style={styles.poiLabel}>to Metro</Text>
                  </View>
                </View>
              )}
              {property.neighborhood_pois.cafes_500m && (
                <View style={styles.poiItem}>
                  <View style={styles.poiIcon}>
                    <Text style={styles.poiEmoji}>☕</Text>
                  </View>
                  <View>
                    <Text style={styles.poiValue}>{property.neighborhood_pois.cafes_500m}</Text>
                    <Text style={styles.poiLabel}>Cafes within 500m</Text>
                  </View>
                </View>
              )}
              {property.neighborhood_pois.parks_1km && (
                <View style={styles.poiItem}>
                  <View style={styles.poiIcon}>
                    <Text style={styles.poiEmoji}>🌳</Text>
                  </View>
                  <View>
                    <Text style={styles.poiValue}>{property.neighborhood_pois.parks_1km}</Text>
                    <Text style={styles.poiLabel}>Parks within 1km</Text>
                  </View>
                </View>
              )}
              {property.neighborhood_pois.gyms_1km && (
                <View style={styles.poiItem}>
                  <View style={styles.poiIcon}>
                    <Text style={styles.poiEmoji}>💪</Text>
                  </View>
                  <View>
                    <Text style={styles.poiValue}>{property.neighborhood_pois.gyms_1km}</Text>
                    <Text style={styles.poiLabel}>Gyms within 1km</Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.noDataText}>No neighborhood data available</Text>
          )}
          <TouchableOpacity style={styles.viewMapLink} onPress={handleViewOnMap}>
            <Ionicons name="navigate-outline" size={16} color="#6366f1" />
            <Text style={styles.viewMapText}>View on Google Maps</Text>
          </TouchableOpacity>
        </ExpandableSection>

        {/* Sunlight & Sound */}
        <ExpandableSection 
          title="Sunlight & Sound" 
          icon="sunny-outline"
          isExpanded={expandedSection === 'sunlight'}
          onToggle={() => toggleSection('sunlight')}
        >
          <View style={styles.lifestyleGrid}>
            {/* Sunlight Section */}
            <View style={styles.lifestyleSection}>
              <Text style={styles.lifestyleSubtitle}>☀️ Natural Light</Text>
              {property.sunlight_hours ? (
                <View style={styles.sunlightGrid}>
                  {property.sunlight_hours.living && (
                    <View style={styles.sunlightItem}>
                      <Text style={styles.sunlightValue}>{property.sunlight_hours.living}h</Text>
                      <Text style={styles.sunlightLabel}>Living Room</Text>
                    </View>
                  )}
                  {property.sunlight_hours.bedroom1 && (
                    <View style={styles.sunlightItem}>
                      <Text style={styles.sunlightValue}>{property.sunlight_hours.bedroom1}h</Text>
                      <Text style={styles.sunlightLabel}>Bedroom</Text>
                    </View>
                  )}
                  {property.sunlight_hours.average && (
                    <View style={styles.sunlightItem}>
                      <Text style={styles.sunlightValue}>{property.sunlight_hours.average}h</Text>
                      <Text style={styles.sunlightLabel}>Average</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.noDataText}>Sunlight data not available</Text>
              )}
            </View>

            {/* Noise Section */}
            <View style={styles.lifestyleSection}>
              <Text style={styles.lifestyleSubtitle}>🔊 Noise Levels</Text>
              {property.noise_levels ? (
                <View style={styles.noiseGrid}>
                  {property.noise_levels.morning && (
                    <View style={styles.noiseItem}>
                      <Text style={styles.noiseTime}>Morning</Text>
                      <Text style={styles.noiseValue}>{property.noise_levels.morning} dB</Text>
                      <Text style={styles.noiseDesc}>{getNoiseLevelDesc(property.noise_levels.morning)}</Text>
                    </View>
                  )}
                  {property.noise_levels.evening && (
                    <View style={styles.noiseItem}>
                      <Text style={styles.noiseTime}>Evening</Text>
                      <Text style={styles.noiseValue}>{property.noise_levels.evening} dB</Text>
                      <Text style={styles.noiseDesc}>{getNoiseLevelDesc(property.noise_levels.evening)}</Text>
                    </View>
                  )}
                  {property.noise_levels.night && (
                    <View style={styles.noiseItem}>
                      <Text style={styles.noiseTime}>Night</Text>
                      <Text style={styles.noiseValue}>{property.noise_levels.night} dB</Text>
                      <Text style={styles.noiseDesc}>{getNoiseLevelDesc(property.noise_levels.night)}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.noDataText}>Noise data not available</Text>
              )}
            </View>
          </View>
        </ExpandableSection>

        {/* Commute Times */}
        <ExpandableSection 
          title="Commute Times" 
          icon="time-outline"
          isExpanded={expandedSection === 'commute'}
          onToggle={() => toggleSection('commute')}
        >
          {property.commute_matrix && Object.keys(property.commute_matrix).length > 0 ? (
            <View style={styles.commuteGrid}>
              {Object.entries(property.commute_matrix).map(([location, minutes], idx) => (
                <View key={idx} style={styles.commuteItem}>
                  <View style={styles.commuteIcon}>
                    <Ionicons name="business-outline" size={20} color="#6366f1" />
                  </View>
                  <View style={styles.commuteInfo}>
                    <Text style={styles.commuteLocation}>{location}</Text>
                    <Text style={styles.commuteTime}>{minutes} min by car</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : property.commuteTime ? (
            <View style={styles.commuteItem}>
              <View style={styles.commuteIcon}>
                <Ionicons name="business-outline" size={20} color="#6366f1" />
              </View>
              <View style={styles.commuteInfo}>
                <Text style={styles.commuteLocation}>Your Office</Text>
                <Text style={styles.commuteTime}>{property.commuteTime} min commute</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>No commute data available. Add your office location in settings.</Text>
          )}
        </ExpandableSection>

        {/* Pet Policy */}
        {property.pet_details && (
          <ExpandableSection 
            title="Pet Policy" 
            icon="paw-outline"
            isExpanded={expandedSection === 'pet'}
            onToggle={() => toggleSection('pet')}
          >
            <View style={styles.petGrid}>
              <View style={styles.petItem}>
                <Text style={styles.petEmoji}>🐕</Text>
                <Text style={styles.petLabel}>Dogs</Text>
                <View style={[styles.petStatus, property.pet_details.dogs_allowed ? styles.petAllowed : styles.petNotAllowed]}>
                  <Text style={styles.petStatusText}>
                    {property.pet_details.dogs_allowed ? 'Allowed' : 'Not Allowed'}
                  </Text>
                </View>
              </View>
              <View style={styles.petItem}>
                <Text style={styles.petEmoji}>🐈</Text>
                <Text style={styles.petLabel}>Cats</Text>
                <View style={[styles.petStatus, property.pet_details.cats_allowed ? styles.petAllowed : styles.petNotAllowed]}>
                  <Text style={styles.petStatusText}>
                    {property.pet_details.cats_allowed ? 'Allowed' : 'Not Allowed'}
                  </Text>
                </View>
              </View>
              {property.pet_details.garden_access && (
                <View style={styles.petItem}>
                  <Text style={styles.petEmoji}>🌿</Text>
                  <Text style={styles.petLabel}>Garden</Text>
                  <View style={[styles.petStatus, styles.petAllowed]}>
                    <Text style={styles.petStatusText}>Access Available</Text>
                  </View>
                </View>
              )}
            </View>
          </ExpandableSection>
        )}

        {/* Owner Details */}
        <ExpandableSection 
          title="Owner Details" 
          icon="person-outline"
          isExpanded={expandedSection === 'owner'}
          onToggle={() => toggleSection('owner')}
        >
          <View style={styles.landlordCard}>
            <View style={styles.landlordAvatar}>
              <Ionicons name="person" size={32} color="#fff" />
            </View>
            <View style={styles.landlordInfo}>
              <Text style={styles.landlordName}>{property.landlord_name || 'Landlord'}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#f59e0b" />
                <Text style={styles.ratingText}>
                  {property.landlord_rating || 'N/A'} rating
                </Text>
              </View>
              <Text style={styles.landlordDesc}>
                Usually responds within 24 hours
              </Text>
            </View>
          </View>
        </ExpandableSection>

        {/* Spacer for bottom button - only needed when matched */}
        {isMatched && <View style={{ height: 120 }} />}
      </ScrollView>

      {/* Fixed Bottom Actions - Only show when matched */}
      {isMatched && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.scheduleButton} onPress={handleScheduleVisit}>
            <Ionicons name="calendar-outline" size={20} color="#6366f1" />
            <Text style={styles.scheduleButtonText}>Schedule Visit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatButton} onPress={handleContactLandlord}>
            <Ionicons name="chatbubble-outline" size={20} color="#fff" />
            <Text style={styles.chatButtonText}>Chat Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: 300,
    position: 'relative',
    backgroundColor: '#1a1a1a',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  imageIndicatorActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  vrButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  vrButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  matchBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  matchScore: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  matchLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  newBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  configuration: {
    fontSize: 18,
    color: '#666',
    marginTop: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  address: {
    fontSize: 15,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  matchHighlightsBox: {
    marginTop: 16,
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  matchHighlightsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 8,
  },
  matchHighlightItem: {
    fontSize: 14,
    color: '#0c4a6e',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  // Expandable Section Styles
  expandableSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  expandableTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  expandableTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  expandableContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  // Details Grid
  detailsGrid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  // Amenities
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    paddingVertical: 8,
  },
  amenityText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  // Neighborhood
  neighborhoodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  poiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
    gap: 12,
  },
  poiIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  poiEmoji: {
    fontSize: 20,
  },
  poiValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  poiLabel: {
    fontSize: 12,
    color: '#666',
  },
  viewMapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewMapText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  // Lifestyle (Sunlight & Sound)
  lifestyleGrid: {
    gap: 20,
  },
  lifestyleSection: {
    gap: 12,
  },
  lifestyleSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  sunlightGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  sunlightItem: {
    flex: 1,
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sunlightValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#b45309',
  },
  sunlightLabel: {
    fontSize: 11,
    color: '#92400e',
    marginTop: 4,
  },
  noiseGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  noiseItem: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  noiseTime: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  noiseValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 4,
  },
  noiseDesc: {
    fontSize: 10,
    color: '#10b981',
    marginTop: 2,
  },
  // Commute
  commuteGrid: {
    gap: 12,
  },
  commuteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 12,
  },
  commuteIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commuteInfo: {
    flex: 1,
  },
  commuteLocation: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  commuteTime: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  // Pet Policy
  petGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  petItem: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
  },
  petEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  petLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  petStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  petAllowed: {
    backgroundColor: '#dcfce7',
  },
  petNotAllowed: {
    backgroundColor: '#fee2e2',
  },
  petStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Landlord
  landlordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
  },
  landlordAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  landlordInfo: {
    marginLeft: 16,
    flex: 1,
  },
  landlordName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  landlordDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  scheduleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
    gap: 8,
  },
  scheduleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366f1',
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    gap: 8,
  },
  chatButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
