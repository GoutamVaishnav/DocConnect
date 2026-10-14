import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { useAuth } from '@/context/auth';
import { useConsultationDraft } from '@/context/consultation-draft';
import { getApiErrorMessage, messageApi, type ApiChatAttachment, type ApiConsultationMessage, type ChatAttachmentUpload } from '@/lib/api';
import { isConsultationId } from '@/lib/chat-navigation';
import { goBackOr } from '@/lib/navigation';
import { createChatSocket, type ChatSocket } from '@/lib/realtime-chat';
import { colors, roleColors, type AppRole } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

type PendingAttachment = ChatAttachmentUpload & {
  bytes?: number;
  kind: 'IMAGE' | 'FILE';
};

const supportedDocumentMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Now';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatFileSize(bytes?: number) {
  if (!bytes || bytes < 1_024) return 'File';
  if (bytes < 1_024 * 1_024) return `${Math.round(bytes / 1_024)} KB`;
  return `${(bytes / (1_024 * 1_024)).toFixed(1)} MB`;
}

function inferDocumentMimeType(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'doc') return 'application/msword';
  if (extension === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (extension === 'txt') return 'text/plain';
  return undefined;
}

function MessageAttachment({ attachment, own, onOpen }: { attachment: ApiChatAttachment; own: boolean; onOpen: () => void }) {
  if (attachment.kind === 'IMAGE') {
    return attachment.deliveryUrl ? (
      <Pressable accessibilityLabel={`Open ${attachment.originalFileName}`} onPress={onOpen} style={styles.attachmentPressable}>
        <Image accessibilityLabel={attachment.originalFileName} source={{ uri: attachment.deliveryUrl }} style={styles.attachmentImage} />
      </Pressable>
    ) : <View style={[styles.attachmentFile, own && styles.attachmentFileOwn]}><MaterialCommunityIcons color={own ? colors.surface : colors.muted} name="image-off-outline" size={22} /><Text style={[styles.attachmentFileName, own && styles.attachmentFileNameOwn]}>Image unavailable</Text></View>;
  }

  return <Pressable accessibilityLabel={`Open ${attachment.originalFileName}`} onPress={onOpen} style={[styles.attachmentFile, own && styles.attachmentFileOwn]}>
    <MaterialCommunityIcons color={own ? colors.surface : colors.patient.primary} name="file-document-outline" size={24} />
    <View style={styles.attachmentFileCopy}><Text numberOfLines={1} style={[styles.attachmentFileName, own && styles.attachmentFileNameOwn]}>{attachment.originalFileName}</Text><Text style={[styles.attachmentFileMeta, own && styles.attachmentFileMetaOwn]}>{formatFileSize(attachment.bytes)}</Text></View>
  </Pressable>;
}

function MessageBubble({ message, own, role, onOpenAttachment }: { message: ApiConsultationMessage; own: boolean; role: AppRole; onOpenAttachment: (attachment: ApiChatAttachment) => void }) {
  const theme = roleColors(role);
  const status = own ? message.readAt ? 'Seen' : 'Sent' : '';

  return (
    <View style={[styles.messageRow, own && styles.messageRowOwn]}>
      {!own ? <View style={[styles.messageAvatar, { backgroundColor: role === 'patient' ? colors.doctor.soft : colors.patient.soft }]}><MaterialCommunityIcons color={role === 'patient' ? colors.doctor.primary : colors.patient.primary} name={role === 'patient' ? 'doctor' : 'account-outline'} size={16} /></View> : null}
      <View style={[styles.bubbleGroup, own && styles.bubbleGroupOwn]}>
        {message.attachments.map((attachment) => <MessageAttachment attachment={attachment} key={attachment.id} onOpen={() => onOpenAttachment(attachment)} own={own} />)}
        {message.body ? <View style={[styles.bubble, own ? { backgroundColor: theme.primary } : styles.bubbleIncoming]}><Text style={[styles.messageText, own && styles.messageTextOwn]}>{message.body}</Text></View> : null}
        <Text style={[styles.messageTime, own && styles.messageTimeOwn]}>{[formatMessageTime(message.createdAt), status].filter(Boolean).join(' · ')}</Text>
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
  const { conversationId: rawConversationId } = useLocalSearchParams<{ conversationId?: string }>();
  const conversationId = isConsultationId(rawConversationId) ? rawConversationId : undefined;
  const { session } = useAuth();
  const { getConsultation, loadConsultation } = useConsultationDraft();
  const [messageText, setMessageText] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [messages, setMessages] = useState<ApiConsultationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isParticipantTyping, setIsParticipantTyping] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const socketRef = useRef<ChatSocket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingSentRef = useRef(false);
  const role: AppRole = session?.user.role === 'DOCTOR' ? 'doctor' : 'patient';
  const chatFallback = role === 'doctor' ? '/my-cases' : '/messages';
  const theme = roleColors(role);
  const accessToken = session?.accessToken;
  const consultation = typeof conversationId === 'string' ? getConsultation(conversationId) : undefined;

  const addMessage = useCallback((message: ApiConsultationMessage) => {
    setMessages((current) => mergeMessages(current, [message]));
  }, []);

  const stopTyping = useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    if (typingSentRef.current && conversationId) {
      socketRef.current?.emit('chat:typing', { consultationId: conversationId, isTyping: false });
    }
    typingSentRef.current = false;
  }, [conversationId]);

  const markIncomingMessagesRead = useCallback(async () => {
    if (!conversationId || !accessToken || !session) return;

    const hasUnreadIncomingMessage = messages.some((message) => (
      message.senderId !== session.user.id && !message.readAt
    ));
    if (!hasUnreadIncomingMessage) return;

    try {
      await messageApi.markRead(accessToken, conversationId);
    } catch {
      // Reading receipts are helpful, but a temporary network issue must not block chat.
    }
  }, [accessToken, conversationId, messages, session]);

  useEffect(() => {
    void markIncomingMessagesRead();
  }, [markIncomingMessagesRead]);

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
    socketRef.current = socket;

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
    socket.on('chat:typing', (typing) => {
      if (typing.consultationId === activeConversationId && typing.userId !== session?.user.id) {
        setIsParticipantTyping(typing.isTyping);
      }
    });
    socket.on('chat:read', (receipt) => {
      if (receipt.consultationId === activeConversationId && receipt.readerId !== session?.user.id) {
        setMessages((current) => current.map((message) => (
          message.senderId === session?.user.id && !message.readAt
            ? { ...message, readAt: receipt.readAt }
            : message
        )));
      }
    });
    socket.connect();

    return () => {
      stopTyping();
      socket.emit('chat:leave', { consultationId: activeConversationId });
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
      setIsParticipantTyping(false);
    };
  }, [accessToken, addMessage, conversationId, session?.user.id, stopTyping]);

  function handleMessageTextChange(value: string) {
    setMessageText(value);
    if (!conversationId || !value.trim()) {
      stopTyping();
      return;
    }

    if (!typingSentRef.current) {
      socketRef.current?.emit('chat:typing', { consultationId: conversationId, isTyping: true });
      typingSentRef.current = true;
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, 1_200);
  }

  async function chooseImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType || 'image/jpeg';
    setPendingAttachment({
      bytes: asset.fileSize,
      fileName: asset.fileName || `chat-image-${Date.now()}.jpg`,
      kind: 'IMAGE',
      mimeType,
      uri: asset.uri,
    });
  }

  async function chooseDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: [...supportedDocumentMimeTypes],
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType || inferDocumentMimeType(asset.name);
    if (!mimeType || !supportedDocumentMimeTypes.has(mimeType)) {
      Alert.alert('Unsupported file', 'Choose a PDF, DOC, DOCX, or TXT file.');
      return;
    }

    setPendingAttachment({
      bytes: asset.size,
      fileName: asset.name,
      kind: 'FILE',
      mimeType,
      uri: asset.uri,
    });
  }

  function chooseAttachment() {
    Alert.alert('Add attachment', 'Choose what you want to send.', [
      { text: 'Photo', onPress: () => void chooseImage() },
      { text: 'Document', onPress: () => void chooseDocument() },
      { style: 'cancel', text: 'Cancel' },
    ]);
  }

  function openAttachment(attachment: ApiChatAttachment) {
    if (!attachment.deliveryUrl) {
      Alert.alert('File unavailable', 'Refresh the chat to request a new secure file link.');
      return;
    }

    void Linking.openURL(attachment.deliveryUrl).catch(() => {
      Alert.alert('Could not open file', 'Please try again.');
    });
  }

  async function sendCurrentMessage() {
    const body = messageText.trim();
    if ((!body && !pendingAttachment) || !conversationId || !accessToken || isSending) return;

    try {
      setIsSending(true);
      stopTyping();
      const response = await messageApi.send(accessToken, conversationId, body, pendingAttachment || undefined);
      addMessage(response.message);
      setMessageText('');
      setPendingAttachment(null);
    } catch (error) {
      setLoadError(getApiErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  }

  if (!conversationId) {
    return <View style={styles.container}><SafeAreaView style={styles.missingState}><MaterialCommunityIcons color={colors.muted} name="message-alert-outline" size={52} /><Text style={styles.missingTitle}>Chat link is invalid</Text><Text style={styles.missingText}>Please open chat from an active consultation. The old or incomplete link was not used.</Text><AppButton label={role === 'doctor' ? 'Go to My Cases' : 'Go to Messages'} onPress={() => router.replace(chatFallback)} role={role} /></SafeAreaView></View>;
  }

  if (isLoading && !consultation) {
    return <View style={styles.container}><SafeAreaView style={styles.missingState}><ActivityIndicator color={theme.primary} size="large" /><Text style={styles.missingText}>Loading secure chat…</Text></SafeAreaView></View>;
  }

  if (loadError && !consultation) {
    return <View style={styles.container}><SafeAreaView style={styles.missingState}><MaterialCommunityIcons color={colors.muted} name="message-alert-outline" size={52} /><Text style={styles.missingTitle}>Chat unavailable</Text><Text style={styles.missingText}>{loadError}</Text><AppButton label="Try again" onPress={() => setRefreshKey((current) => current + 1)} role={role} /></SafeAreaView></View>;
  }

  if (!consultation || consultation.status !== 'In Progress') {
    return <View style={styles.container}><SafeAreaView style={styles.missingState}><MaterialCommunityIcons color={colors.muted} name="message-lock-outline" size={52} /><Text style={styles.missingTitle}>Chat unavailable</Text><Text style={styles.missingText}>Secure chat opens when a doctor has accepted your consultation.</Text><AppButton label="Go back" onPress={() => goBackOr(chatFallback)} role={role} /></SafeAreaView></View>;
  }

  const participantName = role === 'patient' ? consultation.doctorName ?? 'Your doctor' : consultation.patientName ?? 'Patient';
  const participantSubtitle = role === 'patient' ? consultation.doctorSpecialty ?? 'Doctor' : consultation.title;
  const canSend = messageText.trim().length > 0 || Boolean(pendingAttachment);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}><Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => goBackOr(chatFallback)} style={styles.backButton}><MaterialCommunityIcons color={colors.navy} name="arrow-left" size={24} /></Pressable><View style={[styles.headerAvatar, { backgroundColor: theme.soft }]}><MaterialCommunityIcons color={theme.primary} name={role === 'patient' ? 'doctor' : 'account-outline'} size={24} /></View><View style={styles.headerCopy}><Text style={styles.participantName}>{participantName}</Text><View style={styles.statusLine}><View style={[styles.onlineDot, { backgroundColor: isLiveConnected ? colors.success : colors.muted }]} /><Text style={styles.participantSubtitle}>{isLiveConnected ? 'Live chat connected' : `Active consultation · ${participantSubtitle}`}</Text></View></View></View>

        {loadError ? <View style={styles.errorBanner}><MaterialCommunityIcons color="#D93B3B" name="alert-circle-outline" size={18} /><Text style={styles.errorBannerText}>{loadError}</Text></View> : liveError ? <View style={styles.liveErrorBanner}><MaterialCommunityIcons color={colors.warning} name="wifi-alert" size={18} /><Text style={styles.errorBannerText}>{liveError}</Text></View> : <View style={[styles.secureBanner, { backgroundColor: theme.soft }]}><MaterialCommunityIcons color={theme.primary} name="shield-check-outline" size={18} /><Text style={styles.secureBannerText}>Messages are securely saved and delivered live to this consultation.</Text></View>}
        {isParticipantTyping ? <Text style={[styles.typingText, { color: theme.primary }]}>{`${participantName} is typing…`}</Text> : null}

        <ScrollView contentContainerStyle={styles.messages} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })} refreshControl={<RefreshControl onRefresh={() => setRefreshKey((current) => current + 1)} refreshing={isLoading} />} ref={scrollViewRef} showsVerticalScrollIndicator={false}>
          <Text style={styles.dateLabel}>Messages</Text>
          {messages.length > 0 ? messages.map((message) => <MessageBubble key={message.id} message={message} onOpenAttachment={openAttachment} own={message.senderId === session?.user.id} role={role} />) : <Text style={styles.emptyText}>No messages yet. You can start the conversation.</Text>}
        </ScrollView>

        <View style={styles.composer}>
          {pendingAttachment ? <View style={styles.pendingAttachment}><View style={styles.pendingAttachmentIcon}>{pendingAttachment.kind === 'IMAGE' ? <Image source={{ uri: pendingAttachment.uri }} style={styles.pendingImage} /> : <MaterialCommunityIcons color={theme.primary} name="file-document-outline" size={23} />}</View><View style={styles.pendingAttachmentCopy}><Text numberOfLines={1} style={styles.pendingAttachmentName}>{pendingAttachment.fileName}</Text><Text style={styles.pendingAttachmentMeta}>{`${pendingAttachment.kind === 'IMAGE' ? 'Image' : 'Document'} · ${formatFileSize(pendingAttachment.bytes)}`}</Text></View><Pressable accessibilityLabel="Remove attachment" hitSlop={10} onPress={() => setPendingAttachment(null)}><MaterialCommunityIcons color={colors.muted} name="close-circle" size={22} /></Pressable></View> : null}
          <View style={styles.composerRow}><View style={styles.inputWrap}><Pressable accessibilityLabel="Add image or document" hitSlop={8} onPress={chooseAttachment}><MaterialCommunityIcons color={colors.muted} name="paperclip" size={20} /></Pressable><TextInput accessibilityLabel="Message" editable={!isSending} multiline onChangeText={handleMessageTextChange} onFocus={() => requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd({ animated: true }))} onSubmitEditing={() => void sendCurrentMessage()} placeholder="Type a message..." placeholderTextColor={colors.muted} returnKeyType="send" style={styles.input} value={messageText} /></View><Pressable accessibilityLabel="Send message" accessibilityRole="button" disabled={!canSend || isSending} onPress={() => void sendCurrentMessage()} style={[styles.sendButton, { backgroundColor: theme.primary }, (!canSend || isSending) && styles.sendButtonDisabled]}>{isSending ? <ActivityIndicator color={colors.surface} /> : <MaterialCommunityIcons color={colors.surface} name="send" size={20} />}</Pressable></View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  attachmentFile: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.xs, maxWidth: '100%', minWidth: 170, padding: spacing.sm },
  attachmentFileCopy: { flex: 1 }, attachmentFileMeta: { color: colors.muted, fontSize: 10, marginTop: 2 }, attachmentFileMetaOwn: { color: colors.surface }, attachmentFileName: { color: colors.navy, fontSize: 12, fontWeight: '700' }, attachmentFileNameOwn: { color: colors.surface }, attachmentFileOwn: { backgroundColor: colors.patient.primary, borderColor: colors.patient.primary }, attachmentImage: { borderRadius: radius.md, height: 150, width: 180 }, attachmentPressable: { alignSelf: 'flex-start' },
  backButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 32 }, bubble: { borderRadius: radius.md, maxWidth: '100%', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, bubbleGroup: { flexShrink: 1, gap: spacing.xs, maxWidth: '78%' }, bubbleGroupOwn: { alignItems: 'flex-end' }, bubbleIncoming: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  composer: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.xs, padding: spacing.sm }, composerRow: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.xs }, container: { backgroundColor: colors.canvas, flex: 1 }, dateLabel: { alignSelf: 'center', color: colors.muted, fontSize: 11, fontWeight: '700', marginBottom: spacing.md }, emptyText: { color: colors.muted, fontSize: 13, lineHeight: 20, padding: spacing.lg, textAlign: 'center' },
  errorBanner: { alignItems: 'flex-start', backgroundColor: '#FFF0F0', borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, marginHorizontal: spacing.md, marginTop: spacing.sm, padding: spacing.sm }, errorBannerText: { color: colors.text, flex: 1, fontSize: 11, lineHeight: 16 }, header: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }, headerAvatar: { alignItems: 'center', borderRadius: radius.pill, height: 42, justifyContent: 'center', width: 42 }, headerCopy: { flex: 1 },
  input: { color: colors.navy, flex: 1, fontSize: 14, maxHeight: 92, minHeight: 40, paddingVertical: spacing.xs }, inputWrap: { alignItems: 'center', backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.xs, minHeight: 48, paddingHorizontal: spacing.sm }, liveErrorBanner: { alignItems: 'flex-start', backgroundColor: colors.warningSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, marginHorizontal: spacing.md, marginTop: spacing.sm, padding: spacing.sm },
  messageAvatar: { alignItems: 'center', alignSelf: 'flex-end', borderRadius: radius.pill, height: 28, justifyContent: 'center', width: 28 }, messageRow: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.xs }, messageRowOwn: { justifyContent: 'flex-end' }, messageText: { color: colors.text, fontSize: 14, lineHeight: 20 }, messageTextOwn: { color: colors.surface }, messageTime: { color: colors.muted, fontSize: 10 }, messageTimeOwn: { textAlign: 'right' }, messages: { flexGrow: 1, gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl },
  missingState: { alignItems: 'center', flex: 1, gap: spacing.sm, justifyContent: 'center', paddingHorizontal: spacing.xl }, missingText: { color: colors.text, fontSize: 13, lineHeight: 19, marginBottom: spacing.md, textAlign: 'center' }, missingTitle: { color: colors.navy, fontSize: 18, fontWeight: '700', marginTop: spacing.xs }, onlineDot: { borderRadius: radius.pill, height: 6, width: 6 }, participantName: { color: colors.navy, fontSize: 15, fontWeight: '700' }, participantSubtitle: { color: colors.muted, fontSize: 11 },
  pendingAttachment: { alignItems: 'center', backgroundColor: colors.patient.soft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.xs }, pendingAttachmentCopy: { flex: 1 }, pendingAttachmentIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.sm, height: 38, justifyContent: 'center', overflow: 'hidden', width: 38 }, pendingAttachmentMeta: { color: colors.muted, fontSize: 10, marginTop: 2 }, pendingAttachmentName: { color: colors.navy, fontSize: 12, fontWeight: '700' }, pendingImage: { height: 38, width: 38 },
  safeArea: { flex: 1 }, secureBanner: { alignItems: 'flex-start', borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, marginHorizontal: spacing.md, marginTop: spacing.sm, padding: spacing.sm }, secureBannerText: { color: colors.text, flex: 1, fontSize: 11, lineHeight: 16 }, sendButton: { alignItems: 'center', borderRadius: radius.pill, height: 48, justifyContent: 'center', width: 48 }, sendButtonDisabled: { opacity: 0.45 }, statusLine: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 2 }, typingText: { fontSize: 11, fontStyle: 'italic', marginLeft: spacing.md, marginTop: spacing.xs },
});
