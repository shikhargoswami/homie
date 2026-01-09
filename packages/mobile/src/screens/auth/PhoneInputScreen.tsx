import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  navigation: any;
}

export const PhoneInputScreen: React.FC<Props> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const { requestOTP, isRequestingOTP } = useAuth();

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a 10-digit phone number');
      return;
    }

    if (!/^[6-9][0-9]{9}$/.test(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid Indian phone number');
      return;
    }

    try {
      await requestOTP(phone);
      navigation.navigate('OTPVerification', { phone });
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || 'Failed to send OTP. Please try again.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Homie</Text>
        <Text style={styles.subtitle}>Find your perfect home with AI-powered matching</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneInputWrapper}>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="9876543210"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              editable={!isRequestingOTP}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, isRequestingOTP && styles.buttonDisabled]}
          onPress={handleSendOTP}
          disabled={isRequestingOTP}
        >
          {isRequestingOTP ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send OTP</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 48 },
  inputContainer: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  countryCode: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginRight: 12 },
  phoneInput: { flex: 1, fontSize: 16, color: '#1a1a1a' },
  button: {
    backgroundColor: '#6366f1',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  disclaimer: { fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 18 },
});
