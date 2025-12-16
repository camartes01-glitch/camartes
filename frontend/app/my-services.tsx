import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function MyServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState<any>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/services/my-services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServices(response.data);
    } catch (error) {
      console.error('Load services error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Services</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {services?.freelancer_services?.map((service: any, index: number) => (
          <View key={index} style={styles.serviceCard}>
            <Text style={styles.serviceType}>{service.service_type.toUpperCase()}</Text>
            <Text style={styles.serviceDetails}>{service.years_experience} years exp</Text>
          </View>
        ))}
        {services?.business_services?.map((service: any, index: number) => (
          <View key={index} style={styles.serviceCard}>
            <Text style={styles.serviceType}>{service.service_type.toUpperCase()}</Text>
            <Text style={styles.serviceDetails}>{service.years_experience} years exp</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  headerTitle: { ...typography.h4, color: colors.gray[900] },
  content: { padding: spacing.lg },
  serviceCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  serviceType: { ...typography.body, fontWeight: '700', color: colors.gray[900] },
  serviceDetails: { ...typography.bodySmall, color: colors.gray[600], marginTop: spacing.xs },
});
