import { Stack } from 'expo-router';

export default function SubPages2Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile2ndView" options={{ title: "Profile Stats" }} />
      <Stack.Screen name="MapScreen" options={{ title: "Map" }} />
    </Stack>
  );
}