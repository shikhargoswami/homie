import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  TenantCard,
  formatOccupationType,
  formatBudgetRange,
} from '../../contexts/LandlordSwipeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * TenantSwipeCard - Simplified Swipe Card for Landlords
 * 
 * Design Philosophy:
 * - Show only essential info for quick decision making
 * - Match tenant photo as full background
 * - Key info: Name, Age, Occupation, Budget, Match Score
 * - Single tap opens detailed view
 * 
 * Key Info Shown:
 * 1. Photo (full background)
 * 2. Match Score Badge
 * 3. Name + Age
 * 4. Occupation + Company
 * 5. Budget Range
 * 6. Verified badge (if any verifications)
 * 7. Rental History Rating (star if available)
 * 
 * Details shown on tap (TenantDetailModal):
 * - Income, Move-in date, Lease preference
 * - Family composition, Current location
 * - All lifestyle tags, All verifications
 * - Interest message, Full rental history
 */

export interface TenantSwipeCardProps {
  tenant: TenantCard;
  totalPending: number;
  onPress: () => void;
  isActive?: boolean;
}

/**
 * Get verification status summary
 */
export const getVerificationSummary = (tenant: TenantCard): { count: number; label: string } => {
  let count = 0;
  if (tenant.isVerified) count++;
  if (tenant.employmentVerified) count++;
  if (tenant.incomeVerified) count++;
  if (tenant.policeVerification) count++;
  if (tenant.previousLandlordVerified) count++;
  
  if (count === 0) return { count: 0, label: '' };
  if (count === 1) return { count, label: '1 Verified' };
  return { count, label: `${count} Verified` };
};

/**
 * Format rental history rating display
 */
export const formatRentalRating = (rating: number): string => {
  return rating.toFixed(1);
};

export const TenantSwipeCard: React.FC<TenantSwipeCardProps> = ({
  tenant,
  totalPending,
  onPress,
  isActive = false,
}) => {
  // Early return if tenant is undefined
  if (!tenant) {
    return (
      <View style={styles.card}>
        <View style={[styles.cardContent, styles.loadingContent]}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </View>
    );
  }

  const verification = getVerificationSummary(tenant);
  const hasRentalHistory = tenant.rentalHistory && tenant.rentalHistory.rating > 0;

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.95} 
      onPress={onPress}
      testID="tenant-swipe-card"
    >
      {/* Background Photo */}
      <Animated.Image
        source={{
          uri: tenant.photo || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800',
        }}
        style={[StyleSheet.absoluteFill, styles.cardImage]}
        resizeMode="cover"
      />

      {/* Content Overlay */}
      <View style={[StyleSheet.absoluteFill, styles.overlay]}>
        {/* Match Score Badge - Top Right */}
        <View style={styles.matchBadge}>
          <Text style={styles.matchScore}>{tenant.matchScore}%</Text>
          <Text style={styles.matchLabel}>Match</Text>
        </View>

        {/* Pending Count - Top Left */}
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>{totalPending} interested</Text>
        </View>

        {/* Verified Badge - Below match badge */}
        {verification.count > 0 && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#fff" />
            <Text style={styles.verifiedText}>{verification.label}</Text>
          </View>
        )}

        {/* Tap for Details Hint */}
        <View style={styles.tapHint}>
          <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.8)" />
          <Text style={styles.tapHintText}>Tap for details</Text>
        </View>

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
          locations={[0, 0.4, 1]}
          style={styles.gradient}
        />

        {/* Main Content - Bottom */}
        <View style={styles.cardContent}>
          {/* Name + Age + Couple Tag */}
          <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{tenant.name}</Text>
              {tenant.age && <Text style={styles.age}>, {tenant.age}</Text>}
            </View>
            {tenant.isCouple && (
              <View style={styles.coupleTag}>
                <Ionicons name="people" size={12} color="#fff" />
                <Text style={styles.coupleText}>Couple</Text>
              </View>
            )}
          </View>

          {/* Occupation + Company */}
          <View style={styles.infoRow}>
            <Ionicons name="briefcase" size={16} color="#fff" />
            <Text style={styles.infoText}>
              {tenant.occupationType ? formatOccupationType(tenant.occupationType) : 'Professional'}
              {tenant.company ? ` at ${tenant.company}` : ''}
            </Text>
          </View>

          {/* Budget */}
          <View style={styles.infoRow}>
            <Ionicons name="wallet" size={16} color="#fff" />
            <Text style={styles.infoText}>
              Budget: {formatBudgetRange(tenant.budgetMin, tenant.budgetMax)}/month
            </Text>
          </View>

          {/* Rental History Rating - Key trust signal */}
          {hasRentalHistory && (
            <View style={styles.ratingRow}>
              <Text style={styles.ratingIcon}>⭐</Text>
              <Text style={styles.ratingText}>
                {formatRentalRating(tenant.rentalHistory!.rating)}/5 from previous landlord
              </Text>
            </View>
          )}

          {/* Property They're Interested In */}
          <View style={styles.propertyRow}>
            <Ionicons name="home-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.propertyText} numberOfLines={1}>
              {tenant.property.neighborhood} • ₹{tenant.property.rent.toLocaleString('en-IN')}/mo
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  cardImage: {
    borderRadius: 20,
  },
  loadingContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    justifyContent: 'flex-end',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  
  // Badge Styles
  matchBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
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
  pendingBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pendingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    right: 16,
    backgroundColor: 'rgba(76, 217, 100, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  tapHint: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tapHintText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  
  // Content Styles
  cardContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for action buttons
    paddingTop: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  age: {
    fontSize: 24,
    fontWeight: '400',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  coupleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 12,
    gap: 4,
  },
  coupleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Info Rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  
  // Rating Row
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingIcon: {
    fontSize: 14,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fbbf24',
  },
  
  // Property Row
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    opacity: 0.9,
  },
  propertyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
});

export default TenantSwipeCard;
