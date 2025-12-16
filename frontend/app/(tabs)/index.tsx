import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [blogs, setBlogs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const FREELANCER_SERVICES = [
    { id: 'photographer', name: t('services.photographer'), icon: 'camera' },
    { id: 'videographer', name: t('services.videographer'), icon: 'videocam' },
    { id: 'album_designer', name: t('services.albumDesigner'), icon: 'images' },
    { id: 'video_editor', name: t('services.videoEditor'), icon: 'film' },
    { id: 'web_live_services', name: t('services.webLive'), icon: 'wifi' },
    { id: 'led_wall', name: t('services.ledWall'), icon: 'tv' },
  ];

  const BUSINESS_SERVICES = [
    { id: 'photography_firm', name: t('services.photographyFirm'), icon: 'business' },
    { id: 'camera_rental', name: t('services.cameraRental'), icon: 'camera' },
    { id: 'service_centres', name: t('services.serviceCentres'), icon: 'construct' },
    { id: 'outdoor_studios', name: t('services.outdoorStudios'), icon: 'home' },
    { id: 'editing_studios', name: t('services.editingStudios'), icon: 'film' },
    { id: 'printing_labs', name: t('services.printingLabs'), icon: 'print' },
  ];

  useEffect(() => {
    loadData();
    checkProfileCompletion();
  }, []);

  const checkProfileCompletion = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data.has_completed_profile) {
        router.replace('/profile-setup');
      }
    } catch (error) {
      console.error('Profile check error:', error);
    }
  };

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');

      const blogsResponse = await axios.get(`${API_URL}/api/blogs?limit=5`);
      setBlogs(blogsResponse.data);

      const notifResponse = await axios.get(
        `${API_URL}/api/notifications/unread-count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCount(notifResponse.data.unread_count);
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleServicePress = (serviceId: string) => {
    router.push(`/service-list?type=${serviceId}`);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[colors.primary[50], colors.white, colors.gray[100]]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={require('../../assets/images/camartes-logo.png')} 
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/chatbot')}
            >
              <Ionicons name="chatbubble-ellipses" size={24} color={colors.primary[600]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications" size={24} color={colors.primary[600]} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.heroBanner}>
            <Text style={styles.heroTitle}>{t('home.findCreativePartner')}</Text>
            <Text style={styles.heroSubtitle}>
              {t('home.connectWithProfessionals')}
            </Text>
            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => router.push('/(tabs)/services')}
            >
              <LinearGradient
                colors={[colors.primary[400], colors.primary[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.heroButtonGradient}
              >
                <Text style={styles.heroButtonText}>{t('home.browseServices')}</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('home.freelancerServices')}</Text>
            <View style={styles.servicesGrid}>
              {FREELANCER_SERVICES.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => handleServicePress(service.id)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[colors.primary[100], colors.primary[200]]}
                    style={styles.serviceCardGradient}
                  >
                    <Ionicons
                      name={service.icon as any}
                      size={32}
                      color={colors.primary[700]}
                    />
                    <Text style={styles.serviceCardText}>{service.name}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('home.businessServices')}</Text>
            <View style={styles.servicesGrid}>
              {BUSINESS_SERVICES.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => handleServicePress(service.id)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[colors.secondary[100], colors.secondary[200]]}
                    style={styles.serviceCardGradient}
                  >
                    <Ionicons
                      name={service.icon as any}
                      size={32}
                      color={colors.secondary[700]}
                    />
                    <Text style={[styles.serviceCardText, { color: colors.secondary[700] }]}>
                      {service.name}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {blogs.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('home.latestNews')}</Text>
                <TouchableOpacity onPress={() => router.push('/blog-list')}>
                  <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.blogsContainer}
              >
                {blogs.map((blog: any) => (
                  <TouchableOpacity
                    key={blog.blog_id}
                    style={styles.blogCard}
                    onPress={() => router.push(`/blog/${blog.blog_id}`)}
                  >
                    {blog.image && (
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${blog.image}` }}
                        style={styles.blogImage}
                      />
                    )}
                    <View style={styles.blogContent}>
                      <Text style={styles.blogTitle} numberOfLines={2}>
                        {blog.title}
                      </Text>
                      <Text style={styles.blogAuthor}>By {blog.author}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/favorites')}
            >
              <Ionicons name="heart" size={28} color={colors.pink[500]} />
              <Text style={styles.quickActionText}>{t('common.favorites')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/equipment')}
            >
              <Ionicons name="camera-outline" size={28} color={colors.info} />
              <Text style={styles.quickActionText}>{t('common.equipment')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/support')}
            >
              <Ionicons name="help-circle" size={28} color={colors.success} />
              <Text style={styles.quickActionText}>{t('common.support')}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: spacing.xl }} />
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.primary[600],
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.sm,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 10,
  },
  heroBanner: {
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    ...shadows.lg,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.gray[600],
    marginBottom: spacing.lg,
  },
  heroButton: {
    alignSelf: 'flex-start',
  },
  heroButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  heroButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  seeAllText: {
    ...typography.body,
    color: colors.primary[600],
    fontWeight: '600',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  serviceCard: {
    width: (width - spacing.lg * 2 - spacing.md * 2) / 3,
    aspectRatio: 1,
  },
  serviceCardGradient: {
    flex: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  serviceCardText: {
    ...typography.bodySmall,
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary[700],
    textAlign: 'center',
  },
  blogsContainer: {
    gap: spacing.md,
  },
  blogCard: {
    width: width - spacing.lg * 4,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  blogImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  blogContent: {
    padding: spacing.md,
  },
  blogTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  blogAuthor: {
    ...typography.bodySmall,
    color: colors.gray[600],
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.md,
  },
  quickActionText: {
    ...typography.bodySmall,
    color: colors.gray[700],
    fontWeight: '600',
  },
});
