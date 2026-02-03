import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';
import { colors, spacing, borderRadius, typography } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function ProfileSetupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [city, setCity] = useState('');
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fullName || !contactNumber || !city) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!isFreelancer && !isBusiness) {
      Alert.alert('Error', 'Please select at least one user type');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/profile/setup', {
        full_name: fullName,
        contact_number: contactNumber,
        city,
        is_freelancer: isFreelancer,
        is_business: isBusiness,
      });

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Profile setup error:', error);
      Alert.alert('Error', 'Failed to setup profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary[50], colors.white]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Tell us about yourself to get started
            </Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Number *</Text>
                <TextInput
                  style={styles.input}
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  placeholder="Enter your contact number"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Enter your city"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={styles.userTypeSection}>
                <Text style={styles.label}>I am a: *</Text>
                
                <TouchableOpacity
                  style={[
                    styles.userTypeCard,
                    isFreelancer && styles.userTypeCardActive,
                  ]}
                  onPress={() => setIsFreelancer(!isFreelancer)}
                  activeOpacity={0.7}
                >
                  <View style={styles.userTypeContent}>
                    <Text style={[
                      styles.userTypeTitle,
                      isFreelancer && styles.userTypeTextActive,
                    ]}>
                      Freelancer
                    </Text>
                    <Text style={styles.userTypeDesc}>
                      Offer photography, videography, or creative services
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.userTypeCard,
                    isBusiness && styles.userTypeCardActive,
                  ]}
                  onPress={() => setIsBusiness(!isBusiness)}
                  activeOpacity={0.7}
                >
                  <View style={styles.userTypeContent}>
                    <Text style={[
                      styles.userTypeTitle,
                      isBusiness && styles.userTypeTextActive,
                    ]}>
                      Business
                    </Text>
                    <Text style={styles.userTypeDesc}>
                      Provide equipment rental, studios, or business services
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary[400], colors.primary[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  <Text style={styles.submitText}>
                    {loading ? 'Setting up...' : 'Continue'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.gray[600],
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    ...typography.body,
    color: colors.gray[900],
  },
  userTypeSection: {
    marginVertical: spacing.md,
  },
  userTypeCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  userTypeCardActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  userTypeContent: {
    gap: spacing.xs,
  },
  userTypeTitle: {
    ...typography.h4,
    fontSize: 18,
    color: colors.gray[900],
  },
  userTypeTextActive: {
    color: colors.primary[700],
  },
  userTypeDesc: {
    ...typography.bodySmall,
    color: colors.gray[600],
  },
  submitButton: {
    marginTop: spacing.lg,
  },
  submitGradient: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  submitText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
});
