

// // app/(tabs)/_layout.tsx
// import { Tabs } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import React from 'react';
// import { View, Text } from 'react-native'; // Import View and Text for the add button

// export default function TabLayout() {
//   return (
//     <Tabs screenOptions={{
//       tabBarShowLabel: false,
//       tabBarActiveTintColor: 'black', // Active icon and label color
//       tabBarInactiveTintColor: '#888', // Inactive icon and label color
//       tabBarStyle: {
//         backgroundColor: '#fff',
//         borderTopLeftRadius: 25,
//         borderTopRightRadius: 25,
//         paddingTop: 20, // Adjust top padding for better look
//         paddingVertical: 30, // Adjust padding for better look
//         height: 80, // Adjust height to accommodate icons and labels
//         position: 'absolute', // Make it absolute to float above content
//         bottom: 0,
//         left: 0,
//         right: 0,
//         elevation: 10, // Add shadow for Android
//         shadowColor: '#000', // Add shadow for iOS
//         shadowOffset: { width: 0, height: -5 },
//         shadowOpacity: 0.1,
//         shadowRadius: 5,
//       },
//       tabBarLabelStyle: {
//         fontSize: 12, // Adjust label font size
//         // marginBottom: 165, // This value seems very high and might push labels off screen.
//                            // Adjust or remove based on actual visual needs.
//       },
//       headerShown: false, // Hide header by default for all tabs (Drawer will handle the main header)
//     }}>

//       <Tabs.Screen
//         name="main" // Corresponds to app/(tabs)/main.tsx
//         options={{
//           title: 'Home', // Label for the tab
//           tabBarIcon: ({ color }) => (
//             <Ionicons name="home" size={26} color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="news" // Corresponds to app/(tabs)/news.tsx
//         options={{
//           title: 'News', // Label for the tab
//           tabBarIcon: ({ color }) => (
//             <Ionicons name="calendar-outline" size={26} color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="add" // Corresponds to app/(tabs)/add.tsx
//         options={{
//           title: 'Add', // Label for the tab
//           tabBarIcon: ({ color, focused }) => (
//             // Custom styling for the prominent 'add' button
//             <View style={{
//               alignItems: 'center',
//               justifyContent: 'center',
//               backgroundColor: focused ? 'transparent' : 'transparent', // No specific background for tab icon
//               borderRadius: 45,
//               padding: 1, // Padding around the icon
//             }}>
//               <Ionicons name="add-circle" size={26} color="#4CAF50" />
//             </View>
//           )
//         }}
//       />

//       <Tabs.Screen
//         name="notification" // Corresponds to app/(tabs)/notification.tsx
//         options={{
//           title: 'Notifications', // Label for the tab
//           tabBarIcon: ({ color }) => (
//             <Ionicons name="notifications-outline" size={26} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="profile" // Corresponds to app/(tabs)/profile.tsx
//         options={{
//           title: 'Profile', // Label for the tab
//           tabBarIcon: ({ color }) => (
//             <Ionicons name="person-outline" size={26} color={color} />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }

// app/(tabs)/_layout.tsx
import { Tabs, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function TabLayout() {
    const pathname = usePathname();

    const hideTabBar = pathname.includes('/subPages/Profile2ndView');

    return (
        <GestureHandlerRootView style={styles.rootView}>
            <Tabs screenOptions={{
                tabBarShowLabel: false,
                tabBarActiveTintColor: 'black',
                tabBarInactiveTintColor: '#888',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopLeftRadius: 25,
                    borderTopRightRadius: 25,
                    paddingTop: 20,
                    paddingVertical: 30,
                    height: 80,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -5 },
                    shadowOpacity: 0.1,
                    shadowRadius: 5,
                    display: hideTabBar ? 'none' : 'flex',
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                },
                headerShown: false,
            }}>
                <Tabs.Screen
                    name="main"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="home" size={26} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="news"
                    options={{
                        title: 'News',
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="calendar-outline" size={26} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="add"
                    options={{
                        title: 'Add',
                        tabBarIcon: ({ focused }) => (
                            <View style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: focused ? 'transparent' : 'transparent',
                                borderRadius: 45,
                                padding: 1,
                            }}>
                                <Ionicons name="add-circle" size={26} color="#4CAF50" />
                            </View>
                        )
                    }}
                />
                <Tabs.Screen
                    name="notification"
                    options={{
                        title: 'Notifications',
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="notifications-outline" size={26} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="person-outline" size={26} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="subPages/Profile2ndView"
                    options={{
                        href: null,
                        headerShown: false,
                    }}
                />
            </Tabs>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    rootView: {
        flex: 1,
    },
});