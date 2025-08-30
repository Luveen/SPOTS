// screens/ProfileScreen.js
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Image, StyleSheet, Text, View, Dimensions,
    SafeAreaView, TouchableOpacity,
} from 'react-native';
import { doc, onSnapshot, collection, query, where, getAggregateFromServer, sum, count } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
    GestureHandlerRootView,
    PanGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedGestureHandler,
    withSpring,
    withTiming,
    runOnJS,
    interpolateColor,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
    const router = useRouter();
    const [profileData, setProfileData] = useState({
        username: '',
        bio: '',
        profilePictureUrl: null,
        posts: 0,
        km: 0,
    });
    const [userPosts, setUserPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [postCount, setPostCount] = useState(0);
    const [followersCount, setFollowersCount] = useState(0);
    const [totalKm, setTotalKm] = useState(0); 
    const [spotsVisited, setSpotsVisited] = useState(0);

    const translateY = useSharedValue(0);
    const rotate = useSharedValue(0);
    const scale = useSharedValue(1);
    const contentOpacity = useSharedValue(1);
    const backgroundProgress = useSharedValue(0);

    const handlePostPress = (post) => {
        const postWithProfilePic = { ...post, profilePictureUrl: profileData.profilePictureUrl };
        router.push({
            pathname: '/subPages/PostViewScreen',
            params: { post: JSON.stringify(postWithProfilePic) },
        });
    };

    const onGestureEvent = useAnimatedGestureHandler({
        onStart: (_, ctx) => {
            ctx.startY = translateY.value;
        },
        onActive: (event, ctx) => {
            if (event.translationY > 0) {
                translateY.value = ctx.startY + event.translationY;
                rotate.value = withTiming(event.translationY * 0.5, { duration: 100 });
                scale.value = withTiming(1 + event.translationY / 500, { duration: 100 });
                backgroundProgress.value = withTiming(Math.min(event.translationY / 200, 1), { duration: 100 });
                contentOpacity.value = withTiming(Math.max(1 - event.translationY / 200, 0), { duration: 100 });
            }
        },
        onEnd: (event) => {
            if (event.translationY > 100) {
                runOnJS(router.push)('../subPages/Profile2ndview');
            }
            translateY.value = withSpring(0);
            rotate.value = withTiming(0, { duration: 300 });
            scale.value = withTiming(1, { duration: 300 });
            backgroundProgress.value = withTiming(0, { duration: 300 });
            contentOpacity.value = withTiming(1, { duration: 300 });
        },
    });

    const animatedProfileImageStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: translateY.value },
                { rotate: `${rotate.value}deg` },
                { scale: scale.value },
            ],
        };
    });

    const animatedCurveStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: translateY.value * 0.5 },
                { scaleX: 1.5 },
            ],
        };
    });

    const animatedScreenBackgroundStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            backgroundProgress.value,
            [0, 1],
            ['#fff', '#30706D']
        );
        return {
            backgroundColor: backgroundColor,
        };
    });

    const animatedContentStyle = useAnimatedStyle(() => {
        return {
            opacity: contentOpacity.value,
        };
    });

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            router.replace('/login');
            return;
        }

        const userDocRef = doc(db, 'newusers', user.uid);
        let unsubscribePosts;
        let unsubscribeUser;

        const fetchUserProfileAndStats = async () => {
            // Fetch user profile data
            unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProfileData({
                        username: data.Name || 'User',
                        bio: data.userbio || 'Explorer since...',
                        profilePictureUrl: data.profilePictureUrl || null,
                        posts: data.posts || 0,
                        km: data.km || 0,
                    });
                    setFollowersCount(data.followers?.length || 0);
                } else {
                    console.error("User profile not found.");
                }
            }, (error) => {
                console.error("Error fetching user profile: ", error);
            });
            // Fetch trip stats
            const tripsRef = collection(db, 'tripDiaries');
            const userTripsQuery = query(tripsRef, where('userId', '==', user.uid));
            try {
                const snapshot = await getAggregateFromServer(userTripsQuery, {
                    totalKmSum: sum('totalKm'),
                    spotsCount: count(),
                });
            
                // Ensure the returned values are treated as numbers

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

        const setupPostsListener = () => {
            const postsRef = collection(db, 'posts');
            const q = query(postsRef, where('userId', '==', user.uid));

            unsubscribePosts = onSnapshot(q, (querySnapshot) => {
                const postsList = [];
                querySnapshot.forEach(doc => {
                    const postData = doc.data();
                    if (postData.coverImage) {
                        postsList.push({ id: doc.id, ...postData });
                    }
                });

                setUserPosts(postsList);
                setPostCount(postsList.length);
                setPostsLoading(false);
            }, (error) => {
                console.error("Error setting up posts listener: ", error);
                setPostsLoading(false);
            });

            return unsubscribePosts;
        };

        fetchUserProfileAndStats();
        setupPostsListener();

        return () => {
            if (unsubscribeUser) unsubscribeUser();
            if (unsubscribePosts) unsubscribePosts();
        };
    }, [auth.currentUser]);

    const PostGrid = ({ posts }) => (
        <View style={styles.postGrid}>
            {posts.map((post) => {
                if (!post || !post.coverImage) {
                    return null;
                }

                const hasMultipleStops = post.stops && Object.keys(post.stops).length > 1;

                return (
                    <TouchableOpacity
                        key={post.id}
                        style={styles.postImageContainer}
                        onPress={() => handlePostPress(post)}
                    >
                        <Image
                            source={{ uri: post.coverImage }}
                            style={styles.postImage}
                        />
                        {hasMultipleStops && (
                            <View style={styles.multiImageOverlay}>
                                <Ionicons name="copy-outline" size={16} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Animated.View style={[styles.container, animatedScreenBackgroundStyle]}>
                <Animated.ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <View style={styles.headerContainer}>
                        <Animated.View style={[styles.curveBackground, animatedCurveStyle]} />
                        <View style={styles.profileInfoContainer}>
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statCount}>{postCount}</Text>
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
                            <PanGestureHandler onGestureEvent={onGestureEvent}>
                                <Animated.View style={[styles.profileImageContainer, animatedProfileImageStyle]}>
                                    <Image
                                        source={
                                            profileData.profilePictureUrl
                                                ? { uri: profileData.profilePictureUrl }
                                                : require('../../assets/blank-profile-picture.webp')
                                        }
                                        style={styles.profileImage}
                                    />
                                </Animated.View>
                            </PanGestureHandler>
                        </View>
                    </View>
                    <Animated.View style={[styles.detailsContainer, animatedContentStyle]}>
                        <Text style={styles.username}>{profileData.username}</Text>
                        <Text style={styles.bio}>{profileData.bio}</Text>
                        <View style={styles.actionsContainer}>
                            <TouchableOpacity style={styles.editProfileButton} onPress={() => router.push('../subPages/AccountSettings')}>
                                <Text style={styles.editProfileButtonText}>Edit Profile</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                    {postsLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#30706D" />
                        </View>
                    ) : userPosts.length > 0 ? (
                        <Animated.View style={[animatedContentStyle]}>
                            <PostGrid posts={userPosts} />
                        </Animated.View>
                    ) : (
                        <Animated.View style={[styles.noPostsContainer, animatedContentStyle]}>
                            <Text style={styles.noPostsText}>No Posts Yet</Text>
                            <Text style={styles.noPostsSubtext}>Share your adventures to see them here.</Text>
                        </Animated.View>
                    )}
                </Animated.ScrollView>
            </Animated.View>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    headerContainer: {
        backgroundColor: '#fff',
        paddingBottom: 10,
    },
    curveBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 200,
        backgroundColor: '#30706D',
        borderBottomLeftRadius: width * 0.5,
        borderBottomRightRadius: width * 0.5,
        transform: [{ scaleX: 1.8 }],
    },
    profileInfoContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 20,
    },
    statItem: {
        alignItems: 'center',
        padding: 10,
    },
    statCount: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 14,
        color: '#fff',
        marginTop: 4,
    },
    profileImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginTop: 15,
        borderWidth: 4,
        borderColor: '#fff',
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    detailsContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    bio: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
        textAlign: 'center',
    },
    actionsContainer: {
        flexDirection: 'row',
        marginTop: 20,
        justifyContent: 'center',
        width: '100%',
    },
    editProfileButton: {
        backgroundColor: '#fff',
        borderColor: '#30706D',
        borderWidth: 1,
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 30,
        flex: 1,
        marginHorizontal: 50,
        alignItems: 'center',
    },
    editProfileButtonText: {
        color: '#30706D',
        fontSize: 16,
        fontWeight: 'bold',
    },
    postGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingBottom: 20,
        justifyContent:'space-around',
        justifyContent: 'flex-start',
        paddingHorizontal: 10,
        marginTop: 20,
    },
    postImageContainer: {
        width: '33%',
        aspectRatio: 1,
        marginBottom: 5,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        
      
    },
    postImage: {
        width: '100%',
        height: '100%',
    },
    multiImageOverlay: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 3,
        borderRadius: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    noPostsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
    },
    noPostsText: {
        fontSize: 18,
        color: '#666',
        fontWeight: 'bold',
    },
    noPostsSubtext: {
        fontSize: 14,
        color: '#888',
        marginTop: 5,
    },
});

export default ProfileScreen;