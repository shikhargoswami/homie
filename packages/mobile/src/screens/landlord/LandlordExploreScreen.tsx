import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  useLandlordSwipe,
  TenantCard,
} from '../../contexts/LandlordSwipeContext';
import { useChat } from '../../hooks/useChat';
import { TenantSwipeCard } from '../../components/cards/TenantSwipeCard';
import { TenantDetailModal } from '../../components/modals/TenantDetailModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * LandlordExploreScreen - Tenant Swipe Feed
 * 
 * Redesigned with simplified swipe cards:
 * - Tap on card opens detailed tenant profile modal
 * - Swipe right = interested, swipe left = pass
 * - Clean, focused UI for quick decision making
 * 
 * Components:
 * - TenantSwipeCard: Simplified card with key info only
 * - TenantDetailModal: Full tenant profile on tap
 */

interface Props {
  navigation?: any;
}

export const LandlordExploreScreen: React.FC<Props> = ({ navigation }) => {
  const swiperRef = useRef<Swiper<TenantCard>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantCard | null>(null);
  const [matchedTenant, setMatchedTenant] = useState<TenantCard | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);
  
  const { startConversation } = useChat();
  
  const {
    tenantFeed,
    hasMoreCards,
    isLoadingFeed,
    isSwiping,
    totalPending,
    loadTenantFeed,
    swipeRight,
    swipeLeft,
    lastSwipeResult,
    clearLastResult,
  } = useLandlordSwipe();

  // Load feed on focus
  useFocusEffect(
    useCallback(() => {
      loadTenantFeed();
    }, [loadTenantFeed])
  );

  // Show match modal when mutual match occurs
  useEffect(() => {
    if (lastSwipeResult?.isMutualMatch) {
      setShowMatchModal(true);
    }
  }, [lastSwipeResult]);

  const handleSwipeRight = async (index: number) => {
    if (!tenantFeed || index >= tenantFeed.length) return;
    const tenant = tenantFeed[index];
    
    // Store tenant before swiping (feed will be updated after swipe)
    setMatchedTenant(tenant);
    
    await swipeRight(tenant.matchId);
    // Modal will be shown via useEffect watching lastSwipeResult.isMutualMatch
  };

  const handleSwipeLeft = async (index: number) => {
    if (!tenantFeed || index >= tenantFeed.length) return;
    const tenant = tenantFeed[index];
    await swipeLeft(tenant.matchId);
  };

  // Handle card press - open detail modal
  const handleCardPress = (tenant: TenantCard) => {
    setSelectedTenant(tenant);
    setShowDetailModal(true);
  };

  // Handle swipe from modal
  const handleModalSwipeRight = async () => {
    if (!selectedTenant) return;
    
    // Store tenant before swiping
    setMatchedTenant(selectedTenant);
    
    await swipeRight(selectedTenant.matchId);
    // Close detail modal, match modal will show via useEffect
    setShowDetailModal(false);
    // Move to next card
    swiperRef.current?.swipeRight();
  };

  // Handle Chat Now button press
  const handleChatNow = async () => {
    if (!matchedTenant || isStartingChat) return;
    
    setIsStartingChat(true);
    try {
      // Pass tenant_id for landlord to start conversation
      const conversation = await startConversation(matchedTenant.property.id, matchedTenant.tenantId);
      if (conversation) {
        setShowMatchModal(false);
        clearLastResult();
        navigation?.navigate('Chat', {
          conversation: {
            ...conversation,
            property_title: `${matchedTenant.property.neighborhood}`,
            other_user_name: matchedTenant.name,
          }
        });
      } else {
        console.error('Failed to start conversation - no conversation returned');
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleModalSwipeLeft = async () => {
    if (!selectedTenant) return;
    await swipeLeft(selectedTenant.matchId);
    // Move to next card
    swiperRef.current?.swipeLeft();
  };

  // Show loading state
  if (isLoadingFeed) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Finding interested tenants...</Text>
      </View>
    );
  }

  // Show empty state
  if (!tenantFeed || tenantFeed.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No Interested Tenants</Text>
        <Text style={styles.emptyText}>
          When tenants swipe right on your properties, they'll appear here for you to review
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={() => loadTenantFeed()}>
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
          cards={tenantFeed}
          key={`swiper-${tenantFeed.length}`}
          renderCard={(tenant, cardIndex) => (
            <TenantSwipeCard 
              tenant={tenant}
              totalPending={totalPending}
              onPress={() => handleCardPress(tenant)}
              isActive={cardIndex === currentIndex}
            />
          )}
          onSwipedLeft={handleSwipeLeft}
          onSwipedRight={handleSwipeRight}
          onSwiped={(index) => setCurrentIndex(index + 1)}
          cardIndex={0}
          backgroundColor="transparent"
          stackSize={3}
          stackScale={5}
          stackSeparation={10}
          disableBottomSwipe
          disableTopSwipe
          cardVerticalMargin={0}
          cardHorizontalMargin={0}
          overlayLabels={{
            left: {
              title: 'PASS',
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
              title: 'INTERESTED',
              style: {
                label: {
                  backgroundColor: '#10b981',
                  color: '#fff',
                  fontSize: 28,
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
          }}
          animateOverlayLabelsOpacity
          animateCardOpacity
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

      {/* Match Modal */}
      <Modal
        visible={showMatchModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowMatchModal(false);
          clearLastResult();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.matchModal}>
            <Text style={styles.matchEmoji}>🎉</Text>
            <Text style={styles.matchTitle}>It's a Match!</Text>
            <Text style={styles.matchMessage}>
              You and {matchedTenant?.name || 'the tenant'} are both interested.
              {'\n'}Start chatting now!
            </Text>
            <View style={styles.matchButtonsRow}>
              <TouchableOpacity
                style={styles.matchLaterButton}
                onPress={() => {
                  setShowMatchModal(false);
                  clearLastResult();
                }}
              >
                <Text style={styles.matchLaterButtonText}>Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.matchChatButton}
                onPress={handleChatNow}
                disabled={isStartingChat}
              >
                {isStartingChat ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.matchChatButtonText}>Chat Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tenant Detail Modal */}
      <TenantDetailModal
        visible={showDetailModal}
        tenant={selectedTenant}
        onClose={() => setShowDetailModal(false)}
        onSwipeLeft={handleModalSwipeLeft}
        onSwipeRight={handleModalSwipeRight}
      />
    </View>
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
  cardImageStyle: {
    borderRadius: 20,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
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
    paddingVertical: 8,
  },
  pendingBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  verifiedBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 115 : 95,
    right: 16,
    backgroundColor: '#4cd964',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  cardContent: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    gap: 10,
  },
  nameContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  nameBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 12,
    marginHorizontal: -12,
    marginVertical: -6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  name: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  age: {
    fontSize: 26,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  coupleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  coupleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  workContainer: {
    position: 'relative',
  },
  infoBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    marginHorizontal: -10,
    marginVertical: -4,
  },
  workRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  incomeContainer: {
    position: 'relative',
    alignItems: 'flex-start',
  },
  incomeBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    marginHorizontal: -12,
    marginVertical: -6,
  },
  incomeAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  incomePeriod: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginTop: -2,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  budgetContainer: {
    position: 'relative',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  highlightsContainer: {
    position: 'relative',
    marginTop: 4,
  },
  highlightsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 12,
    marginHorizontal: -10,
    marginVertical: -6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  highlights: {
    gap: 4,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightIcon: {
    fontSize: 14,
  },
  highlightText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  interestContainer: {
    position: 'relative',
    marginTop: 4,
  },
  interestBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 193, 7, 0.25)',
    borderRadius: 12,
    marginHorizontal: -10,
    marginVertical: -6,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.4)',
  },
  interestLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  interestMessage: {
    fontSize: 13,
    color: '#fff',
    fontStyle: 'italic',
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  verificationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  verificationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 217, 100, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.4)',
  },
  verificationChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tagChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagChipText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  propertyText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 50,
    gap: 40,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchModal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 32,
  },
  matchEmoji: {
    fontSize: 64,
  },
  matchTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366f1',
    marginTop: 16,
  },
  matchMessage: {
    fontSize: 16,
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  matchButtonsRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  matchLaterButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  matchLaterButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  matchChatButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    minWidth: 120,
    alignItems: 'center',
  },
  matchChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LandlordExploreScreen;
