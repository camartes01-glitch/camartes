import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
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

interface InventoryItem {
  _id?: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  daily_rate: number;
  description: string;
  available: boolean;
  image?: string;
  quantity: number;
  condition: string;
  rental_status: string;
}

export default function InventoryManagementScreen() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'rented'>('all');
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    rented: 0,
    totalValue: 0,
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/equipment/my-equipment`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const items = response.data.map((item: any) => ({
        ...item,
        quantity: item.quantity || 1,
        condition: item.condition || 'Excellent',
        rental_status: item.available ? 'available' : 'rented',
      }));

      setInventory(items);
      calculateStats(items);
    } catch (error) {
      console.error('Load inventory error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (items: InventoryItem[]) => {
    const total = items.length;
    const available = items.filter(item => item.available).length;
    const rented = total - available;
    const totalValue = items.reduce((sum, item) => sum + (item.daily_rate || 0), 0);

    setStats({ total, available, rented, totalValue });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInventory();
    setRefreshing(false);
  };

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      // Update availability (you'll need to add this endpoint)
      // For now, update locally
      const updatedInventory = inventory.map(item => {
        if (item._id === itemId) {
          return { ...item, available: !currentStatus, rental_status: !currentStatus ? 'available' : 'rented' };
        }
        return item;
      });
      setInventory(updatedInventory);
      calculateStats(updatedInventory);
    } catch (error) {
      console.error('Toggle availability error:', error);
    }
  };

  const deleteItem = async (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this equipment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedInventory = inventory.filter(item => item._id !== itemId);
              setInventory(updatedInventory);
              calculateStats(updatedInventory);
              Alert.alert('Success', 'Equipment deleted');
            } catch (error) {
              console.error('Delete error:', error);
            }
          },
        },
      ]
    );
  };

  const filteredInventory = inventory.filter(item => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'available') return item.available;
    if (filterStatus === 'rented') return !item.available;
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[colors.primary[50], colors.white]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inventory Management</Text>
          <TouchableOpacity onPress={() => router.push('/add-equipment')}>
            <Ionicons name="add-circle" size={28} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={[colors.primary[400], colors.primary[600]]}
                style={styles.statGradient}
              >
                <Ionicons name="cube" size={24} color={colors.white} />
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total Items</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={[colors.success, '#059669']}
                style={styles.statGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color={colors.white} />
                <Text style={styles.statValue}>{stats.available}</Text>
                <Text style={styles.statLabel}>Available</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={[colors.orange[400], colors.orange[600]]}
                style={styles.statGradient}
              >
                <Ionicons name="time" size={24} color={colors.white} />
                <Text style={styles.statValue}>{stats.rented}</Text>
                <Text style={styles.statLabel}>Rented Out</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={[colors.secondary[400], colors.secondary[600]]}
                style={styles.statGradient}
              >
                <Ionicons name="cash" size={24} color={colors.white} />
                <Text style={styles.statValue}>₹{stats.totalValue}</Text>
                <Text style={styles.statLabel}>Daily Value</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === 'all' && styles.filterTabActive]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>
              All ({stats.total})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === 'available' && styles.filterTabActive]}
            onPress={() => setFilterStatus('available')}
          >
            <Text style={[styles.filterText, filterStatus === 'available' && styles.filterTextActive]}>
              Available ({stats.available})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === 'rented' && styles.filterTabActive]}
            onPress={() => setFilterStatus('rented')}
          >
            <Text style={[styles.filterText, filterStatus === 'rented' && styles.filterTextActive]}>
              Rented ({stats.rented})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Inventory List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredInventory.length > 0 ? (
            filteredInventory.map((item, index) => (
              <View key={item._id || index} style={styles.inventoryCard}>
                {item.image && (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${item.image}` }}
                    style={styles.itemImage}
                  />
                )}
                <View style={styles.itemContent}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: item.available
                              ? colors.success + '20'
                              : colors.orange[500] + '20',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: item.available ? colors.success : colors.orange[500],
                            },
                          ]}
                        >
                          {item.available ? 'Available' : 'Rented'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.itemDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="pricetag" size={16} color={colors.gray[600]} />
                      <Text style={styles.detailText}>
                        {item.brand} {item.model}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="apps" size={16} color={colors.gray[600]} />
                      <Text style={styles.detailText}>{item.category}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="layers" size={16} color={colors.gray[600]} />
                      <Text style={styles.detailText}>Qty: {item.quantity}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="star" size={16} color={colors.gray[600]} />
                      <Text style={styles.detailText}>{item.condition}</Text>
                    </View>
                  </View>

                  <View style={styles.itemFooter}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceLabel}>Daily Rate:</Text>
                      <Text style={styles.priceValue}>₹{item.daily_rate}</Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => router.push(`/edit-equipment/${item._id}`)}
                      >
                        <Ionicons name="create" size={20} color={colors.info} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deleteItem(item._id!)}
                      >
                        <Ionicons name="trash" size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Toggle Switch */}
                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Available for Rent</Text>
                    <Switch
                      value={item.available}
                      onValueChange={() => toggleAvailability(item._id!, item.available)}
                      trackColor={{ false: colors.gray[300], true: colors.success + '40' }}
                      thumbColor={item.available ? colors.success : colors.gray[500]}
                    />
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyText}>No inventory items</Text>
              <Text style={styles.emptySubtext}>
                {filterStatus === 'all'
                  ? 'Start adding equipment to manage'
                  : `No ${filterStatus} items found`}
              </Text>
              {filterStatus === 'all' && (
                <TouchableOpacity
                  style={styles.addButtonLarge}
                  onPress={() => router.push('/add-equipment')}
                >
                  <LinearGradient
                    colors={[colors.primary[400], colors.primary[600]]}
                    style={styles.addButtonGradient}
                  >
                    <Ionicons name="add" size={24} color={colors.white} />
                    <Text style={styles.addButtonText}>Add Equipment</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
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
  statsContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: (width - spacing.lg * 2 - spacing.sm) / 2,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  statGradient: {
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: { ...typography.h3, color: colors.white, fontWeight: '800' },
  statLabel: { ...typography.caption, color: colors.white, fontWeight: '600', opacity: 0.9 },
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.gray[100],
  },
  filterTabActive: { backgroundColor: colors.primary[500] },
  filterText: { ...typography.bodySmall, fontWeight: '600', color: colors.gray[600] },
  filterTextActive: { color: colors.white },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  inventoryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.lg,
  },
  itemImage: { width: '100%', height: 180, resizeMode: 'cover' },
  itemContent: { padding: spacing.md },
  itemHeader: { marginBottom: spacing.md },
  itemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: { ...typography.body, fontWeight: '700', color: colors.gray[900], flex: 1 },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: { ...typography.caption, fontWeight: '700' },
  itemDetails: { gap: spacing.xs, marginBottom: spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailText: { ...typography.bodySmall, color: colors.gray[700] },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    marginBottom: spacing.md,
  },
  priceContainer: { flex: 1 },
  priceLabel: { ...typography.caption, color: colors.gray[600] },
  priceValue: { ...typography.h4, color: colors.primary[600], fontWeight: '700' },
  actionButtons: { flexDirection: 'row', gap: spacing.sm },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.info + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  toggleLabel: { ...typography.body, color: colors.gray[700], fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: { ...typography.h4, color: colors.gray[500], marginTop: spacing.md },
  emptySubtext: {
    ...typography.body,
    color: colors.gray[400],
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  addButtonLarge: { marginTop: spacing.md },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  addButtonText: { ...typography.body, color: colors.white, fontWeight: '700' },
});