/**
 * TabBar Component
 * Bottom navigation tabs for main sections
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';

type TabId = 'split' | 'buckets' | 'history';

interface Tab {
  id: TabId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  path: string;
}

const TABS: Tab[] = [
  {
    id: 'split',
    label: 'Split',
    icon: 'pie-chart-outline',
    iconActive: 'pie-chart',
    path: '/(tabs)',
  },
  {
    id: 'buckets',
    label: 'Buckets',
    icon: 'layers-outline',
    iconActive: 'layers',
    path: '/(tabs)/buckets',
  },
  {
    id: 'history',
    label: 'History',
    icon: 'time-outline',
    iconActive: 'time',
    path: '/(tabs)/history',
  },
];

interface TabBarProps {
  activeTab?: TabId;
  onTabPress?: (tab: TabId) => void;
}

export function TabBar({ activeTab, onTabPress }: TabBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const getActiveTab = (): TabId => {
    if (activeTab) return activeTab;

    if (pathname.includes('/buckets')) return 'buckets';
    if (pathname.includes('/history')) return 'history';
    return 'split';
  };

  const currentTab = getActiveTab();

  const handleTabPress = (tab: Tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (onTabPress) {
      onTabPress(tab.id);
    } else {
      router.push(tab.path as any);
    }
  };

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = currentTab === tab.id;

        return (
          <Pressable
            key={tab.id}
            onPress={() => handleTabPress(tab)}
            style={styles.tab}
            hitSlop={8}
          >
            <Ionicons
              name={isActive ? tab.iconActive : tab.icon}
              size={20}
              color={isActive ? Colors.primary : Colors.text.muted}
            />
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[1],
    gap: Spacing[1],
  },
  label: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  labelActive: {
    color: Colors.primary,
  },
});
