import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';

const { width } = Dimensions.get('window');

const ALL_SERVICES = [
  // Freelancer Services
  { id: 'photographer', name: 'Photographer', icon: 'camera', type: 'freelancer', description: 'Professional photography services' },
  { id: 'videographer', name: 'Videographer', icon: 'videocam', type: 'freelancer', description: 'Video recording & production' },
  { id: 'album_designer', name: 'Album Designer', icon: 'images', type: 'freelancer', description: 'Beautiful album designs' },
  { id: 'video_editor', name: 'Video Editor', icon: 'film', type: 'freelancer', description: 'Professional video editing' },
  { id: 'web_live_services', name: 'Web Live', icon: 'wifi', type: 'freelancer', description: 'Live streaming services' },
  { id: 'led_wall', name: 'LED Wall', icon: 'tv', type: 'freelancer', description: 'LED wall setup & management' },
  
  // Business Services
  { id: 'photography_firm', name: 'Photography Firm', icon: 'business', type: 'business', description: 'Complete photography solutions' },
  { id: 'camera_rental', name: 'Camera Rental', icon: 'camera', type: 'business', description: 'Rent professional cameras' },
  { id: 'service_centres', name: 'Service Centres', icon: 'construct', type: 'business', description: 'Equipment repair & service' },
  { id: 'outdoor_studios', name: 'Outdoor Studios', icon: 'home', type: 'business', description: 'Outdoor shooting locations' },
  { id: 'editing_studios', name: 'Editing Studios', icon: 'film', type: 'business', description: 'Professional editing suites' },
  { id: 'printing_labs', name: 'Printing Labs', icon: 'print', type: 'business', description: 'High-quality photo printing' },
];

export default function ServicesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'freelancer' | 'business'>('all');

  const filteredServices =
    activeTab === 'all'
      ? ALL_SERVICES
      : ALL_SERVICES.filter((s) => s.type === activeTab);

  const handleServicePress = (serviceId: string) => {
    router.push(`/service-list?type=${serviceId}`);
  };

  const freelancerCount = ALL_SERVICES.filter(s => s.type === 'freelancer').length;
  const businessCount = ALL_SERVICES.filter(s => s.type === 'business').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[colors.primary[50], colors.white, colors.gray[50]]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Services</Text>
            <Text style={styles.headerSubtitle}>Explore creative services</Text>
          </View>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => router.push('/search')}
          >
            <Ionicons name="search" size={24} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ALL_SERVICES.length}</Text>
            <Text style={styles.statLabel}>Total Services</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{freelancerCount}</Text>
            <Text style={styles.statLabel}>Freelancers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{businessCount}</Text>
            <Text style={styles.statLabel}>Businesses</Text>
          </View>
        </View>

        {/* Enhanced Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'all' && styles.tabActive]}
              onPress={() => setActiveTab('all')}
              activeOpacity={0.7}
            >
              {activeTab === 'all' && (
                <LinearGradient
                  colors={[colors.primary[400], colors.primary[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tabGradient}
                />
              )}
              <View style={styles.tabContent}>
                <Ionicons 
                  name="grid" 
                  size={18} 
                  color={activeTab === 'all' ? colors.white : colors.gray[600]} 
                />
                <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                  All Services
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'freelancer' && styles.tabActive]}
              onPress={() => setActiveTab('freelancer')}
              activeOpacity={0.7}
            >
              {activeTab === 'freelancer' && (
                <LinearGradient
                  colors={[colors.primary[400], colors.primary[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tabGradient}
                />
              )}
              <View style={styles.tabContent}>
                <Ionicons 
                  name="person" 
                  size={18} 
                  color={activeTab === 'freelancer' ? colors.white : colors.gray[600]} 
                />
                <Text style={[styles.tabText, activeTab === 'freelancer' && styles.tabTextActive]}>
                  Freelancers
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'business' && styles.tabActive]}
              onPress={() => setActiveTab('business')}
              activeOpacity={0.7}
            >
              {activeTab === 'business' && (
                <LinearGradient
                  colors={[colors.secondary[400], colors.secondary[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tabGradient}
                />
              )}
              <View style={styles.tabContent}>
                <Ionicons 
                  name="business" 
                  size={18} 
                  color={activeTab === 'business' ? colors.white : colors.gray[600]} 
                />
                <Text style={[styles.tabText, activeTab === 'business' && styles.tabTextActive]}>
                  Businesses
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Services Grid */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.servicesGrid}>
            {filteredServices.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => handleServicePress(service.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    service.type === 'freelancer'
                      ? [colors.primary[50], colors.primary[100]]
                      : [colors.secondary[50], colors.secondary[100]]
                  }
                  style={styles.serviceCardGradient}
                >
                  <View style={[
                    styles.iconContainer,
                    { backgroundColor: service.type === 'freelancer' ? colors.primary[200] : colors.secondary[200] }
                  ]}>
                    <Ionicons
                      name={service.icon as any}
                      size={28}
                      color={service.type === 'freelancer' ? colors.primary[700] : colors.secondary[700]}
                    />
                  </View>
                  <Text style={styles.serviceCardTitle}>{service.name}</Text>
                  <Text style={styles.serviceCardDescription} numberOfLines={2}>
                    {service.description}
                  </Text>
                  <View style={styles.serviceCardFooter}>
                    <Text style={[
                      styles.exploreText,
                      { color: service.type === 'freelancer' ? colors.primary[700] : colors.secondary[700] }
                    ]}>
                      Explore
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={service.type === 'freelancer' ? colors.primary[700] : colors.secondary[700]}
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.gray[900],
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.gray[600],
    marginTop: 2,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: colors.primary[600],
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.gray[600],
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray[200],
  },
  tabsContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    ...shadows.sm,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
  },
  tabActive: {
    backgroundColor: 'transparent',
  },
  tabGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
  },
  tabText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.gray[600],
  },
  tabTextActive: {
    color: colors.white,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  serviceCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  serviceCardGradient: {
    padding: spacing.md,
    minHeight: 180,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  serviceCardTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  serviceCardDescription: {
    ...typography.caption,
    color: colors.gray[600],
    lineHeight: 16,
    flex: 1,
  },
  serviceCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  exploreText: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
});
