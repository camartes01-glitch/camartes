import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route?: string;
  action?: () => void;
  color?: string;
  badge?: number;
  subtitle?: string;
}

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<'provider' | 'account'>('provider');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await loadProfile();
    await loadAnalytics();
  };

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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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

  const providerMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      title: t('common.dashboard'),
      icon: 'stats-chart-outline',
      route: '/dashboard',
      color: colors.primary[600],
    },
    {
      id: 'portfolio',
      title: t('account.portfolio'),
      icon: 'images-outline',
      route: '/portfolio',
      color: colors.secondary[500],
      badge: analytics?.portfolio_items,
    },
    {
      id: 'services',
      title: t('account.myServices'),
      icon: 'briefcase-outline',
      route: '/my-services',
      color: colors.info,
    },
    {
      id: 'inventory',
      title: t('account.rentalInventory'),
      icon: 'cube-outline',
      route: '/inventory-management',
      color: colors.primary[500],
      subtitle: t('services.cameraRental'),
    },
    {
      id: 'equipment',
      title: t('account.myEquipment'),
      icon: 'camera-outline',
      route: '/my-equipment',
      color: colors.orange[500],
      subtitle: t('equipment.addGear'),
    },
    {
      id: 'packages',
      title: t('account.packages'),
      icon: 'gift-outline',
      route: '/my-packages',
      color: colors.pink[500],
    },
    {
      id: 'verification',
      title: t('account.verification'),
      icon: 'shield-checkmark-outline',
      route: '/verification',
      color: colors.success,
    },
  ];

  const accountMenuItems: MenuItem[] = [
    {
      id: 'profile',
      title: t('account.editProfile'),
      icon: 'person-outline',
      route: '/edit-profile',
      color: colors.primary[500],
    },
    {
      id: 'favorites',
      title: 'Favorites',
      icon: 'heart-outline',
      route: '/favorites',
      color: colors.error,
    },
    {
      id: 'support',
      title: t('account.support'),
      icon: 'help-circle-outline',
      route: '/support',
      color: colors.info,
    },
    {
      id: 'feedback',
      title: t('common.feedback'),
      icon: 'chatbox-ellipses-outline',
      route: '/feedback',
      color: colors.warning,
    },
    {
      id: 'logout',
      title: t('account.logout'),
      icon: 'log-out-outline',
      action: handleLogout,
      color: colors.error,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <LinearGradient
          colors={[colors.primary[500], colors.primary[700]]}
          style={styles.profileHeader}
        >
          <View style={styles.headerTop}>
            <View style={styles.avatarContainer}>
              {user?.picture ? (
                <Image source={{ uri: user.picture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={48} color={colors.white} />
                </View>
              )}
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              </View>
            </View>
          </View>
          
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          
          {profile?.city && (
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={14} color={colors.white} />
              <Text style={styles.locationText}>{profile.city}</Text>
            </View>
          )}

          {profile?.is_freelancer && (
            <View style={styles.typeBadge}>
              <Ionicons name="star" size={14} color={colors.warning} />
              <Text style={styles.typeBadgeText}>Freelancer</Text>
            </View>
          )}
          {profile?.is_business && (
            <View style={styles.typeBadge}>
              <Ionicons name="business" size={14} color={colors.info} />
              <Text style={styles.typeBadgeText}>Business</Text>
            </View>
          )}
        </LinearGradient>

        {/* Analytics Cards */}
        {analytics && (
          <View style={styles.analyticsContainer}>
            <View style={styles.analyticsCard}>
              <LinearGradient
                colors={[colors.primary[400], colors.primary[600]]}
                style={styles.analyticsGradient}
              >
                <Ionicons name="calendar" size={28} color={colors.white} />
                <Text style={styles.analyticsValue}>{analytics.total_bookings}</Text>
                <Text style={styles.analyticsLabel}>Bookings</Text>
              </LinearGradient>
            </View>
            <View style={styles.analyticsCard}>
              <LinearGradient
                colors={[colors.warning, colors.orange[600]]}
                style={styles.analyticsGradient}
              >
                <Ionicons name="star" size={28} color={colors.white} />
                <Text style={styles.analyticsValue}>
                  {analytics.average_rating.toFixed(1)}
                </Text>
                <Text style={styles.analyticsLabel}>Rating</Text>
              </LinearGradient>
            </View>
            <View style={styles.analyticsCard}>
              <LinearGradient
                colors={[colors.secondary[400], colors.secondary[600]]}
                style={styles.analyticsGradient}
              >
                <Ionicons name="chatbox" size={28} color={colors.white} />
                <Text style={styles.analyticsValue}>{analytics.total_reviews}</Text>
                <Text style={styles.analyticsLabel}>Reviews</Text>
              </LinearGradient>
            </View>
            <View style={styles.analyticsCard}>
              <LinearGradient
                colors={[colors.info, colors.info]}
                style={styles.analyticsGradient}
              >
                <Ionicons name="images" size={28} color={colors.white} />
                <Text style={styles.analyticsValue}>{analytics.portfolio_items}</Text>
                <Text style={styles.analyticsLabel}>Portfolio</Text>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Section Tabs */}
        <View style={styles.sectionTabs}>
          <TouchableOpacity
            style={[styles.sectionTab, activeSection === 'provider' && styles.sectionTabActive]}
            onPress={() => setActiveSection('provider')}
          >
            <Ionicons 
              name="briefcase" 
              size={20} 
              color={activeSection === 'provider' ? colors.primary[600] : colors.gray[500]} 
            />
            <Text style={[
              styles.sectionTabText,
              activeSection === 'provider' && styles.sectionTabTextActive
            ]}>
              Provider Tools
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sectionTab, activeSection === 'account' && styles.sectionTabActive]}
            onPress={() => setActiveSection('account')}
          >
            <Ionicons 
              name="settings" 
              size={20} 
              color={activeSection === 'account' ? colors.primary[600] : colors.gray[500]} 
            />
            <Text style={[
              styles.sectionTabText,
              activeSection === 'account' && styles.sectionTabTextActive
            ]}>
              Account Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {(activeSection === 'provider' ? providerMenuItems : accountMenuItems).map((item) => (
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
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                  {item.subtitle && (
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  )}
                  {item.badge !== undefined && item.badge > 0 && (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
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
  profileHeader: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  headerTop: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
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
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    ...typography.h2,
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
    marginBottom: spacing.xs,
  },
  locationText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  typeBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.gray[800],
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
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.lg,
  },
  analyticsGradient: {
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  analyticsValue: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '800',
  },
  analyticsLabel: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    opacity: 0.9,
  },
  sectionTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  sectionTabActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  sectionTabText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.gray[600],
  },
  sectionTabTextActive: {
    color: colors.primary[700],
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
    flex: 1,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemText: {
    ...typography.body,
    color: colors.gray[900],
    fontWeight: '600',
  },
  menuItemSubtitle: {
    ...typography.caption,
    color: colors.gray[500],
    marginTop: 2,
  },
  menuBadge: {
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  menuBadgeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.white,
    fontWeight: '700',
  },
});
