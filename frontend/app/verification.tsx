import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';


export default function VerificationScreen() {
  const router = useRouter();
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [startingKyc, setStartingKyc] = useState(false);

  const aadhaarVerified = user?.aadhaar_verified ?? false;

  const startAadhaarVerification = async () => {
    try {
      setStartingKyc(true);
      const response = await api.get('/aadhaar/start');
      const { auth_url } = response.data;

      if (!auth_url) {
        Alert.alert('Error', 'Could not get verification link');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        auth_url,
        undefined,
        { showInRecents: true }
      );

      if (result.type === 'cancel' || result.type === 'dismiss') {
        await checkAuth();
      } else if (result.type === 'success' && result.url) {
        await checkAuth();
      }
    } catch (err) {
      console.error('Aadhaar verification error:', err);
      Alert.alert(
        'Verification Error',
        'Could not start Aadhaar verification. Please try again.'
      );
    } finally {
      setStartingKyc(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await checkAuth();
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

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
            name={aadhaarVerified ? 'shield-checkmark' : 'shield-outline'}
            size={64}
            color={aadhaarVerified ? colors.success : colors.gray[400]}
          />
          <Text style={styles.statusText}>
            {aadhaarVerified
              ? 'Aadhaar Verified'
              : 'Verify with Aadhaar'}
          </Text>
          <Text style={styles.description}>
            {aadhaarVerified
              ? 'Your identity has been verified using Aadhaar.'
              : 'Verify your identity using Aadhaar for a trusted profile.'}
          </Text>

          {!aadhaarVerified && (
            <TouchableOpacity
              style={styles.requestButton}
              onPress={startAadhaarVerification}
              disabled={startingKyc}
            >
              <LinearGradient
                colors={[colors.primary[400], colors.primary[600]]}
                style={styles.requestGradient}
              >
                {startingKyc ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.requestText}>Verify with Aadhaar</Text>
                )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  statusText: {
    ...typography.h3,
    color: colors.gray[900],
    marginTop: spacing.md,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.gray[600],
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  requestButton: { marginTop: spacing.md, width: '100%' },
  requestGradient: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  requestText: { ...typography.body, color: colors.white, fontWeight: '600' },
});
