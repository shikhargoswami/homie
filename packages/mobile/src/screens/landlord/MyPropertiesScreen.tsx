import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '@services/api';

/**
 * My Properties Screen
 * 
 * Lists all properties owned by the landlord
 * - View property status
 * - Edit property details
 * - View tenant inquiries
 * - Toggle listing status
 */

interface Property {
  id: string;
  address: string;
  neighborhood: string;
  city: string;
  configuration: string;
  rent: number;
  status: 'available' | 'rented' | 'maintenance' | 'draft';
  photos: string[];
  inquiryCount: number;
  matchCount: number;
  viewCount: number;
  createdAt: string;
}

interface Props {
  navigation: any;
}

export const MyPropertiesScreen: React.FC<Props> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filter, setFilter] = useState<'all' | 'available' | 'rented'>('all');

  const loadProperties = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    
    try {
      const response = await apiClient.get<{ success: boolean; data: { properties: Property[] } }>(
        '/api/landlord/properties'
      );
      
      if (response.success) {
        setProperties(response.data.properties);
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
      // Demo data
      setProperties([
        {
          id: '1',
          address: '123 MG Road',
          neighborhood: 'Koramangala',
          city: 'Bangalore',
          configuration: '2bhk',
          rent: 35000,
          status: 'available',
          photos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'],
          inquiryCount: 5,
          matchCount: 3,
          viewCount: 120,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          address: '456 HSR Layout',
          neighborhood: 'HSR Layout',
          city: 'Bangalore',
          configuration: '3bhk',
          rent: 50000,
          status: 'rented',
          photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'],
          inquiryCount: 0,
          matchCount: 8,
          viewCount: 250,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProperties();
    }, [])
  );

  const filteredProperties = properties.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const handleToggleStatus = async (property: Property) => {
    const newStatus = property.status === 'available' ? 'rented' : 'available';
    
    Alert.alert(
      'Update Status',
      `Mark this property as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await apiClient.patch(`/api/landlord/properties/${property.id}/status`, {
                status: newStatus,
              });
              loadProperties();
            } catch (error) {
              Alert.alert('Error', 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  const handleDeleteProperty = (property: Property) => {
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/landlord/properties/${property.id}`);
              loadProperties();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete property');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: Property['status']) => {
    switch (status) {
      case 'available': return '#059669';
      case 'rented': return '#6366f1';
      case 'maintenance': return '#D97706';
      case 'draft': return '#666';
      default: return '#666';
    }
  };

  const renderProperty = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => navigation.navigate('EditProperty', { propertyId: item.id })}
    >
      <Image
        source={{ uri: item.photos[0] || 'https://via.placeholder.com/150' }}
        style={styles.propertyImage}
      />
      
      <View style={styles.propertyInfo}>
        <View style={styles.propertyHeader}>
          <Text style={styles.propertyConfig}>{item.configuration.toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>
        
        <Text style={styles.propertyAddress} numberOfLines={1}>
          {item.address}
        </Text>
        <Text style={styles.propertyLocation}>
          {item.neighborhood}, {item.city}
        </Text>
        
        <Text style={styles.propertyRent}>₹{item.rent.toLocaleString()}/month</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="eye-outline" size={14} color="#666" />
            <Text style={styles.statText}>{item.viewCount}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="heart-outline" size={14} color="#666" />
            <Text style={styles.statText}>{item.matchCount}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubble-outline" size={14} color="#666" />
            <Text style={styles.statText}>{item.inquiryCount}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => {
          Alert.alert(
            'Property Actions',
            '',
            [
              {
                text: 'Edit',
                onPress: () => navigation.navigate('EditProperty', { propertyId: item.id }),
              },
              {
                text: item.status === 'available' ? 'Mark as Rented' : 'Mark as Available',
                onPress: () => handleToggleStatus(item),
              },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => handleDeleteProperty(item),
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }}
      >
        <Ionicons name="ellipsis-vertical" size={20} color="#666" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Properties</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddProperty')}
        >
          <Ionicons name="add" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'available', 'rented'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Properties List */}
      <FlatList
        data={filteredProperties}
        renderItem={renderProperty}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadProperties(true)} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="home-outline" size={64} color="#ddd" />
            <Text style={styles.emptyText}>No properties yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first property to start receiving tenant matches
            </Text>
            <TouchableOpacity
              style={styles.addPropertyButton}
              onPress={() => navigation.navigate('AddProperty')}
            >
              <Text style={styles.addPropertyButtonText}>Add Property</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterTabActive: {
    backgroundColor: '#6366f1',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  propertyCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  propertyImage: {
    width: 100,
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  propertyInfo: {
    flex: 1,
    padding: 12,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  propertyConfig: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  propertyAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  propertyLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  propertyRent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  menuButton: {
    padding: 12,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  addPropertyButton: {
    marginTop: 24,
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addPropertyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default MyPropertiesScreen;
