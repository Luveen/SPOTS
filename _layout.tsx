// app/_layout.tsx
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, Alert, Image } from 'react-native';
import { TouchableOpacity } from 'react-native'; // Standard React Native TouchableOpacity
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';

// Import Firebase auth for logout
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig'; // Adjust path if firebaseConfig.js is elsewhere

// Custom Drawer Content Component
const CustomDrawerContent = ({ navigation }) => {
  const router = useRouter();
  const drawerNavigation = useNavigation(); // Get the drawer's navigation object

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Logout cancelled"),
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: async () => {
            try {
              await signOut(auth); // Firebase logout
              console.log("User logged out from Firebase");
              drawerNavigation.closeDrawer(); // Close the drawer using drawerNavigation
              router.replace('/auth/login'); // Navigate back to the login screen
            } catch (error) {
              console.error("Error logging out:", error);
              Alert.alert("Logout Error", "Failed to log out. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={drawerStyles.container}>
      <View style={drawerStyles.drawerHeader}>
        {/* User profile picture or name */}
        <Image
          source={{ uri: 'https://via.placeholder.com/80' }} // Placeholder image
          style={drawerStyles.profileImage}
        />
        <Text style={drawerStyles.drawerHeaderText}>Welcome, User</Text> {/* Replace with dynamic user name */}
      </View>

      <View style={drawerStyles.drawerItemContainer}>
        {/* Only Logout Drawer Item */}
        <TouchableOpacity style={drawerStyles.drawerItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#333" />
          <Text style={drawerStyles.drawerItemText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default function DrawerLayout() {
  const router = useRouter();

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true, // Show header for screens within the drawer
        headerTitleAlign: 'center', // Center header title
        headerStyle: {
          backgroundColor: '#6B906A', // Example header background color
        },
        headerTintColor: '#FFFFFF', // Header text color
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerLeft: () => null, // Hide default drawer icon on the left
      }}
    >
      {/* Main Tabs Navigator */}
      <Drawer.Screen
        name="(tabs)" // Matches the directory name for your Tabs layout
        options={{
          drawerLabel: "Home", // Label in the drawer for this item
          title: "SPOTS", // Header title displayed when this screen is active
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                if (auth.currentUser) {
                  router.openDrawer();
                } else {
                  Alert.alert('Not Logged In', 'Please log in to access the menu.');
                }
              }}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="menu" size={30} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* New addition: The drawer screen for the subPages directory */}
      <Drawer.Screen
        name="subPages" // This name matches the directory
        options={{
          drawerLabel: "Profile Settings", // The label shown in the drawer
          title: "Profile Settings", // The title of the screen
        }}
      />
    </Drawer>
  );
}

const drawerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Dimensions.get('window').height * 0.05, // Adjust for status bar
  },
  drawerHeader: {
    padding: 20,
    paddingTop: 50, // More padding for the header
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
    alignItems: 'center', // Center content
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    backgroundColor: '#ccc', // Placeholder background
  },
  drawerHeaderText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  drawerItemContainer: {
    flex: 1, // Take remaining space
    paddingHorizontal: 10,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginVertical: 5,
    backgroundColor: '#f5f5f5', // Light background for items
  },
  drawerItemText: {
    fontSize: 18,
    marginLeft: 15,
    color: '#333',
  },
});