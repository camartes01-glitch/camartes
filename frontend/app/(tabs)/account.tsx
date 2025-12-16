import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route?: string;
  action?: () => void;
  color?: string;
}

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadProfile();
    loadAnalytics();
  }, []);

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(
        `${API_URL}/api/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(response.data);
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(
        `${API_URL}/api/analytics/dashboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalytics(response.data);
    } catch (error) {
      console.error('Load analytics error:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: 'profile',
      title: 'Edit Profile',
      icon: 'person-outline',
      route: '/edit-profile',
      color: colors.primary[500],
    },
    {
      id: 'portfolio',
      title: 'Portfolio',
      icon: 'images-outline',
      route: '/portfolio',
      color: colors.secondary[500],
    },
    {
      id: 'services',
      title: 'My Services',
      icon: 'briefcase-outline',
      route: '/my-services',
      color: colors.info,
    },
    {
      id: 'equipment',
      title: 'My Equipment',
      icon: 'camera-outline',
      route: '/my-equipment',
      color: colors.orange[500],
    },
    {
      id: 'packages',
      title: 'My Packages',
      icon: 'gift-outline',
      route: '/my-packages',
      color: colors.pink[500],
    },
    {
      id: 'favorites',
      title: 'Favorites',
      icon: 'heart-outline',
      route: '/favorites',
      color: colors.error,
    },
    {
      id: 'verification',
      title: 'Verification',
      icon: 'shield-checkmark-outline',
      route: '/verification',
      color: colors.success,
    },
    {
      id: 'support',
      title: 'Support',
      icon: 'help-circle-outline',
      route: '/support',
      color: colors.info,
    },
    {
      id: 'feedback',
      title: 'Feedback',
      icon: 'chatbox-ellipses-outline',
      route: '/feedback',
      color: colors.warning,
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: 'log-out-outline',
      action: handleLogout,
      color: colors.error,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <LinearGradient
          colors={[colors.primary[500], colors.primary[700]]}
          style={styles.profileHeader}
        >
          <View style={styles.avatarContainer}>
            {user?.picture ? (
              <Image source={{ uri: user.picture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color={colors.white} />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {profile?.city && (
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={14} color={colors.white} />
              <Text style={styles.locationText}>{profile.city}</Text>
            </View>
          )}
        </LinearGradient>

        {/* Analytics Cards */}
        {analytics && (
          <View style={styles.analyticsContainer}>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsValue}>{analytics.total_bookings}</Text>
              <Text style={styles.analyticsLabel}>Bookings</Text>
            </View>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsValue}>
                {analytics.average_rating.toFixed(1)}
              </Text>
              <Text style={styles.analyticsLabel}>Rating</Text>
            </View>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsValue}>{analytics.total_reviews}</Text>
              <Text style={styles.analyticsLabel}>Reviews</Text>
            </View>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsValue}>{analytics.portfolio_items}</Text>
              <Text style={styles.analyticsLabel}>Portfolio</Text>
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => {
                if (item.action) {
                  item.action();
                } else if (item.route) {
                  router.push(item.route as any);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: (item.color || colors.primary[500]) + '20' },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={item.color || colors.primary[500]}
                  />
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  profileHeader: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.white,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  userName: {
    ...typography.h3,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body,
    color: colors.primary[100],
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
  },
  locationText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
  },
  analyticsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.lg,
  },
  analyticsValue: {
    ...typography.h3,
    color: colors.primary[600],
    marginBottom: spacing.xs,
  },
  analyticsLabel: {
    ...typography.caption,
    color: colors.gray[600],
    fontWeight: '600',
  },
  menuContainer: {
    paddingHorizontal: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    ...typography.body,
    color: colors.gray[900],
    fontWeight: '600',
  },
});
