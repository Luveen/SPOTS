// MapScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Alert, Modal, Pressable } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from '../../firebaseConfig'; 

const DEFAULT_PROFILE_PIC = 'https://via.placeholder.com/40?text=NP';
const DEFAULT_SPOT_IMAGE = 'https://via.placeholder.com/400x200?text=No+Image';

const MapScreen = () => {
    const [recommendedSpots, setRecommendedSpots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapRegion, setMapRegion] = useState({
        latitude: 7.8731, 
        longitude: 80.7718,
        latitudeDelta: 4,
        longitudeDelta: 4,
    });
    const [selectedSpot, setSelectedSpot] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const fetchRecommendedSpots = async () => {
            setLoading(true);
            const userId = auth.currentUser?.uid;

            if (!userId) {
                Alert.alert("Authentication Required", "Please log in to see recommended spots.");
                setLoading(false);
                setRecommendedSpots([]);
                return;
            }

            try {
                // Get the list of users the current user is following
                const followingRef = collection(db, "newusers", userId, "following");
                const followingSnapshot = await getDocs(followingRef);
                const followingIds = followingSnapshot.docs.map(doc => doc.id);

                if (followingIds.length === 0) {
                    setRecommendedSpots([]);
                    setLoading(false);
                    return;
                }

                const allFetchedSpots = [];
                const BATCH_SIZE = 10;

                // Process followingIds in batches to query tripDiaries
                for (let i = 0; i < followingIds.length; i += BATCH_SIZE) {
                    const batch = followingIds.slice(i, i + BATCH_SIZE);
                    
                    const tripsQuery = query(
                        collection(db, "tripDiaries"), 
                        where("userId", "in", batch),
                        where("status", "==", "published")
                    );
                    const tripsSnapshot = await getDocs(tripsQuery);

                    // For each published trip, fetch its stops
                    for (const tripDoc of tripsSnapshot.docs) {
                        const tripId = tripDoc.id;
                        const tripOwnerId = tripDoc.data().userId; 
                        
                        // Query the 'stops' subcollection
                        const stopsRef = collection(db, "tripDiaries", tripId, "stops");
                        const stopQuery = query(stopsRef, where("showOnMap", "==", true)); 
                        const stopsSnapshot = await getDocs(stopQuery);

                        // Fetch owner's profile picture once per owner
                        const ownerProfile = await getDoc(doc(db, "newusers", tripOwnerId));
                        const ownerData = ownerProfile.exists() ? ownerProfile.data() : {};
                        const ownerUsername = ownerData.username || 'Unknown User';
                        
                        const ownerProfilePic = ownerData.profilePictureUrl || ownerData.profilePic || DEFAULT_PROFILE_PIC;

                        // Add valid stops to the list
                        for (const stopDoc of stopsSnapshot.docs) {
                            const stopData = stopDoc.data();
                            if (stopData.location?.geo) {
                                allFetchedSpots.push({
                                    id: stopDoc.id,
                                    name: stopData.stopName || 'Unnamed Stop',
                                    description: stopData.description || 'No description',
                                    latitude: stopData.location.geo.latitude,
                                    longitude: stopData.location.geo.longitude,
                                    userProfilePic: ownerProfilePic,
                                    username: ownerUsername,
                                    // Make sure you get the image URL from your stop data
                                    spotImage: stopData.photos && stopData.photos.length > 0 ? stopData.photos[0] : DEFAULT_SPOT_IMAGEE,
                                });
                            }
                        }
                    }
                }

                setRecommendedSpots(allFetchedSpots);

                if (allFetchedSpots.length > 0) {
                    const latitudes = allFetchedSpots.map(spot => spot.latitude);
                    const longitudes = allFetchedSpots.map(spot => spot.longitude);

                    const minLat = Math.min(...latitudes);
                    const maxLat = Math.max(...latitudes);
                    const minLng = Math.min(...longitudes);
                    const maxLng = Math.max(...longitudes);

                    setMapRegion({
                        latitude: (minLat + maxLat) / 2,
                        longitude: (minLng + maxLng) / 2,
                        latitudeDelta: Math.abs(maxLat - minLat) * 1.5 || mapRegion.latitudeDelta,
                        longitudeDelta: Math.abs(maxLng - minLng) * 1.5 || mapRegion.longitudeDelta,
                    });
                }
            } catch (error) {
                console.error("Error fetching recommended spots:", error);
                Alert.alert("Error", "Failed to load recommended spots. Please check your network and try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendedSpots();
    }, [auth.currentUser?.uid]);

    const handleMarkerPress = (spot) => {
        setSelectedSpot(spot);
        setModalVisible(true);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3F7D58" />
                <Text style={styles.loadingText}>Loading recommended locations...</Text>
            </View>
        );
    }

    if (recommendedSpots.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No recommended locations yet!</Text>
                <Text style={styles.emptySubText}>Follow more users or wait for their recommendations to appear.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                region={mapRegion}
                onRegionChangeComplete={setMapRegion}
            >
                {recommendedSpots.map((spot) => (
                    spot.latitude && spot.longitude && (
                        <Marker
                            key={spot.id}
                            coordinate={{
                                latitude: spot.latitude,
                                longitude: spot.longitude,
                            }}
                            onPress={() => handleMarkerPress(spot)}
                            pinColor="red" // This will make the marker a red pin
                        />
                    )
                ))}
            </MapView>
            
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <View style={styles.bottomSheet}>
                        <View style={styles.bottomSheetHeader}>
                            <View style={styles.bottomSheetHandle} />
                        </View>
                        <View style={styles.spotDetailsContainer}>
                            <Image
                                source={{ uri: selectedSpot?.spotImage || DEFAULT_SPOT_IMAGE }}
                                style={styles.spotImage}
                            />
                            <View style={styles.textContainer}>
                                <View style={styles.userInfo}>
                                    <Image
                                        source={{ uri: selectedSpot?.userProfilePic || DEFAULT_PROFILE_PIC }}
                                        style={styles.userProfilePic}
                                    />
                                    <Text style={styles.username}>{selectedSpot?.username}</Text>
                                </View>
                                <Text style={styles.bottomSheetTitle}>{selectedSpot?.name}</Text>
                                
                                <Text style={styles.description}>{selectedSpot?.description}</Text>
                            </View>
                        </View>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f4f7',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        
    },
    bottomSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 50,
        paddingTop: 10,
        alignItems: 'center',
    },
    bottomSheetHeader: {
        width: '100%',
        alignItems: 'center',
    },
    bottomSheetHandle: {
        width: 50,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 3,
    },
    spotDetailsContainer: {
        width: '100%',
        paddingHorizontal: 20,
        alignItems: 'center',
        marginTop: 10,
    },
    spotImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 15,
        resizeMode: 'cover',
    },
    textContainer: {
        width: '100%',
        alignItems: 'center',
    },
    bottomSheetTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 5,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    userProfilePic: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 10,
        
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3F7D58',
    },
    description: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default MapScreen;