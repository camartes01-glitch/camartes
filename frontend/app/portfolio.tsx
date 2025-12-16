import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const CATEGORIES = ['Wedding', 'Portrait', 'Product', 'Event', 'Landscape', 'Fashion', 'General'];

interface PortfolioItem {
  title: string;
  description: string;
  image: string;
  category: string;
  created_at?: string;
}

export default function EnhancedPortfolioScreen() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'profile'>('portfolio');

  // Add Item Form
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newImage, setNewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Profile Building
  const [bio, setBio] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [achievements, setAchievements] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('session_token');

      // Load Portfolio
      const portfolioRes = await axios.get(`${API_URL}/api/portfolio`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPortfolio(portfolioRes.data);

      // Load Profile
      const profileRes = await axios.get(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(profileRes.data);

      // Set profile building fields
      setBio(profileRes.data.bio || '');
      setSpecialization(profileRes.data.specialization || '');
      setYearsExperience(profileRes.data.years_experience?.toString() || '');
      setAchievements(profileRes.data.achievements || '');
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setNewImage(result.assets[0].base64);
    }
  };

  const handleAddPortfolio = async () => {
    if (!newTitle || !newImage) {
      Alert.alert('Error', 'Please provide title and image');
      return;
    }

    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('session_token');

      await axios.post(
        `${API_URL}/api/portfolio`,
        {
          title: newTitle,
          description: newDescription,
          image: newImage,
          category: newCategory,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', 'Portfolio item added!');
      setShowAddModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewImage(null);
      setNewCategory('General');
      await loadData();
    } catch (error) {
      console.error('Add portfolio error:', error);
      Alert.alert('Error', 'Failed to add portfolio item');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('session_token');

      await axios.put(
        `${API_URL}/api/profile`,
        {
          bio,
          specialization,
          years_experience: yearsExperience ? parseInt(yearsExperience) : undefined,
          achievements,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Save profile error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[colors.primary[50], colors.white]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Portfolio & Profile</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Ionicons name="add-circle" size={28} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'portfolio' && styles.tabActive]}
            onPress={() => setActiveTab('portfolio')}
          >
            <Ionicons
              name="images"
              size={20}
              color={activeTab === 'portfolio' ? colors.white : colors.gray[600]}
            />
            <Text style={[styles.tabText, activeTab === 'portfolio' && styles.tabTextActive]}>
              Portfolio ({portfolio.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
            onPress={() => setActiveTab('profile')}
          >
            <Ionicons
              name="person"
              size={20}
              color={activeTab === 'profile' ? colors.white : colors.gray[600]}
            />
            <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
              Profile Builder
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {activeTab === 'portfolio' ? (
            // Portfolio Grid
            <View>
              {portfolio.length > 0 ? (
                <View style={styles.portfolioGrid}>
                  {portfolio.map((item, index) => (
                    <View key={index} style={styles.portfolioCard}>
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${item.image}` }}
                        style={styles.portfolioImage}
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.portfolioOverlay}
                      >
                        <Text style={styles.portfolioTitle}>{item.title}</Text>
                        {item.category && (
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{item.category}</Text>
                          </View>
                        )}
                      </LinearGradient>
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
            </View>
          ) : (
            // Profile Building Form
            <View style={styles.profileForm}>
              <Text style={styles.sectionTitle}>Build Your Professional Profile</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Professional Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell clients about yourself and your photography journey..."
                  placeholderTextColor={colors.gray[400]}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Specialization</Text>
                <TextInput
                  style={styles.input}
                  value={specialization}
                  onChangeText={setSpecialization}
                  placeholder="e.g., Wedding Photography, Portrait Photography"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Years of Experience</Text>
                <TextInput
                  style={styles.input}
                  value={yearsExperience}
                  onChangeText={setYearsExperience}
                  placeholder="e.g., 5"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Achievements & Awards</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={achievements}
                  onChangeText={setAchievements}
                  placeholder="List your achievements, awards, and recognitions..."
                  placeholderTextColor={colors.gray[400]}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                disabled={uploading}
              >
                <LinearGradient
                  colors={[colors.primary[400], colors.primary[600]]}
                  style={styles.saveGradient}
                >
                  <Text style={styles.saveText}>
                    {uploading ? 'Saving...' : 'Save Profile'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Profile Preview */}
              {(bio || specialization) && (
                <View style={styles.previewCard}>
                  <Text style={styles.previewTitle}>Profile Preview</Text>
                  {specialization && (
                    <View style={styles.previewRow}>
                      <Ionicons name="briefcase" size={20} color={colors.primary[600]} />
                      <Text style={styles.previewText}>{specialization}</Text>
                    </View>
                  )}
                  {yearsExperience && (
                    <View style={styles.previewRow}>
                      <Ionicons name="time" size={20} color={colors.primary[600]} />
                      <Text style={styles.previewText}>{yearsExperience} years experience</Text>
                    </View>
                  )}
                  {bio && (
                    <View style={styles.bioPreview}>
                      <Text style={styles.bioText}>{bio}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Add Portfolio Modal */}
        {showAddModal && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Portfolio Item</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={28} color={colors.gray[600]} />
                </TouchableOpacity>
              </View>

              <ScrollView>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Title *</Text>
                  <TextInput
                    style={styles.input}
                    value={newTitle}
                    onChangeText={setNewTitle}
                    placeholder="e.g., Summer Wedding 2024"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.categoryRow}>
                      {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoryChip,
                            newCategory === cat && styles.categoryChipActive,
                          ]}
                          onPress={() => setNewCategory(cat)}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              newCategory === cat && styles.categoryChipTextActive,
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={newDescription}
                    onChangeText={setNewDescription}
                    placeholder="Describe this project..."
                    placeholderTextColor={colors.gray[400]}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                  <LinearGradient
                    colors={[colors.secondary[100], colors.secondary[200]]}
                    style={styles.imagePickerGradient}
                  >
                    <Ionicons
                      name={newImage ? 'checkmark-circle' : 'image'}
                      size={24}
                      color={colors.secondary[700]}
                    />
                    <Text style={styles.imagePickerText}>
                      {newImage ? 'Image Selected' : 'Select Image *'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleAddPortfolio}
                  disabled={uploading}
                >
                  <LinearGradient
                    colors={[colors.primary[400], colors.primary[600]]}
                    style={styles.submitGradient}
                  >
                    <Text style={styles.submitText}>
                      {uploading ? 'Adding...' : 'Add to Portfolio'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  headerTitle: { ...typography.h4, color: colors.gray[900] },
  tabsContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
  },
  tabActive: { backgroundColor: colors.primary[500] },
  tabText: { ...typography.bodySmall, fontWeight: '600', color: colors.gray[600] },
  tabTextActive: { color: colors.white },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  portfolioCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    height: 200,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  portfolioImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  portfolioOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
  },
  portfolioTitle: { ...typography.bodySmall, color: colors.white, fontWeight: '700' },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: 4,
  },
  categoryText: { ...typography.caption, fontSize: 10, color: colors.white, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl * 2 },
  emptyText: { ...typography.h4, color: colors.gray[500], marginTop: spacing.md },
  emptySubtext: { ...typography.body, color: colors.gray[400], marginTop: spacing.xs },
  profileForm: { gap: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.gray[900], marginBottom: spacing.md },
  inputGroup: { marginBottom: spacing.md },
  label: { ...typography.bodySmall, fontWeight: '600', color: colors.gray[700], marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    ...typography.body,
    color: colors.gray[900],
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  saveButton: { marginTop: spacing.lg },
  saveGradient: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveText: { ...typography.body, color: colors.white, fontWeight: '600' },
  previewCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
    ...shadows.lg,
  },
  previewTitle: { ...typography.h4, color: colors.gray[900], marginBottom: spacing.md },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  previewText: { ...typography.body, color: colors.gray[700] },
  bioPreview: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  bioText: { ...typography.body, color: colors.gray[700], lineHeight: 22 },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: { ...typography.h3, color: colors.gray[900] },
  categoryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  categoryChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  categoryChipText: { ...typography.bodySmall, fontWeight: '600', color: colors.gray[600] },
  categoryChipTextActive: { color: colors.white },
  imagePickerButton: { marginVertical: spacing.md },
  imagePickerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  imagePickerText: { ...typography.body, color: colors.secondary[700], fontWeight: '600' },
  submitButton: { marginTop: spacing.lg },
  submitGradient: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  submitText: { ...typography.body, color: colors.white, fontWeight: '600' },
});
