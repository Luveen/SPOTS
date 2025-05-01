// app/subPages/_layout.js
import { Stack } from 'expo-router';

export default function SubPagesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AccountSettings" options={{ title: "Account settings" }} />
      <Stack.Screen name="CommentScreen" options={{ title: "Comments" }} />
      <Stack.Screen name="JoinMeMain" options={{ title: "Join Me" }} />
      <Stack.Screen name="OtherUserProfileScreen" options={{ title: "User Profile" }} />
      <Stack.Screen name="PostScreen" options={{ title: "Post View screen" }} />
      <Stack.Screen name="SearchScreen" options={{ title: "search" }} />
    </Stack>
  );
}