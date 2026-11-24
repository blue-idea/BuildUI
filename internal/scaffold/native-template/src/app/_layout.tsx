import '../../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const dark = useColorScheme() === 'dark';
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: dark ? '#09090b' : '#ffffff' },
        headerTintColor: dark ? '#fafafa' : '#18181b',
        contentStyle: { backgroundColor: dark ? '#09090b' : '#ffffff' },
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="details" options={{ title: 'Details' }} />
      </Stack>
    </>
  );
}
