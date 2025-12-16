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
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const EQUIPMENT_TYPES = ['Camera', 'Lens', 'Lighting', 'Gimbal', 'Tripod', 'Drone', 'Audio', 'Accessories'];

interface EquipmentItem {
  equipment_id?: string;
  service_type: string;
  equipment_type: string;
  brand: string;
  model: string;
  serial_number: string;
  created_at?: string;
}

export default function MyEquipmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const serviceType = (params.serviceType as string) || 'photographer';
  
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [selectedEquipmentType, setSelectedEquipmentType] = useState('Camera');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  
  // Autocomplete state
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [allModels, setAllModels] = useState<string[]>([]);

  useEffect(() => {
    loadEquipment();
  }, [serviceType]);

  useEffect(() => {
    loadBrands(selectedEquipmentType);
  }, [selectedEquipmentType]);

  useEffect(() => {
    if (brand) {
      loadModels(selectedEquipmentType, brand);
    } else {
      setAllModels([]);
      setModelSuggestions([]);
    }
  }, [brand, selectedEquipmentType]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/equipment/service/${serviceType}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEquipment(response.data || []);
    } catch (error) {
      console.error('Load equipment error:', error);
      // Try alternate endpoint
      try {
        const token = await AsyncStorage.getItem('session_token');
        const response = await axios.get(`${API_URL}/api/equipment/my-equipment`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEquipment(response.data || []);
      } catch (e) {
        console.error('Fallback load error:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async (equipmentType: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/equipment/brands?equipment_type=${equipmentType}`);
      setAllBrands(response.data.brands || []);
      setBrandSuggestions(response.data.brands || []);
    } catch (error) {
      console.error('Load brands error:', error);
    }
  };

  const loadModels = async (equipmentType: string, brandName: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/equipment/models?equipment_type=${equipmentType}&brand=${brandName}`);
      setAllModels(response.data.models || []);
      setModelSuggestions(response.data.models || []);
    } catch (error) {
      console.error('Load models error:', error);
    }
  };

  const filterBrands = (text: string) => {
    setBrand(text);
    if (text) {
      const filtered = allBrands.filter(b => b.toLowerCase().includes(text.toLowerCase()));
      setBrandSuggestions(filtered);
      setShowBrandDropdown(filtered.length > 0);
    } else {
      setBrandSuggestions(allBrands);
      setShowBrandDropdown(true);
    }
    // Reset model when brand changes
    setModel('');
    setModelSuggestions([]);
  };

  const filterModels = (text: string) => {
    setModel(text);
    if (text) {
      const filtered = allModels.filter(m => m.toLowerCase().includes(text.toLowerCase()));
      setModelSuggestions(filtered);
      setShowModelDropdown(filtered.length > 0);
    } else {
      setModelSuggestions(allModels);
      setShowModelDropdown(true);
    }
  };

  const selectBrand = (selectedBrand: string) => {
    setBrand(selectedBrand);
    setShowBrandDropdown(false);
    // Load models for this brand
    loadModels(selectedEquipmentType, selectedBrand);
  };

  const selectModel = (selectedModel: string) => {
    setModel(selectedModel);
    setShowModelDropdown(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEquipment();
    setRefreshing(false);
  };

  const resetForm = () => {
    setSelectedEquipmentType('Camera');
    setBrand('');
    setModel('');
    setSerialNumber('');
    setShowBrandDropdown(false);
    setShowModelDropdown(false);
  };

  const handleAddEquipment = async () => {
    if (!brand || !model || !serialNumber) {
      Alert.alert('Error', 'Please fill in brand, model, and serial number');
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('session_token');

      await axios.post(
        `${API_URL}/api/equipment/service`,
        {
          service_type: serviceType,
          equipment_type: selectedEquipmentType,
          brand,
          model,
          serial_number: serialNumber,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', 'Equipment added successfully!');
      setShowAddModal(false);
      resetForm();
      await loadEquipment();
    } catch (error: any) {
      console.error('Add equipment error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add equipment');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    Alert.alert(
      'Delete Equipment',
      'Are you sure you want to remove this equipment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('session_token');
              await axios.delete(`${API_URL}/api/equipment/service/${equipmentId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Success', 'Equipment removed');
              await loadEquipment();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete equipment');
            }
          },
        },
      ]
    );
  };

  const getEquipmentIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      Camera: 'camera',
      Lens: 'aperture',
      Lighting: 'flashlight',
      Gimbal: 'sync',
      Tripod: 'triangle',
      Drone: 'airplane',
      Audio: 'mic',
      Accessories: 'cube',
    };
    return icons[type] || 'cube';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[colors.primary[50], colors.white]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>My Equipment</Text>
            <Text style={styles.headerSubtitle}>{serviceType.replace('_', ' ')}</Text>
          </View>
          <TouchableOpacity onPress={() => { resetForm(); setShowAddModal(true); }}>
            <Ionicons name="add-circle" size={28} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={styles.infoText}>
            List your equipment to show clients what you work with. This helps build trust and showcases your professional gear.
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {equipment.length > 0 ? (
            equipment.map((item, index) => (
              <View key={item.equipment_id || index} style={styles.equipmentCard}>
                <View style={styles.cardIconContainer}>
                  <Ionicons name={getEquipmentIcon(item.equipment_type) as any} size={28} color={colors.primary[600]} />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.equipmentName}>{item.brand} {item.model}</Text>
                    <TouchableOpacity onPress={() => handleDeleteEquipment(item.equipment_id || '')}>
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cardDetails}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{item.equipment_type}</Text>
                    </View>
                    {item.serial_number && (
                      <Text style={styles.serialText}>S/N: {item.serial_number}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="camera-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyText}>No equipment listed</Text>
              <Text style={styles.emptySubtext}>Add your gear to showcase your professional equipment</Text>
              <TouchableOpacity style={styles.addButtonLarge} onPress={() => setShowAddModal(true)}>
                <LinearGradient colors={[colors.primary[400], colors.primary[600]]} style={styles.addButtonGradient}>
                  <Ionicons name="add" size={24} color={colors.white} />
                  <Text style={styles.addButtonText}>Add Equipment</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Add Equipment Modal */}
        <Modal visible={showAddModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Equipment</Text>
                <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                  <Ionicons name="close" size={28} color={colors.gray[600]} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
                {/* Equipment Type */}
                <Text style={styles.formLabel}>Equipment Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScrollView}>
                  <View style={styles.typeRow}>
                    {EQUIPMENT_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.typeChip, selectedEquipmentType === type && styles.typeChipActive]}
                        onPress={() => {
                          setSelectedEquipmentType(type);
                          setBrand('');
                          setModel('');
                        }}
                      >
                        <Ionicons
                          name={getEquipmentIcon(type) as any}
                          size={16}
                          color={selectedEquipmentType === type ? colors.white : colors.gray[600]}
                        />
                        <Text style={[styles.typeChipText, selectedEquipmentType === type && styles.typeChipTextActive]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Brand with Autocomplete */}
                <Text style={styles.formLabel}>Brand *</Text>
                <View style={styles.autocompleteContainer}>
                  <View style={styles.inputWithClear}>
                    <TextInput
                      style={styles.input}
                      value={brand}
                      onChangeText={filterBrands}
                      onFocus={() => setShowBrandDropdown(brandSuggestions.length > 0)}
                      placeholder="Type or select brand..."
                      placeholderTextColor={colors.gray[400]}
                    />
                    {brand !== '' && (
                      <TouchableOpacity style={styles.clearButton} onPress={() => { setBrand(''); setModel(''); }}>
                        <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {showBrandDropdown && brandSuggestions.length > 0 && (
                    <View style={styles.dropdown}>
                      <FlatList
                        data={brandSuggestions.slice(0, 8)}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                          <TouchableOpacity style={styles.dropdownItem} onPress={() => selectBrand(item)}>
                            <Text style={styles.dropdownText}>{item}</Text>
                          </TouchableOpacity>
                        )}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                      />
                    </View>
                  )}
                </View>

                {/* Model with Autocomplete */}
                <Text style={styles.formLabel}>Model *</Text>
                <View style={styles.autocompleteContainer}>
                  <View style={styles.inputWithClear}>
                    <TextInput
                      style={[styles.input, !brand && styles.inputDisabled]}
                      value={model}
                      onChangeText={filterModels}
                      onFocus={() => setShowModelDropdown(modelSuggestions.length > 0)}
                      placeholder={brand ? "Type or select model..." : "Select brand first"}
                      placeholderTextColor={colors.gray[400]}
                      editable={!!brand}
                    />
                    {model !== '' && (
                      <TouchableOpacity style={styles.clearButton} onPress={() => setModel('')}>
                        <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {showModelDropdown && modelSuggestions.length > 0 && (
                    <View style={styles.dropdown}>
                      <FlatList
                        data={modelSuggestions.slice(0, 8)}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                          <TouchableOpacity style={styles.dropdownItem} onPress={() => selectModel(item)}>
                            <Text style={styles.dropdownText}>{item}</Text>
                          </TouchableOpacity>
                        )}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                      />
                    </View>
                  )}
                </View>

                {/* Serial Number */}
                <Text style={styles.formLabel}>Serial Number *</Text>
                <TextInput
                  style={styles.input}
                  value={serialNumber}
                  onChangeText={setSerialNumber}
                  placeholder="Enter serial number"
                  placeholderTextColor={colors.gray[400]}
                />

                {/* Submit Button */}
                <TouchableOpacity style={styles.submitButton} onPress={handleAddEquipment} disabled={saving}>
                  <LinearGradient colors={[colors.primary[400], colors.primary[600]]} style={styles.submitGradient}>
                    <Text style={styles.submitText}>{saving ? 'Adding...' : 'Add Equipment'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  headerSubtitle: { ...typography.caption, color: colors.primary[600], textTransform: 'capitalize' },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.info + '10',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  infoText: { flex: 1, ...typography.bodySmall, color: colors.info },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  equipmentCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardContent: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  equipmentName: { ...typography.body, fontWeight: '700', color: colors.gray[900], flex: 1, paddingRight: spacing.sm },
  cardDetails: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  typeBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: { ...typography.caption, color: colors.primary[700], fontWeight: '600' },
  serialText: { ...typography.caption, color: colors.gray[500] },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl * 2 },
  emptyText: { ...typography.h4, color: colors.gray[500], marginTop: spacing.md },
  emptySubtext: { ...typography.body, color: colors.gray[400], marginTop: spacing.xs, textAlign: 'center', paddingHorizontal: spacing.xl },
  addButtonLarge: { marginTop: spacing.xl },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  addButtonText: { ...typography.body, color: colors.white, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: { ...typography.h3, color: colors.gray[900] },
  formScroll: { padding: spacing.lg },
  formLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.gray[700], marginBottom: spacing.sm, marginTop: spacing.md },
  typeScrollView: { marginBottom: spacing.sm },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  typeChipActive: { backgroundColor: colors.primary[500], borderColor: colors.primary[500] },
  typeChipText: { ...typography.bodySmall, fontWeight: '600', color: colors.gray[600] },
  typeChipTextActive: { color: colors.white },
  autocompleteContainer: { position: 'relative', zIndex: 10 },
  inputWithClear: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    ...typography.body,
    color: colors.gray[900],
  },
  inputDisabled: { backgroundColor: colors.gray[100], color: colors.gray[500] },
  clearButton: { position: 'absolute', right: spacing.sm },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    maxHeight: 200,
    ...shadows.lg,
    zIndex: 100,
  },
  dropdownItem: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  dropdownText: { ...typography.body, color: colors.gray[800] },
  submitButton: { marginTop: spacing.xl, marginBottom: spacing.xxl },
  submitGradient: { paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  submitText: { ...typography.body, color: colors.white, fontWeight: '700' },
});
