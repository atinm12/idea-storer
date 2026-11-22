import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors } from '@/constants/theme';
import { StoreProvider, useStore } from '@/lib/store';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash may already be hidden (e.g. fast refresh); safe to ignore.
});

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.main,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    border: Colors.border,
  },
};

function SplashGate() {
  const { loaded } = useStore();
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded]);
  return null;
}

export default function RootLayout() {
  return (
    <StoreProvider>
      <ThemeProvider value={navTheme}>
        <StatusBar style="dark" />
        <SplashGate />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.main,
            headerTitleStyle: { color: Colors.text, fontWeight: '700' },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: Colors.background },
          }}>
          <Stack.Screen
            name="index"
            options={{
              title: 'Idea Storer',
              headerTitleStyle: { color: Colors.text, fontSize: 28, fontWeight: 'bold' },
            }}
          />
          <Stack.Screen name="topic/[id]" options={{ title: '' }} />
          <Stack.Screen name="idea/[id]" options={{ title: '' }} />
          <Stack.Screen
            name="topic/new"
            options={{ title: 'New Topic', presentation: 'modal' }}
          />
        </Stack>
      </ThemeProvider>
    </StoreProvider>
  );
}
