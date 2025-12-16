import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { format } from 'date-fns';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function BookingsScreen() {
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState<'my-bookings' | 'requests'>('my-bookings');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [activeTab]);

  const loadBookings = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      
      if (activeTab === 'my-bookings') {
        const response = await axios.get(
          `${API_URL}/api/bookings/my-bookings`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBookings(response.data);
      } else {
        const response = await axios.get(
          `${API_URL}/api/bookings/requests`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRequests(response.data);
      }
    } catch (error) {
      console.error('Load bookings error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time';
      case 'confirmed':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      case 'completed':
        return 'checkbox';
      default:
        return 'help-circle';
    }
  };

  const renderBookingCard = (booking: any) => (
    <View key={booking.booking_id} style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.bookingService}>
          <Ionicons
            name="briefcase"
            size={20}
            color={colors.primary[600]}
          />
          <Text style={styles.bookingServiceText}>
            {booking.service_type.replace('_', ' ')}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(booking.status) + '20' },
          ]}
        >
          <Ionicons
            name={getStatusIcon(booking.status) as any}
            size={14}
            color={getStatusColor(booking.status)}
          />
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(booking.status) },
            ]}
          >
            {booking.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={colors.gray[600]} />
          <Text style={styles.detailText}>{booking.event_date}</Text>
        </View>
        {booking.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color={colors.gray[600]} />
            <Text style={styles.detailText}>{booking.location}</Text>
          </View>
        )}
        {booking.budget && (
          <View style={styles.detailRow}>
            <Ionicons name="cash" size={16} color={colors.gray[600]} />
            <Text style={styles.detailText}>₹{booking.budget}</Text>
          </View>
        )}
      </View>

      {booking.special_requirements && (
        <Text style={styles.requirements} numberOfLines={2}>
          {booking.special_requirements}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookings</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'my-bookings' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('my-bookings')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'my-bookings' && styles.tabTextActive,
            ]}
          >
            My Bookings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'requests' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('requests')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'requests' && styles.tabTextActive,
            ]}
          >
            Requests
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'my-bookings' ? (
          bookings.length > 0 ? (
            bookings.map(renderBookingCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyText}>No bookings yet</Text>
              <Text style={styles.emptySubtext}>
                Start booking services to see them here
              </Text>
            </View>
          )
        ) : requests.length > 0 ? (
          requests.map(renderBookingCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyText}>No requests</Text>
            <Text style={styles.emptySubtext}>
              Booking requests will appear here
            </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.gray[900],
  },
  tabs: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.gray[100],
  },
  tabActive: {
    backgroundColor: colors.primary[500],
  },
  tabText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.gray[600],
  },
  tabTextActive: {
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  bookingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bookingService: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  bookingServiceText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.gray[900],
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
  },
  bookingDetails: {
    gap: spacing.sm,
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
  requirements: {
    ...typography.bodySmall,
    color: colors.gray[600],
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
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
