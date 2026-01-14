import React, { useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../hooks/useAuth';
import { Property } from '../services/matching.service';
import { apiClient } from '../services/api';
import { LandlordProvider } from '../contexts/LandlordContext';
import { LandlordSwipeProvider } from '../contexts/LandlordSwipeContext';

// Auth screens
import { PhoneInputScreen } from '../screens/auth/PhoneInputScreen';
import { OTPVerificationScreen } from '../screens/auth/OTPVerificationScreen';
import { UserTypeSelectionScreen, UserType } from '../screens/auth/UserTypeSelectionScreen';
import { TenantOnboardingScreen } from '../screens/auth/TenantOnboardingScreen';
import { LandlordOnboardingScreen } from '../screens/auth/LandlordOnboardingScreen';

// Tenant screens
import { SwipeScreen } from '../screens/tenant/SwipeScreen';
import { PropertyDetailScreen } from '../screens/tenant/PropertyDetailScreen';
import { ProfileScreen } from '../screens/tenant/ProfileScreen';
import { EditProfileScreen } from '../screens/tenant/EditProfileScreen';
import { MatchesScreen } from '../screens/tenant/MatchesScreen';
import { PreferencesScreen } from '../screens/tenant/PreferencesScreen';

// Landlord screens
import { DashboardScreen } from '../screens/landlord/DashboardScreen';
import { MyPropertiesScreen } from '../screens/landlord/MyPropertiesScreen';
import { AddPropertyScreen } from '../screens/landlord/AddPropertyScreen';
import { LandlordMatchesScreen } from '../screens/landlord/LandlordMatchesScreen';
import { LandlordExploreScreen } from '../screens/landlord/LandlordExploreScreen';

// Shared screens
import ChatListScreen from '../screens/shared/ChatListScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import { ViewingsScreen } from '../screens/shared/ViewingsScreen';
import { ScheduleViewingScreen } from '../screens/shared/ScheduleViewingScreen';

// Type definitions for navigation
export type AuthStackParamList = {
  PhoneInput: undefined;
  OTPVerification: { phone: string };
  UserTypeSelection: undefined;
  TenantOnboarding: { searchType: 'full_home' | 'room_sharing' };
  LandlordOnboarding: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  PropertyDetail: { property: Property; isMatched?: boolean };
  Chat: { conversation: { id: string; property_title?: string; other_user_name?: string; [key: string]: any } };
  Preferences: { isOnboarding?: boolean };
  EditProfile: undefined;
  Viewings: { userRole: 'tenant' | 'landlord' };
  ScheduleViewing: { propertyId: string; propertyAddress: string; landlordName: string };
};

export type LandlordStackParamList = {
  LandlordTabs: undefined;
  AddProperty: undefined;
  EditProperty: { propertyId: string };
  PropertyDetail: { property: Property; isMatched?: boolean };
  Chat: { conversation: { id: string; property_title?: string; other_user_name?: string; [key: string]: any } };
  Viewings: { userRole: 'tenant' | 'landlord' };
  LandlordMatches: { tab?: 'interested' | 'matches' } | undefined;
  ViewingDetail: { viewingId: string };
};

// Landlord Tab Navigator param list
export type LandlordTabParamList = {
  Explore: undefined;
  Dashboard: undefined;
  Properties: { filter?: 'all' | 'available' | 'rented' } | undefined;
  Messages: undefined;
  Profile: undefined;
};

// Separate stacks for different navigation contexts
const AppStack = createNativeStackNavigator<AppStackParamList>();
const LandlordStack = createNativeStackNavigator<LandlordStackParamList>();
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator();
const LandlordTab = createBottomTabNavigator<LandlordTabParamList>();

/**
 * Auth Stack Navigator with Onboarding Flow
 */
const AuthStack = ({ 
  initialRouteName = 'PhoneInput',
  refetchUser,
}: { 
  initialRouteName?: keyof AuthStackParamList;
  refetchUser?: () => Promise<void>;
}) => {
  const [isSettingUp, setIsSettingUp] = useState(false);

  const handleUserTypeSelect = async (navigation: any, userType: UserType) => {
    if (userType === 'landlord') {
      navigation.navigate('LandlordOnboarding');
    } else if (userType === 'full_home_tenant') {
      navigation.navigate('TenantOnboarding', { searchType: 'full_home' });
    } else {
      navigation.navigate('TenantOnboarding', { searchType: 'room_sharing' });
    }
  };

  const handleTenantOnboardingComplete = async (navigation: any, preferences: any) => {
    setIsSettingUp(true);
    try {
      // Update user profile and preferences via API
      await apiClient.put('/api/users/profile/onboarding', {
        userType: 'tenant',
        searchType: preferences.searchType,
        name: preferences.name,
        employmentStatus: preferences.employmentStatus,
      });

      await apiClient.put('/api/users/preferences', {
        preferred_locations: preferences.preferredLocations,
        min_budget: parseInt(preferences.budgetMin) || 10000,
        max_budget: parseInt(preferences.budgetMax) || 50000,
        preferred_configuration: preferences.configuration?.[0] || '2bhk',
        preferred_furnishing: preferences.furnishing?.[0] || 'semi-furnished',
        property_types: preferences.propertyType || [],
        gender_preference: preferences.genderPreference,
        lifestyle_preferences: preferences.lifestylePreferences,
      });

      // Mark profile as completed - this will trigger RootNavigator to show main app
      await apiClient.put('/api/users/profile/complete');

      // Force refresh user data to update profileCompleted status
      if (refetchUser) {
        await refetchUser();
      }
      Alert.alert('Welcome!', 'Your profile is set up. Start exploring!');
      // The RootNavigator will automatically switch to main app when user data refreshes
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert('Error', 'Failed to save your preferences. Please try again.');
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleLandlordOnboardingComplete = async (navigation: any, profile: any) => {
    setIsSettingUp(true);
    try {
      // Update user profile to landlord
      await apiClient.put('/api/users/profile/onboarding', {
        userType: 'landlord',
        name: profile.name,
        email: profile.email,
        propertiesCount: profile.propertiesCount,
        experience: profile.experience,
      });

      await apiClient.put('/api/users/preferences', {
        property_types: profile.propertyTypes,
        locations: profile.locations,
      });

      // Mark profile as completed - this will trigger RootNavigator to show main app
      await apiClient.put('/api/users/profile/complete');

      // Force refresh user data to update profileCompleted status
      if (refetchUser) {
        await refetchUser();
      }
      Alert.alert('Welcome!', 'Your landlord profile is ready. Add your first property!');
      // The RootNavigator will automatically switch to main app when user data refreshes
    } catch (error) {
      console.error('Landlord onboarding error:', error);
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    } finally {
      setIsSettingUp(false);
    }
  };

  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <AuthStackNav.Screen name="PhoneInput" component={PhoneInputScreen} />
      <AuthStackNav.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <AuthStackNav.Screen name="UserTypeSelection">
        {(props) => (
          <UserTypeSelectionScreen
            onSelect={(userType) => handleUserTypeSelect(props.navigation, userType)}
            isLoading={isSettingUp}
          />
        )}
      </AuthStackNav.Screen>
      <AuthStackNav.Screen name="TenantOnboarding">
        {(props) => (
          <TenantOnboardingScreen
            searchType={(props.route.params as any)?.searchType || 'full_home'}
            onComplete={(preferences) => handleTenantOnboardingComplete(props.navigation, preferences)}
            onBack={() => props.navigation.goBack()}
            isLoading={isSettingUp}
          />
        )}
      </AuthStackNav.Screen>
      <AuthStackNav.Screen name="LandlordOnboarding">
        {(props) => (
          <LandlordOnboardingScreen
            onComplete={(profile) => handleLandlordOnboardingComplete(props.navigation, profile)}
            onBack={() => props.navigation.goBack()}
            isLoading={isSettingUp}
          />
        )}
      </AuthStackNav.Screen>
    </AuthStackNav.Navigator>
  );
};

/**
 * Main App Navigator (Bottom Tabs for Tenants)
 */
const AppTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Explore') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Matches') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Explore" component={SwipeScreen} />
      <Tab.Screen name="Messages" component={ChatListScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

/**
 * Landlord Bottom Tabs Navigator
 */
const LandlordTabs = () => {
  return (
    <LandlordTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Explore') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Properties') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      })}
    >
      <LandlordTab.Screen name="Explore" component={LandlordExploreScreen} />
      <LandlordTab.Screen name="Dashboard" component={DashboardScreen} />
      <LandlordTab.Screen name="Properties" component={MyPropertiesScreen} />
      <LandlordTab.Screen name="Messages" component={ChatListScreen} />
      <LandlordTab.Screen name="Profile" component={ProfileScreen} />
    </LandlordTab.Navigator>
  );
};

/**
 * Main App Stack for Tenants (wraps tabs + detail screens)
 */
const MainAppStack = () => {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="MainTabs" component={AppTabs} />
      <AppStack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
      <AppStack.Screen name="Chat" component={ChatScreen} />
      <AppStack.Screen name="Preferences" component={PreferencesScreen} />
      <AppStack.Screen name="EditProfile" component={EditProfileScreen} />
      <AppStack.Screen name="Viewings" component={ViewingsScreen} />
      <AppStack.Screen name="ScheduleViewing" component={ScheduleViewingScreen} />
    </AppStack.Navigator>
  );
};

/**
 * Main App Stack for Landlords (wraps tabs + detail screens)
 */
const MainLandlordStack = () => {
  return (
    <LandlordStack.Navigator screenOptions={{ headerShown: false }}>
      <LandlordStack.Screen name="LandlordTabs" component={LandlordTabs} />
      <LandlordStack.Screen name="AddProperty" component={AddPropertyScreen} />
      <LandlordStack.Screen name="EditProperty" component={AddPropertyScreen} />
      <LandlordStack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
      <LandlordStack.Screen name="Chat" component={ChatScreen} />
      <LandlordStack.Screen name="Viewings" component={ViewingsScreen} />
      <LandlordStack.Screen 
        name="LandlordMatches" 
        component={LandlordMatchesScreen}
        options={{ 
          headerShown: true, 
          title: 'Tenant Matches',
          headerBackTitle: 'Back',
        }} 
      />
    </LandlordStack.Navigator>
  );
};

/**
 * Root Navigator
 * 
 * Navigation Decision Tree:
 * 1. Not authenticated → AuthStack (Login flow)
 * 2. Authenticated but profile not completed → AuthStack (starts at UserTypeSelection)
 * 3. Authenticated with completed profile → MainApp (based on role)
 */
export const RootNavigator = () => {
  const { isAuthenticated, isLoadingUser, user, refetchUser } = useAuth();

  console.log('🧭 RootNavigator render:', { isAuthenticated, isLoadingUser, profileCompleted: user?.profileCompleted, role: user?.role });

  if (isLoadingUser) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Determine which navigation stack to show based on user role
  const renderMainApp = () => {
    if (user?.role === 'landlord') {
      return (
        <LandlordProvider>
          <LandlordSwipeProvider>
            <MainLandlordStack />
          </LandlordSwipeProvider>
        </LandlordProvider>
      );
    }
    return <MainAppStack />;
  };

  // Check if user needs to complete onboarding
  const needsOnboarding = isAuthenticated && user && !user.profileCompleted;

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        // Not logged in - show login flow
        <AuthStack refetchUser={refetchUser} />
      ) : needsOnboarding ? (
        // Logged in but profile incomplete - show onboarding
        <AuthStack initialRouteName="UserTypeSelection" refetchUser={refetchUser} />
      ) : (
        // Fully authenticated - show main app
        renderMainApp()
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
