import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
    TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
    SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, getDoc, doc
} from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { addNotification } from '../tabs/notification';

const CommentItem = ({ comment, fromUser }) => {
    return (
        <View style={styles.commentItem}>
            <Image
                source={fromUser?.profilePictureUrl ? { uri: fromUser.profilePictureUrl } : require('../../assets/blank-profile-picture.webp')}
                style={styles.profilePicture}
            />
            <View style={styles.commentContent}>
                <Text style={styles.commentText}>
                    <Text style={styles.username}>{fromUser?.username || 'User'}</Text> {comment.text}
                </Text>
            </View>
        </View>
    );
};

const CommentScreen = () => {
    const { postId, postCreatorId } = useLocalSearchParams();
    const router = useRouter();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [usersMap, setUsersMap] = useState({});
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        if (!postId) {
            setLoading(false);
            return;
        }

        const commentsRef = collection(db, 'posts', postId, 'comments');
        const q = query(commentsRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            setLoading(true);
            const commentsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Fetch user data for all comments
            const userPromises = commentsData.map(comment => {
                if (!usersMap[comment.userId]) {
                    return fetchUser(comment.userId);
                }
                return Promise.resolve(usersMap[comment.userId]);
            });

            const fetchedUsers = await Promise.all(userPromises);
            const newUsersMap = { ...usersMap };
            fetchedUsers.forEach(user => {
                if (user) {
                    newUsersMap[user.id] = user;
                }
            });
            setUsersMap(newUsersMap);
            setComments(commentsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching comments:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [postId]);

    const fetchUser = async (userId) => {
        if (!userId) return null;
        const userRef = doc(db, 'newusers', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return { id: userSnap.id, ...userSnap.data() };
        }
        return null;
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !currentUserId || !postId) return;

        try {
            const commentsRef = collection(db, 'posts', postId, 'comments');
            await addDoc(commentsRef, {
                userId: currentUserId,
                text: newComment.trim(),
                timestamp: serverTimestamp(),
            });

            setNewComment(''); // Clear input after submitting

            // Send a notification to the post creator if it's not the current user
            if (postCreatorId && postCreatorId !== currentUserId) {
                // CORRECTED: Call addNotification with separate parameters
                await addNotification(postCreatorId, currentUserId, 'comment', postId, newComment.trim());
            }

        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Comments</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#30706D" />
                </View>
            ) : (
                <FlatList
                    data={comments}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <CommentItem comment={item} fromUser={usersMap[item.userId]} />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubble-outline" size={50} color="#ccc" />
                            <Text style={styles.emptyText}>No comments yet.</Text>
                        </View>
                    }
                />
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inputContainer}
            >
                <TextInput
                    style={styles.input}
                    placeholder="Add a comment..."
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholderTextColor="#999"
                    multiline
                />
                <TouchableOpacity onPress={handleAddComment} style={styles.sendButton}>
                    <Ionicons name="send" size={24} color="#fff" />
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#fff',
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingVertical: 10,
    },
    commentItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    profilePicture: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        marginRight: 10,
    },
    commentContent: {
        flex: 1,
    },
    commentText: {
        fontSize: 14,
        color: '#333',
        flexWrap: 'wrap',
    },
    username: {
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: '#888',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    input: {
        flex: 1,
        backgroundColor: '#F0F0F0',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        maxHeight: 100,
        fontSize: 16,
    },
    sendButton: {
        backgroundColor: '#3F7D58',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CommentScreen;