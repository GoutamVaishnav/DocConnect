import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { useChat, type ChatMessage } from '@/context/chat';
import { colors, roleColors, type AppRole } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

function MessageBubble({ message, role }: { message: ChatMessage; role: AppRole }) {
  const isOwnMessage = message.sender === role;
  const theme = roleColors(role);

  return (
    <View style={[styles.messageRow, isOwnMessage && styles.messageRowOwn]}>
      {!isOwnMessage ? (
        <View style={[styles.messageAvatar, { backgroundColor: role === 'patient' ? colors.doctor.soft : colors.patient.soft }]}>
          <MaterialCommunityIcons
            color={role === 'patient' ? colors.doctor.primary : colors.patient.primary}
            name={role === 'patient' ? 'doctor' : 'account-outline'}
            size={16}
          />
        </View>
      ) : null}
      <View style={[styles.bubbleGroup, isOwnMessage && styles.bubbleGroupOwn]}>
        <View style={[styles.bubble, isOwnMessage ? { backgroundColor: theme.primary } : styles.bubbleIncoming]}>
          <Text style={[styles.messageText, isOwnMessage && styles.messageTextOwn]}>{message.text}</Text>
        </View>
        <Text style={[styles.messageTime, isOwnMessage && styles.messageTimeOwn]}>{message.sentAt}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { conversationId, role: requestedRole } = useLocalSearchParams<{ conversationId?: string; role?: string }>();
  const { getConversation, sendMessage } = useChat();
  const [messageText, setMessageText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const role: AppRole = requestedRole === 'doctor' ? 'doctor' : 'patient';
  const conversation = typeof conversationId === 'string' ? getConversation(conversationId) : undefined;
  const theme = roleColors(role);

  function sendCurrentMessage() {
    if (!conversation) {
      return;
    }

    sendMessage(conversation.id, role, messageText);
    setMessageText('');
  }

  if (!conversation) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.missingState}>
          <MaterialCommunityIcons color={colors.muted} name="message-alert-outline" size={52} />
          <Text style={styles.missingTitle}>Chat unavailable</Text>
          <Text style={styles.missingText}>This local demo conversation is not available in the current session.</Text>
          <AppButton label="Go back" onPress={() => router.back()} role={role} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons color={colors.navy} name="arrow-left" size={24} />
          </Pressable>
          <View style={[styles.headerAvatar, { backgroundColor: theme.soft }]}>
            <MaterialCommunityIcons
              color={theme.primary}
              name={role === 'patient' ? 'doctor' : 'account-outline'}
              size={24}
            />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.participantName}>{conversation.participantName}</Text>
            <View style={styles.statusLine}>
              <View style={[styles.onlineDot, { backgroundColor: theme.primary }]} />
              <Text style={styles.participantSubtitle}>{conversation.participantSubtitle}</Text>
            </View>
          </View>
          <MaterialCommunityIcons color={colors.muted} name="dots-vertical" size={23} />
        </View>

        <View style={[styles.demoBanner, { backgroundColor: theme.soft }]}>
          <MaterialCommunityIcons color={theme.primary} name="information-outline" size={18} />
          <Text style={styles.demoBannerText}>Messages stay only in this local UI demo until secure chat is connected.</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.dateLabel}>Today</Text>
          {conversation.messages.map((message) => <MessageBubble key={message.id} message={message} role={role} />)}
        </ScrollView>

        <View style={styles.composer}>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons color={colors.muted} name="paperclip" size={20} />
            <TextInput
              accessibilityLabel="Message"
              multiline
              onChangeText={setMessageText}
              onSubmitEditing={sendCurrentMessage}
              placeholder="Type a message..."
              placeholderTextColor={colors.muted}
              returnKeyType="send"
              style={styles.input}
              value={messageText}
            />
          </View>
          <Pressable
            accessibilityLabel="Send message"
            accessibilityRole="button"
            disabled={messageText.trim().length === 0}
            onPress={sendCurrentMessage}
            style={[styles.sendButton, { backgroundColor: theme.primary }, messageText.trim().length === 0 && styles.sendButtonDisabled]}
          >
            <MaterialCommunityIcons color={colors.surface} name="send" size={20} />
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 32 },
  bubble: { borderRadius: radius.md, maxWidth: '100%', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  bubbleGroup: { flexShrink: 1, maxWidth: '78%' },
  bubbleGroupOwn: { alignItems: 'flex-end' },
  bubbleIncoming: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  composer: { alignItems: 'flex-end', backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: spacing.xs, padding: spacing.sm },
  container: { backgroundColor: colors.canvas, flex: 1 },
  dateLabel: { alignSelf: 'center', color: colors.muted, fontSize: 11, fontWeight: '700', marginBottom: spacing.md },
  demoBanner: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.xs, marginHorizontal: spacing.md, marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.md },
  demoBannerText: { color: colors.text, flex: 1, fontSize: 11, lineHeight: 16 },
  header: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  headerAvatar: { alignItems: 'center', borderRadius: radius.pill, height: 42, justifyContent: 'center', width: 42 },
  headerCopy: { flex: 1 },
  input: { color: colors.navy, flex: 1, fontSize: 14, maxHeight: 92, minHeight: 40, paddingVertical: spacing.xs },
  inputWrap: { alignItems: 'center', backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.xs, minHeight: 48, paddingHorizontal: spacing.sm },
  messageAvatar: { alignItems: 'center', alignSelf: 'flex-end', borderRadius: radius.pill, height: 28, justifyContent: 'center', width: 28 },
  messageRow: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.xs },
  messageRowOwn: { justifyContent: 'flex-end' },
  messageText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  messageTextOwn: { color: colors.surface },
  messageTime: { color: colors.muted, fontSize: 10, marginTop: 4 },
  messageTimeOwn: { textAlign: 'right' },
  messages: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl },
  missingState: { alignItems: 'center', flex: 1, gap: spacing.sm, justifyContent: 'center', paddingHorizontal: spacing.xl },
  missingText: { color: colors.text, fontSize: 13, lineHeight: 19, marginBottom: spacing.md, textAlign: 'center' },
  missingTitle: { color: colors.navy, fontSize: 18, fontWeight: '700', marginTop: spacing.xs },
  onlineDot: { borderRadius: radius.pill, height: 6, width: 6 },
  participantName: { color: colors.navy, fontSize: 15, fontWeight: '700' },
  participantSubtitle: { color: colors.muted, fontSize: 11 },
  safeArea: { flex: 1 },
  sendButton: { alignItems: 'center', borderRadius: radius.pill, height: 48, justifyContent: 'center', width: 48 },
  sendButtonDisabled: { opacity: 0.45 },
  statusLine: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 2 },
});
