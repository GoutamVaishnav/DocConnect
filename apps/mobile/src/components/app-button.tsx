import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';

import { colors, type AppRole, roleColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type AppButtonProps = {
  label: string;
  onPress: () => void;
  role?: AppRole;
  variant?: 'primary' | 'outline' | 'ghost';
  icon?: IconName;
  disabled?: boolean;
};

export function AppButton({
  label,
  onPress,
  role = 'patient',
  variant = 'primary',
  icon,
  disabled = false,
}: AppButtonProps) {
  const theme = roleColors(role);
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }: PressableStateCallbackType) => [
        styles.button,
        isPrimary && { backgroundColor: theme.primary },
        variant === 'outline' && { borderColor: theme.primary, borderWidth: 1.5 },
        variant === 'ghost' && styles.ghost,
        (pressed || disabled) && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        {icon ? (
          <MaterialCommunityIcons
            color={isPrimary ? colors.surface : theme.primary}
            name={icon}
            size={19}
          />
        ) : null}
        <Text style={[styles.label, { color: isPrimary ? colors.surface : theme.primary }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  ghost: {
    minHeight: 38,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.76,
  },
});
