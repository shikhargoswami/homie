import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '@services/api';

/**
 * Viewings Screen
 * 
 * Shows scheduled property viewings for both tenants and landlords
 * - Upcoming viewings
 * - Past viewings
 * - Cancel/reschedule options
 */

interface Viewing {
  id: string;
  propertyId: string;
  propertyAddress: string;
  propertyNeighborhood: string;
  propertyImage: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  counterpartyName: string;
  counterpartyPhone?: string;
  notes?: string;
}

interface Props {
  navigation: any;
  route?: {
    params?: {
      userRole: 'tenant' | 'landlord';
    };
  };
}

export const ViewingsScreen: React.FC<Props> = ({ navigation, route }) => {
  const userRole = route?.params?.userRole || 'tenant';
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  const loadViewings = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    
    try {
      const endpoint = userRole === 'landlord' 
        ? '/api/landlord/viewings' 
        : '/api/tenant/viewings';
      
      const response = await apiClient.get<{ success: boolean; data: { viewings: Viewing[] } }>(
        endpoint
      );
      
      if (response.success) {
        setViewings(response.data.viewings);
      }
    } catch (error) {
      console.error('Failed to load viewings:', error);
      // Demo data
      setViewings([
        {
          id: '1',
          propertyId: 'p1',
          propertyAddress: '123 MG Road',
          propertyNeighborhood: 'Koramangala',
          propertyImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
          date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          time: '10:00 AM',
          status: 'confirmed',
          counterpartyName: userRole === 'tenant' ? 'John (Owner)' : 'Alice (Tenant)',
          counterpartyPhone: '+91 9876543210',
        },
        {
          id: '2',
          propertyId: 'p2',
          propertyAddress: '456 HSR Layout',
          propertyNeighborhood: 'HSR Layout',
          propertyImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
          date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
          time: '2:00 PM',
          status: 'pending',
          counterpartyName: userRole === 'tenant' ? 'Mike (Owner)' : 'Bob (Tenant)',
        },
        {
          id: '3',
          propertyId: 'p3',
          propertyAddress: '789 Indiranagar',
          propertyNeighborhood: 'Indiranagar',
          propertyImage: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400',
          date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
          time: '11:00 AM',
          status: 'completed',
          counterpartyName: userRole === 'tenant' ? 'Sarah (Owner)' : 'Charlie (Tenant)',
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadViewings();
    }, [])
  );

  const filteredViewings = viewings.filter((v) => {
    const viewingDate = new Date(v.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (filter === 'upcoming') {
      return viewingDate >= today && v.status !== 'cancelled' && v.status !== 'completed';
    } else {
      return viewingDate < today || v.status === 'completed' || v.status === 'cancelled';
    }
  });

  const getStatusColor = (status: Viewing['status']) => {
    switch (status) {
      case 'confirmed': return '#059669';
      case 'pending': return '#D97706';
      case 'completed': return '#6366f1';
      case 'cancelled': return '#DC2626';
      default: return '#666';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const handleCancelViewing = (viewing: Viewing) => {
    Alert.alert(
      'Cancel Viewing',
      'Are you sure you want to cancel this viewing?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.patch(`/api/viewings/${viewing.id}/cancel`);
              loadViewings();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel viewing');
            }
          },
        },
      ]
    );
  };

  const handleConfirmViewing = async (viewing: Viewing) => {
    try {
      await apiClient.patch(`/api/viewings/${viewing.id}/confirm`);
      Alert.alert('Success', 'Viewing confirmed!');
      loadViewings();
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm viewing');
    }
  };

  const renderViewing = ({ item }: { item: Viewing }) => (
    <TouchableOpacity
      style={styles.viewingCard}
      onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.propertyId })}
    >
      <Image
        source={{ uri: item.propertyImage }}
        style={styles.propertyImage}
      />
      
      <View style={styles.viewingInfo}>
        <View style={styles.viewingHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>
        
        <Text style={styles.propertyAddress} numberOfLines={1}>
          {item.propertyAddress}
        </Text>
        <Text style={styles.propertyNeighborhood}>
          {item.propertyNeighborhood}
        </Text>
        
        <View style={styles.dateTimeRow}>
          <View style={styles.dateTime}>
            <Ionicons name="calendar-outline" size={14} color="#6366f1" />
            <Text style={styles.dateTimeText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.dateTime}>
            <Ionicons name="time-outline" size={14} color="#6366f1" />
            <Text style={styles.dateTimeText}>{item.time}</Text>
          </View>
        </View>
        
        <View style={styles.counterpartyRow}>
          <Ionicons name="person-outline" size={14} color="#666" />
          <Text style={styles.counterpartyText}>{item.counterpartyName}</Text>
        </View>
      </View>

      {/* Action buttons */}
      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          {userRole === 'landlord' && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => handleConfirmViewing(item)}
            >
              <Ionicons name="checkmark" size={18} color="#059669" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelViewing(item)}
          >
            <Ionicons name="close" size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'confirmed' && item.counterpartyPhone && (
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call-outline" size={18} color="#6366f1" />
        </TouchableOpacity>
      )}
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
        <Text style={styles.headerTitle}>Viewings</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'upcoming' && styles.filterTabActive]}
          onPress={() => setFilter('upcoming')}
        >
          <Text style={[styles.filterTabText, filter === 'upcoming' && styles.filterTabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'past' && styles.filterTabActive]}
          onPress={() => setFilter('past')}
        >
          <Text style={[styles.filterTabText, filter === 'past' && styles.filterTabTextActive]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Viewings List */}
      <FlatList
        data={filteredViewings}
        renderItem={renderViewing}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadViewings(true)} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ddd" />
            <Text style={styles.emptyText}>
              {filter === 'upcoming' ? 'No upcoming viewings' : 'No past viewings'}
            </Text>
            <Text style={styles.emptySubtext}>
              {filter === 'upcoming' && userRole === 'tenant'
                ? 'Schedule a viewing from a property you like'
                : filter === 'upcoming' && userRole === 'landlord'
                ? 'Tenants will request viewings for your properties'
                : 'Your completed and cancelled viewings will appear here'}
            </Text>
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
  placeholder: {
    width: 40,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
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
  viewingCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  propertyImage: {
    width: 90,
    height: 110,
    backgroundColor: '#f0f0f0',
  },
  viewingInfo: {
    flex: 1,
    padding: 12,
  },
  viewingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
  propertyNeighborhood: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dateTimeRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  dateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTimeText: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  counterpartyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  counterpartyText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'column',
    justifyContent: 'center',
    paddingRight: 8,
    gap: 8,
  },
  confirmButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
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
});

export default ViewingsScreen;
