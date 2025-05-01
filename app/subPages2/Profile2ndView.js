// screens/subPages/Profile2ndView.js
import React, { useEffect, useState } from 'react';
import {
    StyleSheet, View, Text, SafeAreaView, Dimensions, Image,
} from 'react-native';
import { doc, onSnapshot, collection, query, where, getAggregateFromServer, sum, count } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, useAnimatedGestureHandler } from 'react-native-reanimated';
import { GestureHandlerRootView, PanGestureHandler, } from 'react-native-gesture-handler';

// Import MapView
import MapView, { Marker } from 'react-native-maps'; // Import Marker if you plan to add specific spots

const { width, height } = Dimensions.get('window'); // Get height for better layout calculations

const Profile2ndView = () => {
    const [userData, setUserData] = useState(null);
    const [postsCount, setPostsCount] = useState(0);
    const [followersCount, setFollowersCount] = useState(0);
    const [totalKm, setTotalKm] = useState(0);
    const [spotsVisited, setSpotsVisited] = useState(0);
    const translateY = useSharedValue(0);

    const onGestureEvent = useAnimatedGestureHandler({
        onStart: (_, ctx) => {
            ctx.startY = translateY.value;
        },
        onActive: (event, ctx) => {
            if (event.translationY < 0) { // Only allow swiping up
                translateY.value = ctx.startY + event.translationY;
            }
        },
        onEnd: (event) => {
            // Optional: Add logic to navigate back if swiped far enough
            if (event.translationY < -100) {
                // You can add a `router.pop()` or similar here if you're using Expo Router
            }
            translateY.value = withSpring(0);
        },
    });

    const animatedHeaderStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: translateY.value },
            ],
        };
    });

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            // Handle case where user is not logged in
            return;
        }

        // Fetch user profile data
        const userDocRef = doc(db, 'newusers', user.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData(data);
                setFollowersCount(data.followers?.length || 0);
            }
        });

        // Fetch posts count
        const postsRef = collection(db, 'posts');
        const userPostsQuery = query(postsRef, where('userId', '==', user.uid));
        const unsubscribePosts = onSnapshot(userPostsQuery, (querySnapshot) => {
            setPostsCount(querySnapshot.size);
        });

        // Fetch trip stats
        const fetchTripStats = async () => {
            try {
                const tripsRef = collection(db, 'tripDiaries');
                const userTripsQuery = query(tripsRef, where('userId', '==', user.uid));
                const snapshot = await getAggregateFromServer(userTripsQuery, {
                    totalKmSum: sum('totalKm'),
                    spotsCount: count(),
                });

                const km = Math.round(Number(snapshot.data().totalKmSum)) || 0;
                const spots = Number(snapshot.data().spotsCount) || 0;

                setTotalKm(km);
                setSpotsVisited(spots);
            } catch (error) {
                console.error("Error fetching trip stats:", error);
                setTotalKm(0);
                setSpotsVisited(0);
            }
        };

        fetchTripStats();

        // Cleanup listeners on unmount
        return () => {
            unsubscribeUser();
            unsubscribePosts();
        };
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.greeting}>Hi, {userData?.Name || 'Explorer'}</Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.stat}>
                            <Text style={{color: 'white' , fontSize: 25, fontWeight: 'bold'}}>KM</Text>
                            <Text style={styles.statValue}>{totalKm}</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={{color: 'white' , fontSize: 25, fontWeight: 'bold'}}>Spots</Text>
                            <Text style={styles.statValue}>{spotsVisited}</Text>
                        </View>
                    </View>

                    {/* Map of Sri Lanka */}
                    <View style={styles.mapContainer}>
                        <MapView
                            style={styles.map}
                            initialRegion={{
                                latitude: 7.8731,    // Latitude for the center of Sri Lanka
                                longitude: 80.7718,   // Longitude for the center of Sri Lanka
                                latitudeDelta: 4,     // Adjust this to zoom in/out
                                longitudeDelta: 4,    // Adjust this to zoom in/out
                            }}
                            // Optional: Disable gestures if you just want a static map image
                            scrollEnabled={false}
                            zoomEnabled={false}
                            pitchEnabled={false}
                            rotateEnabled={false}
                        >
                            {/* You can add markers for visited spots if you have their coordinates */}
                            {/* Example of a marker for a fixed location (e.g., Sigiriya) */}
                            <Marker
                                coordinate={{ latitude: 7.9567, longitude: 80.7570 }}
                                title="Sigiriya"
                                description="Famous rock fortress"
                            />
                        </MapView>

                        
                    </View>

                        <View>
                            <Text style = {styles.tripscompleted}>Trips Completed </Text>
                            <View>
                                
                                

                            </View>
                        </View>
                </View>

                <View style={styles.bottomContainer}>
                    <View style={styles.curveBackground} />
                    <View style={styles.profileInfoContainer}>
                        <Image
                            source={
                                userData?.profilePictureUrl
                                    ? { uri: userData.profilePictureUrl }
                                    : require('../../assets/blank-profile-picture.webp')
                            }
                            style={styles.profileImage}
                        />
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statCount}>{postsCount}</Text>
                                <Text style={styles.statLabel}>Posts</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statCount}>{followersCount}</Text>
                                <Text style={styles.statLabel}>Followers</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statCount}>{totalKm}</Text>
                                <Text style={styles.statLabel}>KM</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#30706D',
    },
    header: {
        // Adjust padding to accommodate the map
        padding: 20,
        paddingTop: 60,
        alignItems: 'left',
        // Make header flex grow to push content down
        flex: 1, 
    },
    greeting: {
        fontSize: 25,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 15,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 10,
        marginBottom: 20, // Add some space below stats and before the map
    },
    stat: {
        flexDirection: 'row',
        gap: 20,
    },
    tripscompleted: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 10,
    },
    statLabel: {
        fontSize: 25,
        color: 'white',
        fontWeight: 'bold',
    },
    statValue: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#9AF40A',
        marginLeft: 5,
        textAlign: 'right',
    },
    // New styles for the map
    mapContainer: {
        // position: 'absolute', // You might not need absolute if it's part of the flow
        width: '100%',
        height: height * 0.4, // Adjust map height as needed
        borderRadius: 15,
        overflow: 'hidden', // Ensures the map respects border radius
        marginTop: 20, // Space from stats
        alignSelf: 'center', // Center the map horizontally
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)', // Subtle border
    },
    map: {
        ...StyleSheet.absoluteFillObject, // Map fills its container
    },
    bottomContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 20,
        overflow: 'visible',
        alignItems: 'center',
    },
    curveBackground: {
        position: 'relative',
        width: width * 1.4,
        top: 60,
        left: 0,
        right: 0,
        height: 270,
        backgroundColor: 'white',
        borderTopLeftRadius: width * 12,
        borderTopRightRadius: width * 12,
        backgroundColor: '#FFFFFF',
    },
    profileInfoContainer: {
        alignItems: 'center',
        marginTop: -100,
        marginRight: 20,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#fff',
        marginBottom: 15,
        marginTop: -170, // Adjust to overlap the curve
        marginLeft: 30, // Adjust to overlap the curve
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 20,
    },
    statItem: {
        alignItems: 'center',
        padding: 10,
    },
    statCount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
});

export default Profile2ndView;