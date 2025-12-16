import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const CATEGORIES = ['All', 'Camera', 'Lens', 'Lighting', 'Audio', 'Accessories'];

export default function EquipmentScreen() {
  const router = useRouter();
  const [equipment, setEquipment] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEquipment();
  }, [activeCategory]);

  const loadEquipment = async () => {
    try {
      const category = activeCategory === 'All' ? undefined : activeCategory;
      const response = await axios.get(`${API_URL}/api/equipment`, {
        params: { category },
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Equipment Rental</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              activeCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setActiveCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                activeCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
              <View style={styles.equipmentInfo}>
                <Text style={styles.equipmentName}>{item.name}</Text>
                {item.brand && (
                  <Text style={styles.equipmentBrand}>
                    {item.brand} {item.model}
                  </Text>
                )}
                {item.description && (
                  <Text style={styles.equipmentDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <View style={styles.priceRow}>
                  {item.daily_rate && (
                    <Text style={styles.price}>₹{item.daily_rate}/day</Text>
                  )}
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
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="camera-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyText}>No equipment available</Text>
            <Text style={styles.emptySubtext}>Check back later for new items</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.gray[900],
  },
  placeholder: {
    width: 40,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
  },
  categoryChipActive: {
    backgroundColor: colors.primary[500],
  },
  categoryText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.gray[600],
  },
  categoryTextActive: {
    color: colors.white,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  equipmentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  equipmentImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  equipmentInfo: {
    padding: spacing.md,
  },
  equipmentName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  equipmentBrand: {
    ...typography.bodySmall,
    color: colors.gray[600],
    marginBottom: spacing.sm,
  },
  equipmentDescription: {
    ...typography.bodySmall,
    color: colors.gray[700],
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary[600],
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
  },
});