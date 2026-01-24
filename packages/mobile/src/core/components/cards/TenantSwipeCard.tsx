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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * TenantSwipeCard - Redesigned for Better UI
 * 
 * Design Improvements:
 * - Content positioned higher to avoid button overlap
 * - Cleaner card layout with better visual hierarchy
 * - Compact info chips for key details
 * - Property interest shown as subtle footer
 * - Action buttons area clearly separated
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

      {/* Gradient Overlay - Center band for text readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)']}
        locations={[0, 0.35, 0.65, 1]}
        style={styles.gradient}
      />

      {/* Top Badges Row */}
      <View style={styles.topBadgesRow}>
        {/* Pending Count - Left */}
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>{totalPending} interested</Text>
        </View>

        {/* Tap Hint - Center */}
        <TouchableOpacity style={styles.tapHint} onPress={onPress}>
          <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.9)" />
          <Text style={styles.tapHintText}>Tap for details</Text>
        </TouchableOpacity>

        {/* Match Score - Right */}
        <View style={styles.matchBadge}>
          <Text style={styles.matchScore}>{tenant.matchScore}%</Text>
          <Text style={styles.matchLabel}>MATCH</Text>
        </View>
      </View>

      {/* Verified Badge - Below match score */}
      {verification.count > 0 && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#fff" />
          <Text style={styles.verifiedText}>{verification.label}</Text>
        </View>
      )}

      {/* Main Content - Centered vertically for better readability */}
      <View style={styles.cardContent}>
        {/* Name + Age Row */}
        <View style={styles.nameContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{tenant.name}</Text>
            {tenant.age && <Text style={styles.age}>, {tenant.age}</Text>}
          </View>
          {tenant.isCouple && (
            <View style={styles.coupleTag}>
              <Ionicons name="people" size={12} color="#fff" />
              <Text style={styles.coupleText}>Couple</Text>
            </View>
          )}
        </View>

        {/* Info Cards Row */}
        <View style={styles.infoCardsRow}>
          {/* Occupation Card */}
          <View style={styles.infoCard}>
            <Ionicons name="briefcase" size={14} color="#a5b4fc" />
            <Text style={styles.infoCardText} numberOfLines={1}>
              {tenant.occupationType ? formatOccupationType(tenant.occupationType) : 'Professional'}
              {tenant.company ? ` at ${tenant.company}` : ''}
            </Text>
          </View>

          {/* Budget Card */}
          <View style={styles.infoCard}>
            <Ionicons name="wallet" size={14} color="#86efac" />
            <Text style={styles.infoCardText}>
              {formatBudgetRange(tenant.budgetMin, tenant.budgetMax)}
            </Text>
          </View>
        </View>

        {/* Rental Rating - If available */}
        {hasRentalHistory && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingIcon}>⭐</Text>
            <Text style={styles.ratingText}>
              {formatRentalRating(tenant.rentalHistory!.rating)}/5 from previous landlords
            </Text>
          </View>
        )}

        {/* Property Interest Footer */}
        <View style={styles.propertyFooter}>
          <Ionicons name="home" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.propertyText} numberOfLines={1}>
            Interested in {tenant.property.neighborhood} • ₹{tenant.property.rent.toLocaleString('en-IN')}/mo
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  cardImage: {
    borderRadius: 24,
  },
  loadingContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  
  // Top Badges Row - Horizontal layout
  topBadgesRow: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  
  // Pending Badge - Left
  pendingBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pendingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Tap Hint - Center
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tapHintText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  
  // Match Score Badge - Right
  matchBadge: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  matchScore: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  matchLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginTop: -2,
    letterSpacing: 1,
  },
  
  // Verified Badge - Below match score
  verifiedBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    right: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  
  // Main Content Area - Centered vertically in card
  cardContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    transform: [{ translateY: -80 }], // Offset to center the content block
    paddingHorizontal: 16,
    gap: 8,
  },
  
  // Name Row
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  age: {
    fontSize: 24,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  coupleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  coupleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  
  // Info Cards Row - Compact chips
  infoCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  infoCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    maxWidth: SCREEN_WIDTH * 0.35,
  },
  
  // Rating Badge
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  ratingIcon: {
    fontSize: 14,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fbbf24',
  },
  
  // Property Footer
  propertyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  propertyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
});

export default TenantSwipeCard;
