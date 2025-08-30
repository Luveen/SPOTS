import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, FlatList, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db, auth } from '../firebaseConfig';
import { doc, collection, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { addNotification } from '././../app/tabs/notification';

const { width } = Dimensions.get('window');

// Helper function to format the date
const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
};

const PostComponent = ({ post }) => {
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [commentsCount, setCommentsCount] = useState(0);
    const [loadingLikes, setLoadingLikes] = useState(true);
    const [loadingComments, setLoadingComments] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    const router = useRouter();
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        if (!post?.id) return;

        const likesRef = collection(db, 'posts', post.id, 'likes');
        const unsubscribeLikes = onSnapshot(likesRef, (snapshot) => {
            const likedBy = snapshot.docs.map(doc => doc.id);
            // This is the fallback to ensure consistency with the database
            setLikesCount(likedBy.length);
            setIsLiked(likedBy.includes(currentUserId));
            setLoadingLikes(false);
        });

        const commentsRef = collection(db, 'posts', post.id, 'comments');
        const unsubscribeComments = onSnapshot(commentsRef, (snapshot) => {
            setCommentsCount(snapshot.size);
            setLoadingComments(false);
        });

        return () => {
            unsubscribeLikes();
            unsubscribeComments();
        };
    }, [post?.id, currentUserId]);

    const handleLike = async () => {
        if (!currentUserId || !post?.id) return;
    
        const likeRef = doc(db, 'posts', post.id, 'likes', currentUserId);
        const newIsLikedState = !isLiked;
        const newLikesCount = isLiked ? likesCount - 1 : likesCount + 1;
    
        // Optimistically update the UI
        setIsLiked(newIsLikedState);
        setLikesCount(newLikesCount);
    
        try {
            if (isLiked) {
                // If currently liked, delete the like document
                await deleteDoc(likeRef);
            } else {
                // If not liked, add a new like document
                await setDoc(likeRef, {
                    userId: currentUserId,
                    timestamp: serverTimestamp(),
                });
                if (post.userId !== currentUserId) {
                    await addNotification(post.userId, currentUserId, 'like', post.id);
                }
            }
        } catch (error) {
            console.error("Error liking/unliking post:", error);
            // Revert state on error
            setIsLiked(!newIsLikedState);
            setLikesCount(!newIsLikedState ? likesCount + 1 : likesCount - 1);
        }
    };

    const handleCommentPress = () => {
        if (post?.id) {
            router.push({
                pathname: '/subPages/CommentScreen',
                params: { postId: post.id, postCreatorId: post.userId }
            });
        }
    };

    const handleProfilePress = () => {
        if (!post?.userId) return;
        if (post.userId === currentUserId) {
            router.push('../tabs/profile');
        } else {
            router.push({
                pathname: '../subPages/OtherUserProfileScreen',
                params: { userId: post.userId }
            });
        }
    };

    const handleScroll = (event) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(contentOffsetX / (width - 40));
        setActiveIndex(newIndex);
    };

    const allStopPhotos = post?.stops ? post.stops.flatMap(stop => stop.photos) : [];

    if (!post || !post.tripTitle) {
        return <ActivityIndicator size="large" color="#3F7D58" />;
    }
    
    // Get the tags for the currently active stop
    const activeStop = post.stops && post.stops[activeIndex] ? post.stops[activeIndex] : null;
    const activeTags = activeStop?.categories || [];

    return (
        <View style={styles.postCard}>
            {/* User Info Header */}
            <View style={styles.postHeader}>
                <TouchableOpacity onPress={handleProfilePress} style={styles.profileContainer}>
                    <Image
                        source={post.profilePictureUrl ? { uri: post.profilePictureUrl } : require('../assets/blank-profile-picture.webp')}
                        style={styles.profileAvatar}
                    />
                    <View>
                        <Text style={styles.username}>{post.username || 'User'}</Text>
                        <Text style={styles.tripInfoDate}>
                            {formatDate(post.startDate)} - {formatDate(post.endDate)}
                        </Text>
                    </View>
                </TouchableOpacity>
                {/* KM Badge */}
                {post.totalKm !== undefined && (
                    <View style={styles.kmBadge}>
                        <Text style={styles.kmText}>KM {Math.round(post.totalKm)}</Text>
                    </View>
                )}
            </View>

            {/* Trip Details Section */}
            <View style={styles.tripDetailsContainer}>
                <Text style={styles.tripTitle}>{post.tripTitle} </Text>
                <View style={styles.tripInfoRow}>
                    <Ionicons name="location-outline" size={16} color="#333" />
                    <Text style={styles.tripInfoText}>{post.startLocation?.name} ➡️ {post.endLocation?.name}</Text>
                </View>
            </View>

            {/* Horizontal image carousel for the stop photos */}
            {allStopPhotos.length > 0 && (
                <View style={styles.imageGalleryWrapper}>
                    <FlatList
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        data={allStopPhotos}
                        keyExtractor={(item, index) => item + index}
                        renderItem={({ item }) => (
                            <Image
                                source={{ uri: item }}
                                style={styles.postImage}
                                resizeMode='cover'
                            />
                        )}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    />
                    {/* Dot indicators */}
                    {allStopPhotos.length > 1 && (
                        <View style={styles.dotContainer}>
                            {allStopPhotos.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        { backgroundColor: index === activeIndex ? '#3F7D58' : '#ccc' },
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* Stop details */}
            {post.stops && post.stops.length > 0 && (
                <View style={styles.stopDetailsContainer}>
                    <View style={styles.stopInfoRow}>
                        <Ionicons name="location-outline" size={18} color="#333" />
                        <Text 
                            style={styles.stopName}
                            numberOfLines={2} 
                        >
                            {post.stops[activeIndex]?.stopName}, {post.stops[activeIndex]?.location?.name}
                        </Text>
                    </View>
                    <Text 
                        style={styles.stopDescription}
                        numberOfLines={2} 
                    >
                        {post.stops[activeIndex]?.description}
                    </Text>
                </View>
            )}

            {/* Categories as 'Spots' */}
            {activeTags.length > 0 && (
                <View style={styles.spotTagsContainer}>
                    <Text style={styles.spotsLabel}>Spots</Text>
                    <FlatList
                        horizontal
                        data={activeTags}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <View style={styles.spotTag}>
                                <Text style={styles.spotTagText}>{item}</Text>
                            </View>
                        )}
                        showsHorizontalScrollIndicator={false}
                    />
                </View>
            )}
            
            {/* Post Actions */}
            <View style={styles.postActions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                    {loadingLikes ? (
                        <ActivityIndicator size="small" color="#333" />
                    ) : (
                        <>
                            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#E21818" : "#333"} />
                            <Text style={styles.actionText}>{likesCount}</Text>
                        </>
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleCommentPress}>
                    {loadingComments ? (
                        <ActivityIndicator size="small" color="#333" />
                    ) : (
                        <>
                            <Ionicons name="chatbubble-outline" size={24} color="#333" />
                            <Text style={styles.actionText}>{commentsCount}</Text>
                        </>
                    )}
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    postCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    username: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    tripInfoDate: {
        fontSize: 14,
        color: '#888',
    },
    kmBadge: {
        backgroundColor: '#E0E0E0',
        borderRadius: 15,
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    kmText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#555',
    },
    tripDetailsContainer: {
        marginBottom: 10,
    },
    tripTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    tripInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3,
    },
    tripInfoText: {
        fontSize: 14,
        color: '#555',
        marginLeft: 5,
    },
    spotTagsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    spotsLabel: {
        fontWeight: 'bold',
        fontSize: 15,
        marginRight: 10,
    },
    spotTag: {
        backgroundColor: '#E6F0E6',
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 12,
        marginRight: 8,
    },
    spotTagText: {
        fontSize: 12,
        color: '#3F7D58',
    },
    imageGalleryWrapper: {
        height: width - 100,
        width: "100%",
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 15,
    },
    postImage: {
        width: width - 80,
        height: '100%',
        resizeMode: 'cover',
    },
    dotContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        position: 'absolute',
        bottom: 10,
        zIndex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingVertical: 5,
        borderRadius: 20,
        marginHorizontal: 140,
        paddingTop: 5,
        paddingBottom: 5,
        paddingHorizontal: 10,
        shadowColor: '#000',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    stopDetailsContainer: {
        padding: 5,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    stopInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stopName: {
        fontSize: 15,
        color: '#444',
        paddingBottom: 5,
        paddingTop: 2,
        paddingLeft: 12,
    },
    stopDescription: {
        fontSize: 14,
        color: '#444',
        paddingLeft: 30,
        height: 40,
    },
    postActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    actionText: {
        marginLeft: 5,
        fontSize: 14,
        color: '#333',
    },
});

export default PostComponent;