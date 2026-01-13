import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@services/api';

/**
 * Schedule Viewing Screen
 * 
 * Allows tenants to request a viewing for a property
 * - Select date and time
 * - Add optional notes
 * - Submit request to landlord
 */

interface Props {
  navigation: any;
  route: {
    params: {
      propertyId: string;
      propertyAddress: string;
      landlordName: string;
    };
  };
}

const TIME_SLOTS = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
  '6:00 PM',
];

export const ScheduleViewingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { propertyId, propertyAddress, landlordName } = route.params;
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Generate next 7 available dates
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1); // Start from tomorrow
    return date;
  });

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === tomorrow.toDateString()) {
      return { day: 'Tomorrow', date: date.getDate(), month: '' };
    }
    
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Required', 'Please select both date and time for the viewing');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/api/viewings', {
        propertyId,
        date: selectedDate,
        time: selectedTime,
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        'Request Sent',
        `Your viewing request has been sent to ${landlordName}. You'll be notified once they confirm.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Failed to schedule viewing:', error);
      Alert.alert('Error', 'Failed to schedule viewing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Viewing</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Property Info */}
        <View style={styles.propertyInfo}>
          <Ionicons name="home-outline" size={20} color="#6366f1" />
          <Text style={styles.propertyAddress} numberOfLines={2}>
            {propertyAddress}
          </Text>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesContainer}
          >
            {availableDates.map((date) => {
              const formatted = formatDate(date);
              const dateStr = date.toISOString().split('T')[0];
              const isSelected = selectedDate === dateStr;
              
              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                  onPress={() => setSelectedDate(dateStr)}
                >
                  <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
                    {formatted.day}
                  </Text>
                  <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}>
                    {formatted.date}
                  </Text>
                  {formatted.month && (
                    <Text style={[styles.dateMonth, isSelected && styles.dateMonthSelected]}>
                      {formatted.month}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeSlotsGrid}>
            {TIME_SLOTS.map((time) => {
              const isSelected = selectedTime === time;
              
              return (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeSlot, isSelected && styles.timeSlotSelected]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextSelected]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any specific requests or questions for the landlord?"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Summary */}
        {selectedDate && selectedTime && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Viewing Summary</Text>
            <View style={styles.summaryRow}>
              <Ionicons name="calendar-outline" size={18} color="#6366f1" />
              <Text style={styles.summaryText}>
                {new Date(selectedDate).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="time-outline" size={18} color="#6366f1" />
              <Text style={styles.summaryText}>{selectedTime}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="person-outline" size={18} color="#6366f1" />
              <Text style={styles.summaryText}>With {landlordName}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedDate || !selectedTime || isLoading) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!selectedDate || !selectedTime || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="calendar-outline" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Request Viewing</Text>
            </>
          )}
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
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  scrollView: {
    flex: 1,
  },
  propertyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9ff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    gap: 12,
  },
  propertyAddress: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  section: {
    padding: 16,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  datesContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  dateCard: {
    width: 70,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  dateCardSelected: {
    backgroundColor: '#6366f1',
  },
  dateDay: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateDaySelected: {
    color: '#fff',
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  dateNumberSelected: {
    color: '#fff',
  },
  dateMonth: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dateMonthSelected: {
    color: '#fff',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  timeSlotSelected: {
    backgroundColor: '#6366f1',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#666',
  },
  timeSlotTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  notesInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1a1a1a',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  summary: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ScheduleViewingScreen;
