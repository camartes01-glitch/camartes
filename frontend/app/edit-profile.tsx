import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function EditProfileScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFullName(response.data.full_name || '');
      setContactNumber(response.data.contact_number || '');
      setCity(response.data.city || '');
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('session_token');
      await axios.put(
        `${API_URL}/api/profile`,
        { full_name: fullName, contact_number: contactNumber, city },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact Number</Text>
          <TextInput
            style={styles.input}
            value={contactNumber}
            onChangeText={setContactNumber}
            placeholder="Your contact number"
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Your city"
          />
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          <LinearGradient
            colors={[colors.primary[400], colors.primary[600]]}
            style={styles.saveGradient}
          >
            <Text style={styles.saveText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
          </LinearGradient>
        </TouchableOpacity>
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
  inputGroup: { marginBottom: spacing.lg },
  label: { ...typography.bodySmall, fontWeight: '600', color: colors.gray[700], marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
  },
  saveButton: { marginTop: spacing.lg },
  saveGradient: { padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  saveText: { ...typography.body, color: colors.white, fontWeight: '600' },
});
