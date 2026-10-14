import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/app-card';
import { BottomNav } from '@/components/bottom-nav';
import { ScreenHeader } from '@/components/screen-header';
import { useNotifications } from '@/context/notifications';
import type { ApiNotification } from '@/lib/api';
import { colors, type AppRole, roleColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function notificationIcon(notification: ApiNotification) {
  if (notification.type === 'CONSULTATION_REQUEST') return 'inbox-arrow-down-outline' as const;
  if (notification.type === 'CONSULTATION_ACCEPTED') return 'check-circle-outline' as const;
  if (notification.type === 'CONSULTATION_COMPLETED') return 'clipboard-check-outline' as const;
  return 'message-text-outline' as const;
}

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1_000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3_600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)}h ago`;
  return `${Math.floor(seconds / 86_400)}d ago`;
}

export function NotificationListScreen({ role }: { role: AppRole }) {
  const { error, isLoading, markAllRead, notifications, openNotification, refreshNotifications, unreadCount } = useNotifications();
  const theme = roleColors(role);
  const emptyText = role === 'doctor'
    ? 'New requests, patient messages, and consultation updates will appear here.'
    : 'Updates about your consultation and messages will appear here.';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScreenHeader role={role} title="Notifications" />
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl onRefresh={() => void refreshNotifications()} refreshing={isLoading} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headingRow}>
            <View>
              <Text style={typography.screenTitle}>Notifications</Text>
              {unreadCount > 0 ? <Text style={styles.unreadLabel}>{`${unreadCount} unread`}</Text> : null}
            </View>
            {unreadCount > 0 ? <Pressable accessibilityRole="button" onPress={() => void markAllRead()}><Text style={[styles.readAll, { color: theme.primary }]}>Mark all read</Text></Pressable> : null}
          </View>

          {notifications.length > 0 ? <View style={styles.list}>{notifications.map((notification) => <AppCard key={notification.id}><Pressable accessibilityLabel={notification.title} onPress={() => void openNotification(notification)} style={[styles.row, !notification.readAt && { backgroundColor: theme.soft }]}><View style={[styles.iconBox, { backgroundColor: theme.soft }]}><MaterialCommunityIcons color={theme.primary} name={notificationIcon(notification)} size={23} /></View><View style={styles.copy}><View style={styles.titleRow}><Text numberOfLines={1} style={styles.title}>{notification.title}</Text>{!notification.readAt ? <View style={[styles.dot, { backgroundColor: theme.primary }]} /> : null}</View><Text style={styles.body}>{notification.body}</Text><Text style={styles.time}>{relativeTime(notification.createdAt)}</Text></View></Pressable></AppCard>)}</View> : !isLoading ? <View style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: theme.soft }]}><MaterialCommunityIcons color={theme.primary} name="bell-outline" size={34} /></View><Text style={styles.emptyTitle}>No notifications yet</Text><Text style={styles.emptyText}>{emptyText}</Text></View> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      </SafeAreaView>
      <BottomNav activeLabel="Alerts" role={role} />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 2 },
  container: { backgroundColor: colors.canvas, flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  copy: { flex: 1 },
  dot: { borderRadius: 4, height: 8, marginLeft: spacing.sm, width: 8 },
  empty: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxxl },
  emptyIcon: { alignItems: 'center', borderRadius: radius.pill, height: 90, justifyContent: 'center', width: 90 },
  emptyText: { color: colors.text, fontSize: 13, lineHeight: 20, marginTop: spacing.sm, textAlign: 'center' },
  emptyTitle: { color: colors.navy, fontSize: 17, fontWeight: '700', marginTop: spacing.md },
  error: { color: '#B42318', fontSize: 12, lineHeight: 18, marginTop: spacing.md, textAlign: 'center' },
  headingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  iconBox: { alignItems: 'center', borderRadius: radius.sm, height: 44, justifyContent: 'center', width: 44 },
  list: { gap: spacing.sm, marginTop: spacing.lg },
  readAll: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', gap: spacing.sm, padding: spacing.sm },
  safeArea: { flex: 1 },
  time: { color: colors.muted, fontSize: 10, marginTop: 5 },
  title: { color: colors.navy, flex: 1, fontSize: 13, fontWeight: '700' },
  titleRow: { alignItems: 'center', flexDirection: 'row' },
  unreadLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
});
