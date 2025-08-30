

import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    SafeAreaView,
    ScrollView,
    Image,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TripCard from '../../components/TripCard';
import { useNavigation } from 'expo-router';

import { onAuthStateChanged } from 'firebase/auth';
import { 
    doc, 
    getDoc, 
    Timestamp, 
    query, 
    collection, 
    orderBy, 
    onSnapshot, 
    addDoc, 
    serverTimestamp,
    getDocs,
    where
} from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { addNotification } from './../tabs/notification';

const SIX_MONTHS_IN_MS = 15552000000;

export default function JoinMeMain() {
    const navigation = useNavigation();
    const [isCreatePostVisible, setCreatePostVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);
    const [userTripsCompleted, setUserTripsCompleted] = useState(0);
    const [canCreateTrip, setCanCreateTrip] = useState(false);

    const initialTripDetails = {
        title: '',
        destination: '',
        dates: '',
        budget: '',
        description: '',
        groupSize: 1,
        safetyProtocols: '',
        advancePayment: '',
        meetingPoint: '',
    };

    const [tripDetails, setTripDetails] = useState(initialTripDetails);
    const [availableTrips, setAvailableTrips] = useState([]);

    useEffect(() => {
        let unsubscribeAuth;
        let unsubscribeTrips;

        const setupListeners = async () => {
            unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    const userDocRef = doc(db, 'newusers', user.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        setUserName(userData.Name || userData.username || 'User');
                        setProfilePicture(userData.profilePictureUrl || null);
                        setUserTripsCompleted(userData.tripsCompleted || 0);

                        const isOrganizer = userData.role === 'organizer';
                        const isMemberForSixMonths = userData.createdAt && (Timestamp.now().toMillis() - userData.createdAt.toMillis() > SIX_MONTHS_IN_MS);

                        setCanCreateTrip(isOrganizer && isMemberForSixMonths);
                    } else {
                        Alert.alert('Error', 'User data not found.');
                    }
                } else {
                    Alert.alert('Error', 'No user logged in.');
                    navigation.goBack();
                }
                setLoading(false);
            });

            const q = query(collection(db, 'trips'), orderBy('createdAt', 'desc'));
            unsubscribeTrips = onSnapshot(q, (snapshot) => {
                const trips = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setAvailableTrips(trips);
            }, (error) => {
                console.error("Error fetching trips: ", error);
                Alert.alert('Error', 'Failed to load available trips.');
            });
        };

        setupListeners();

        return () => {
            if (unsubscribeAuth) unsubscribeAuth();
            if (unsubscribeTrips) unsubscribeTrips();
        };
    }, []);

    const handleInputChange = (name, value) => {
        setTripDetails({ ...tripDetails, [name]: value });
    };

    const handleGroupSizeChange = (change) => {
        setTripDetails(prevDetails => {
            const newSize = Math.max(1, prevDetails.groupSize + change);
            return { ...prevDetails, groupSize: newSize };
        });
    };

    const handlePostTrip = async () => {
        if (!tripDetails.title || !tripDetails.destination || !tripDetails.dates || !tripDetails.budget || !tripDetails.description || tripDetails.groupSize < 1) {
            Alert.alert('Error', 'Please fill in all required fields: Title, Destination, Dates, Budget, Description, and Group Size (must be at least 1).');
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) {
                Alert.alert('Error', 'No user logged in.');
                return;
            }

            const newTrip = {
                title: tripDetails.title,
                organizer: userName || "You",
                organizerId: user.uid,
                location: tripDetails.destination,
                date: tripDetails.dates,
                budget: tripDetails.budget,
                description: tripDetails.description,
                groupSize: tripDetails.groupSize,
                safetyProtocols: tripDetails.safetyProtocols,
                advancePayment: tripDetails.advancePayment,
                meetingPoint: tripDetails.meetingPoint,
                createdAt: serverTimestamp(),
                joinedMembers: [],
            };

            const tripRef = await addDoc(collection(db, 'trips'), newTrip);
            const tripId = tripRef.id;

            const followersRef = collection(db, 'newusers', user.uid, 'followers');
            const followersSnapshot = await getDocs(followersRef);

            // Loop through each follower and send a notification
            followersSnapshot.forEach(async (followerDoc) => {
                const followerId = followerDoc.id;

                // Pass the necessary data to addNotification
                await addNotification({
                    type: 'join_me_trip',
                    fromUserId: user.uid,
                    toUserId: followerId,
                    // The trip object must be passed with an 'id' property
                    trip: {
                        id: tripId,
                        title: newTrip.title
                    }
                });
            });

            setCreatePostVisible(false);
            setTripDetails(initialTripDetails);
            Alert.alert('Trip Posted!', `Your trip has been posted and your followers will be notified.`);

        } catch (error) {
            console.error('Error posting trip: ', error);
            Alert.alert('Error', 'Failed to post trip. Please try again.');
        }
    };

    const handleCancelPost = () => {
        setCreatePostVisible(false);
        setTripDetails(initialTripDetails);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5A8B7B" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Join Me</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.profileSection}>
                    <View>
                        <Text style={styles.profileName}>{userName}</Text>
                        <Text style={styles.profileSubtitle}>Trips Completed - {userTripsCompleted}</Text>
                    </View>
                    <Image
                        source={profilePicture ? { uri: profilePicture } : require('../../assets/blank-profile-picture.webp')}
                        style={styles.avatar}
                    />
                </View>

                {canCreateTrip && (
                    <TouchableOpacity
                        style={styles.joinAdventureCard}
                        onPress={() => setCreatePostVisible(true)}
                    >
                        <View style={styles.joinAdventureTextContainer}>
                            <Text style={styles.joinAdventureTitle}>Create a Trip</Text>
                            <Text style={styles.joinAdventureSubtitle}>
                                Time to craft a message asking others to join you for your next big adventure!
                            </Text>
                        </View>
                        <View style={styles.plusButton}>
                            <Ionicons name="add" size={28} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                )}

                {isCreatePostVisible && (
                    <View style={styles.createPostContainer}>
                        <View style={styles.createPostHeader}>
                            <TouchableOpacity onPress={handleCancelPost}>
                                <Ionicons name="close-outline" size={28} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.createPostTitle}>Create a Post</Text>
                            <View style={{ width: 28 }} />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Trip Title"
                            value={tripDetails.title}
                            onChangeText={(text) => handleInputChange('title', text)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Destination"
                            value={tripDetails.destination}
                            onChangeText={(text) => handleInputChange('destination', text)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Dates"
                            value={tripDetails.dates}
                            onChangeText={(text) => handleInputChange('dates', text)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Estimated Budget (e.g., LKR 10,000)"
                            value={tripDetails.budget}
                            onChangeText={(text) => handleInputChange('budget', text)}
                        />
                        <TextInput
                            style={[styles.input, styles.multilineInput]}
                            placeholder="Safety Protocols (e.g., Bring a first-aid kit, wear a helmet)"
                            value={tripDetails.safetyProtocols}
                            onChangeText={(text) => handleInputChange('safetyProtocols', text)}
                            multiline
                            numberOfLines={3}
                        />
                        <TextInput
                            style={[styles.input, styles.multilineInput]}
                            placeholder="Trip Description"
                            value={tripDetails.description}
                            onChangeText={(text) => handleInputChange('description', text)}
                            multiline
                            numberOfLines={3}
                        />
                        <View style={styles.groupSizeContainer}>
                            <Text style={styles.groupSizeLabel}>Desired Group Size</Text>
                            <View style={styles.groupSizeInputRow}>
                                <TouchableOpacity onPress={() => handleGroupSizeChange(-1)} style={styles.groupSizeButton}>
                                    <Ionicons name="remove-circle" size={30} color="#5A8B7B" />
                                </TouchableOpacity>
                                <TextInput
                                    style={styles.groupSizeInput}
                                    value={tripDetails.groupSize.toString()}
                                    onChangeText={(text) => handleInputChange('groupSize', parseInt(text) || 0)}
                                    keyboardType="numeric"
                                />
                                <TouchableOpacity onPress={() => handleGroupSizeChange(1)} style={styles.groupSizeButton}>
                                    <Ionicons name="add-circle" size={30} color="#5A8B7B" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Advance Payment (e.g., LKR 5,000)"
                            value={tripDetails.advancePayment}
                            onChangeText={(text) => handleInputChange('advancePayment', text)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Meeting Point (Optional)"
                            value={tripDetails.meetingPoint}
                            onChangeText={(text) => handleInputChange('meetingPoint', text)}
                        />
                        <TouchableOpacity style={styles.postButton} onPress={handlePostTrip}>
                            <Text style={styles.postButtonText}>Post</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelPost}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!isCreatePostVisible && (
                    <>
                        <Text style={styles.sectionTitle}>Available Trips</Text>
                        {availableTrips.map((trip, index) => (
                            <TripCard key={index} {...trip} />
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: 30,
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#5A8B7B',
    },
    container: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    profileSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    profileName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    profileSubtitle: {
        fontSize: 16,
        color: '#7F8C8D',
        marginTop: 4,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    joinAdventureCard: {
        backgroundColor: '#E0EBE8',
        borderRadius: 15,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    joinAdventureTextContainer: {
        flex: 1,
    },
    joinAdventureTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#34495E',
    },
    joinAdventureSubtitle: {
        fontSize: 14,
        color: '#5A8B7B',
        marginTop: 5,
        lineHeight: 20,
    },
    plusButton: {
        backgroundColor: '#5A8B7B',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 15,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#34495E',
        marginBottom: 20,
    },
    createPostContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    createPostHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    createPostTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#F7F7F7',
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    groupSizeContainer: {
        marginBottom: 15,
    },
    groupSizeLabel: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
        fontWeight: 'bold',
    },
    groupSizeInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#F7F7F7',
        padding: 5,
    },
    groupSizeButton: {
        padding: 5,
    },
    groupSizeInput: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
    },
    postButton: {
        backgroundColor: '#5A8B7B',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    postButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#D3D3D3',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#333',
        fontSize: 18,
        fontWeight: 'bold',
    },
});