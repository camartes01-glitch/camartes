import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { formatDistanceToNow } from 'date-fns';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function MessagesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(
        `${API_URL}/api/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConversations(response.data);
    } catch (error) {
      console.error('Load conversations error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleConversationPress = (userId: string) => {
    router.push(`/chat/${userId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('common.messages')}</Text>
        <TouchableOpacity onPress={() => router.push('/new-message')}>
          <Ionicons name="create-outline" size={24} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {conversations.length > 0 ? (
          conversations.map((conversation: any) => (
            <TouchableOpacity
              key={conversation._id}
              style={styles.conversationCard}
              onPress={() => handleConversationPress(conversation._id)}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                {conversation.user?.picture ? (
                  <Image
                    source={{ uri: conversation.user.picture }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Ionicons name="person" size={32} color={colors.gray[400]} />
                )}
              </View>

              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationName}>
                    {conversation.user?.name || 'Unknown User'}
                  </Text>
                  <Text style={styles.conversationTime}>
                    {formatDistanceToNow(new Date(conversation.last_message_time), {
                      addSuffix: true,
                    })}
                  </Text>
                </View>
                <View style={styles.messageRow}>
                  <Text
                    style={[
                      styles.lastMessage,
                      conversation.unread_count > 0 && styles.lastMessageUnread,
                    ]}
                    numberOfLines={1}
                  >
                    {conversation.last_message}
                  </Text>
                  {conversation.unread_count > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>
                        {conversation.unread_count}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyText}>{t('messages.noMessages')}</Text>
            <Text style={styles.emptySubtext}>
              {t('messages.startConversation')}
            </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.gray[900],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.gray[900],
  },
  conversationTime: {
    ...typography.caption,
    color: colors.gray[500],
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    ...typography.bodySmall,
    color: colors.gray[600],
    flex: 1,
  },
  lastMessageUnread: {
    fontWeight: '600',
    color: colors.gray[900],
  },
  unreadBadge: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  unreadText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 11,
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
    textAlign: 'center',
  },
});
