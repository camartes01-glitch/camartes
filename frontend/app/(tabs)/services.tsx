import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';

const { width } = Dimensions.get('window');

const ALL_SERVICES = [
  // Freelancer
  { id: 'photographer', name: 'Photographer', icon: 'camera', type: 'freelancer' },
  { id: 'videographer', name: 'Videographer', icon: 'videocam', type: 'freelancer' },
  { id: 'album_designer', name: 'Album Designer', icon: 'images', type: 'freelancer' },
  { id: 'video_editor', name: 'Video Editor', icon: 'film', type: 'freelancer' },
  { id: 'web_live_services', name: 'Web Live', icon: 'wifi', type: 'freelancer' },
  { id: 'led_wall', name: 'LED Wall', icon: 'tv', type: 'freelancer' },
  // Business
  { id: 'photography_firm', name: 'Photography Firm', icon: 'business', type: 'business' },
  { id: 'camera_rental', name: 'Camera Rental', icon: 'camera', type: 'business' },
  { id: 'service_centres', name: 'Service Centres', icon: 'construct', type: 'business' },
  { id: 'outdoor_studios', name: 'Outdoor Studios', icon: 'home', type: 'business' },
  { id: 'editing_studios', name: 'Editing Studios', icon: 'film', type: 'business' },
  { id: 'printing_labs', name: 'Printing Labs', icon: 'print', type: 'business' },
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[colors.primary[50], colors.white]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Services</Text>
          <TouchableOpacity onPress={() => router.push('/search')}>
            <Ionicons name="search" size={24} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'all' && styles.tabTextActive,
              ]}
            >
              All Services
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'freelancer' && styles.tabActive]}
            onPress={() => setActiveTab('freelancer')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'freelancer' && styles.tabTextActive,
              ]}
            >
              Freelancers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'business' && styles.tabActive]}
            onPress={() => setActiveTab('business')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'business' && styles.tabTextActive,
              ]}
            >
              Businesses
            </Text>
          </TouchableOpacity>
        </View>

        {/* Services List */}
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
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    service.type === 'freelancer'
                      ? [colors.primary[100], colors.primary[200]]
                      : [colors.secondary[100], colors.secondary[200]]
                  }
                  style={styles.serviceCardGradient}
                >
                  <Ionicons
                    name={service.icon as any}
                    size={40}
                    color={
                      service.type === 'freelancer'
                        ? colors.primary[700]
                        : colors.secondary[700]
                    }
                  />
                  <Text
                    style={[
                      styles.serviceCardText,
                      {
                        color:
                          service.type === 'freelancer'
                            ? colors.primary[700]
                            : colors.secondary[700],
                      },
                    ]}
                  >
                    {service.name}
                  </Text>
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
    aspectRatio: 1,
  },
  serviceCardGradient: {
    flex: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.md,
  },
  serviceCardText: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});
