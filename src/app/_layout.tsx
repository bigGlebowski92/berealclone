import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/authContext';

function RouteGuard() {
  const router = useRouter();
  const { user } = useAuth();
  const segments = useSegments();
  const inAuthGroup = segments[0] === '(auth)';
  const inTabsGroup = segments[0] === '(tabs)';

  useEffect(() => {
    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      if (!inTabsGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [user, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RouteGuard />
    </AuthProvider>
  );
}
