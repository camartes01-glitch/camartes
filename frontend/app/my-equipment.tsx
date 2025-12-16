import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function MyEquipmentScreen() {
  const router = useRouter();
  const [equipment, setEquipment] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/equipment/my-equipment`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEquipment(response.data);
    } catch (error) {
      console.error('Load equipment error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEquipment();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[colors.primary[50], colors.white]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Equipment</Text>
          <TouchableOpacity onPress={() => router.push('/add-equipment')}>
            <Ionicons name="add-circle" size={28} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {equipment.length > 0 ? (
            equipment.map((item: any, index) => (
              <View key={index} style={styles.equipmentCard}>
                {item.image && (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${item.image}` }}
                    style={styles.equipmentImage}
                  />
                )}
                <View style={styles.equipmentContent}>
                  <View style={styles.equipmentHeader}>
                    <Text style={styles.equipmentName}>{item.name}</Text>
                    <View
                      style={[
                        styles.availabilityBadge,
                        {
                          backgroundColor: item.available
                            ? colors.success + '20'
                            : colors.error + '20',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.availabilityText,
                          {
                            color: item.available ? colors.success : colors.error,
                          },
                        ]}
                      >
                        {item.available ? 'Available' : 'Rented'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.equipmentDetails}>
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
                    {item.daily_rate && (
                      <View style={styles.detailRow}>
                        <Ionicons name="cash" size={16} color={colors.gray[600]} />
                        <Text style={styles.detailText}>₹{item.daily_rate}/day</Text>
                      </View>
                    )}
                  </View>

                  {item.description && (
                    <Text style={styles.equipmentDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="camera-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyText}>No equipment listed</Text>
              <Text style={styles.emptySubtext}>
                Start adding equipment to rent out
              </Text>
              <TouchableOpacity
                style={styles.addButton}
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
            </View>
          )}
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.gray[900],
  },
  scrollContent: {
    padding: spacing.lg,
  },
  equipmentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  equipmentImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  equipmentContent: {
    padding: spacing.md,
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  equipmentName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.gray[900],
    flex: 1,
  },
  availabilityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  availabilityText: {
    ...typography.caption,
    fontWeight: '700',
  },
  equipmentDetails: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    ...typography.bodySmall,
    color: colors.gray[700],
  },
  equipmentDescription: {
    ...typography.bodySmall,
    color: colors.gray[600],
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    ...typography.h4,
    color: colors.gray[500],
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.gray[400],
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  addButton: {
    marginTop: spacing.md,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },
});
