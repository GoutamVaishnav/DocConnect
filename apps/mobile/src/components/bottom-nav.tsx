import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, type AppRole, roleColors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Tab = {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
};

const patientTabs: Tab[] = [
  { icon: 'home-variant', label: 'Home' },
  { icon: 'clipboard-text-outline', label: 'Consultations' },
  { icon: 'message-text-outline', label: 'Messages' },
  { icon: 'bell-outline', label: 'Alerts' },
  { icon: 'account-outline', label: 'Profile' },
];

const doctorTabs: Tab[] = [
  { icon: 'home-variant', label: 'Home' },
  { icon: 'inbox-arrow-down-outline', label: 'Requests' },
  { icon: 'briefcase-edit-outline', label: 'My Cases' },
  { icon: 'bell-outline', label: 'Alerts' },
  { icon: 'account-outline', label: 'Profile' },
];

type BottomNavProps = {
  activeLabel?: string;
  role: AppRole;
};

export function BottomNav({ activeLabel = 'Home', role }: BottomNavProps) {
  const theme = roleColors(role);
  const tabs = role === 'patient' ? patientTabs : doctorTabs;

  function handleTabPress(label: string) {
    if (role === 'patient' && label === 'Home') {
      router.replace('/home');
      return;
    }

    if (role === 'patient' && label === 'Consultations') {
      router.replace('/consultations');
      return;
    }

    if (role === 'patient' && label === 'Messages') {
      router.replace('/messages');
      return;
    }

    if (role === 'patient' && label === 'Alerts') {
      router.replace('/patient-notifications');
      return;
    }

    if (role === 'patient' && label === 'Profile') {
      router.replace('/patient-profile');
      return;
    }

    if (role === 'doctor' && label === 'Home') {
      router.replace('/dashboard');
      return;
    }

    if (role === 'doctor' && label === 'Requests') {
      router.replace('/open-requests');
      return;
    }

    if (role === 'doctor' && label === 'My Cases') {
      router.replace('/my-cases');
      return;
    }

    if (role === 'doctor' && label === 'Alerts') {
      router.replace('/doctor-notifications');
      return;
    }

    if (role === 'doctor' && label === 'Profile') {
      router.replace('/doctor-profile');
    }
  }

  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const active = tab.label === activeLabel;

        return (
          <Pressable
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            key={tab.label}
            onPress={() => handleTabPress(tab.label)}
            style={styles.tab}
          >
            <MaterialCommunityIcons
              color={active ? theme.primary : colors.muted}
              name={tab.icon}
              size={22}
            />
            <Text style={[styles.label, { color: active ? theme.primary : colors.muted }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 3,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    minHeight: 43,
  },
});
