import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ProviderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews'>('about');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadProvider();
  }, [id]);

  const loadProvider = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/providers/${id}`);
      setProvider(response.data);
    } catch (error) {
      console.error('Load provider error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    router.push(`/booking?providerId=${id}`);
  };

  const handleMessage = () => {
    router.push(`/chat/${id}`);
  };

  const toggleFavorite = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      if (isFavorite) {
        await axios.delete(`${API_URL}/api/favorites/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(
          `${API_URL}/api/favorites/${id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  };

  if (loading || !provider) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <LinearGradient
          colors={[colors.primary[500], colors.primary[700]]}
          style={styles.profileSection}
        >
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={48} color={colors.white} />
          </View>
          <Text style={styles.providerName}>{provider.profile?.full_name || 'Provider'}</Text>
          {provider.profile?.city && (
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={14} color={colors.white} />
              <Text style={styles.locationText}>{provider.profile.city}</Text>
            </View>
          )}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={20} color={colors.warning} />
              <Text style={styles.statValue}>{provider.avg_rating?.toFixed(1) || '0.0'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="chatbox" size={20} color={colors.white} />
              <Text style={styles.statValue}>{provider.review_count || 0} Reviews</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.tabActive]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>
              About
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'portfolio' && styles.tabActive]}
            onPress={() => setActiveTab('portfolio')}
          >
            <Text style={[styles.tabText, activeTab === 'portfolio' && styles.tabTextActive]}>
              Portfolio
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
              Reviews
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'about' && (
            <View>
              <Text style={styles.sectionTitle}>Services Offered</Text>
              {provider.freelancer_services?.map((service: any, index: number) => (
                <View key={index} style={styles.serviceItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.serviceText}>
                    {service.service_type.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>
              ))}
              {provider.business_services?.map((service: any, index: number) => (
                <View key={index} style={styles.serviceItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.serviceText}>
                    {service.service_type.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'portfolio' && (
            <View style={styles.portfolioGrid}>
              {provider.portfolio?.length > 0 ? (
                provider.portfolio.map((item: any, index: number) => (
                  <View key={index} style={styles.portfolioItem}>
                    {item.image && (
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${item.image}` }}
                        style={styles.portfolioImage}
                      />
                    )}
                    <Text style={styles.portfolioTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No portfolio items yet</Text>
              )}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View>
              {provider.reviews?.length > 0 ? (
                provider.reviews.map((review: any, index: number) => (
                  <View key={index} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.ratingRow}>
                        {[...Array(5)].map((_, i) => (
                          <Ionicons
                            key={i}
                            name={i < review.rating ? 'star' : 'star-outline'}
                            size={16}
                            color={colors.warning}
                          />
                        ))}
                      </View>
                    </View>
                    {review.comment && (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No reviews yet</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
          <Ionicons name="chatbubble" size={24} color={colors.primary[600]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
          <LinearGradient
            colors={[colors.primary[400], colors.primary[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookButtonGradient}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    padding: spacing.xl,
    paddingTop: 80,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.white,
    marginBottom: spacing.md,
  },
  providerName: {
    ...typography.h2,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  locationText: {
    ...typography.bodySmall,
    color: colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.primary[100],
  },
  tabText: {
    ...typography.body,
    color: colors.gray[600],
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary[700],
  },
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  serviceText: {
    ...typography.body,
    color: colors.gray[700],
    textTransform: 'capitalize',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  portfolioItem: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  portfolioImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  portfolioTitle: {
    ...typography.bodySmall,
    padding: spacing.sm,
  },
  reviewCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  reviewHeader: {
    marginBottom: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 4,
  },
  reviewComment: {
    ...typography.body,
    color: colors.gray[700],
  },
  emptyText: {
    ...typography.body,
    color: colors.gray[500],
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  actionBar: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    ...shadows.lg,
  },
  messageButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButton: {
    flex: 1,
  },
  bookButtonGradient: {
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },
});