import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { useAuth } from '@/context/auth';
import { useConsultationDraft } from '@/context/consultation-draft';
import { getApiErrorMessage, messageApi, type ApiConsultationMessage } from '@/lib/api';
import { createChatSocket } from '@/lib/realtime-chat';
import { colors, roleColors, type AppRole } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Now';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function MessageBubble({ message, own, role }: { message: ApiConsultationMessage; own: boolean; role: AppRole }) {
  const theme = roleColors(role);

  return (
    <View style={[styles.messageRow, own && styles.messageRowOwn]}>
      {!own ? <View style={[styles.messageAvatar, { backgroundColor: role === 'patient' ? colors.doctor.soft : colors.patient.soft }]}><MaterialCommunityIcons color={role === 'patient' ? colors.doctor.primary : colors.patient.primary} name={role === 'patient' ? 'doctor' : 'account-outline'} size={16} /></View> : null}
      <View style={[styles.bubbleGroup, own && styles.bubbleGroupOwn]}>
        <View style={[styles.bubble, own ? { backgroundColor: theme.primary } : styles.bubbleIncoming]}><Text style={[styles.messageText, own && styles.messageTextOwn]}>{message.body}</Text></View>
        <Text style={[styles.messageTime, own && styles.messageTimeOwn]}>{formatMessageTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}

function mergeMessages(current: ApiConsultationMessage[], incoming: ApiConsultationMessage[]) {
  const messagesById = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => messagesById.set(message.id, message));

  return [...messagesById.values()].sort((left, right) => (
    left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id)
  ));
}

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId?: string }>();
  const { session } = useAuth();
  const { getConsultation, loadConsultation } = useConsultationDraft();
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<ApiConsultationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const role: AppRole = session?.user.role === 'DOCTOR' ? 'doctor' : 'patient';
  const theme = roleColors(role);
  const accessToken = session?.accessToken;
  const consultation = typeof conversationId === 'string' ? getConsultation(conversationId) : undefined;

  const addMessage = useCallback((message: ApiConsultationMessage) => {
    setMessages((current) => mergeMessages(current, [message]));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadConversation() {
      if (!conversationId || !accessToken) {
        if (!cancelled) {
          setLoadError('Sign in to open this chat.');
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);
        const details = await loadConsultation(conversationId);
        if (details.status !== 'In Progress') {
          if (!cancelled) setMessages([]);
          return;
        }

        const page = await messageApi.list(accessToken, conversationId);
        if (!cancelled) setMessages((current) => mergeMessages(current, page.messages));
      } catch (error) {
        if (!cancelled) setLoadError(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadConversation();
    return () => { cancelled = true; };
  }, [accessToken, conversationId, loadConsultation, refreshKey]);

  useEffect(() => {
    if (!conversationId || !accessToken) {
      return;
    }

    const activeConversationId = conversationId;
    const socket = createChatSocket(accessToken);

    function joinConsultationRoom() {
      socket.emit('chat:join', { consultationId: activeConversationId }, (result) => {
        if (!result.ok) {
          setIsLiveConnected(false);
          setLiveError(result.message);
          return;
        }

        setIsLiveConnected(true);
        setLiveError(null);
      });
    }

    function receiveMessage(message: ApiConsultationMessage) {
      if (message.consultationId === activeConversationId) {
        addMessage(message);
      }
    }

    socket.on('connect', joinConsultationRoom);
    socket.on('disconnect', () => setIsLiveConnected(false));
    socket.on('connect_error', () => {
      setIsLiveConnected(false);
      setLiveError('Live updates are reconnecting. You can still send messages.');
    });
    socket.on('chat:error', (payload) => {
      setIsLiveConnected(false);
      setLiveError(payload.message);
    });
    socket.on('chat:message', receiveMessage);
    socket.connect();

    return () => {
      socket.emit('chat:leave', { consultationId: activeConversationId });
      socket.disconnect();
    };
  }, [accessToken, addMessage, conversationId]);

  async function sendCurrentMessage() {
    const body = messageText.trim();
    if (!body || !conversationId || !accessToken || isSending) return;

    try {
      setIsSending(true);
      const response = await messageApi.send(accessToken, conversationId, body);
      addMessage(response.message);
      setMessageText('');
    } catch (error) {
      setLoadError(getApiErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  }

  if (isLoading && !consultation) {
    return <View style={styles.container}><SafeAreaView style={styles.missingState}><ActivityIndicator color={theme.primary} size="large" /><Text style={styles.missingText}>Loading secure chat…</Text></SafeAreaView></View>;
  }

  if (loadError && !consultation) {
    return <View style={styles.container}><SafeAreaView style={styles.missingState}><MaterialCommunityIcons color={colors.muted} name="message-alert-outline" size={52} /><Text style={styles.missingTitle}>Chat unavailable</Text><Text style={styles.missingText}>{loadError}</Text><AppButton label="Try again" onPress={() => setRefreshKey((current) => current + 1)} role={role} /></SafeAreaView></View>;
  }

  if (!consultation || consultation.status !== 'In Progress') {
    return <View style={styles.container}><SafeAreaView style={styles.missingState}><MaterialCommunityIcons color={colors.muted} name="message-lock-outline" size={52} /><Text style={styles.missingTitle}>Chat unavailable</Text><Text style={styles.missingText}>Secure chat opens when a doctor has accepted your consultation.</Text><AppButton label="Go back" onPress={() => router.back()} role={role} /></SafeAreaView></View>;
  }

  const participantName = role === 'patient'
    ? consultation.doctorName ?? 'Your doctor'
    : consultation.patientName ?? 'Patient';
  const participantSubtitle = role === 'patient'
    ? consultation.doctorSpecialty ?? 'Doctor'
    : consultation.title;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}><Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => router.back()} style={styles.backButton}><MaterialCommunityIcons color={colors.navy} name="arrow-left" size={24} /></Pressable><View style={[styles.headerAvatar, { backgroundColor: theme.soft }]}><MaterialCommunityIcons color={theme.primary} name={role === 'patient' ? 'doctor' : 'account-outline'} size={24} /></View><View style={styles.headerCopy}><Text style={styles.participantName}>{participantName}</Text><View style={styles.statusLine}><View style={[styles.onlineDot, { backgroundColor: isLiveConnected ? colors.success : colors.muted }]} /><Text style={styles.participantSubtitle}>{isLiveConnected ? 'Live chat connected' : `Active consultation · ${participantSubtitle}`}</Text></View></View></View>

        {loadError ? <View style={styles.errorBanner}><MaterialCommunityIcons color="#D93B3B" name="alert-circle-outline" size={18} /><Text style={styles.errorBannerText}>{loadError}</Text></View> : liveError ? <View style={styles.liveErrorBanner}><MaterialCommunityIcons color={colors.warning} name="wifi-alert" size={18} /><Text style={styles.errorBannerText}>{liveError}</Text></View> : <View style={[styles.secureBanner, { backgroundColor: theme.soft }]}><MaterialCommunityIcons color={theme.primary} name="shield-check-outline" size={18} /><Text style={styles.secureBannerText}>Messages are securely saved and delivered live to this consultation.</Text></View>}

        <ScrollView contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })} refreshControl={<RefreshControl onRefresh={() => setRefreshKey((current) => current + 1)} refreshing={isLoading} />} ref={scrollViewRef} showsVerticalScrollIndicator={false}>
          <Text style={styles.dateLabel}>Messages</Text>
          {messages.length > 0 ? messages.map((message) => <MessageBubble key={message.id} message={message} own={message.senderId === session?.user.id} role={role} />) : <Text style={styles.emptyText}>No messages yet. You can start the conversation.</Text>}
        </ScrollView>

        <View style={styles.composer}><View style={styles.inputWrap}><MaterialCommunityIcons color={colors.muted} name="paperclip" size={20} /><TextInput accessibilityLabel="Message" editable={!isSending} multiline onChangeText={setMessageText} onSubmitEditing={() => void sendCurrentMessage()} placeholder="Type a message..." placeholderTextColor={colors.muted} returnKeyType="send" style={styles.input} value={messageText} /></View><Pressable accessibilityLabel="Send message" accessibilityRole="button" disabled={messageText.trim().length === 0 || isSending} onPress={() => void sendCurrentMessage()} style={[styles.sendButton, { backgroundColor: theme.primary }, (messageText.trim().length === 0 || isSending) && styles.sendButtonDisabled]}>{isSending ? <ActivityIndicator color={colors.surface} /> : <MaterialCommunityIcons color={colors.surface} name="send" size={20} />}</Pressable></View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 32 }, bubble: { borderRadius: radius.md, maxWidth: '100%', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, bubbleGroup: { flexShrink: 1, maxWidth: '78%' }, bubbleGroupOwn: { alignItems: 'flex-end' }, bubbleIncoming: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }, composer: { alignItems: 'flex-end', backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: spacing.xs, padding: spacing.sm }, container: { backgroundColor: colors.canvas, flex: 1 }, dateLabel: { alignSelf: 'center', color: colors.muted, fontSize: 11, fontWeight: '700', marginBottom: spacing.md }, emptyText: { color: colors.muted, fontSize: 13, lineHeight: 20, padding: spacing.lg, textAlign: 'center' }, errorBanner: { alignItems: 'flex-start', backgroundColor: '#FFF0F0', flexDirection: 'row', gap: spacing.xs, marginHorizontal: spacing.md, marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.md }, errorBannerText: { color: colors.text, flex: 1, fontSize: 11, lineHeight: 16 }, header: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }, headerAvatar: { alignItems: 'center', borderRadius: radius.pill, height: 42, justifyContent: 'center', width: 42 }, headerCopy: { flex: 1 }, input: { color: colors.navy, flex: 1, fontSize: 14, maxHeight: 92, minHeight: 40, paddingVertical: spacing.xs }, inputWrap: { alignItems: 'center', backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.xs, minHeight: 48, paddingHorizontal: spacing.sm }, liveErrorBanner: { alignItems: 'flex-start', backgroundColor: colors.warningSoft, flexDirection: 'row', gap: spacing.xs, marginHorizontal: spacing.md, marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.md }, messageAvatar: { alignItems: 'center', alignSelf: 'flex-end', borderRadius: radius.pill, height: 28, justifyContent: 'center', width: 28 }, messageRow: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.xs }, messageRowOwn: { justifyContent: 'flex-end' }, messageText: { color: colors.text, fontSize: 14, lineHeight: 20 }, messageTextOwn: { color: colors.surface }, messageTime: { color: colors.muted, fontSize: 10, marginTop: 4 }, messageTimeOwn: { textAlign: 'right' }, messages: { flexGrow: 1, gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl }, missingState: { alignItems: 'center', flex: 1, gap: spacing.sm, justifyContent: 'center', paddingHorizontal: spacing.xl }, missingText: { color: colors.text, fontSize: 13, lineHeight: 19, marginBottom: spacing.md, textAlign: 'center' }, missingTitle: { color: colors.navy, fontSize: 18, fontWeight: '700', marginTop: spacing.xs }, onlineDot: { borderRadius: radius.pill, height: 6, width: 6 }, participantName: { color: colors.navy, fontSize: 15, fontWeight: '700' }, participantSubtitle: { color: colors.muted, fontSize: 11 }, safeArea: { flex: 1 }, secureBanner: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.xs, marginHorizontal: spacing.md, marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.md }, secureBannerText: { color: colors.text, flex: 1, fontSize: 11, lineHeight: 16 }, sendButton: { alignItems: 'center', borderRadius: radius.pill, height: 48, justifyContent: 'center', width: 48 }, sendButtonDisabled: { opacity: 0.45 }, statusLine: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 2 },
});
