import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TenantCard,
  formatOccupationType,
  formatBudgetRange,
  formatAnnualIncome,
  formatMoveInDate,
  formatLeaseDuration,
  formatLifestyleTag,
} from '../../contexts/LandlordSwipeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * TenantDetailModal - Full Tenant Profile View
 * 
 * Shown when landlord taps on a swipe card.
 * Displays comprehensive tenant information:
 * 
 * Sections:
 * 1. Header: Photo, Name, Age, Match Score
 * 2. About: Occupation, Company, Current Location
 * 3. Financial: Annual Income, Budget Range
 * 4. Move-in Details: Preferred date, Lease duration
 * 5. Family: Family size, Children, Couple info
 * 6. Rental History: Previous landlord rating & review
 * 7. Verifications: All verification badges
 * 8. Lifestyle: All lifestyle tags
 * 9. Interest Message: Why they want your property
 * 10. Property: Which property they're interested in
 */

export interface TenantDetailModalProps {
  visible: boolean;
  tenant: TenantCard | null;
  onClose: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

/**
 * Section Header Component
 */
const SectionHeader: React.FC<{ icon: string; title: string }> = ({ icon, title }) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon as any} size={18} color="#6366f1" />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

/**
 * Info Row Component
 */
const InfoRow: React.FC<{ label: string; value: string | number | undefined; icon?: string }> = ({
  label,
  value,
  icon,
}) => {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      {icon && <Text style={styles.infoIcon}>{icon}</Text>}
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
};

/**
 * Verification Badge Component
 */
const VerificationBadge: React.FC<{ verified: boolean; label: string }> = ({ verified, label }) => (
  <View style={[styles.verificationBadge, verified && styles.verificationBadgeActive]}>
    <Ionicons
      name={verified ? 'checkmark-circle' : 'ellipse-outline'}
      size={16}
      color={verified ? '#10b981' : '#9ca3af'}
    />
    <Text style={[styles.verificationLabel, verified && styles.verificationLabelActive]}>
      {label}
    </Text>
  </View>
);

export const TenantDetailModal: React.FC<TenantDetailModalProps> = ({
  visible,
  tenant,
  onClose,
  onSwipeLeft,
  onSwipeRight,
}) => {
  if (!tenant) return null;

  const hasRentalHistory = tenant.rentalHistory && tenant.rentalHistory.rating > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      testID="tenant-detail-modal"
    >
      <View style={styles.container}>
        {/* Header with Photo */}
        <View style={styles.header}>
          <Image
            source={{
              uri: tenant.photo || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800',
            }}
            style={styles.headerImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.headerGradient}
          />
          
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose} testID="close-modal-button">
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          
          {/* Match Score */}
          <View style={styles.matchBadge}>
            <Text style={styles.matchScore}>{tenant.matchScore}%</Text>
            <Text style={styles.matchLabel}>Match</Text>
          </View>
          
          {/* Name & Age */}
          <View style={styles.headerContent}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{tenant.name}</Text>
              {tenant.age && <Text style={styles.age}>, {tenant.age}</Text>}
            </View>
            {tenant.isCouple && (
              <View style={styles.coupleTag}>
                <Ionicons name="people" size={14} color="#fff" />
                <Text style={styles.coupleText}>
                  Couple{tenant.partnerName ? ` with ${tenant.partnerName}` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* About Section */}
          <View style={styles.section}>
            <SectionHeader icon="person-outline" title="About" />
            <InfoRow
              icon="💼"
              label="Occupation"
              value={
                tenant.occupationType
                  ? formatOccupationType(tenant.occupationType)
                  : undefined
              }
            />
            {tenant.company && (
              <InfoRow icon="🏢" label="Company" value={tenant.company} />
            )}
            {tenant.currentLocation && (
              <InfoRow icon="📍" label="Current Location" value={tenant.currentLocation} />
            )}
          </View>

          {/* Financial Section */}
          <View style={styles.section}>
            <SectionHeader icon="cash-outline" title="Financial" />
            <InfoRow
              icon="💰"
              label={tenant.isCouple ? 'Combined Annual Income' : 'Annual Income'}
              value={tenant.annualIncome ? formatAnnualIncome(tenant.annualIncome) : undefined}
            />
            <InfoRow
              icon="💳"
              label="Monthly Budget"
              value={formatBudgetRange(tenant.budgetMin, tenant.budgetMax)}
            />
          </View>

          {/* Move-in Details Section */}
          <View style={styles.section}>
            <SectionHeader icon="calendar-outline" title="Move-in Details" />
            <InfoRow
              icon="📅"
              label="Preferred Move-in"
              value={tenant.preferredMoveIn ? formatMoveInDate(tenant.preferredMoveIn) : undefined}
            />
            <InfoRow
              icon="📝"
              label="Lease Duration"
              value={
                tenant.preferredLeaseMonths
                  ? formatLeaseDuration(tenant.preferredLeaseMonths)
                  : undefined
              }
            />
          </View>

          {/* Family Section */}
          {(tenant.familySize > 1 || tenant.hasChildren) && (
            <View style={styles.section}>
              <SectionHeader icon="people-outline" title="Family" />
              <InfoRow icon="👥" label="Family Size" value={`${tenant.familySize} people`} />
              {tenant.hasChildren && (
                <InfoRow icon="👶" label="Children" value="Yes" />
              )}
            </View>
          )}

          {/* Rental History Section */}
          {hasRentalHistory && (
            <View style={styles.section}>
              <SectionHeader icon="star-outline" title="Rental History" />
              <View style={styles.rentalHistoryCard}>
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingValue}>{tenant.rentalHistory!.rating.toFixed(1)}</Text>
                  <Text style={styles.ratingStar}>⭐</Text>
                </View>
                <View style={styles.rentalDetails}>
                  <Text style={styles.landlordName}>
                    From: {tenant.rentalHistory!.landlordName}
                  </Text>
                  <Text style={styles.rentalDuration}>
                    {tenant.rentalHistory!.durationMonths} months tenancy
                  </Text>
                  {tenant.rentalHistory!.review && (
                    <Text style={styles.rentalReview} numberOfLines={3}>
                      "{tenant.rentalHistory!.review}"
                    </Text>
                  )}
                  {tenant.rentalHistory!.isVerified && (
                    <View style={styles.verifiedTag}>
                      <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                      <Text style={styles.verifiedTagText}>Verified Reference</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Verifications Section */}
          <View style={styles.section}>
            <SectionHeader icon="shield-checkmark-outline" title="Verifications" />
            <View style={styles.verificationsGrid}>
              <VerificationBadge verified={tenant.isVerified} label="Identity" />
              <VerificationBadge verified={tenant.employmentVerified} label="Employment" />
              <VerificationBadge verified={tenant.incomeVerified} label="Income" />
              <VerificationBadge verified={tenant.policeVerification} label="Police Check" />
              <VerificationBadge verified={tenant.previousLandlordVerified} label="Landlord Ref" />
            </View>
          </View>

          {/* Lifestyle Section */}
          {tenant.lifestyleTags && tenant.lifestyleTags.length > 0 && (
            <View style={styles.section}>
              <SectionHeader icon="heart-outline" title="Lifestyle" />
              <View style={styles.tagsContainer}>
                {tenant.lifestyleTags.map((tag, index) => (
                  <View key={index} style={styles.lifestyleTag}>
                    <Text style={styles.lifestyleTagText}>{formatLifestyleTag(tag)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Interest Message Section */}
          {tenant.interestMessage && (
            <View style={styles.section}>
              <SectionHeader icon="chatbubble-outline" title="Why They're Interested" />
              <View style={styles.messageCard}>
                <Text style={styles.messageText}>"{tenant.interestMessage}"</Text>
              </View>
            </View>
          )}

          {/* Looking For Description */}
          {tenant.lookingForDescription && (
            <View style={styles.section}>
              <SectionHeader icon="search-outline" title="What They're Looking For" />
              <View style={styles.messageCard}>
                <Text style={styles.messageText}>{tenant.lookingForDescription}</Text>
              </View>
            </View>
          )}

          {/* Property Interested In */}
          <View style={styles.section}>
            <SectionHeader icon="home-outline" title="Property Interested In" />
            <View style={styles.propertyCard}>
              <Text style={styles.propertyAddress}>{tenant.property.address}</Text>
              <Text style={styles.propertyDetails}>
                {tenant.property.neighborhood} • ₹{tenant.property.rent.toLocaleString('en-IN')}/month
              </Text>
            </View>
          </View>

          {/* Bottom Spacing for Actions */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Fixed Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.passButton]}
            onPress={() => {
              onSwipeLeft();
              onClose();
            }}
            testID="pass-button"
          >
            <Ionicons name="close" size={28} color="#fff" />
            <Text style={styles.actionText}>Pass</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => {
              onSwipeRight();
              onClose();
            }}
            testID="interested-button"
          >
            <Ionicons name="heart" size={28} color="#fff" />
            <Text style={styles.actionText}>Interested</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  
  // Header Styles
  header: {
    height: SCREEN_HEIGHT * 0.35,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 16,
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  matchScore: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  matchLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  headerContent: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  age: {
    fontSize: 26,
    fontWeight: '400',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  coupleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  coupleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Content Styles
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  
  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  
  // Info Row Styles
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  
  // Rental History Styles
  rentalHistoryCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
  },
  ratingContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  ratingValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#d97706',
  },
  ratingStar: {
    fontSize: 20,
  },
  rentalDetails: {
    flex: 1,
  },
  landlordName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  rentalDuration: {
    fontSize: 14,
    color: '#b45309',
    marginBottom: 8,
  },
  rentalReview: {
    fontSize: 14,
    color: '#78350f',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  verifiedTagText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  
  // Verifications Grid
  verificationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  verificationBadgeActive: {
    backgroundColor: '#d1fae5',
  },
  verificationLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  verificationLabelActive: {
    color: '#065f46',
    fontWeight: '600',
  },
  
  // Lifestyle Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lifestyleTag: {
    backgroundColor: '#eef2ff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  lifestyleTagText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '500',
  },
  
  // Message Card
  messageCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  messageText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  
  // Property Card
  propertyCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
  },
  propertyAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  propertyDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  // Action Buttons
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  passButton: {
    backgroundColor: '#ef4444',
  },
  likeButton: {
    backgroundColor: '#10b981',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default TenantDetailModal;
