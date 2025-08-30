import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { collection, addDoc, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function TripSummaryScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { tripId } = params;

    const [tripData, setTripData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch trip data from Firestore when the component mounts or tripId changes
    useEffect(() => {
        const fetchTripData = async () => {
            if (tripId) {
                const docRef = doc(db, "tripDiaries", tripId);
                try {
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setTripData({ id: docSnap.id, ...docSnap.data() });
                    } else {
                        Alert.alert("Error", "Trip not found. Please go back and try again.");
                        router.back();
                    }
                } catch (error) {
                    console.error("Error fetching trip data: ", error);
                    Alert.alert("Error", "Could not load trip data. Please try again.");
                    router.back();
                }
            }
            setLoading(false);
        };

        fetchTripData();
    }, [tripId]);

    const handlePublishTrip = async () => {
        if (!tripData) {
            Alert.alert("Error", "Trip data is not available to publish.");
            return;
        }

        try {
            const userId = auth.currentUser.uid;

            // Step 1: Fetch the user's details (username and profile picture URL)
            const userDocRef = doc(db, "newusers", userId);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                Alert.alert("Error", "User profile not found. Cannot publish trip.");
                return;
            }

            const userData = userDocSnap.data();
            const username = userData.Name; // Use userData.Name based on your Firestore structure
            const profilePictureUrl = userData.profilePictureUrl || null;

            // Step 2: Create a post document with the collected user info
            const newPost = {
                userId: userId,
                username: username, 
                profilePictureUrl: profilePictureUrl,
                tripId: tripData.id,
                tripTitle: tripData.tripTitle,
                startLocation: tripData.startLocation,
                endLocation: tripData.endLocation,
                startDate: tripData.startDate,
                endDate: tripData.endDate,
                stops: tripData.stops,
                totalKm: tripData.totalKm,
                createdAt: new Date().toISOString(),
                likes: 0,
                commentsCount: 0,
            };

            // Add the coverImage field to the newPost object
            if (tripData.stops && tripData.stops.length > 0 && tripData.stops[0].photos && tripData.stops[0].photos.length > 0) {
                newPost.coverImage = tripData.stops[0].photos[0];
            } else {
                newPost.coverImage = null; // Set to null if no photos exist
            }

            const postRef = await addDoc(collection(db, "posts"), newPost);

            // Step 3: Update the user's profile to track the new post
            // Use arrayUnion to add the new post's ID to the 'posts' array without overwriting it
            await updateDoc(userDocRef, {
                posts: arrayUnion(postRef.id),
                // Increment the post count
                postCount: (userData.postCount || 0) + 1 
            });

            Alert.alert('Success', 'Trip published successfully!');
            router.push('../../tabs/main');
        } catch (e) {
            console.error("Error publishing trip: ", e);
            Alert.alert("Error publishing trip", e.message);
        }
    };

    const handleSaveDraft = async () => {
        if (!tripData) return;

        try {
            const tripDocRef = doc(db, "tripDiaries", tripId);
            await updateDoc(tripDocRef, {
                isPublished: false,
                updatedAt: new Date().toISOString(),
            });

            Alert.alert('Success', 'Trip saved as a draft!');
            router.push('./main');
        } catch (e) {
            console.error("Error saving as draft: ", e);
            Alert.alert("Error saving draft", e.message);
        }
    };

    const handleAddAnotherStop = () => {
        router.push({
            pathname: './AddStopScreen',
            params: { tripId: tripId }
        });
    };

    const renderStop = ({ item }) => (
        <View style={styles.stopItem}>
            <Image source={{ uri: item.photos[0] }} style={styles.stopImage} />
            <View style={styles.stopDetails}>
                <View style={styles.stopTitleContainer}>
                    <MaterialCommunityIcons name="camera" size={16} color="#666" />
                    <Text style={styles.stopTitle}>{item.stopName}</Text>
                </View>
                <View style={styles.stopLocationContainer}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.stopLocation}>{item.location.name}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.editButton}>
                <Ionicons name="pencil-outline" size={20} color="#3F7D58" />
            </TouchableOpacity>
        </View>
    );

    if (loading || !tripData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3F7D58" />
                <Text>Loading trip summary...</Text>
            </View>
        );
    }

    const startDate = tripData.startDate ? new Date(tripData.startDate) : null;
    const endDate = tripData.endDate ? new Date(tripData.endDate) : null;
    const stopCount = tripData.stops ? tripData.stops.length : 0;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.header}>Trip Summary</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.progressBarContainer}>
                <View style={styles.progressBarFill} />
                <Text style={styles.progressText}>Creating Trip 4/4</Text>
            </View>
            
            <View style={styles.summaryCard}>
                <View style={styles.statusContainer}>
                    <Ionicons name="checkmark-circle" size={24} color="#3F7D58" />
                    <Text style={styles.statusText}>Trip diary ready!</Text>
                </View>
                <Text style={styles.statusSubText}>Review your trip details before publishing</Text>
            </View>

            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Trip Details</Text>
                    <TouchableOpacity>
                        <Ionicons name="pencil-outline" size={20} color="#3F7D58" />
                    </TouchableOpacity>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={20} color="#666" style={styles.detailIcon} />
                    <Text>{startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}</Text>
                </View>
                <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="car" size={20} color="#666" style={styles.detailIcon} />
                    <Text>{tripData.startLocation.name} to {tripData.endLocation.name}</Text>
                </View>
                <Text style={styles.stopCount}>{stopCount} {stopCount === 1 ? 'stop' : 'stops'}</Text>
            </View>

            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Trip Stops</Text>
                    <TouchableOpacity>
                        <Ionicons name="pencil-outline" size={20} color="#3F7D58" />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={tripData.stops}
                    renderItem={renderStop}
                    keyExtractor={(item, index) => index.toString()}
                    scrollEnabled={false}
                />
                <TouchableOpacity style={styles.addStopButton} onPress={handleAddAnotherStop}>
                    <Ionicons name="add-circle" size={24} color="#3F7D58" />
                    <Text style={styles.addStopText}>Add Another Stop</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.publishButton} onPress={handlePublishTrip}>
                    <Text style={styles.publishButtonText}>Publish Trip Diary</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.draftButton} onPress={handleSaveDraft}>
                    <Text style={styles.draftButtonText}>Save as Draft</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 50,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    progressBarContainer: {
        backgroundColor: '#E6F0E6',
        height: 8,
        borderRadius: 4,
        marginBottom: 10,
        position: 'relative',
    },
    progressBarFill: {
        backgroundColor: '#3F7D58',
        height: 8,
        borderRadius: 4,
        width: '100%',
    },
    progressText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 20,
    },
    summaryCard: {
        backgroundColor: '#e6f0e6',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    statusText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3F7D58',
        marginLeft: 10,
    },
    statusSubText: {
        color: '#666',
    },
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    detailIcon: {
        marginRight: 10,
    },
    stopCount: {
        color: '#666',
        marginTop: 10,
    },
    stopItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    stopImage: {
        width: 80,
        height: 80,
        borderRadius: 10,
        marginRight: 15,
    },
    stopDetails: {
        flex: 1,
    },
    stopTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stopTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 5,
    },
    stopLocationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    stopLocation: {
        fontSize: 12,
        color: '#666',
        marginLeft: 5,
    },
    addStopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    addStopText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3F7D58',
        marginLeft: 5,
    },
    buttonContainer: {
        marginBottom: 50,
    },
    publishButton: {
        backgroundColor: '#3F7D58',
        padding: 18,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 10,
    },
    publishButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    draftButton: {
        backgroundColor: '#fff',
        borderColor: '#3F7D58',
        borderWidth: 1,
        padding: 18,
        borderRadius: 30,
        alignItems: 'center',
    },
    draftButtonText: {
        color: '#3F7D58',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});