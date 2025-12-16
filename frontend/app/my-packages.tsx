import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function MyPackagesScreen() {
  const router = useRouter();
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/packages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPackages(response.data);
    } catch (error) {
      console.error('Load packages error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Packages</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {packages.length > 0 ? (
          packages.map((pkg: any, index) => (
            <View key={index} style={styles.packageCard}>
              <Text style={styles.packageName}>{pkg.name}</Text>
              <Text style={styles.packagePrice}>₹{pkg.price}</Text>
              <Text style={styles.packageDescription}>{pkg.description}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No packages created</Text>
        )}
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
  packageCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  packageName: { ...typography.body, fontWeight: '700', color: colors.gray[900] },
  packagePrice: { ...typography.h4, color: colors.primary[600], marginVertical: spacing.sm },
  packageDescription: { ...typography.bodySmall, color: colors.gray[600] },
  emptyText: { ...typography.body, color: colors.gray[500], textAlign: 'center', marginTop: spacing.xxl },
});
