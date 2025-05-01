// screens/subPages/OtherUserProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator, Image, StyleSheet, Text, View, Dimensions,
    ScrollView, SafeAreaView, TouchableOpacity, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const OtherUserProfileScreen = () => {
    const router = useRouter();
    const { userId: otherUserId } = useLocalSearchParams();
    const [profileData, setProfileData] = useState(null);
    const [posts, setPosts] = useState([]);
    const [followers, setFollowers] = useState(0);
    const [postCount, setPostCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);

    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        const fetchUserProfileAndPosts = async () => {
            if (!otherUserId || !currentUserId) {
                setLoading(false);
                Alert.alert("Navigation Error", "User ID not found. Please try again.");
                return;
            }

            setLoading(true);
            setPosts([]); // Ensure posts are cleared before fetching new data

            try {
                const userDocRef = doc(db, 'newusers', otherUserId);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setProfileData({
                        username: data.Name || 'User',
                        bio: data.userbio || 'Explorer since...',
                        profilePictureUrl: data.profilePictureUrl || null,
                        isPrivate: data.isPrivate || false,
                    });

                    const followingRef = doc(db, 'newusers', currentUserId, 'following', otherUserId);
                    const followingDoc = await getDoc(followingRef);
                    setIsFollowing(followingDoc.exists());

                    const followersCollection = collection(db, 'newusers', otherUserId, 'followers');
                    const followersSnapshot = await getDocs(followersCollection);
                    setFollowers(followersSnapshot.size);

                    if (!data.isPrivate || followingDoc.exists()) {
                        const q = query(collection(db, 'posts'), where('userId', '==', otherUserId));
                        const querySnapshot = await getDocs(q);
                        const fetchedPosts = querySnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                        }));
                        setPosts(fetchedPosts);
                        setPostCount(querySnapshot.size);
                    } else {
                        // Keep posts as an empty array
                        setPostCount(0);
                    }
                } else {
                    setProfileData(null);
                    setPosts([]);
                }
            } catch (error) {
                console.error("Error fetching user data: ", error);
                Alert.alert("Error", "Failed to fetch user profile.");
                setProfileData(null);
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        if (otherUserId && currentUserId) {
            fetchUserProfileAndPosts();
        } else {
            setLoading(false);
        }
    }, [otherUserId, currentUserId]);

    const handleFollowToggle = async () => {
        if (!profileData || !currentUserId) return;

        const followingRef = doc(db, 'newusers', currentUserId, 'following', otherUserId);
        const followerRef = doc(db, 'newusers', otherUserId, 'followers', currentUserId);

        try {
            if (isFollowing) {
                await deleteDoc(followingRef);
                await deleteDoc(followerRef);
                setIsFollowing(false);
                setFollowers(prev => prev - 1);
                Alert.alert("Unfollowed", `You have unfollowed ${profileData.username}`);
            } else {
                await setDoc(followingRef, { followingId: otherUserId });
                await setDoc(followerRef, { followerId: currentUserId });
                setIsFollowing(true);
                setFollowers(prev => prev + 1);
                Alert.alert("Followed", `You are now following ${profileData.username}`);
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
            Alert.alert("Error", "Failed to update follow status. Please try again.");
        }
    };

    const handlePostPress = (post) => {
        router.push({
            pathname: '/subPages/PostViewScreen',
            params: { postId: post.id }
        });
    };

    const PostGrid = ({ posts }) => (
        <View style={styles.postGrid}>
            {posts.map((post) => (
                <TouchableOpacity
                    key={post.id}
                    style={styles.postImageContainer}
                    onPress={() => handlePostPress(post)}
                >
                    <Image
                        source={{ uri: post.coverImage }}
                        style={styles.postImage}
                    />
                    {/* Assuming you have a way to determine if a post has multiple images */}
                    {/* For example, if your posts have a field like `imageUrls` and it's an array with more than one item */}
                    {/* {post.imageUrls && post.imageUrls.length > 1 && (
                      <View style={styles.multiImageOverlay}>
                          <Ionicons name="copy-outline" size={16} color="#fff" />
                      </View>
                    )} */}
                </TouchableOpacity>
            ))}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#30706D" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    if (!profileData) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>User not found or data is corrupted.</Text>
            </View>
        );
    }

    const isPrivateAndNotFollowing = profileData.isPrivate && !isFollowing;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.headerContainer}>
                    <View style={styles.curveBackground} />
                    <View style={styles.profileInfoContainer}>
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statCount}>{postCount}</Text>
                                <Text style={styles.statLabel}>Posts</Text>
                            </View>
                            <View style={styles.statItem}>
                                {/* Assuming 'KM' data is available from another source */}
                                <Text style={styles.statCount}>0</Text>
                                <Text style={styles.statLabel}>KM</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statCount}>{followers}</Text>
                                <Text style={styles.statLabel}>Followers</Text>
                            </View>
                        </View>
                        <View style={styles.profileImageContainer}>
                            <Image
                                source={
                                    profileData.profilePictureUrl
                                        ? { uri: profileData.profilePictureUrl }
                                        : require('../../assets/blank-profile-picture.webp')
                                }
                                style={styles.profileImage}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.detailsContainer}>
                    <Text style={styles.username}>{profileData.username}</Text>
                    <Text style={styles.bio}>{profileData.bio}</Text>
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[
                                styles.followButton,
                                isFollowing ? styles.followingButton : styles.unfollowingButton
                            ]}
                            onPress={handleFollowToggle}
                        >
                            <Text style={[styles.followButtonText, isFollowing && { color: '#30706D' }]}>
                                {isFollowing ? "Following" : "Follow"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {isPrivateAndNotFollowing ? (
                    <View style={styles.noPostsContainer}>
                        <Ionicons name="lock-closed" size={50} color="#ccc" />
                        <Text style={styles.noPostsText}>This Account is Private</Text>
                        <Text style={styles.noPostsSubtext}>Follow this account to see their posts.</Text>
                    </View>
                ) : posts.length > 0 ? (
                    <PostGrid posts={posts} />
                ) : (
                    <View style={styles.noPostsContainer}>
                        <Text style={styles.noPostsText}>No Posts Yet</Text>
                        <Text style={styles.noPostsSubtext}>This user has not shared any posts.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 10,
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
        transform: [{ scaleX: 1.5 }],
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1,
    },
    profileInfoContainer: {
        alignItems: 'center',
        marginTop: 20,
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
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 20,
    },
    statItem: {
        alignItems: 'center',
        width: '30%',
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
    detailsContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 20,
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
    followButton: {
        paddingHorizontal: 25,
        paddingVertical: 10,
        borderRadius: 25,
        minWidth: 120,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 50,
    },
    unfollowingButton: {
        backgroundColor: '#30706D',
    },
    followingButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#30706D',
    },
    followButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    postGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    postImageContainer: {
        width: '32%',
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
    noPostsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
        paddingHorizontal: 20,
    },
    noPostsText: {
        fontSize: 18,
        color: '#666',
        fontWeight: 'bold',
        marginTop: 10,
        textAlign: 'center',
    },
    noPostsSubtext: {
        fontSize: 14,
        color: '#888',
        marginTop: 5,
        textAlign: 'center',
    },
});

export default OtherUserProfileScreen;