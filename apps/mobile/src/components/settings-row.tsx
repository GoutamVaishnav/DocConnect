import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, roleColors, type AppRole } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type SettingsRowProps = {
  detail?: string;
  destructive?: boolean;
  icon: IconName;
  label: string;
  onPress?: () => void;
  role?: AppRole;
};

export function SettingsRow({ detail, destructive = false, icon, label, onPress, role = 'patient' }: SettingsRowProps) {
  const theme = roleColors(role);
  const content = (
    <>
      <View style={[styles.iconBox, { backgroundColor: destructive ? '#FFF0F0' : theme.soft }]}>
        <MaterialCommunityIcons color={destructive ? '#E54545' : theme.primary} name={icon} size={21} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.label, destructive && styles.destructiveText]}>{label}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      {onPress ? <MaterialCommunityIcons color={colors.muted} name="chevron-right" size={22} /> : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>{content}</Pressable>;
}

const styles = StyleSheet.create({
  copy: { flex: 1 },
  destructiveText: { color: '#D93B3B' },
  detail: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  iconBox: { alignItems: 'center', borderRadius: radius.sm, height: 40, justifyContent: 'center', width: 40 },
  label: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 64, paddingHorizontal: spacing.md },
});
