import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
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

export default function DashboardScreen() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      
      // Load analytics
      const analyticsRes = await axios.get(`${API_URL}/api/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(analyticsRes.data);

      // Load recent bookings
      const bookingsRes = await axios.get(`${API_URL}/api/bookings/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentBookings(bookingsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Overview Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <LinearGradient
                  colors={[colors.primary[400], colors.primary[600]]}
                  style={styles.metricGradient}
                >
                  <Ionicons name="calendar" size={32} color={colors.white} />
                  <Text style={styles.metricValue}>{analytics?.total_bookings || 0}</Text>
                  <Text style={styles.metricLabel}>Total Bookings</Text>
                </LinearGradient>
              </View>

              <View style={styles.metricCard}>
                <LinearGradient
                  colors={[colors.warning, colors.orange[600]]}
                  style={styles.metricGradient}
                >
                  <Ionicons name="time" size={32} color={colors.white} />
                  <Text style={styles.metricValue}>{analytics?.pending_bookings || 0}</Text>
                  <Text style={styles.metricLabel}>Pending</Text>
                </LinearGradient>
              </View>

              <View style={styles.metricCard}>
                <LinearGradient
                  colors={[colors.success, '#059669']}
                  style={styles.metricGradient}
                >
                  <Ionicons name="checkmark-circle" size={32} color={colors.white} />
                  <Text style={styles.metricValue}>{analytics?.confirmed_bookings || 0}</Text>
                  <Text style={styles.metricLabel}>Confirmed</Text>
                </LinearGradient>
              </View>

              <View style={styles.metricCard}>
                <LinearGradient
                  colors={[colors.secondary[400], colors.secondary[600]]}
                  style={styles.metricGradient}
                >
                  <Ionicons name="star" size={32} color={colors.white} />
                  <Text style={styles.metricValue}>
                    {analytics?.average_rating?.toFixed(1) || '0.0'}
                  </Text>
                  <Text style={styles.metricLabel}>Rating</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="chatbox" size={24} color={colors.info} />
                <Text style={styles.statValue}>{analytics?.total_reviews || 0}</Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="images" size={24} color={colors.secondary[500]} />
                <Text style={styles.statValue}>{analytics?.portfolio_items || 0}</Text>
                <Text style={styles.statLabel}>Portfolio</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="people" size={24} color={colors.pink[500]} />
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </View>
          </View>

          {/* Recent Bookings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Bookings</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/bookings')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentBookings.length > 0 ? (
              recentBookings.map((booking: any, index) => (
                <View key={index} style={styles.bookingCard}>
                  <View style={styles.bookingHeader}>
                    <View style={styles.bookingIcon}>
                      <Ionicons name="briefcase" size={20} color={colors.primary[600]} />
                    </View>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingService}>
                        {booking.service_type.replace(/_/g, ' ')}
                      </Text>
                      <Text style={styles.bookingDate}>{booking.event_date}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(booking.status) + '20' },
                      ]}
                    >
                      <Text style={{ color: getStatusColor(booking.status), ...typography.caption }}>
                        {booking.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={colors.gray[300]} />
                <Text style={styles.emptyText}>No recent bookings</Text>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/portfolio')}
              >
                <LinearGradient
                  colors={[colors.secondary[100], colors.secondary[200]]}
                  style={styles.actionGradient}
                >
                  <Ionicons name="add-circle" size={32} color={colors.secondary[700]} />
                  <Text style={styles.actionText}>Add Portfolio</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/my-equipment')}
              >
                <LinearGradient
                  colors={[colors.primary[100], colors.primary[200]]}
                  style={styles.actionGradient}
                >
                  <Ionicons name="camera" size={32} color={colors.primary[700]} />
                  <Text style={styles.actionText}>Manage Equipment</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/my-packages')}
              >
                <LinearGradient
                  colors={[colors.pink[100], colors.pink[200]]}
                  style={styles.actionGradient}
                >
                  <Ionicons name="gift" size={32} color={colors.pink[600]} />
                  <Text style={styles.actionText}>Create Package</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/my-services')}
              >
                <LinearGradient
                  colors={[colors.info + '20', colors.info + '40']}
                  style={styles.actionGradient}
                >
                  <Ionicons name="briefcase" size={32} color={colors.info} />
                  <Text style={styles.actionText}>Add Service</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return colors.warning;
    case 'confirmed':
      return colors.success;
    case 'rejected':
      return colors.error;
    case 'completed':
      return colors.info;
    default:
      return colors.gray[500];
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    ...typography.h3,
    color: colors.gray[900],
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  seeAllText: {
    ...typography.body,
    color: colors.primary[600],
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  metricGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  metricValue: {
    ...typography.h2,
    color: colors.white,
    fontWeight: '800',
  },
  metricLabel: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.9,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    ...typography.h4,
    color: colors.gray[900],
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    color: colors.gray[600],
  },
  bookingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingService: {
    ...typography.body,
    fontWeight: '600',
    color: colors.gray[900],
    textTransform: 'capitalize',
  },
  bookingDate: {
    ...typography.bodySmall,
    color: colors.gray[600],
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.gray[500],
    marginTop: spacing.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  actionGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 120,
    justifyContent: 'center',
  },
  actionText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
  },
});