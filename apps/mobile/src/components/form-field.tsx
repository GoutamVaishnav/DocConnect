import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type FormFieldProps = {
  accessibilityLabel: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  icon: IconName;
  keyboardType?: KeyboardTypeOptions;
  onChangeText: (value: string) => void;
  onSubmitEditing?: () => void;
  placeholder: string;
  returnKeyType?: 'done' | 'go' | 'next';
  secureTextEntry?: boolean;
  toggleSecureEntry?: () => void;
  value: string;
};

export function FormField({
  accessibilityLabel,
  autoCapitalize = 'none',
  icon,
  keyboardType = 'default',
  onChangeText,
  onSubmitEditing,
  placeholder,
  returnKeyType = 'next',
  secureTextEntry = false,
  toggleSecureEntry,
  value,
}: FormFieldProps) {
  return (
    <View style={styles.field}>
      <MaterialCommunityIcons color={colors.muted} name={icon} size={20} />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        returnKeyType={returnKeyType}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        value={value}
      />
      {toggleSecureEntry ? (
        <Pressable accessibilityLabel="Show or hide password" hitSlop={8} onPress={toggleSecureEntry}>
          <MaterialCommunityIcons
            color={colors.muted}
            name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
            size={20}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  input: {
    color: colors.navy,
    flex: 1,
    fontSize: 14,
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },
});
