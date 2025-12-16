import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { login } = useAuth();

  return (
    <LinearGradient
      colors={[colors.primary[50], colors.white, colors.gray[100]]}
      style={styles.container}
    >
      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Camera size={60} color={colors.primary[500]} />
          <Text style={styles.logoText}>Camartes</Text>
          <Text style={styles.tagline}>Photography Ecosystem Platform</Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            Connect with professional photographers, videographers, and creative services.
          </Text>
          <Text style={styles.features}>
            {"\u2022"} Book photography services{"\n"}
            {"\u2022"} Rent camera equipment{"\n"}
            {"\u2022"} Discover talented professionals{"\n"}
            {"\u2022"} Manage your creative business
          </Text>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={login}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary[400], colors.primary[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continue with Google</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  circle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primary[200],
    opacity: 0.3,
  },
  circle2: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: colors.secondary[200],
    opacity: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoText: {
    ...typography.h1,
    fontSize: 42,
    color: colors.primary[600],
    marginTop: spacing.md,
    fontWeight: '800',
  },
  tagline: {
    ...typography.bodySmall,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  descriptionContainer: {
    marginBottom: spacing.xxl,
    width: '100%',
  },
  description: {
    ...typography.body,
    color: colors.gray[700],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  features: {
    ...typography.bodySmall,
    color: colors.gray[600],
    textAlign: 'left',
    lineHeight: 28,
  },
  loginButton: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  buttonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  footer: {
    ...typography.caption,
    color: colors.gray[500],
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
