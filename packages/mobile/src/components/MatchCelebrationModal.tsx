/**
 * Match Celebration Modal
 * 
 * Shows a celebratory animation when a new match occurs.
 * Displays confetti, property info, and quick actions.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMatchNotification } from '../contexts/MatchNotificationContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MatchCelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  onChat: () => void;
  propertyTitle: string;
  landlordName?: string;
}

// Confetti particle component
const ConfettiParticle: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(Math.random() * SCREEN_WIDTH)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT + 50,
        duration: 3000 + Math.random() * 2000,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: translateX._value + (Math.random() - 0.5) * 200,
        duration: 3000 + Math.random() * 2000,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
        duration: 3000,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 3000,
        delay: delay + 2000,
        useNativeDriver: true,
      }),
    ]);

    animation.start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: color,
          transform: [
            { translateY },
            { translateX },
            {
              rotate: rotate.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
          opacity,
        },
      ]}
    />
  );
};

export const MatchCelebrationModal: React.FC<MatchCelebrationModalProps> = ({
  visible,
  onClose,
  onChat,
  propertyTitle,
  landlordName,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      heartScale.setValue(0);

      // Animate in
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(heartScale, {
          toValue: 1,
          friction: 3,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const confettiColors = ['#ef4444', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Confetti */}
        {visible &&
          Array.from({ length: 50 }).map((_, i) => (
            <ConfettiParticle
              key={i}
              delay={i * 50}
              color={confettiColors[i % confettiColors.length]}
            />
          ))}

        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#6366f1', '#8b5cf6', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Animated Heart */}
            <Animated.View
              style={[
                styles.heartContainer,
                {
                  transform: [{ scale: heartScale }],
                },
              ]}
            >
              <View style={styles.heartBg}>
                <Ionicons name="heart" size={80} color="#fff" />
              </View>
            </Animated.View>

            {/* Title */}
            <Text style={styles.title}>It's a Match! 🎉</Text>
            <Text style={styles.subtitle}>
              You and {landlordName || 'the landlord'} both expressed interest
            </Text>

            {/* Property Info */}
            <View style={styles.propertyCard}>
              <Ionicons name="home" size={24} color="#6366f1" />
              <Text style={styles.propertyTitle} numberOfLines={2}>
                {propertyTitle}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.chatButton} onPress={onChat}>
                <Ionicons name="chatbubbles" size={20} color="#fff" />
                <Text style={styles.chatButtonText}>Start Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.laterButton} onPress={onClose}>
                <Text style={styles.laterButtonText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 20,
    borderRadius: 2,
  },
  modalContent: {
    width: SCREEN_WIDTH * 0.85,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  gradient: {
    padding: 32,
    alignItems: 'center',
  },
  heartContainer: {
    marginBottom: 24,
  },
  heartBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
  },
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    gap: 12,
  },
  propertyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  laterButton: {
    alignItems: 'center',
    padding: 12,
  },
  laterButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default MatchCelebrationModal;
