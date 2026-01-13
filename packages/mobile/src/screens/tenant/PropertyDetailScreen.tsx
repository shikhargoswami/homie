import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Property } from '@services/matching.service';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define navigation param list for this screen
type RootStackParamList = {
  PropertyDetail: { property: Property };
};

type Props = NativeStackScreenProps<RootStackParamList, 'PropertyDetail'>;

/**
 * Property Detail Screen
 * 
 * Shows full property information when user taps on a card
 */
export const PropertyDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { property } = route.params;

  const handleContactLandlord = () => {
    // For now, just show an alert - in production, this would open chat
    alert('Chat feature coming soon!');
  };

  const handleViewOnMap = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`;
    Linking.openURL(url);
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
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {property.photos && property.photos.length > 0 ? (
            <Image source={{ uri: property.photos[0] }} style={styles.mainImage} />
          ) : (
            <View style={[styles.mainImage, styles.placeholderImage]}>
              <Ionicons name="home-outline" size={80} color="#ccc" />
              <Text style={styles.placeholderText}>No photos available</Text>
            </View>
          )}
          
          {/* Match Badge */}
          {property.matchScore ? (
            <View style={styles.matchBadge}>
              <Text style={styles.matchScore}>{property.matchScore}%</Text>
              <Text style={styles.matchLabel}>Match</Text>
            </View>
          ) : null}
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

          {property.matchReason ? (
            <View style={styles.matchReasonBox}>
              <Text style={styles.matchReasonText}>{'💡 '}{property.matchReason}</Text>
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

        {/* Costs Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Costs</Text>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Rent</Text>
            <Text style={styles.costValue}>₹{(property.rent || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Security Deposit</Text>
            <Text style={styles.costValue}>₹{(property.security_deposit || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Maintenance</Text>
            <Text style={styles.costValue}>₹{(property.maintenance_charge || 0).toLocaleString()}/mo</Text>
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {(property.amenities || []).map((amenity, index) => (
              <View key={index} style={styles.amenityItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
            {(!property.amenities || property.amenities.length === 0) && (
              <Text style={styles.noAmenities}>No amenities listed</Text>
            )}
          </View>
        </View>

        {/* Landlord Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listed by</Text>
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
            </View>
          </View>
        </View>

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.mapButton} onPress={handleViewOnMap}>
          <Ionicons name="map-outline" size={20} color="#6366f1" />
          <Text style={styles.mapButtonText}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactButton} onPress={handleContactLandlord}>
          <Ionicons name="chatbubble-outline" size={20} color="#fff" />
          <Text style={styles.contactButtonText}>Contact Landlord</Text>
        </TouchableOpacity>
      </View>
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
    height: 280,
    position: 'relative',
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
  matchReasonBox: {
    marginTop: 16,
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
  },
  matchReasonText: {
    fontSize: 14,
    color: '#166534',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  costLabel: {
    fontSize: 15,
    color: '#666',
  },
  costValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
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
  noAmenities: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
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
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6366f1',
    marginRight: 12,
  },
  mapButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 6,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#6366f1',
    borderRadius: 12,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
});
