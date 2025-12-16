import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const EQUIPMENT_TYPES = ['Camera', 'Lens', 'Lighting', 'Gimbal', 'Tripod', 'Drone', 'Audio', 'Accessories'];

interface EquipmentRequirement {
  type: string;
  brand: string;
  model: string;
}

export default function EnhancedBookingFlowScreen() {
  const router = useRouter();
  const { service } = useLocalSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [serviceType, setServiceType] = useState(String(service || ''));
  const [city, setCity] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');

  // Equipment requirements for camera rental
  const [equipmentReqs, setEquipmentReqs] = useState<EquipmentRequirement[]>([]);
  const [newEquipType, setNewEquipType] = useState('Camera');
  const [newEquipBrand, setNewEquipBrand] = useState('');
  const [newEquipModel, setNewEquipModel] = useState('');

  const isCameraRental = serviceType === 'camera_rental';

  const addEquipmentRequirement = () => {
    if (!newEquipBrand || !newEquipModel) {
      Alert.alert('Error', 'Please fill equipment details');
      return;
    }

    setEquipmentReqs([...equipmentReqs, {
      type: newEquipType,
      brand: newEquipBrand,
      model: newEquipModel,
    }]);

    setNewEquipBrand('');
    setNewEquipModel('');
  };

  const removeEquipment = (index: number) => {
    setEquipmentReqs(equipmentReqs.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!serviceType || !city || !eventDate) {
        Alert.alert('Error', 'Please fill required fields');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (isCameraRental && equipmentReqs.length === 0) {
        Alert.alert('Error', 'Please add at least one equipment requirement');
        return;
      }
      setStep(3);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('session_token');

      const bookingData: any = {
        provider_id: 'system',
        service_type: serviceType,
        event_date: eventDate,
        event_time: eventTime,
        location: city,
        duration: durationHours ? `${durationHours} hours` : undefined,
        budget: budget ? parseFloat(budget) : undefined,
        special_requirements: notes,
      };

      if (isCameraRental && equipmentReqs.length > 0) {
        bookingData.equipment_requirements = JSON.stringify(equipmentReqs);
      }

      await axios.post(
        `${API_URL}/api/bookings`,
        bookingData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', 'Booking request submitted successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/bookings') },
      ]);
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Failed to submit booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Service</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={styles.stepContainer}>
            <View style={[styles.stepCircle, step >= s && styles.stepCircleActive]}>
              <Text style={[styles.stepText, step >= s && styles.stepTextActive]}>{s}</Text>
            </View>
            {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
          </View>
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Basic Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Service Type *</Text>
                <TextInput
                  style={styles.input}
                  value={serviceType}
                  onChangeText={setServiceType}
                  placeholder="e.g., photographer"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Enter city"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Event Date *</Text>
                <TextInput
                  style={styles.input}
                  value={eventDate}
                  onChangeText={setEventDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Event Time</Text>
                <TextInput
                  style={styles.input}
                  value={eventTime}
                  onChangeText={setEventTime}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>
                {isCameraRental ? 'Equipment Requirements' : 'Additional Details'}
              </Text>

              {isCameraRental ? (
                <View>
                  <View style={styles.equipmentForm}>
                    <Text style={styles.label}>Add Equipment</Text>
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.typeRow}>
                        {EQUIPMENT_TYPES.map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.typeChip,
                              newEquipType === type && styles.typeChipActive,
                            ]}
                            onPress={() => setNewEquipType(type)}
                          >
                            <Text
                              style={[
                                styles.typeText,
                                newEquipType === type && styles.typeTextActive,
                              ]}
                            >
                              {type}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    <TextInput
                      style={styles.input}
                      value={newEquipBrand}
                      onChangeText={setNewEquipBrand}
                      placeholder="Brand (e.g., Canon)"
                      placeholderTextColor={colors.gray[400]}
                    />

                    <TextInput
                      style={styles.input}
                      value={newEquipModel}
                      onChangeText={setNewEquipModel}
                      placeholder="Model (e.g., EOS R5)"
                      placeholderTextColor={colors.gray[400]}
                    />

                    <TouchableOpacity style={styles.addButton} onPress={addEquipmentRequirement}>
                      <LinearGradient
                        colors={[colors.secondary[400], colors.secondary[600]]}
                        style={styles.addButtonGradient}
                      >
                        <Ionicons name="add" size={20} color={colors.white} />
                        <Text style={styles.addButtonText}>Add Equipment</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  {equipmentReqs.map((eq, index) => (
                    <View key={index} style={styles.equipmentCard}>
                      <View style={styles.equipmentInfo}>
                        <Text style={styles.equipmentType}>{eq.type}</Text>
                        <Text style={styles.equipmentDetails}>
                          {eq.brand} {eq.model}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeEquipment(index)}>
                        <Ionicons name="trash" size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Duration (hours)</Text>
                    <TextInput
                      style={styles.input}
                      value={durationHours}
                      onChangeText={setDurationHours}
                      placeholder="e.g., 4"
                      placeholderTextColor={colors.gray[400]}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Budget (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={budget}
                      onChangeText={setBudget}
                      placeholder="Your budget"
                      placeholderTextColor={colors.gray[400]}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Review & Confirm</Text>

              <View style={styles.reviewCard}>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Service:</Text>
                  <Text style={styles.reviewValue}>{serviceType}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>City:</Text>
                  <Text style={styles.reviewValue}>{city}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Date:</Text>
                  <Text style={styles.reviewValue}>{eventDate}</Text>
                </View>
                {eventTime && (
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Time:</Text>
                    <Text style={styles.reviewValue}>{eventTime}</Text>
                  </View>
                )}
                {isCameraRental && equipmentReqs.length > 0 && (
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Equipment:</Text>
                    <Text style={styles.reviewValue}>{equipmentReqs.length} items</Text>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Additional Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any special requirements..."
                  placeholderTextColor={colors.gray[400]}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            disabled={loading}
          >
            <LinearGradient
              colors={[colors.primary[400], colors.primary[600]]}
              style={styles.nextGradient}
            >
              <Text style={styles.nextText}>
                {loading ? 'Submitting...' : step === 3 ? 'Submit Booking' : 'Next'}
              </Text>
              {step < 3 && <Ionicons name="arrow-forward" size={20} color={colors.white} />}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  headerTitle: { ...typography.h4, color: colors.gray[900] },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.primary[500],
  },
  stepText: { ...typography.body, fontWeight: '700', color: colors.gray[600] },
  stepTextActive: { color: colors.white },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.gray[200],
  },
  stepLineActive: {
    backgroundColor: colors.primary[500],
  },
  keyboardView: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  stepContent: { marginBottom: spacing.xl },
  stepTitle: { ...typography.h3, color: colors.gray[900], marginBottom: spacing.lg },
  inputGroup: { marginBottom: spacing.md },
  label: { ...typography.bodySmall, fontWeight: '600', color: colors.gray[700], marginBottom: spacing.sm },
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
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  equipmentForm: { marginBottom: spacing.lg, gap: spacing.md },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  typeChipActive: {
    backgroundColor: colors.secondary[500],
    borderColor: colors.secondary[500],
  },
  typeText: { ...typography.bodySmall, fontWeight: '600', color: colors.gray[600] },
  typeTextActive: { color: colors.white },
  addButton: { marginTop: spacing.sm },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
  },
  addButtonText: { ...typography.body, color: colors.white, fontWeight: '600' },
  equipmentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.secondary[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  equipmentInfo: { flex: 1 },
  equipmentType: { ...typography.body, fontWeight: '700', color: colors.secondary[900] },
  equipmentDetails: { ...typography.bodySmall, color: colors.gray[700] },
  reviewCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  reviewLabel: { ...typography.body, color: colors.gray[600] },
  reviewValue: { ...typography.body, fontWeight: '600', color: colors.gray[900] },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    ...shadows.lg,
  },
  nextButton: {},
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  nextText: { ...typography.body, color: colors.white, fontWeight: '700' },
});