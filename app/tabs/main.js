import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
    ActivityIndicator, Alert, FlatList, StyleSheet, Text, View, TouchableOpacity, Dimensions
} from 'react-native';
import {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    runOnJS,
    withSpring,
} from 'react-native-reanimated';
import Animated, {
    useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, PanGestureHandler } from 'react-native-gesture-handler';

import { collection, onSnapshot, orderBy, query, doc, getDoc, getDocs, limit } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';

import PostComponent from './../../components/PostComponent';
import JoinMeCard from '../../components/JoinMeCard';
import DiscoverPeopleCard from '../../components/DiscoverPeopleCard';

const { width, height } = Dimensions.get('window');
const STATIC_HEADER_HEIGHT = 150;
const COLLAPSIBLE_SECTION_HEIGHT = 150;

const HomePage = () => {
    const router = useRouter();
    const [feedData, setFeedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userProfilePicture, setUserProfilePicture] = useState(null);
    const [activeSlide, setActiveSlide] = useState(0);
    const [currentUserFollows, setCurrentUserFollows] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const containerHeight = useSharedValue(COLLAPSIBLE_SECTION_HEIGHT);
    const opacity = useSharedValue(1);
    const scrollY = useSharedValue(0);
    const flatListRef = useRef(null);

    // This is the updated part for handling gestures
    const panGesture = Gesture.Pan()
        .onBegin((_, ctx) => {
            'worklet';
            ctx.startY = containerHeight.value;
        })
        .onUpdate((event, ctx) => {
            'worklet';
            const newHeight = ctx.startY + event.translationY;
            if (newHeight >= 0 && newHeight <= COLLAPSIBLE_SECTION_HEIGHT) {
                containerHeight.value = newHeight;
                opacity.value = newHeight / COLLAPSIBLE_SECTION_HEIGHT;
            }
        })
        .onEnd((event) => {
            'worklet';
            if (event.translationY > 50) {
                runOnJS(setIsCollapsed)(true);
                containerHeight.value = withSpring(0);
                opacity.value = withSpring(0);
            } else if (event.translationY < -50) {
                runOnJS(setIsCollapsed)(false);
                containerHeight.value = withSpring(COLLAPSIBLE_SECTION_HEIGHT);
                opacity.value = withSpring(1);
            } else {
                runOnJS(setIsCollapsed)(isCollapsed);
                containerHeight.value = withSpring(isCollapsed ? 0 : COLLAPSIBLE_SECTION_HEIGHT);
                opacity.value = withSpring(isCollapsed ? 0 : 1);
            }
        });

    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            height: withTiming(containerHeight.value, {
                duration: 300,
                easing: Easing.inOut(Easing.ease),
            }),
            opacity: withTiming(opacity.value, {
                duration: 200,
                easing: Easing.inOut(Easing.ease),
            }),
        };
    });

    const animatedArrowStyle = useAnimatedStyle(() => {
        const rotation = isCollapsed ? '180deg' : '0deg';
        return {
            transform: [{ rotate: withTiming(rotation, { duration: 200 }) }],
            opacity: opacity.value,
        };
    });

    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
        
        if (scrollY.value > 50 && !isCollapsed) {
            runOnJS(setIsCollapsed)(true);
            containerHeight.value = withTiming(0);
            opacity.value = withTiming(0);
        } else if (scrollY.value <= 50 && isCollapsed) {
            runOnJS(setIsCollapsed)(false);
            containerHeight.value = withTiming(COLLAPSIBLE_SECTION_HEIGHT);
            opacity.value = withTiming(1);
        }
    });

    const handleToggleCollapse = () => {
        const newCollapsedState = !isCollapsed;
        setIsCollapsed(newCollapsedState);
        containerHeight.value = withTiming(newCollapsedState ? 0 : COLLAPSIBLE_SECTION_HEIGHT);
        opacity.value = withTiming(newCollapsedState ? 0 : 1);
    };

    const handleJoinMePress = () => {
        router.push('/subPages/JoinMeMain');
    };

    const handleMapPress = () => {
        router.push('/subPages/MapScreen');
    };

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUserId(user.uid);
            } else {
                setCurrentUserId(null);
                setLoading(false);
            }
        });
        return unsubscribeAuth;
    }, []);

    useEffect(() => {
        if (!currentUserId) {
            return;
        }

        let unsubscribePosts;
        let unsubscribeUserProfile;

        const fetchAndListen = async () => {
            try {
                const usersQuery = query(collection(db, 'newusers'), limit(10));
                const usersSnapshot = await getDocs(usersQuery);
                const discoverUsers = usersSnapshot.docs
                    .filter(doc => doc.id !== currentUserId)
                    .map(doc => ({ id: doc.id, type: 'user', ...doc.data() }));

                const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
                unsubscribePosts = onSnapshot(postsQuery, (querySnapshot) => {
                    const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, type: 'post', ...doc.data() }));
                    
                    const combinedFeed = [...postsData];
                    if (discoverUsers.length > 0) {
                        const insertIndex = Math.min(Math.floor(Math.random() * 5) + 3, postsData.length);
                        combinedFeed.splice(insertIndex, 0, { id: 'discover-section', type: 'discover', users: discoverUsers });
                    }
                    setFeedData(combinedFeed);
                }, (error) => {
                    console.error("Error listening to posts:", error);
                    Alert.alert("Error", "Failed to load posts.");
                });

                const userRef = doc(db, 'newusers', currentUserId);
                unsubscribeUserProfile = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        setUserProfilePicture(userData.profilePictureUrl || null);
                        setCurrentUserFollows(userData.following || []);
                    }
                }, (error) => {
                    console.error("Error listening to user profile:", error);
                });

            } catch (error) {
                console.error("Error fetching initial data: ", error);
                Alert.alert("Error", "Failed to load data.");
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        fetchAndListen();

        return () => {
            if (unsubscribePosts) {
                unsubscribePosts();
            }
            if (unsubscribeUserProfile) {
                unsubscribeUserProfile();
            }
        };
    }, [currentUserId]);

    const handleFollow = async (userId, isCurrentlyFollowing) => {
        // Unchanged handleFollow logic
    };

    const renderFeedItem = ({ item }) => {
        if (item.type === 'post') {
            return <PostComponent post={item} />;
        } else if (item.type === 'discover') {
            return (
                <View style={styles.discoverContainer}>
                    <Text style={styles.discoverTitle}>Discover People</Text>
                    <FlatList
                        data={item.users}
                        keyExtractor={(user) => user.id}
                        renderItem={({ item: userItem }) => (
                            <DiscoverPeopleCard
                                user={userItem}
                                isFollowing={currentUserFollows.includes(userItem.id)}
                                onFollowToggle={() => handleFollow(userItem.id, currentUserFollows.includes(userItem.id))}
                                onPress={() => router.push({ pathname: '/subPages/OtherUserProfileScreen', params: { userId: userItem.id } })}
                            />
                        )}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={(width - 50) / 2 + 10}
                        decelerationRate="fast"
                        onScroll={event => {
                            const slide = Math.round(event.nativeEvent.contentOffset.x / ((width - 50) / 2 + 10));
                            setActiveSlide(slide);
                        }}
                        contentContainerStyle={{ paddingHorizontal: 10 }}
                    />
                    <View style={styles.paginationDots}>
                        {item.users.slice(0, Math.ceil(item.users.length / 2)).map((_, dotIndex) => (
                            <View
                                key={dotIndex}
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor: activeSlide === dotIndex ? '#30706D' : '#D3D3D3',
                                    },
                                ]}
                            />
                        ))}
                    </View>
                </View>
            );
        }
        return null;
    };

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            router.replace('/auth/login');
                        } catch (error) {
                            console.error("Error logging out:", error);
                            Alert.alert("Logout Error", "Failed to log out. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#3F7D58" style={{ marginTop: 20 }} />
            </View>
        );
    }
    
    return (
        <View style={styles.container}>
            <View style={styles.fixedHeaderSection}>
                <View style={styles.header}>
                    <Ionicons name="location-sharp" size={30} color="#3F7D58" />
                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={handleLogout}>
                            <Ionicons name="exit-outline" size={26} color="#000" />
                        </TouchableOpacity>
                    </View>
                </View>
                <TouchableOpacity style={styles.searchContainer} onPress={() => router.push('../subPages/SearchScreen')}>
                    <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                    <Text style={styles.searchPlaceholder}>Search for Spots, People</Text>
                </TouchableOpacity>
            </View>

            {/* The PanGestureHandler is now the main gesture on the collapsible view */}
            <PanGestureHandler onGestureEvent={panGesture} >
                <Animated.View style={[styles.collapsibleContainer, animatedContainerStyle, { position: 'absolute', top: STATIC_HEADER_HEIGHT, width: '100%', zIndex: 1 }]}>
                    <View style={styles.planTripContainer}>
                        {/* The TouchableOpacity components now have a higher zIndex to be on top of the gesture handler */}
                        <TouchableOpacity >
                            <JoinMeCard onPress={handleJoinMePress} style={{ zIndex: 2 }} userProfilePicture={userProfilePicture} />
                        </TouchableOpacity>
                        <View style={styles.spotsNearMeCard}>
                            <Text style={styles.spotsNearMeText}>Spots near me</Text>
                            <TouchableOpacity style={[styles.mapButton, { zIndex: 2 }]} onPress={handleMapPress}>
                                <Text style={styles.mapButtonText}>Map</Text>
                                <Ionicons name="location-outline" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.collapseButton} onPress={handleToggleCollapse}>
                        <Animated.View style={animatedArrowStyle}>
                            <Ionicons name="chevron-down" size={24} color="#555" />
                        </Animated.View>
                    </TouchableOpacity>
                </Animated.View>
            </PanGestureHandler>

            <Animated.FlatList
                ref={flatListRef}
                data={feedData}
                keyExtractor={(item, index) => item.id + index}
                renderItem={renderFeedItem}
                showsVerticalScrollIndicator={false}
                style={styles.feedList}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingTop: STATIC_HEADER_HEIGHT + (isCollapsed ? 0 : COLLAPSIBLE_SECTION_HEIGHT) }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    fixedHeaderSection: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: '#F5F5F5',
        paddingBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: width * 0.05,
        paddingTop: height * 0.06,
        paddingBottom: height * 0.025,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0E0E0',
        borderRadius: width * 0.025,
        marginHorizontal: width * 0.05,
        paddingHorizontal: width * 0.04,
        paddingVertical: height * 0.012,
        marginBottom: height * 0.025,
    },
    searchIcon: {
        marginRight: width * 0.025,
    },
    searchPlaceholder: {
        fontSize: width * 0.04,
        color: '#888',
    },
    collapsibleContainer: {
        overflow: 'hidden',
    },
    planTripContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: width * 0.05,
        paddingVertical: width * 0.08,
    },
    spotsNearMeCard: {
        backgroundColor: '#30706D',
        borderRadius: width * 0.04,
        padding: width * 0.04,
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        marginLeft: width * 0.010,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: height * 0.002 },
        shadowOpacity: 0.1,
        shadowRadius: width * 0.01,
        elevation: 3,
    },
    spotsNearMeText: {
        color: '#fff',
        fontSize: width * 0.04,
        fontWeight: 'bold',
        marginBottom: height * 0.01,
    },
    mapButton: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: width * 0.03,
        paddingVertical: height * 0.008,
        borderRadius: width * 0.05,
        alignItems: 'center',
    },
    mapButtonText: {
        color: '#fff',
        fontSize: width * 0.032,
        fontWeight: 'bold',
        marginRight: width * 0.012,
    },
    collapseButton: {
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
    },
    feedList: {
        flex: 1,
    },
    discoverContainer: {
        paddingVertical: height * 0.025,
        backgroundColor: '#F5F5F5',
    },
    discoverTitle: {
        fontSize: width * 0.045,
        fontWeight: 'bold',
        marginBottom: height * 0.012,
        paddingHorizontal: width * 0.05,
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: height * 0.012,
    },
    dot: {
        height: height * 0.01,
        width: height * 0.01,
        borderRadius: (height * 0.01) / 2,
        marginHorizontal: width * 0.01,
    },
});

export default HomePage;