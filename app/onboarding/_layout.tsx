// app/(onboarding)/_layout.tsx
import { Stack } from 'expo-router';
import { loadFonts } from '../../hooks/useFonts'; // Adjust path

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/*
        Define each onboarding screen here if you want explicit control over
        names and order within this stack. Otherwise, expo-router picks them up
        by filename.
      */}
      <Stack.Screen name="onboarding1" />
      <Stack.Screen name="onboarding2" />
      <Stack.Screen name="onboarding3" />
    </Stack>
  );
}