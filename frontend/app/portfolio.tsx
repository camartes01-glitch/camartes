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
            <Ionicons name=\"arrow-back\" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Portfolio & Profile</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Ionicons name=\"add-circle\" size={28} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'portfolio' && styles.tabActive]}
            onPress={() => setActiveTab('portfolio')}
          >
            <Ionicons
              name=\"images\"
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
              name=\"person\"
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
                  <Ionicons name=\"images-outline\" size={64} color={colors.gray[300]} />
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
                  placeholder=\"Tell clients about yourself and your photography journey...\"
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
                  placeholder=\"e.g., Wedding Photography, Portrait Photography\"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Years of Experience</Text>
                <TextInput
                  style={styles.input}
                  value={yearsExperience}
                  onChangeText={setYearsExperience}
                  placeholder=\"e.g., 5\"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType=\"numeric\"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Achievements & Awards</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={achievements}
                  onChangeText={setAchievements}
                  placeholder=\"List your achievements, awards, and recognitions...\"
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
                      <Ionicons name=\"briefcase\" size={20} color={colors.primary[600]} />
                      <Text style={styles.previewText}>{specialization}</Text>
                    </View>
                  )}
                  {yearsExperience && (
                    <View style={styles.previewRow}>
                      <Ionicons name=\"time\" size={20} color={colors.primary[600]} />
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
                  <Ionicons name=\"close\" size={28} color={colors.gray[600]} />
                </TouchableOpacity>
              </View>

              <ScrollView>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Title *</Text>
                  <TextInput
                    style={styles.input}
                    value={newTitle}
                    onChangeText={setNewTitle}
                    placeholder=\"e.g., Summer Wedding 2024\"
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
                    placeholder=\"Describe this project...\"
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
  header: {\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    alignItems: 'center',\n    padding: spacing.lg,\n    backgroundColor: colors.white,\n    ...shadows.sm,\n  },\n  headerTitle: { ...typography.h4, color: colors.gray[900] },\n  tabsContainer: {\n    flexDirection: 'row',\n    padding: spacing.md,\n    gap: spacing.sm,\n    backgroundColor: colors.white,\n  },\n  tab: {\n    flex: 1,\n    flexDirection: 'row',\n    alignItems: 'center',\n    justifyContent: 'center',\n    gap: spacing.xs,\n    paddingVertical: spacing.sm + 2,\n    borderRadius: borderRadius.md,\n    backgroundColor: colors.gray[100],\n  },\n  tabActive: { backgroundColor: colors.primary[500] },\n  tabText: { ...typography.bodySmall, fontWeight: '600', color: colors.gray[600] },\n  tabTextActive: { color: colors.white },\n  scrollView: { flex: 1 },\n  scrollContent: { padding: spacing.lg },\n  portfolioGrid: {\n    flexDirection: 'row',\n    flexWrap: 'wrap',\n    gap: spacing.md,\n  },\n  portfolioCard: {\n    width: (width - spacing.lg * 2 - spacing.md) / 2,\n    height: 200,\n    borderRadius: borderRadius.md,\n    overflow: 'hidden',\n    ...shadows.md,\n  },\n  portfolioImage: { width: '100%', height: '100%', resizeMode: 'cover' },\n  portfolioOverlay: {\n    position: 'absolute',\n    bottom: 0,\n    left: 0,\n    right: 0,\n    padding: spacing.sm,\n  },\n  portfolioTitle: { ...typography.bodySmall, color: colors.white, fontWeight: '700' },\n  categoryBadge: {\n    alignSelf: 'flex-start',\n    backgroundColor: colors.primary[500],\n    paddingHorizontal: spacing.xs,\n    paddingVertical: 2,\n    borderRadius: borderRadius.sm,\n    marginTop: 4,\n  },\n  categoryText: { ...typography.caption, fontSize: 10, color: colors.white, fontWeight: '600' },\n  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl * 2 },\n  emptyText: { ...typography.h4, color: colors.gray[500], marginTop: spacing.md },\n  emptySubtext: { ...typography.body, color: colors.gray[400], marginTop: spacing.xs },\n  profileForm: { gap: spacing.md },\n  sectionTitle: { ...typography.h3, color: colors.gray[900], marginBottom: spacing.md },\n  inputGroup: { marginBottom: spacing.md },\n  label: { ...typography.bodySmall, fontWeight: '600', color: colors.gray[700], marginBottom: spacing.sm },\n  input: {\n    backgroundColor: colors.white,\n    borderWidth: 1,\n    borderColor: colors.gray[300],\n    borderRadius: borderRadius.md,\n    paddingHorizontal: spacing.md,\n    paddingVertical: spacing.sm + 4,\n    ...typography.body,\n    color: colors.gray[900],\n  },\n  textArea: { minHeight: 100, textAlignVertical: 'top' },\n  saveButton: { marginTop: spacing.lg },\n  saveGradient: {\n    paddingVertical: spacing.md,\n    borderRadius: borderRadius.md,\n    alignItems: 'center',\n  },\n  saveText: { ...typography.body, color: colors.white, fontWeight: '600' },\n  previewCard: {\n    backgroundColor: colors.white,\n    padding: spacing.lg,\n    borderRadius: borderRadius.lg,\n    marginTop: spacing.xl,\n    ...shadows.lg,\n  },\n  previewTitle: { ...typography.h4, color: colors.gray[900], marginBottom: spacing.md },\n  previewRow: {\n    flexDirection: 'row',\n    alignItems: 'center',\n    gap: spacing.sm,\n    marginBottom: spacing.sm,\n  },\n  previewText: { ...typography.body, color: colors.gray[700] },\n  bioPreview: {\n    marginTop: spacing.md,\n    paddingTop: spacing.md,\n    borderTopWidth: 1,\n    borderTopColor: colors.gray[200],\n  },\n  bioText: { ...typography.body, color: colors.gray[700], lineHeight: 22 },\n  modalContainer: {\n    position: 'absolute',\n    top: 0,\n    left: 0,\n    right: 0,\n    bottom: 0,\n    backgroundColor: 'rgba(0,0,0,0.5)',\n    justifyContent: 'flex-end',\n  },\n  modalContent: {\n    backgroundColor: colors.white,\n    borderTopLeftRadius: borderRadius.xl,\n    borderTopRightRadius: borderRadius.xl,\n    padding: spacing.lg,\n    maxHeight: '90%',\n  },\n  modalHeader: {\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    alignItems: 'center',\n    marginBottom: spacing.lg,\n  },\n  modalTitle: { ...typography.h3, color: colors.gray[900] },\n  categoryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },\n  categoryChip: {\n    paddingHorizontal: spacing.md,\n    paddingVertical: spacing.sm,\n    borderRadius: borderRadius.full,\n    backgroundColor: colors.gray[100],\n    borderWidth: 1,\n    borderColor: colors.gray[300],\n  },\n  categoryChipActive: {\n    backgroundColor: colors.primary[500],\n    borderColor: colors.primary[500],\n  },\n  categoryChipText: { ...typography.bodySmall, fontWeight: '600', color: colors.gray[600] },\n  categoryChipTextActive: { color: colors.white },\n  imagePickerButton: { marginVertical: spacing.md },\n  imagePickerGradient: {\n    flexDirection: 'row',\n    alignItems: 'center',\n    justifyContent: 'center',\n    gap: spacing.sm,\n    paddingVertical: spacing.md,\n    borderRadius: borderRadius.md,\n  },\n  imagePickerText: { ...typography.body, color: colors.secondary[700], fontWeight: '600' },\n  submitButton: { marginTop: spacing.lg },\n  submitGradient: {\n    paddingVertical: spacing.md,\n    borderRadius: borderRadius.md,\n    alignItems: 'center',\n  },\n  submitText: { ...typography.body, color: colors.white, fontWeight: '600' },\n});\n