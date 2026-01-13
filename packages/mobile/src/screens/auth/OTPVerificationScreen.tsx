import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '@hooks/useAuth';

/**
 * OTP Verification Screen
 * 
 * User flow:
 * 1. Enter 6-digit OTP from SMS
 * 2. Tap "Verify"
 * 3. On success, navigate to home screen
 * 4. Option to resend OTP
 */

interface Props {
  route: any;
  navigation: any;
}

export const OTPVerificationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { phone } = route.params || {};
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const { verifyOTP, isVerifyingOTP, requestOTP } = useAuth();
  
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Log only once when component mounts
  useEffect(() => {
    console.log('📱 OTPVerificationScreen mounted with phone:', phone);
  }, []);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOTPChange = (value: string, index: number) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOTP = [...otp];
    newOTP[index] = value;
    setOTP(newOTP);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newOTP.every((digit) => digit) && index === 5) {
      handleVerify(newOTP.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode?: string) => {
    console.log('🔘 handleVerify called!', { otpCode, currentOTP: otp.join(''), isVerifyingOTP });
    
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter all 6 digits');
      return;
    }

    console.log('🔐 Verifying OTP:', { phone, otp: code });
    
    try {
      const result = await verifyOTP({ phone, otp: code });
      console.log('✅ OTP verified successfully:', result);
      
      // Check if profile is completed
      const user = result?.data?.user;
      if (user && !user.profileCompleted) {
        // Navigate to user type selection for onboarding
        console.log('📝 Profile not completed, navigating to onboarding...');
        navigation.navigate('UserTypeSelection');
      }
      // If profile is completed, RootNavigator will handle navigation to main app
    } catch (error: any) {
      console.error('❌ OTP verification failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      Alert.alert(
        'Verification Failed',
        error.response?.data?.error?.message || error.message || 'Invalid OTP. Please try again.'
      );
      
      // Clear OTP inputs
      setOTP(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      await requestOTP(phone);
      
      // Reset timer
      setTimer(60);
      setCanResend(false);
      
      Alert.alert('Success', 'OTP sent successfully');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || 'Failed to resend OTP'
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit code to{'\n'}
          <Text style={styles.phone}>+91 {phone}</Text>
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={(value) => handleOTPChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!isVerifyingOTP}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, isVerifyingOTP && styles.buttonDisabled]}
          onPress={() => handleVerify()}
          disabled={isVerifyingOTP}
        >
          {isVerifyingOTP ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>Resend in {timer}s</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.changeNumberButton}
        >
          <Text style={styles.changeNumberText}>Change Phone Number</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 48,
    lineHeight: 24,
  },
  phone: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  otpInputFilled: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f0ff',
  },
  button: {
    backgroundColor: '#6366f1',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  timerText: {
    fontSize: 14,
    color: '#999',
  },
  changeNumberButton: {
    alignItems: 'center',
  },
  changeNumberText: {
    fontSize: 14,
    color: '#666',
  },
});
