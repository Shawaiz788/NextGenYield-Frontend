import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { Colors, FontFamily } from '@/constants/theme';
import { useApp } from '@/context/app-context';

function TabIconPill({
  name,
  color,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const theme = Colors.light;
  const { language } = useApp();

  const isUrdu = language === 'ur';

  const bottomPadding = Platform.OS === 'web' ? 10 : Math.max(insets.bottom + 6, 12);
  const barHeight = Platform.OS === 'web' ? 70 : 68 + Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: '#64748B',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: 'rgba(15, 23, 42, 0.06)',
          borderTopWidth: 1,
          height: barHeight,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          elevation: 10,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.05,
          shadowRadius: 16,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarIconStyle: {
          width: 48,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarLabelStyle: {
          fontFamily: FontFamily.semiBold,
          fontSize: 11,
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: isUrdu ? 'ہوم' : 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIconPill name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: isUrdu ? 'اسکین' : 'Scan',
          tabBarIcon: ({ color, focused }) => (
            <TabIconPill name={focused ? 'scan-circle' : 'scan-circle-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: isUrdu ? 'نقشہ' : 'Map',
          tabBarIcon: ({ color, focused }) => (
            <TabIconPill name={focused ? 'map' : 'map-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: isUrdu ? 'کمیونٹی' : 'Community',
          tabBarIcon: ({ color, focused }) => (
            <TabIconPill name={focused ? 'people' : 'people-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isUrdu ? 'پروفائل' : 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIconPill name={focused ? 'person' : 'person-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="showcase"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
  },
});
