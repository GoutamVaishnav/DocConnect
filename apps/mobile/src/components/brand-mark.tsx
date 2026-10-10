import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { colors, type AppRole, roleColors } from '@/theme/colors';

type BrandMarkProps = {
  role?: AppRole;
  size?: number;
};

export function BrandMark({ role = 'patient', size = 88 }: BrandMarkProps) {
  const theme = roleColors(role);

  return (
    <View
      accessibilityLabel="DocConnect logo"
      style={[styles.container, { height: size, width: size }]}
    >
      <MaterialCommunityIcons color={theme.primary} name="heart-pulse" size={size} />
      <View style={[styles.cross, { backgroundColor: colors.surface, right: size * 0.17 }]}>
        <MaterialCommunityIcons color={theme.primary} name="plus" size={size * 0.26} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cross: {
    alignItems: 'center',
    borderRadius: 99,
    bottom: 4,
    justifyContent: 'center',
    padding: 2,
    position: 'absolute',
  },
});
