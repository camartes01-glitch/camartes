import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function MyEquipmentScreen() {
  const router = useRouter();
  const [equipment, setEquipment] = useState([]);

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/equipment/my-equipment`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEquipment(response.data);
    } catch (error) {
      console.error('Load equipment error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Equipment</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {equipment.length > 0 ? (
          equipment.map((item: any, index) => (
            <View key={index} style={styles.equipmentCard}>
              <Text style={styles.equipmentName}>{item.name}</Text>
              <Text style={styles.equipmentDetails}>
                {item.brand} {item.model} - ₹{item.daily_rate}/day
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No equipment listed</Text>
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
  equipmentCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  equipmentName: { ...typography.body, fontWeight: '700', color: colors.gray[900] },
  equipmentDetails: { ...typography.bodySmall, color: colors.gray[600], marginTop: spacing.xs },
  emptyText: { ...typography.body, color: colors.gray[500], textAlign: 'center', marginTop: spacing.xxl },
});
