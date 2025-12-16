import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(response.data);
    } catch (error) {
      console.error('Load favorites error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {favorites.length > 0 ? (
          favorites.map((provider: any) => (
            <TouchableOpacity
              key={provider.user_id}
              style={styles.providerCard}
              onPress={() => router.push(`/provider/${provider.user_id}`)}
            >
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color={colors.primary[600]} />
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{provider.full_name || 'Provider'}</Text>
                {provider.city && (
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color={colors.gray[500]} />
                    <Text style={styles.locationText}>{provider.city}</Text>
                  </View>
                )}
              </View>
              <Ionicons name="heart" size={24} color={colors.error} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyText}>No favorites yet</Text>
            <Text style={styles.emptySubtext}>Start adding providers to your favorites</Text>
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
  scrollContent: {
    padding: spacing.lg,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...typography.bodySmall,
    color: colors.gray[600],
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
    textAlign: 'center',
  },
});