// index.tsx
import { Redirect } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

// This is the main entry point of the app.

const App = () => {
  // Instead of showing links here, we'll redirect to the first onboarding screen
  // This makes the onboarding flow the actual starting point of the app.
  return <Redirect href="/onboarding/onboarding1" />;
};

export default App;

// You can keep these styles if you ever decide to use this index.tsx for a different purpose
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  link: {
    fontSize: 18,
    color: "#6B906A",
    marginVertical: 10,
    textDecorationLine: "underline",
  },
});