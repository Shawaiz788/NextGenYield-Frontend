import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, LogBox } from 'react-native';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

// Suppress LogBox popup for handled network connection and auth failure notices
LogBox.ignoreLogs([
  'Network request failed',
  'Unable to reach backend',
  'BackendUnreachableError',
  'Incorrect credentials entered',
]);
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

import { AppProvider, useApp } from '@/context/app-context';
import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'NEXTGENYIELD_TANSTACK_QUERY_CACHE',
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 15, // 15 minutes: serve immediately from cache
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days: retain in persistent offline cache
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Serve from cache if fresh; never force-refetch on mount
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

export const unstable_settings = {
  initialRouteName: 'auth',
};

function NavigationGuard() {
  const { isAuthenticated, isAuthLoading } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait until secure session restoration check finishes
    if (isAuthLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isAuthLoading, segments, router]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days cache validity
        }}>
        <AppProvider>
          <ThemeProvider value={DefaultTheme}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />
            <NavigationGuard />
            <Stack
              initialRouteName="auth"
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#F8FAFC' },
              }}>
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="field-profile"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                }}
              />
              <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
            </Stack>
          </ThemeProvider>
        </AppProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

