import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Service definitions matching original code
const FREELANCER_SERVICES = [
  { id: 'photographer', name: 'Photographer', icon: 'camera' },
  { id: 'videographer', name: 'Videographer', icon: 'videocam' },
  { id: 'album_designer', name: 'Album Designer', icon: 'images' },
  { id: 'video_editor', name: 'Video Editor', icon: 'cut' },
  { id: 'web_live_services', name: 'Web/Live Services', icon: 'desktop' },
  { id: 'led_wall', name: 'LED Wall', icon: 'grid' },
  { id: 'fly_cam', name: 'Fly Cam', icon: 'airplane' },
];

const BUSINESS_SERVICES = [
  { id: 'photography_firm', name: 'Photography Firm', icon: 'business' },
  { id: 'camera_rental', name: 'Camera Rental', icon: 'camera' },
  { id: 'service_centres', name: 'Service Centres', icon: 'construct' },
  { id: 'outdoor_studios', name: 'Outdoor Studios', icon: 'sunny' },
  { id: 'editing_studios', name: 'Editing Studios', icon: 'film' },
  { id: 'printing_labs', name: 'Printing Labs', icon: 'print' },
];

// Specialties per service type
const SPECIALTIES: { [key: string]: string[] } = {
  photographer: ['Traditional', 'Candid', 'Fashion', 'Product', 'Newborn', 'Architecture', 'Wildlife', 'Sports', 'Travel', 'Aerial'],
  videographer: ['Traditional', 'Candid', 'Fashion', 'Product', 'Newborn', 'Architecture', 'Sports', 'Travel'],
  photography_firm: ['Wedding', 'Corporate Event', 'Birthday', 'Other Parties'],
};

// Pricing fields per service type
const PRICING_FIELDS: { [key: string]: { key: string; label: string }[] } = {
  photographer: [
    { key: 'price_6_hours', label: '6 Hours' },
    { key: 'price_8_hours', label: '8 Hours' },
    { key: 'price_12_hours', label: '12 Hours' },
  ],
  videographer: [
    { key: 'price_6_hours', label: '6 Hours' },
    { key: 'price_8_hours', label: '8 Hours' },
    { key: 'price_12_hours', label: '12 Hours' },
  ],
  album_designer: [
    { key: 'price_per_pic', label: 'Per Picture' },
    { key: 'price_per_page', label: 'Per Page' },
  ],
  video_editor: [
    { key: 'price_per_minute', label: 'Per Minute' },
    { key: 'price_per_hour', label: 'Per Hour' },
  ],
  web_live_services: [
    { key: 'price_6_hours', label: '6 Hours' },
    { key: 'price_8_hours', label: '8 Hours' },
    { key: 'price_12_hours', label: '12 Hours' },
  ],
  led_wall: [
    { key: 'price_6_hours', label: '6 Hours' },
    { key: 'price_8_hours', label: '8 Hours' },
    { key: 'price_12_hours', label: '12 Hours' },
  ],
  fly_cam: [
    { key: 'price_6_hours', label: '6 Hours' },
    { key: 'price_8_hours', label: '8 Hours' },
    { key: 'price_12_hours', label: '12 Hours' },
  ],
  photography_firm: [
    { key: 'price_per_event', label: 'Per Event' },
    { key: 'price_per_album', label: 'Per Album' },
    { key: 'price_per_video', label: 'Per Video' },
  ],
  outdoor_studios: [
    { key: 'price_4_hours', label: '4 Hours' },
    { key: 'price_6_hours', label: '6 Hours' },
    { key: 'price_8_hours', label: '8 Hours' },
  ],
  editing_studios: [
    { key: 'price_per_minute', label: 'Per Minute' },
    { key: 'price_per_hour', label: 'Per Hour' },
  ],
  printing_labs: [
    { key: 'price_per_sheet', label: 'Per Sheet' },
    { key: 'price_per_album_cover', label: 'Per Album Cover' },
    { key: 'price_per_poster', label: 'Per Poster' },
    { key: 'price_per_album_box', label: 'Per Album Box' },
  ],
};

// Quality options for streaming services
const QUALITY_OPTIONS = ['4K', '2K', 'HD', 'P2', 'P3', 'P4', 'P5', 'P6'];

export default function MyServicesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'selection' | 'editor'>('selection');
  const [editingService, setEditingService] = useState<string | null>(null);
  
  // Service editor state
  const [yearsExperience, setYearsExperience] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedQualityOptions, setSelectedQualityOptions] = useState<string[]>([]);
  const [pricing, setPricing] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('session_token');

      // Load profile
      const profileRes = await axios.get(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(profileRes.data);

      // Load selected services
      const servicesRes = await axios.get(`${API_URL}/api/user-services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const serviceIds = servicesRes.data.map((s: any) => s.service_id);
      setSelectedServices(serviceIds);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleService = (serviceId: string, category: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const saveSelectedServices = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('session_token');
      
      const services = selectedServices.map(id => {
        const isFreelancer = FREELANCER_SERVICES.find(s => s.id === id);
        return {
          service_id: id,
          service_category: isFreelancer ? 'freelancer' : 'business',
        };
      });

      await axios.post(
        `${API_URL}/api/user-services`,
        { services },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', 'Services saved! Now set up each service profile.');
    } catch (error) {
      console.error('Save services error:', error);
      Alert.alert('Error', 'Failed to save services');
    } finally {
      setSaving(false);
    }
  };

  const openServiceEditor = async (serviceId: string) => {
    setEditingService(serviceId);
    setActiveView('editor');
    
    // Load service details
    try {
      const token = await AsyncStorage.getItem('session_token');
      
      const [detailsRes, pricingRes] = await Promise.all([
        axios.get(`${API_URL}/api/services/details/${serviceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: {} })),
        axios.get(`${API_URL}/api/services/pricing/${serviceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: {} })),
      ]);

      const details = detailsRes.data || {};
      setYearsExperience(details.years_experience?.toString() || '');
      setSelectedSpecialties(details.specialties ? JSON.parse(details.specialties) : []);
      setSelectedQualityOptions(details.quality_options ? JSON.parse(details.quality_options) : []);
      
      const pricingData = pricingRes.data || {};
      const pricingState: { [key: string]: string } = {};
      Object.keys(pricingData).forEach(key => {
        if (pricingData[key]) pricingState[key] = pricingData[key].toString();
      });
      setPricing(pricingState);
    } catch (error) {
      console.error('Load service details error:', error);
    }
  };

  const saveServiceProfile = async () => {
    if (!editingService) return;
    
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('session_token');

      // Save details
      await axios.post(
        `${API_URL}/api/services/details`,
        {
          service_type: editingService,
          years_experience: parseInt(yearsExperience) || 0,
          specialties: JSON.stringify(selectedSpecialties),
          quality_options: JSON.stringify(selectedQualityOptions),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Save pricing
      const pricingPayload: { [key: string]: any } = { service_type: editingService };
      Object.keys(pricing).forEach(key => {
        pricingPayload[key] = pricing[key] ? parseFloat(pricing[key]) : null;
      });

      await axios.post(
        `${API_URL}/api/services/pricing`,
        pricingPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', 'Service profile saved!');
      setActiveView('selection');
      setEditingService(null);
    } catch (error) {
      console.error('Save service profile error:', error);
      Alert.alert('Error', 'Failed to save service profile');
    } finally {
      setSaving(false);
    }
  };

  const getServiceName = (serviceId: string) => {
    const service = [...FREELANCER_SERVICES, ...BUSINESS_SERVICES].find(s => s.id === serviceId);
    return service?.name || serviceId;
  };

  const getServiceIcon = (serviceId: string) => {
    const service = [...FREELANCER_SERVICES, ...BUSINESS_SERVICES].find(s => s.id === serviceId);
    return service?.icon || 'cube';
  };

  const hasQualityOptions = (serviceId: string) => {
    return ['web_live_services', 'led_wall', 'fly_cam'].includes(serviceId);
  };

  const hasEquipment = (serviceId: string) => {
    return ['photographer', 'videographer'].includes(serviceId);
  };

  // Service Editor View
  if (activeView === 'editor' && editingService) {
    const specialties = SPECIALTIES[editingService] || [];
    const pricingFields = PRICING_FIELDS[editingService] || [];

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={[colors.primary[50], colors.white]} style={styles.gradient}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => { setActiveView('selection'); setEditingService(null); }}>
              <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{getServiceName(editingService)}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Setup Guide */}
            <View style={styles.guideCard}>
              <Text style={styles.guideTitle}>Setup Guide</Text>
              <View style={styles.guideItem}>
                <Ionicons name={yearsExperience ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={yearsExperience ? colors.success : colors.gray[400]} />
                <Text style={styles.guideText}>Add years of experience</Text>
              </View>
              {specialties.length > 0 && (
                <View style={styles.guideItem}>
                  <Ionicons name={selectedSpecialties.length > 0 ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={selectedSpecialties.length > 0 ? colors.success : colors.gray[400]} />
                  <Text style={styles.guideText}>Select your specialties</Text>
                </View>
              )}
              <View style={styles.guideItem}>
                <Ionicons name={Object.values(pricing).some(v => v) ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={Object.values(pricing).some(v => v) ? colors.success : colors.gray[400]} />
                <Text style={styles.guideText}>Set your pricing (required)</Text>
              </View>
            </View>

            {/* Years of Experience */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Years of Experience</Text>
              <TextInput
                style={styles.input}
                value={yearsExperience}
                onChangeText={setYearsExperience}
                keyboardType="numeric"
                placeholder="Enter years"
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            {/* Specialties */}
            {specialties.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Specialties</Text>
                <View style={styles.chipContainer}>
                  {specialties.map((specialty) => (
                    <TouchableOpacity
                      key={specialty}
                      style={[styles.chip, selectedSpecialties.includes(specialty) && styles.chipActive]}
                      onPress={() => {
                        if (selectedSpecialties.includes(specialty)) {
                          setSelectedSpecialties(selectedSpecialties.filter(s => s !== specialty));
                        } else {
                          setSelectedSpecialties([...selectedSpecialties, specialty]);
                        }
                      }}
                    >
                      <Text style={[styles.chipText, selectedSpecialties.includes(specialty) && styles.chipTextActive]}>
                        {specialty}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Quality Options */}
            {hasQualityOptions(editingService) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quality Options</Text>
                <View style={styles.chipContainer}>
                  {QUALITY_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.chip, selectedQualityOptions.includes(option) && styles.chipActive]}
                      onPress={() => {
                        if (selectedQualityOptions.includes(option)) {
                          setSelectedQualityOptions(selectedQualityOptions.filter(o => o !== option));
                        } else {
                          setSelectedQualityOptions([...selectedQualityOptions, option]);
                        }
                      }}
                    >
                      <Text style={[styles.chipText, selectedQualityOptions.includes(option) && styles.chipTextActive]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Pricing */}
            {pricingFields.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pricing (INR)</Text>
                <View style={styles.pricingGrid}>
                  {pricingFields.map((field) => (
                    <View key={field.key} style={styles.pricingItem}>
                      <Text style={styles.pricingLabel}>{field.label}</Text>
                      <TextInput
                        style={styles.pricingInput}
                        value={pricing[field.key] || ''}
                        onChangeText={(v) => setPricing({ ...pricing, [field.key]: v })}
                        keyboardType="numeric"
                        placeholder="₹0"
                        placeholderTextColor={colors.gray[400]}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Equipment Section */}
            {hasEquipment(editingService) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Equipment</Text>
                <TouchableOpacity 
                  style={styles.equipmentButton}
                  onPress={() => router.push('/my-equipment')}
                >
                  <Ionicons name="camera" size={24} color={colors.primary[600]} />
                  <Text style={styles.equipmentButtonText}>Manage Equipment</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
                </TouchableOpacity>
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={saveServiceProfile} disabled={saving}>
              <LinearGradient colors={[colors.primary[400], colors.primary[600]]} style={styles.saveGradient}>
                <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Service Profile'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Service Selection View
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[colors.primary[50], colors.white]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Services</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={colors.primary[600]} />
            <Text style={styles.infoText}>
              Select your service categories, then tap each service to set up your profile with specialties, pricing, and equipment.
            </Text>
          </View>

          {/* Freelancer Services */}
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>Freelancer Services</Text>
              <View style={[styles.categoryBadge, { backgroundColor: colors.success + '20' }]}>
                <Text style={[styles.categoryBadgeText, { color: colors.success }]}>Individual</Text>
              </View>
            </View>
            <View style={styles.servicesGrid}>
              {FREELANCER_SERVICES.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                    onPress={() => toggleService(service.id, 'freelancer')}
                    onLongPress={() => isSelected && openServiceEditor(service.id)}
                  >
                    <Ionicons
                      name={service.icon as any}
                      size={28}
                      color={isSelected ? colors.primary[600] : colors.gray[400]}
                    />
                    <Text style={[styles.serviceName, isSelected && styles.serviceNameSelected]}>
                      {service.name}
                    </Text>
                    {isSelected && (
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => openServiceEditor(service.id)}
                      >
                        <Text style={styles.editButtonText}>Setup →</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Business Services */}
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>Business Services</Text>
              <View style={[styles.categoryBadge, { backgroundColor: colors.info + '20' }]}>
                <Text style={[styles.categoryBadgeText, { color: colors.info }]}>Company</Text>
              </View>
            </View>
            <View style={styles.servicesGrid}>
              {BUSINESS_SERVICES.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                    onPress={() => toggleService(service.id, 'business')}
                    onLongPress={() => isSelected && openServiceEditor(service.id)}
                  >
                    <Ionicons
                      name={service.icon as any}
                      size={28}
                      color={isSelected ? colors.primary[600] : colors.gray[400]}
                    />
                    <Text style={[styles.serviceName, isSelected && styles.serviceNameSelected]}>
                      {service.name}
                    </Text>
                    {isSelected && (
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => openServiceEditor(service.id)}
                      >
                        <Text style={styles.editButtonText}>Setup →</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Save Button */}
          {selectedServices.length > 0 && (
            <TouchableOpacity style={styles.saveButton} onPress={saveSelectedServices} disabled={saving}>
              <LinearGradient colors={[colors.primary[400], colors.primary[600]]} style={styles.saveGradient}>
                <Text style={styles.saveText}>
                  {saving ? 'Saving...' : `Save ${selectedServices.length} Service(s)`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  headerTitle: { ...typography.h4, color: colors.gray[900] },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 100 },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  infoText: { flex: 1, ...typography.bodySmall, color: colors.primary[800] },
  categorySection: { marginBottom: spacing.xl },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  categoryTitle: { ...typography.h4, color: colors.gray[900] },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  categoryBadgeText: { ...typography.caption, fontWeight: '600' },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  serviceCard: {
    width: (width - spacing.lg * 2 - spacing.sm * 2) / 3,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
    ...shadows.sm,
  },
  serviceCardSelected: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  serviceName: {
    ...typography.caption,
    color: colors.gray[600],
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  serviceNameSelected: { color: colors.primary[700], fontWeight: '600' },
  editButton: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.sm,
  },
  editButtonText: { ...typography.caption, color: colors.white, fontWeight: '600' },
  saveButton: { marginTop: spacing.lg },
  saveGradient: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveText: { ...typography.body, color: colors.white, fontWeight: '700' },
  // Editor Styles
  guideCard: {
    backgroundColor: colors.info + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  guideTitle: { ...typography.body, fontWeight: '700', color: colors.info, marginBottom: spacing.sm },
  guideItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  guideText: { ...typography.bodySmall, color: colors.gray[700] },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.body, fontWeight: '600', color: colors.gray[800], marginBottom: spacing.sm },
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
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  chipActive: { backgroundColor: colors.primary[100], borderColor: colors.primary[400] },
  chipText: { ...typography.bodySmall, color: colors.gray[600] },
  chipTextActive: { color: colors.primary[700], fontWeight: '600' },
  pricingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pricingItem: { width: (width - spacing.lg * 2 - spacing.sm) / 2 },
  pricingLabel: { ...typography.caption, color: colors.gray[600], marginBottom: 4 },
  pricingInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.gray[900],
  },
  equipmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  equipmentButtonText: { flex: 1, ...typography.body, color: colors.gray[800] },
});
