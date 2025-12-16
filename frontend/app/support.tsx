import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

const FAQ_ITEMS = [
  {
    question: 'How do I book a photographer?',
    answer:
      'Browse services, select a provider, view their profile, and click "Book Now" to send a booking request.',
  },
  {
    question: 'How does payment work?',
    answer:
      'Discuss payment terms directly with the service provider. Camartes helps you connect but doesn\'t process payments.',
  },
  {
    question: 'Can I cancel a booking?',
    answer: 'Contact the provider directly to discuss cancellation policies.',
  },
  {
    question: 'How do I become a verified provider?',
    answer:
      'Go to Account > Verification and submit your verification request with required documents.',
  },
];

const CONTACT_OPTIONS = [
  { id: 'email', icon: 'mail', title: 'Email Us', value: 'support@camartes.com' },
  { id: 'phone', icon: 'call', title: 'Call Us', value: '+91 1234567890' },
  { id: 'whatsapp', icon: 'logo-whatsapp', title: 'WhatsApp', value: '+91 1234567890' },
];

export default function SupportScreen() {
  const router = useRouter();

  const handleContactPress = (type: string, value: string) => {
    switch (type) {
      case 'email':
        Linking.openURL(`mailto:${value}`);
        break;
      case 'phone':
        Linking.openURL(`tel:${value}`);
        break;
      case 'whatsapp':
        Linking.openURL(`https://wa.me/${value.replace(/[^0-9]/g, '')}`);
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          {CONTACT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.contactCard}
              onPress={() => handleContactPress(option.id, option.value)}
            >
              <View style={styles.contactIcon}>
                <Ionicons name={option.icon as any} size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>{option.title}</Text>
                <Text style={styles.contactValue}>{option.value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {FAQ_ITEMS.map((item, index) => (
            <View key={index} style={styles.faqCard}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.feedbackButton}
          onPress={() => router.push('/feedback')}
        >
          <Ionicons name="chatbox-ellipses" size={20} color={colors.primary[600]} />
          <Text style={styles.feedbackButtonText}>Send Feedback</Text>
        </TouchableOpacity>
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
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  contactValue: {
    ...typography.bodySmall,
    color: colors.gray[600],
  },
  faqCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  faqQuestion: {
    ...typography.body,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  faqAnswer: {
    ...typography.bodySmall,
    color: colors.gray[700],
    lineHeight: 20,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  feedbackButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary[600],
  },
});