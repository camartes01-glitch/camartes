import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';
import { LANGUAGES } from '../i18n/config';

const { height } = Dimensions.get('window');

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  const currentLanguage = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0];

  return (
    <View>
      {/* Language Button */}
      <TouchableOpacity
        style={styles.languageButton}
        onPress={() => setIsOpen(true)}
      >
        <Ionicons name="globe-outline" size={20} color={colors.primary[600]} />
        <Text style={styles.languageButtonText}>{currentLanguage.nativeName}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.gray[500]} />
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal visible={isOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('common.language')}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={28} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            {/* Language List */}
            <ScrollView style={styles.languageList}>
              {LANGUAGES.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageItem,
                    i18n.language === language.code && styles.languageItemActive,
                  ]}
                  onPress={() => handleLanguageChange(language.code)}
                >
                  <View style={styles.languageInfo}>
                    <Text style={[
                      styles.languageNative,
                      i18n.language === language.code && styles.languageNativeActive,
                    ]}>
                      {language.nativeName}
                    </Text>
                    <Text style={styles.languageName}>{language.name}</Text>
                  </View>
                  {i18n.language === language.code && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary[600]} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  languageButtonText: {
    ...typography.bodySmall,
    color: colors.primary[700],
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    ...typography.h3,
    color: colors.gray[900],
  },
  languageList: {
    padding: spacing.md,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  languageItemActive: {
    backgroundColor: colors.primary[50],
  },
  languageInfo: {
    flex: 1,
  },
  languageNative: {
    ...typography.body,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 2,
  },
  languageNativeActive: {
    color: colors.primary[700],
  },
  languageName: {
    ...typography.caption,
    color: colors.gray[500],
  },
});
