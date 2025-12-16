import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function VerificationScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/verification/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatus(response.data);
    } catch (error) {
      console.error('Load status error:', error);
    }
  };

  const requestVerification = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      await axios.post(
        `${API_URL}/api/verification/request`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Verification request submitted');
      await loadStatus();
    } catch (error) {
      console.error('Request verification error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusCard}>
          <Ionicons
            name={status?.status === 'pending' ? 'time' : 'shield-checkmark'}
            size={64}
            color={status?.status === 'pending' ? colors.warning : colors.success}
          />
          <Text style={styles.statusText}>
            {status?.status === 'pending'
              ? 'Verification Pending'
              : status?.status === 'approved'
              ? 'Verified Account'
              : 'Not Verified'}
          </Text>
          {status?.status === 'not_requested' && (
            <TouchableOpacity style={styles.requestButton} onPress={requestVerification}>
              <LinearGradient
                colors={[colors.primary[400], colors.primary[600]]}
                style={styles.requestGradient}
              >
                <Text style={styles.requestText}>Request Verification</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
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
  statusCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.lg,
  },
  statusText: { ...typography.h3, color: colors.gray[900], marginTop: spacing.md, textAlign: 'center' },
  requestButton: { marginTop: spacing.xl, width: '100%' },
  requestGradient: { padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  requestText: { ...typography.body, color: colors.white, fontWeight: '600' },
});
