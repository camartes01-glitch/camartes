import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function PortfolioScreen() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState([]);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/portfolio`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPortfolio(response.data);
    } catch (error) {
      console.error('Load portfolio error:', error);
    }
  };

  const handleAddItem = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      Alert.prompt(
        'Add Portfolio Item',
        'Enter title',
        async (title) => {
          if (title) {
            try {
              const token = await AsyncStorage.getItem('session_token');
              await axios.post(
                `${API_URL}/api/portfolio`,
                {
                  title,
                  image: result.assets[0].base64,
                  category: 'general',
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              await loadPortfolio();
            } catch (error) {
              console.error('Add portfolio error:', error);
            }
          }
        }
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Portfolio</Text>
        <TouchableOpacity onPress={handleAddItem}>
          <Ionicons name="add-circle" size={28} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {portfolio.length > 0 ? (
          <View style={styles.grid}>
            {portfolio.map((item: any, index) => (
              <View key={index} style={styles.portfolioCard}>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${item.image}` }}
                  style={styles.portfolioImage}
                />
                <Text style={styles.portfolioTitle}>{item.title}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyText}>No portfolio items</Text>
            <Text style={styles.emptySubtext}>Add your work to showcase</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.gray[900],
  },
  scrollContent: {
    padding: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  portfolioCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  portfolioImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  portfolioTitle: {
    ...typography.bodySmall,
    padding: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    ...typography.h4,
    color: colors.gray[500],
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.gray[400],
    marginTop: spacing.xs,
  },
});
