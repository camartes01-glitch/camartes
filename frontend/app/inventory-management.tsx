import React, { useState, useEffect } from 'react';
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
  Modal,
  KeyboardAvoidingView,
  Platform,
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

import * as ImagePicker from 'expo-image-picker';

const EQUIPMENT_TYPES = ['Camera', 'Lens', 'Lighting', 'Gimbal', 'Tripod', 'Drone', 'Audio', 'Accessories'];
const CONDITION_OPTIONS = ['excellent', 'good', 'fair', 'needs_repair'];
const AVAILABILITY_OPTIONS = ['available', 'rented', 'maintenance', 'unavailable'];

interface QCPhoto {
  photo_id: string;
  inventory_id: string;
  qc_type: string;
  image_base64: string;
  file_name: string;
  created_at: string;
}

interface InventoryItem {
  inventory_id: string;
  equipment_type: string;
  brand: string;
  model: string;
  serial_number: string;
  purchase_date?: string;
  condition_status: string;
  availability_status: string;
  rental_price_6h?: number;
  rental_price_8h?: number;
  rental_price_12h?: number;
  rental_price_24h?: number;
  maintenance_notes?: string;
  current_renter_name?: string;
  current_renter_contact?: string;
  rental_start_date?: string;
  rental_end_date?: string;
}

export default function InventoryManagementScreen() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showQCModal, setShowQCModal] = useState<{ item: InventoryItem; qcType: 'delivery' | 'return' } | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // Autocomplete state
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  // QC Photos state
  const [qcPhotos, setQcPhotos] = useState<QCPhoto[]>([]);
  const [uploadingQC, setUploadingQC] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    equipment_type: 'Camera',
    brand: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    condition_status: 'excellent',
    availability_status: 'available',
    rental_price_6h: '',
    rental_price_8h: '',
    rental_price_12h: '',
    rental_price_24h: '',
    maintenance_notes: '',
  });

  // Rent Out Form State
  const [rentForm, setRentForm] = useState({
    renter_name: '',
    renter_contact: '',
    start_date: '',
    end_date: '',
  });

  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    rented: 0,
    maintenance: 0,
  });

  useEffect(() => {
    loadInventory();
  }, []);
  
  // Load brand suggestions when equipment type changes
  useEffect(() => {
    loadBrandSuggestions(formData.equipment_type);
  }, [formData.equipment_type]);
  
  // Load model suggestions when brand changes
  useEffect(() => {
    if (formData.brand) {
      loadModelSuggestions(formData.equipment_type, formData.brand);
    }
  }, [formData.brand]);
  
  const loadBrandSuggestions = async (equipmentType: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/equipment/brands?equipment_type=${equipmentType}`);
      setBrandSuggestions(response.data.brands || []);
    } catch (error) {
      console.error('Failed to load brands:', error);
    }
  };
  
  const loadModelSuggestions = async (equipmentType: string, brand: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/equipment/models?equipment_type=${equipmentType}&brand=${brand}`);
      setModelSuggestions(response.data.models || []);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };
  
  const loadQCPhotos = async (inventoryId: string) => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/inventory/${inventoryId}/qc-photos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQcPhotos(response.data || []);
    } catch (error) {
      console.error('Failed to load QC photos:', error);
    }
  };
  
  const handleUploadQCPhoto = async () => {
    if (!showQCModal) return;
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    
    if (!result.canceled && result.assets[0].base64) {
      try {
        setUploadingQC(true);
        const token = await AsyncStorage.getItem('session_token');
        
        await axios.post(
          `${API_URL}/api/inventory/${showQCModal.item.inventory_id}/qc-photos`,
          {
            inventory_id: showQCModal.item.inventory_id,
            qc_type: showQCModal.qcType,
            image_base64: result.assets[0].base64,
            file_name: `qc_${Date.now()}.jpg`,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        Alert.alert('Success', 'QC photo uploaded!');
        await loadQCPhotos(showQCModal.item.inventory_id);
      } catch (error) {
        Alert.alert('Error', 'Failed to upload QC photo');
      } finally {
        setUploadingQC(false);
      }
    }
  };
  
  const handleDeleteQCPhoto = async (photoId: string) => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      await axios.delete(`${API_URL}/api/inventory/qc-photos/${photoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setQcPhotos(qcPhotos.filter(p => p.photo_id !== photoId));
      Alert.alert('Success', 'Photo deleted');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete photo');
    }
  };

  const loadInventory = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const items = response.data || [];
      setInventory(items);
      calculateStats(items);
    } catch (error: any) {
      console.error('Load inventory error:', error);
      if (error.response?.status === 403) {
        Alert.alert('Access Denied', 'Only business accounts can manage inventory. Please update your profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (items: InventoryItem[]) => {
    setStats({
      total: items.length,
      available: items.filter(i => i.availability_status === 'available').length,
      rented: items.filter(i => i.availability_status === 'rented').length,
      maintenance: items.filter(i => i.availability_status === 'maintenance').length,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInventory();
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormData({
      equipment_type: 'Camera',
      brand: '',
      model: '',
      serial_number: '',
      purchase_date: '',
      condition_status: 'excellent',
      availability_status: 'available',
      rental_price_6h: '',
      rental_price_8h: '',
      rental_price_12h: '',
      rental_price_24h: '',
      maintenance_notes: '',
    });
    setEditingItem(null);
  };

  const handleSubmit = async () => {
    if (!formData.serial_number || !formData.brand || !formData.model) {
      Alert.alert('Error', 'Please fill in brand, model, and serial number');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('session_token');
      const payload = {
        ...formData,
        rental_price_6h: formData.rental_price_6h ? parseFloat(formData.rental_price_6h) : null,
        rental_price_8h: formData.rental_price_8h ? parseFloat(formData.rental_price_8h) : null,
        rental_price_12h: formData.rental_price_12h ? parseFloat(formData.rental_price_12h) : null,
        rental_price_24h: formData.rental_price_24h ? parseFloat(formData.rental_price_24h) : null,
      };

      if (editingItem) {
        await axios.put(`${API_URL}/api/inventory/${editingItem.inventory_id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Alert.alert('Success', 'Equipment updated successfully!');
      } else {
        await axios.post(`${API_URL}/api/inventory`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Alert.alert('Success', 'Equipment added successfully!');
      }

      setShowForm(false);
      resetForm();
      await loadInventory();
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save. Please try again.');
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      equipment_type: item.equipment_type || 'Camera',
      brand: item.brand || '',
      model: item.model || '',
      serial_number: item.serial_number || '',
      purchase_date: item.purchase_date || '',
      condition_status: item.condition_status || 'excellent',
      availability_status: item.availability_status || 'available',
      rental_price_6h: item.rental_price_6h?.toString() || '',
      rental_price_8h: item.rental_price_8h?.toString() || '',
      rental_price_12h: item.rental_price_12h?.toString() || '',
      rental_price_24h: item.rental_price_24h?.toString() || '',
      maintenance_notes: item.maintenance_notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (inventoryId: string) => {
    Alert.alert(
      'Delete Equipment',
      'Are you sure you want to delete this equipment? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('session_token');
              await axios.delete(`${API_URL}/api/inventory/${inventoryId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Success', 'Equipment deleted successfully!');
              await loadInventory();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete equipment');
            }
          },
        },
      ]
    );
  };

  const handleRentOut = async () => {
    if (!rentForm.renter_name || !rentForm.renter_contact || !rentForm.start_date || !rentForm.end_date) {
      Alert.alert('Error', 'Please fill all rental details');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('session_token');
      await axios.post(`${API_URL}/api/inventory/${selectedItem?.inventory_id}/rent`, rentForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Success', 'Equipment marked as rented!');
      setShowRentModal(false);
      setRentForm({ renter_name: '', renter_contact: '', start_date: '', end_date: '' });
      setSelectedItem(null);
      await loadInventory();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark as rented');
    }
  };

  const handleReturn = async (item: InventoryItem) => {
    Alert.alert(
      'Mark as Returned',
      'Mark this equipment as returned and available?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('session_token');
              await axios.post(`${API_URL}/api/inventory/${item.inventory_id}/return`, {
                availability_status: 'available',
                condition_status: 'excellent',
              }, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Success', 'Equipment marked as returned!');
              await loadInventory();
            } catch (error) {
              Alert.alert('Error', 'Failed to mark as returned');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return colors.success;
      case 'rented': return colors.info;
      case 'maintenance': return colors.warning;
      case 'unavailable': return colors.error;
      default: return colors.gray[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return 'checkmark-circle';
      case 'rented': return 'time';
      case 'maintenance': return 'alert-circle';
      case 'unavailable': return 'close-circle';
      default: return 'cube';
    }
  };

  const filteredInventory = filterStatus === 'all'
    ? inventory
    : inventory.filter(item => item.availability_status === filterStatus);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[colors.primary[50], colors.white]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Camera Rental Inventory</Text>
          <TouchableOpacity onPress={() => { resetForm(); setShowForm(true); }}>
            <Ionicons name="add-circle" size={28} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <StatCard label="Total" value={stats.total} color={colors.gray[600]} icon="cube" />
            <StatCard label="Available" value={stats.available} color={colors.success} icon="checkmark-circle" />
            <StatCard label="Rented" value={stats.rented} color={colors.info} icon="time" />
            <StatCard label="Maintenance" value={stats.maintenance} color={colors.warning} icon="alert-circle" />
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <View style={styles.filterRow}>
            {['all', 'available', 'rented', 'maintenance'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.filterTab, filterStatus === status && styles.filterTabActive]}
                onPress={() => setFilterStatus(status)}
              >
                <Text style={[styles.filterText, filterStatus === status && styles.filterTextActive]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Inventory List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredInventory.length > 0 ? (
            filteredInventory.map((item) => (
              <View key={item.inventory_id} style={styles.inventoryCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.statusRow}>
                    <Ionicons name={getStatusIcon(item.availability_status) as any} size={20} color={getStatusColor(item.availability_status)} />
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.availability_status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(item.availability_status) }]}>
                        {item.availability_status}
                      </Text>
                    </View>
                    <Text style={styles.equipmentType}>{item.equipment_type}</Text>
                  </View>
                </View>

                <Text style={styles.itemName}>{item.brand} {item.model}</Text>

                <View style={styles.detailsGrid}>
                  {item.serial_number && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Serial Number</Text>
                      <Text style={styles.detailValue}>{item.serial_number}</Text>
                    </View>
                  )}
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Condition</Text>
                    <Text style={styles.detailValue}>{item.condition_status.replace('_', ' ')}</Text>
                  </View>
                </View>

                {/* Rental Info if Rented */}
                {item.availability_status === 'rented' && item.current_renter_name && (
                  <View style={styles.rentalInfo}>
                    <Text style={styles.rentalInfoTitle}>Current Rental</Text>
                    <Text style={styles.rentalInfoText}>Renter: {item.current_renter_name}</Text>
                    <Text style={styles.rentalInfoText}>Contact: {item.current_renter_contact}</Text>
                    <Text style={styles.rentalInfoText}>
                      Period: {item.rental_start_date} - {item.rental_end_date}
                    </Text>
                  </View>
                )}

                {/* Pricing Badges */}
                <View style={styles.pricingRow}>
                  {item.rental_price_6h && (
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>6h: ₹{item.rental_price_6h}</Text>
                    </View>
                  )}
                  {item.rental_price_8h && (
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>8h: ₹{item.rental_price_8h}</Text>
                    </View>
                  )}
                  {item.rental_price_12h && (
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>12h: ₹{item.rental_price_12h}</Text>
                    </View>
                  )}
                  {item.rental_price_24h && (
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>24h: ₹{item.rental_price_24h}</Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  {item.availability_status === 'available' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rentButton]}
                      onPress={() => { setSelectedItem(item); setShowRentModal(true); }}
                    >
                      <Ionicons name="arrow-forward-circle" size={18} color={colors.white} />
                      <Text style={styles.actionButtonText}>Rent Out</Text>
                    </TouchableOpacity>
                  )}
                  {item.availability_status === 'rented' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.returnButton]}
                      onPress={() => handleReturn(item)}
                    >
                      <Ionicons name="refresh" size={18} color={colors.white} />
                      <Text style={styles.actionButtonText}>Return</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.iconButton} onPress={() => handleEdit(item)}>
                    <Ionicons name="create" size={20} color={colors.primary[600]} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(item.inventory_id)}>
                    <Ionicons name="trash" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyText}>No inventory items</Text>
              <Text style={styles.emptySubtext}>
                {filterStatus === 'all' ? 'Add equipment to get started' : `No ${filterStatus} items found`}
              </Text>
              {filterStatus === 'all' && (
                <TouchableOpacity style={styles.addButtonLarge} onPress={() => setShowForm(true)}>
                  <LinearGradient colors={[colors.primary[400], colors.primary[600]]} style={styles.addButtonGradient}>
                    <Ionicons name="add" size={24} color={colors.white} />
                    <Text style={styles.addButtonText}>Add Equipment</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

        {/* Add/Edit Form Modal */}
        <Modal visible={showForm} animationType="slide" transparent>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingItem ? 'Edit Equipment' : 'Add New Equipment'}</Text>
                <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
                  <Ionicons name="close" size={28} color={colors.gray[600]} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formScroll}>
                {/* Equipment Type */}
                <Text style={styles.formLabel}>Equipment Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipRow}>
                    {EQUIPMENT_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.chip, formData.equipment_type === type && styles.chipActive]}
                        onPress={() => setFormData({ ...formData, equipment_type: type })}
                      >
                        <Text style={[styles.chipText, formData.equipment_type === type && styles.chipTextActive]}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Brand & Model */}
                <Text style={styles.formLabel}>Brand *</Text>
                <TextInput style={styles.input} value={formData.brand} onChangeText={(v) => setFormData({ ...formData, brand: v })} placeholder="e.g., Canon, Sony, Nikon" placeholderTextColor={colors.gray[400]} />

                <Text style={styles.formLabel}>Model *</Text>
                <TextInput style={styles.input} value={formData.model} onChangeText={(v) => setFormData({ ...formData, model: v })} placeholder="e.g., EOS R5, A7 III" placeholderTextColor={colors.gray[400]} />

                <Text style={styles.formLabel}>Serial Number *</Text>
                <TextInput style={styles.input} value={formData.serial_number} onChangeText={(v) => setFormData({ ...formData, serial_number: v })} placeholder="Enter serial number" placeholderTextColor={colors.gray[400]} />

                {/* Condition */}
                <Text style={styles.formLabel}>Condition</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipRow}>
                    {CONDITION_OPTIONS.map((cond) => (
                      <TouchableOpacity
                        key={cond}
                        style={[styles.chip, formData.condition_status === cond && styles.chipActive]}
                        onPress={() => setFormData({ ...formData, condition_status: cond })}
                      >
                        <Text style={[styles.chipText, formData.condition_status === cond && styles.chipTextActive]}>{cond.replace('_', ' ')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Pricing */}
                <Text style={styles.formLabel}>Rental Pricing (INR)</Text>
                <View style={styles.pricingGrid}>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.priceInputLabel}>6 Hours</Text>
                    <TextInput style={styles.priceInput} value={formData.rental_price_6h} onChangeText={(v) => setFormData({ ...formData, rental_price_6h: v })} keyboardType="numeric" placeholder="₹0" placeholderTextColor={colors.gray[400]} />
                  </View>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.priceInputLabel}>8 Hours</Text>
                    <TextInput style={styles.priceInput} value={formData.rental_price_8h} onChangeText={(v) => setFormData({ ...formData, rental_price_8h: v })} keyboardType="numeric" placeholder="₹0" placeholderTextColor={colors.gray[400]} />
                  </View>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.priceInputLabel}>12 Hours</Text>
                    <TextInput style={styles.priceInput} value={formData.rental_price_12h} onChangeText={(v) => setFormData({ ...formData, rental_price_12h: v })} keyboardType="numeric" placeholder="₹0" placeholderTextColor={colors.gray[400]} />
                  </View>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.priceInputLabel}>24 Hours</Text>
                    <TextInput style={styles.priceInput} value={formData.rental_price_24h} onChangeText={(v) => setFormData({ ...formData, rental_price_24h: v })} keyboardType="numeric" placeholder="₹0" placeholderTextColor={colors.gray[400]} />
                  </View>
                </View>

                {/* Notes */}
                <Text style={styles.formLabel}>Maintenance Notes</Text>
                <TextInput style={[styles.input, styles.textArea]} value={formData.maintenance_notes} onChangeText={(v) => setFormData({ ...formData, maintenance_notes: v })} placeholder="Any notes about maintenance, accessories included..." placeholderTextColor={colors.gray[400]} multiline numberOfLines={3} />

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <LinearGradient colors={[colors.primary[400], colors.primary[600]]} style={styles.submitGradient}>
                    <Text style={styles.submitText}>{editingItem ? 'Update' : 'Add'} Equipment</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Rent Out Modal */}
        <Modal visible={showRentModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Rent Out Equipment</Text>
                  <Text style={styles.modalSubtitle}>{selectedItem?.brand} {selectedItem?.model}</Text>
                </View>
                <TouchableOpacity onPress={() => { setShowRentModal(false); setSelectedItem(null); }}>
                  <Ionicons name="close" size={28} color={colors.gray[600]} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formScroll}>
                <Text style={styles.formLabel}>Renter Name *</Text>
                <TextInput style={styles.input} value={rentForm.renter_name} onChangeText={(v) => setRentForm({ ...rentForm, renter_name: v })} placeholder="Enter renter's name" placeholderTextColor={colors.gray[400]} />

                <Text style={styles.formLabel}>Contact Number *</Text>
                <TextInput style={styles.input} value={rentForm.renter_contact} onChangeText={(v) => setRentForm({ ...rentForm, renter_contact: v })} placeholder="Enter contact number" placeholderTextColor={colors.gray[400]} keyboardType="phone-pad" />

                <Text style={styles.formLabel}>Start Date (YYYY-MM-DD) *</Text>
                <TextInput style={styles.input} value={rentForm.start_date} onChangeText={(v) => setRentForm({ ...rentForm, start_date: v })} placeholder="2025-06-15" placeholderTextColor={colors.gray[400]} />

                <Text style={styles.formLabel}>End Date (YYYY-MM-DD) *</Text>
                <TextInput style={styles.input} value={rentForm.end_date} onChangeText={(v) => setRentForm({ ...rentForm, end_date: v })} placeholder="2025-06-16" placeholderTextColor={colors.gray[400]} />

                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color={colors.primary[600]} />
                  <Text style={styles.infoText}>After marking as rented, you can add QC photos documenting the equipment's condition at delivery.</Text>
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handleRentOut}>
                  <LinearGradient colors={[colors.primary[400], colors.primary[600]]} style={styles.submitGradient}>
                    <Text style={styles.submitText}>Mark as Rented</Text>
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

const StatCard = ({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon as any} size={24} color={color} />
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.white, ...shadows.sm },
  headerTitle: { ...typography.h4, color: colors.gray[900] },
  statsContainer: { padding: spacing.md, backgroundColor: colors.white },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { alignItems: 'center', flex: 1 },
  statValue: { ...typography.h3, fontWeight: '800', marginTop: 4 },
  statLabel: { ...typography.caption, color: colors.gray[600] },
  filterContainer: { backgroundColor: colors.white, paddingVertical: spacing.sm },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm },
  filterTab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.gray[100] },
  filterTabActive: { backgroundColor: colors.primary[500] },
  filterText: { ...typography.bodySmall, fontWeight: '600', color: colors.gray[600] },
  filterTextActive: { color: colors.white },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  inventoryCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.md },
  cardHeader: { marginBottom: spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  statusText: { ...typography.caption, fontWeight: '700', textTransform: 'capitalize' },
  equipmentType: { ...typography.caption, color: colors.primary[600], fontWeight: '600' },
  itemName: { ...typography.body, fontWeight: '700', color: colors.gray[900], marginBottom: spacing.sm },
  detailsGrid: { flexDirection: 'row', gap: spacing.xl, marginBottom: spacing.sm },
  detailItem: {},
  detailLabel: { ...typography.caption, color: colors.gray[500] },
  detailValue: { ...typography.bodySmall, color: colors.gray[800], fontWeight: '600', textTransform: 'capitalize' },
  rentalInfo: { backgroundColor: colors.info + '10', padding: spacing.sm, borderRadius: borderRadius.md, marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.info },
  rentalInfoTitle: { ...typography.bodySmall, fontWeight: '700', color: colors.info, marginBottom: 4 },
  rentalInfoText: { ...typography.caption, color: colors.info },
  pricingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  priceBadge: { backgroundColor: colors.success + '15', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  priceText: { ...typography.caption, color: colors.success, fontWeight: '600' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.gray[200] },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.md },
  rentButton: { backgroundColor: colors.info },
  returnButton: { backgroundColor: colors.success },
  actionButtonText: { ...typography.bodySmall, color: colors.white, fontWeight: '600' },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray[100], justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl * 2 },
  emptyText: { ...typography.h4, color: colors.gray[500], marginTop: spacing.md },
  emptySubtext: { ...typography.body, color: colors.gray[400], marginTop: spacing.xs },
  addButtonLarge: { marginTop: spacing.lg },
  addButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: borderRadius.md },
  addButtonText: { ...typography.body, color: colors.white, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200] },
  modalTitle: { ...typography.h3, color: colors.gray[900] },
  modalSubtitle: { ...typography.bodySmall, color: colors.gray[600] },
  formScroll: { padding: spacing.lg },
  formLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.gray[700], marginBottom: spacing.sm, marginTop: spacing.md },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[300], borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4, ...typography.body, color: colors.gray[900] },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.gray[100], borderWidth: 1, borderColor: colors.gray[300] },
  chipActive: { backgroundColor: colors.primary[500], borderColor: colors.primary[500] },
  chipText: { ...typography.bodySmall, fontWeight: '600', color: colors.gray[600] },
  chipTextActive: { color: colors.white },
  pricingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  priceInputContainer: { width: (width - spacing.lg * 2 - spacing.sm * 3) / 2 },
  priceInputLabel: { ...typography.caption, color: colors.gray[600], marginBottom: 4 },
  priceInput: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[300], borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.body, color: colors.gray[900] },
  submitButton: { marginTop: spacing.xl, marginBottom: spacing.xl },
  submitGradient: { paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  submitText: { ...typography.body, color: colors.white, fontWeight: '700' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.primary[50], padding: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.md },
  infoText: { flex: 1, ...typography.bodySmall, color: colors.primary[800] },
});
