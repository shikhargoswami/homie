import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchPlaces, getPlaceDetails, PlacePrediction, PlaceDetails } from '../../services/places.service';

interface LocationAutocompleteProps {
  /**
   * Current value of the input
   */
  value: string;
  
  /**
   * Callback when a place is selected
   */
  onPlaceSelect: (place: PlaceDetails, displayText: string) => void;
  
  /**
   * Callback when text changes (for controlled input)
   */
  onChangeText?: (text: string) => void;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Label text above input
   */
  label?: string;
  
  /**
   * Place types to filter (e.g., 'establishment', 'geocode')
   */
  types?: string;
  
  /**
   * Location to bias results towards
   */
  biasLocation?: { lat: number; lng: number };
  
  /**
   * Radius in meters for location bias
   */
  biasRadius?: number;
  
  /**
   * Whether the input is required
   */
  required?: boolean;
  
  /**
   * Custom styles for the container
   */
  containerStyle?: object;
  
  /**
   * Whether to show the "Use current location" option
   */
  showCurrentLocation?: boolean;
  
  /**
   * Callback when "Use current location" is pressed
   */
  onCurrentLocationPress?: () => void;
  
  /**
   * Quick select options to show below input
   */
  quickSelectOptions?: string[];
  
  /**
   * Whether input is disabled
   */
  disabled?: boolean;
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

const DEBOUNCE_MS = 300;

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onPlaceSelect,
  onChangeText,
  placeholder = 'Search for a location',
  label,
  types,
  biasLocation,
  biasRadius = 50000, // 50km default
  required = false,
  containerStyle,
  showCurrentLocation = false,
  onCurrentLocationPress,
  quickSelectOptions = [],
  disabled = false,
  testID,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Sync external value changes
  useEffect(() => {
    if (value !== inputValue && !isFocused) {
      setInputValue(value);
    }
  }, [value]);

  const handleSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchPlaces(query, {
        types,
        lat: biasLocation?.lat,
        lng: biasLocation?.lng,
        radius: biasRadius,
      });
      setPredictions(results);
    } catch (error) {
      console.error('Search error:', error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, [types, biasLocation, biasRadius]);

  const handleTextChange = (text: string) => {
    setInputValue(text);
    onChangeText?.(text);
    setShowSuggestions(true);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      handleSearch(text);
    }, DEBOUNCE_MS);
  };

  const handlePlaceSelect = async (prediction: PlacePrediction) => {
    setIsLoading(true);
    Keyboard.dismiss();
    
    try {
      const details = await getPlaceDetails(prediction.placeId);
      
      if (details) {
        setInputValue(prediction.mainText);
        onChangeText?.(prediction.mainText);
        setShowSuggestions(false);
        setPredictions([]);
        onPlaceSelect(details, prediction.mainText);
      }
    } catch (error) {
      console.error('Failed to get place details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = async (location: string) => {
    setInputValue(location);
    onChangeText?.(location);
    setShowSuggestions(true);
    
    // Trigger search for the quick select
    handleSearch(location);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (inputValue.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow tap to register
    setTimeout(() => {
      if (!isFocused) {
        setShowSuggestions(false);
      }
    }, 200);
  };

  const clearInput = () => {
    setInputValue('');
    onChangeText?.('');
    setPredictions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const renderPredictionItem = ({ item }: { item: PlacePrediction }) => (
    <TouchableOpacity
      style={styles.predictionItem}
      onPress={() => handlePlaceSelect(item)}
      activeOpacity={0.7}
    >
      <Ionicons name="location-outline" size={18} color="#6b7280" />
      <View style={styles.predictionTextContainer}>
        <Text style={styles.predictionMainText} numberOfLines={1}>
          {item.mainText}
        </Text>
        {item.secondaryText ? (
          <Text style={styles.predictionSecondaryText} numberOfLines={1}>
            {item.secondaryText}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        disabled && styles.inputContainerDisabled,
      ]}>
        <Ionicons 
          name="search" 
          size={20} 
          color={isFocused ? '#6366f1' : '#9ca3af'} 
          style={styles.searchIcon}
        />
        
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={inputValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
          testID={testID ? `${testID}-input` : undefined}
        />
        
        {isLoading ? (
          <ActivityIndicator size="small" color="#6366f1" style={styles.rightIcon} />
        ) : inputValue.length > 0 ? (
          <TouchableOpacity onPress={clearInput} style={styles.rightIcon}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Suggestions dropdown */}
      {showSuggestions && predictions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.placeId}
            renderItem={renderPredictionItem}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.suggestionsList}
          />
        </View>
      )}

      {/* Current location option */}
      {showCurrentLocation && onCurrentLocationPress && !showSuggestions && (
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={onCurrentLocationPress}
          activeOpacity={0.7}
        >
          <Ionicons name="locate" size={18} color="#6366f1" />
          <Text style={styles.currentLocationText}>Use current location</Text>
        </TouchableOpacity>
      )}

      {/* Quick select options */}
      {quickSelectOptions.length > 0 && !showSuggestions && (
        <View style={styles.quickSelectContainer}>
          <Text style={styles.quickSelectLabel}>Popular areas:</Text>
          <View style={styles.quickSelectChips}>
            {quickSelectOptions.slice(0, 5).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.quickSelectChip,
                  inputValue === option && styles.quickSelectChipSelected,
                ]}
                onPress={() => handleQuickSelect(option)}
              >
                <Text
                  style={[
                    styles.quickSelectChipText,
                    inputValue === option && styles.quickSelectChipTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
  },
  inputContainerFocused: {
    borderColor: '#6366f1',
    backgroundColor: '#fff',
  },
  inputContainerDisabled: {
    backgroundColor: '#f3f4f6',
    opacity: 0.7,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: '#111827',
  },
  rightIcon: {
    padding: 4,
  },
  suggestionsContainer: {
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 250,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  suggestionsList: {
    borderRadius: 12,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  predictionTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  predictionMainText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  predictionSecondaryText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  currentLocationText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '500',
  },
  quickSelectContainer: {
    marginTop: 12,
  },
  quickSelectLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  quickSelectChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickSelectChipSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  quickSelectChipText: {
    fontSize: 13,
    color: '#4b5563',
  },
  quickSelectChipTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default LocationAutocomplete;
