// TripDetailsScreen.js (Updated with correct publishing logic)

import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, writeBatch } from "firebase/firestore";
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { useTrip } from '../../hooks/useTrip';

export default function TripDetailsScreen() {
    const router = useRouter();
    const { tripId } = useLocalSearchParams();
    const { tripData, setTripData, updateTripData } = useTrip();
    const [loadingTrip, setLoadingTrip] = useState(true);
    const [stops, setStops] = useState([]);
    const [loadingStops, setLoadingStops] = useState(true);
    const [isPublishing, setIsPublishing] = useState(false);
    const [userData, setUserData] = useState(null);

    // Function to fetch the main trip details
    const fetchTripDetails = useCallback(async () => {
        if (!tripId) {
            console.warn("Trip ID is missing for TripDetailsScreen.");
            setLoadingTrip(false);
            return;
        }
        setLoadingTrip(true);
        try {
            const tripDocRef = doc(db, "tripDiaries", tripId);
            const tripSnap = await getDoc(tripDocRef);

            if (tripSnap.exists()) {
                setTripData(prevData => ({
                    ...prevData,
                    ...tripSnap.data(),
                    id: tripSnap.id
                }));
            } else {
                Alert.alert("Error", "Trip not found!");
                router.back();
            }
        } catch (error) {
            console.error("Error fetching trip details:", error);
            Alert.alert("Error", "Could not load trip details.");
        } finally {
            setLoadingTrip(false);
        }
    }, [tripId, setTripData, router]);

    // Function to fetch stops from the subcollection
    const fetchStops = useCallback(async () => {
        if (!tripId) {
            setLoadingStops(false);
            return;
        }
        setLoadingStops(true);
        try {
            const stopsCollectionRef = collection(db, "tripDiaries", tripId, "stops");
            const q = query(stopsCollectionRef, orderBy("timestamp", "asc"));
            const querySnapshot = await getDocs(q);

            const fetchedStops = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : doc.data().timestamp
            }));
            setStops(fetchedStops);
        } catch (error) {
            console.error("Error fetching stops:", error);
            Alert.alert("Error", "Could not load trip stops.");
        } finally {
            setLoadingStops(false);
        }
    }, [tripId]);

    // Function to fetch user data
    const fetchUserData = useCallback(async () => {
        const userId = auth.currentUser.uid;
        if (!userId) {
            console.warn("User not authenticated.");
            return;
        }
        try {
            const userDocRef = doc(db, "newusers", userId);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
                setUserData(userSnap.data());
            } else {
                console.warn("User profile not found.");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }, []);

    // useFocusEffect to refetch data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchTripDetails();
            fetchStops();
            fetchUserData();
            return () => { };
        }, [fetchTripDetails, fetchStops, fetchUserData])
    );

    // Helper function to calculate total distance
    const calculateTotalDistance = (stops) => {
        // Implement your distance calculation logic here.
        // This is a placeholder. You'd typically use a library like 'geolib'
        // or a custom function that iterates through stops and calculates the
        // distance between consecutive points.
        // For now, it returns a placeholder value.
        // e.g., from your data it was ~125 KM
        return 125; 
    };

    // CORRECTED: Function to handle publishing the trip diary
    const handlePublishTrip = async () => {
        if (!tripId) {
            Alert.alert("Error", "Cannot publish: Trip ID is missing.");
            return;
        }

        if (!tripData.tripTitle || !tripData.startLocation?.name || !tripData.endLocation?.name || stops.length === 0) {
            Alert.alert("Incomplete Trip", "Please ensure your trip has a title, start/end locations, and at least one stop before publishing.");
            return;
        }

        if (!userData) {
            Alert.alert("Error", "User data is not available. Please try again.");
            return;
        }

        setIsPublishing(true);

        const batch = writeBatch(db);

        try {
            const tripDocRef = doc(db, "tripDiaries", tripId);

            // 1. Update the trip diary document status
            batch.update(tripDocRef, {
                status: 'published',
                publishedAt: serverTimestamp(),
            });

            // 2. Create a new document in the 'posts' collection
            const postsCollectionRef = collection(db, "posts");
            const newPostDocRef = doc(postsCollectionRef);

            // Calculate total distance (placeholder)
            const totalKm = calculateTotalDistance(stops);

            const postData = {
                // Trip Information
                tripTitle: tripData.tripTitle,
                description: tripData.description || "",
                startDate: tripData.startDate,
                endDate: tripData.endDate,
                startLocation: tripData.startLocation,
                endLocation: tripData.endLocation,
                totalKm: totalKm,
                stops: stops, // Pass the entire stops array
                tripId: tripId,

                // User Information
                userId: auth.currentUser.uid,
                username: userData.username || 'Anonymous',
                profilePictureUrl: userData.profilePictureUrl || null,

                // Post-specific Information
                createdAt: serverTimestamp(),
                commentsCount: 0,
                likes: 0,
                // Use a default image if no cover image is present
                coverImage: tripData.coverImage || (stops.length > 0 && stops[0].photos.length > 0 ? stops[0].photos[0] : null),
            };

            batch.set(newPostDocRef, postData);

            // 3. Commit the batch
            await batch.commit();

            Alert.alert("Success", "Trip diary published successfully!");
            router.replace('../tabs/main');

        } catch (error) {
            console.error("Error publishing trip diary:", error);
            Alert.alert("Error", "Failed to publish trip diary. Please try again.");
        } finally {
            setIsPublishing(false);
        }
    };


    // Render loading state
    if (loadingTrip || loadingStops) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3F7D58" />
                <Text style={styles.loadingText}>Loading trip data...</Text>
            </View>
        );
    }

    const numStops = stops.length;
    const tripStartDate = tripData.startDate?.toDate ? tripData.startDate.toDate().toLocaleDateString() : 'N/A';
    const tripEndDate = tripData.endDate?.toDate ? tripData.endDate.toDate().toLocaleDateString() : 'N/A';
    const startLocName = tripData.startLocation?.name || 'Unknown';
    const endLocName = tripData.endLocation?.name || 'Unknown';

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trip Summary</Text>
            </View>

            <View style={styles.statusCard}>
                <Ionicons name="checkmark-circle" size={24} color="#3F7D58" style={styles.statusIcon} />
                <View>
                    <Text style={styles.statusText}>Trip diary ready!</Text>
                    <Text style={styles.statusSubText}>Review your trip details before publishing</Text>
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Trip Details</Text>
                    <TouchableOpacity onPress={() => router.push({ pathname: "/edit-trip-details", params: { tripId: tripId } })}>
                        <Ionicons name="create-outline" size={18} color="#3F7D58" />
                    </TouchableOpacity>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={18} color="#333" style={styles.detailIcon} />
                    <Text style={styles.detailText}>{tripStartDate} - {tripEndDate}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="car-outline" size={18} color="#333" style={styles.detailIcon} />
                    <Text style={styles.detailText}>{startLocName} to {endLocName}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="stop-circle-outline" size={18} color="#333" style={styles.detailIcon} />
                    <Text style={styles.detailText}>{numStops} stops</Text>
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Trip Stops</Text>
                    <TouchableOpacity onPress={() => router.push({ pathname: "/trip/AddStopScreen", params: { tripId: tripId } })}>
                        <Ionicons name="create-outline" size={18} color="#3F7D58" />
                    </TouchableOpacity>
                </View>
                {numStops > 0 ? (
                    stops.map((stop, index) => (
                        <View key={stop.id} style={styles.stopItem}>
                            <Text style={styles.stopName}>{index + 1}. {stop.stopName}</Text>
                            <Text style={styles.stopLocation}>{stop.location.name}</Text>
                            {stop.photos && stop.photos.length > 0 && (
                                <Image source={{ uri: stop.photos[0] }} style={styles.stopImage} />
                            )}
                        </View>
                    ))
                ) : (
                    <Text style={styles.noStopsText}>No stops added yet.</Text>
                )}
                <TouchableOpacity style={styles.addStopButton} onPress={() => router.push({ pathname: "/trip/AddStopScreen", params: { tripId: tripId } })}>
                    <Ionicons name="add-circle-outline" size={18} color="#3F7D58" />
                    <Text style={styles.addStopButtonText}>Add Another Stop</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.publishButton}
                onPress={handlePublishTrip}
                disabled={isPublishing || loadingTrip || loadingStops}
            >
                {isPublishing ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.publishButtonText}>Publish Trip Diary</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveDraftButton} onPress={() => Alert.alert("Save Draft", "Saving as Draft...")}>
                <Text style={styles.saveDraftButtonText}>Save as Draft</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f7',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingTop: 40,
    },
    backButton: {
        marginRight: 10,
    },
    backIcon: {
        fontSize: 24,
        color: '#333',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f4f7',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e6ffe6',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderLeftWidth: 5,
        borderColor: '#3F7D58',
    },
    statusIcon: {
        fontSize: 24,
        marginRight: 10,
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3F7D58',
    },
    statusSubText: {
        fontSize: 13,
        color: '#666',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    editIcon: {
        fontSize: 18,
        color: '#3F7D58',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    detailText: {
        fontSize: 16,
        color: '#555',
    },
    stopItem: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginBottom: 10,
    },
    stopName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    stopLocation: {
        fontSize: 14,
        color: '#777',
        marginTop: 2,
        marginBottom: 5,
    },
    stopImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginTop: 10,
        resizeMode: 'cover',
    },
    noStopsText: {
        fontSize: 15,
        color: '#888',
        textAlign: 'center',
        paddingVertical: 15,
    },
    addStopButton: {
        backgroundColor: '#e6ffe6',
        padding: 12,
        borderRadius: 8,
        marginTop: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3F7D58',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    addStopButtonText: {
        color: '#3F7D58',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    publishButton: {
        backgroundColor: '#3F7D58',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    publishButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    saveDraftButton: {
        backgroundColor: '#f0f4f7',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 20,
    },
    saveDraftButtonText: {
        color: '#555',
        fontSize: 18,
        fontWeight: 'bold',
    },
});