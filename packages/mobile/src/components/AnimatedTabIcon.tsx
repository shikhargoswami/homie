/**
 * Animated Tab Bar Icon Component
 * 
 * Displays a tab bar icon with optional badge and animations.
 * Used in the bottom tab navigator for visual feedback.
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AnimatedTabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
  badgeCount?: number;
  scaleAnim?: Animated.Value;
  rotateAnim?: Animated.Value;
  pulseAnim?: Animated.Value;
}

export const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
  name,
  color,
  size,
  focused,
  badgeCount = 0,
  scaleAnim,
  rotateAnim,
  pulseAnim,
}) => {
  // Combine all transform animations
  const getTransformStyle = () => {
    const transforms: any[] = [];
    
    if (pulseAnim) {
      transforms.push({ scale: pulseAnim });
    }
    
    if (scaleAnim && badgeCount > 0) {
      transforms.push({ scale: scaleAnim });
    }
    
    if (rotateAnim && badgeCount > 0) {
      transforms.push({
        rotate: rotateAnim.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: ['-15deg', '0deg', '15deg'],
        }),
      });
    }
    
    return transforms.length > 0 ? { transform: transforms } : {};
  };

  return (
    <Animated.View style={[styles.container, getTransformStyle()]}>
      <Ionicons name={name} size={size} color={color} />
      
      {badgeCount > 0 && (
        <Animated.View 
          style={[
            styles.badge,
            scaleAnim ? {
              transform: [{ scale: scaleAnim }],
            } : {},
          ]}
        >
          <Text style={styles.badgeText}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

/**
 * Match Tab Icon with celebration badge
 */
export const MatchTabIcon: React.FC<{
  focused: boolean;
  color: string;
  size: number;
  badgeCount: number;
  scaleAnim: Animated.Value;
  rotateAnim: Animated.Value;
  pulseAnim: Animated.Value;
}> = ({ focused, color, size, badgeCount, scaleAnim, rotateAnim, pulseAnim }) => {
  const iconName = focused ? 'heart' : 'heart-outline';
  
  return (
    <AnimatedTabIcon
      name={iconName}
      color={badgeCount > 0 ? '#ef4444' : color}
      size={size}
      focused={focused}
      badgeCount={badgeCount}
      scaleAnim={scaleAnim}
      rotateAnim={rotateAnim}
      pulseAnim={pulseAnim}
    />
  );
};

/**
 * Message Tab Icon with unread badge
 */
export const MessageTabIcon: React.FC<{
  focused: boolean;
  color: string;
  size: number;
  badgeCount: number;
  scaleAnim: Animated.Value;
  pulseAnim: Animated.Value;
}> = ({ focused, color, size, badgeCount, scaleAnim, pulseAnim }) => {
  const iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
  
  return (
    <AnimatedTabIcon
      name={iconName}
      color={badgeCount > 0 ? '#6366f1' : color}
      size={size}
      focused={focused}
      badgeCount={badgeCount}
      scaleAnim={scaleAnim}
      pulseAnim={pulseAnim}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default AnimatedTabIcon;
