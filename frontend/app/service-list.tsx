import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ServiceListScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProviders();
  }, [type]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/providers/service/${type}`
      );
      setProviders(response.data);
    } catch (error) {
      console.error('Load providers error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProviders();
    setRefreshing(false);
  };

  const handleProviderPress = (providerId: string) => {
    router.push(`/provider/${providerId}`);
  };

  const filteredProviders = providers.filter((provider: any) =>
    provider.profile?.full_name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[colors.primary[50], colors.white]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {String(type).replace(/_/g, ' ').toUpperCase()}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={colors.gray[400]}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search providers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.gray[400]}
          />
        </View>

        {/* Providers List */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredProviders.length > 0 ? (
            filteredProviders.map((provider: any) => (
              <TouchableOpacity
                key={provider.user_id}
                style={styles.providerCard}
                onPress={() => handleProviderPress(provider.user_id)}
                activeOpacity={0.7}
              >
                <View style={styles.providerHeader}>
                  <View style={styles.providerAvatar}>
                    <Ionicons name="person" size={32} color={colors.primary[600]} />
                  </View>
                  <View style={styles.providerInfo}>
                    <Text style={styles.providerName}>
                      {provider.profile?.full_name || 'Unknown'}
                    </Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={16} color={colors.warning} />
                      <Text style={styles.ratingText}>
                        {provider.avg_rating?.toFixed(1) || '0.0'}
                      </Text>
                      <Text style={styles.reviewCount}>
                        ({provider.review_count || 0} reviews)
                      </Text>
                    </View>
                    {provider.profile?.city && (
                      <View style={styles.locationRow}>
                        <Ionicons name="location" size={14} color={colors.gray[500]} />
                        <Text style={styles.locationText}>{provider.profile.city}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {provider.years_experience && (
                  <View style={styles.experienceBadge}>
                    <Text style={styles.experienceText}>
                      {provider.years_experience} years experience
                    </Text>
                  </View>
                )}

                {provider.description && (
                  <Text style={styles.providerDescription} numberOfLines={2}>
                    {provider.description}
                  </Text>
                )}

                <View style={styles.cardFooter}>
                  {provider.hourly_rate && (
                    <Text style={styles.priceText}>
                      ₹{provider.hourly_rate}/hr
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => handleProviderPress(provider.user_id)}
                  >
                    <Text style={styles.viewButtonText}>View Profile</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={colors.primary[600]}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyText}>
                {loading ? 'Loading providers...' : 'No providers found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {loading ? 'Please wait...' : 'Try adjusting your search'}
              </Text>
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
    textTransform: 'capitalize',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.gray[900],
    paddingVertical: spacing.sm + 4,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  providerCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  providerHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  providerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  providerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  providerName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.gray[900],
  },
  reviewCount: {
    ...typography.bodySmall,
    color: colors.gray[600],
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
  experienceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  experienceText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.secondary[700],
  },
  providerDescription: {
    ...typography.bodySmall,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  priceText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary[600],
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.primary[600],
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
