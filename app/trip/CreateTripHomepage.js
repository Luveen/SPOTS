// import React, { useState } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
// import { useRouter } from 'expo-router';
// import * as Location from 'expo-location';
// import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// const { width } = Dimensions.get('window');

// export default function CreateTripHomepage() {
//     const router = useRouter();

//     const handleStartTrip = async () => {
//         let { status } = await Location.requestForegroundPermissionsAsync();
//         if (status !== 'granted') {
//             alert('Permission to access location was denied');
//             return;
//         }
//         router.push('./TripDetailsScreen');
//     };

//     return (
//         <View style={styles.container}>
//             <View style={styles.content}>
//                 <View style={styles.iconContainer}>
//                     <Ionicons name="location-sharp" size={width * 0.25} color="#3F7D58" />
//                 </View>
//                 <Text style={styles.title}>Create a Trip Diary</Text>
//                 <Text style={styles.subtitle}>
//                     Document your journey and share your experiences with friends
//                 </Text>

//                 <View style={styles.locationWarning}>
//                     <MaterialCommunityIcons name="map-marker-alert-outline" size={24} color="#3F7D58" />
//                     <Text style={styles.warningText}>
//                         We'll need access to your location to enhance your trip diary experience
//                     </Text>
//                 </View>

//                 <TouchableOpacity style={styles.button} onPress={handleStartTrip}>
//                     <Text style={styles.buttonText}>Start New Trip</Text>
//                 </TouchableOpacity>
//             </View>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#fff',
//         justifyContent: 'center',
//         alignItems: 'center',
//         paddingHorizontal: 20,
//     },
//     content: {
//         alignItems: 'center',
//     },
//     iconContainer: {
//         backgroundColor: '#E6F0E6',
//         borderRadius: 100,
//         padding: 20,
//         marginBottom: 20,
//     },
//     title: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         color: '#333',
//         marginBottom: 10,
//     },
//     subtitle: {
//         fontSize: 16,
//         color: '#666',
//         textAlign: 'center',
//         marginBottom: 30,
//     },
//     locationWarning: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: '#f0f0e0',
//         borderRadius: 10,
//         padding: 15,
//         marginBottom: 30,
//         borderWidth: 1,
//         borderColor: '#E6F0E6',
//     },
//     warningText: {
//         marginLeft: 10,
//         flexShrink: 1,
//         color: '#555',
//     },
//     button: {
//         backgroundColor: '#3F7D58',
//         paddingVertical: 15,
//         paddingHorizontal: 40,
//         borderRadius: 30,
//     },
//     buttonText: {
//         color: '#fff',
//         fontSize: 18,
//         fontWeight: 'bold',
//     },
// });






import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function CreateTripHomepage() {
    const router = useRouter();

    const handleStartTrip = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            alert('Permission to access location was denied');
            return;
        }
        router.push('./TripDetailsScreen');
    };

    const handleGoBack = () => {
        router.replace('../tabs/main');
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.closeButton} onPress={handleGoBack}>
                <Ionicons name="close-outline" size={30} color="#333" />
            </TouchableOpacity>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="location-sharp" size={width * 0.25} color="#3F7D58" />
                </View>
                <Text style={styles.title}>Create a Trip Diary</Text>
                <Text style={styles.subtitle}>
                    Document your journey and share your experiences with friends
                </Text>

                <View style={styles.locationWarning}>
                    <MaterialCommunityIcons name="map-marker-alert-outline" size={24} color="#3F7D58" />
                    <Text style={styles.warningText}>
                        We'll need access to your location to enhance your trip diary experience
                    </Text>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleStartTrip}>
                    <Text style={styles.buttonText}>Start New Trip</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        position: 'relative', // Add this to position the close button
    },
    closeButton: {
        position: 'absolute',
        top: 50, // Adjust this value for proper spacing from the top
        right: 20, // Adjust this value for proper spacing from the right
        zIndex: 1, // Ensure the button is on top of other content
    },
    content: {
        alignItems: 'center',
        marginTop: -50, // Adjust this to center the content vertically after adding the close button
    },
    iconContainer: {
        backgroundColor: '#E6F0E6',
        borderRadius: 100,
        padding: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    locationWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0e0',
        borderRadius: 10,
        padding: 15,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#E6F0E6',
    },
    warningText: {
        marginLeft: 10,
        flexShrink: 1,
        color: '#555',
    },
    button: {
        backgroundColor: '#3F7D58',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});