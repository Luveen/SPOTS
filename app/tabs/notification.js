import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    collection, query, onSnapshot, orderBy, doc, updateDoc, addDoc, serverTimestamp, getDoc
} from 'firebase/firestore';

import { auth, db } from '../../firebaseConfig';

// Export the function so it can be used in other files (like main.js)
// Updated to accept individual parameters
export const addNotification = async (recipientId, senderId, type, postId, commentText = null) => {
    if (!recipientId || !senderId || !type) {
        console.error("Missing required fields for notification.");
        return;
    }
    
    try {
        const senderRef = doc(db, 'newusers', senderId);
        const senderSnap = await getDoc(senderRef);
        
        if (!senderSnap.exists()) {
            console.error("From user not found for notification.");
            return;
        }
    
        const senderData = senderSnap.data();
        
        const notificationsRef = collection(db, 'newusers', recipientId, 'notifications');
        
        await addDoc(notificationsRef, {
            from: senderId,
            // The message is constructed here for the notification list
            message: `${senderData.username || 'A user'} commented on your post: "${commentText}"`, 
            type: type,
            isRead: false,
            timestamp: serverTimestamp(),
            relatedPostId: postId || null,
            commentText: commentText, // We now save the comment text in the notification
        });
    
    } catch (error) {
        console.error("Error adding notification:", error);
    }
};

const NotificationItem = ({ notification, onPress }) => {
    const { type, fromUser, trip, isRead, commentText } = notification;

    let icon;
    let mainMessage;
    let extraDetail = '';

    const username = fromUser?.username || 'User';
    const profilePictureUri = fromUser?.profilePictureUrl ? { uri: fromUser.profilePictureUrl } : require('../../assets/blank-profile-picture.webp');

    switch (type) {
        case 'follow':
            mainMessage = 'started following you.';
            icon = <Ionicons name="person-add-outline" size={24} color="#30706D" />;
            break;
        case 'like':
            mainMessage = 'liked your post.';
            icon = <Ionicons name="heart" size={24} color="#E21818" />;
            break;
        case 'comment':
            mainMessage = 'commented on your post:';
            extraDetail = `"${commentText}"`;
            icon = <Ionicons name="chatbubble-ellipses-outline" size={24} color="#30706D" />;
            break;
        case 'join_me_trip':
            mainMessage = 'created a new trip:';
            extraDetail = `"${trip?.title}"`;
            icon = <Ionicons name="map-outline" size={24} color="#30706D" />;
            break;
        default:
            mainMessage = 'sent you a notification.';
            icon = <Ionicons name="notifications-outline" size={24} color="#333" />;
            break;
    }

    return (
        <View>
            <TouchableOpacity style={[styles.notificationItem, !isRead && styles.unreadNotification]} onPress={onPress}>
                {!isRead && <View style={styles.unreadDot} />}
                <Image
                    source={profilePictureUri}
                    style={styles.profilePicture}
                />
                <View style={styles.notificationContent}>
                    <Text style={styles.notificationText}>
                        <Text style={{ fontWeight: 'bold' }}>{username} </Text>
                        {mainMessage}
                        {extraDetail && (
                            <Text style={{ fontStyle: 'italic', color: '#666' }}> {extraDetail}</Text>
                        )}
                    </Text>
                </View>
                <View style={styles.actionIcon}>
                    {icon}
                </View>
            </TouchableOpacity>
        </View>
    );
};

// This helper function is needed for the main component
const getFromUser = async (userId) => {
    if (!userId) return null;
    const userRef = doc(db, 'newusers', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
    }
    return null;
};


const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        if (!currentUserId) {
            setLoading(false);
            return;
        }

        const notificationsRef = collection(db, 'newusers', currentUserId, 'notifications');
        const q = query(notificationsRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const notificationsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // If there are no notifications, set the state and stop loading
            if (notificationsData.length === 0) {
                setNotifications([]);
                setLoading(false);
                return;
            }

            // Fetch user data for all notifications concurrently
            const userPromises = notificationsData.map(notification => getFromUser(notification.from));

            try {
                const usersData = await Promise.all(userPromises);
                
                // Map the fetched user data back into the notifications
                const notificationsWithUserData = notificationsData.map((notification, index) => {
                    const fromUserData = usersData[index];
                    return {
                        ...notification,
                        fromUser: fromUserData,
                    };
                });
                
                setNotifications(notificationsWithUserData);

            } catch (error) {
                console.error("Error fetching user data for notifications:", error);
                // In case of an error, still show the notifications we have
                // and set loading to false to unblock the UI
                setNotifications(notificationsData);
            } finally {
                setLoading(false); // Make sure loading is always set to false
            }

        }, (error) => {
            console.error("Error fetching notifications: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUserId]);

    const handleNotificationPress = async (notification) => {
        const notificationRef = doc(db, 'newusers', currentUserId, 'notifications', notification.id);
        try {
            await updateDoc(notificationRef, { isRead: true });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }

        switch (notification.type) {
            case 'follow':
                if (notification.fromUser?.id) {
                    router.push({ pathname: '/subPages/OtherUserProfileScreen', params: { userId: notification.fromUser.id } });
                }
                break;
            case 'like':
            case 'comment':
                if (notification.relatedPostId) {
                    router.push({ pathname: '/subPages/PostDetailScreen', params: { postId: notification.relatedPostId } });
                }
                break;
            case 'join_me_trip':
                if (notification.trip?.id) {
                    router.push({ pathname: '/subPages/TripDetailsScreen', params: { tripId: notification.trip.id } });
                }
                break;
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#30706D" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
            </View>
            {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off-outline" size={50} color="#ccc" />
                    <Text style={styles.emptyText}>No notifications yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <NotificationItem
                            notification={item}
                            onPress={() => handleNotificationPress(item)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    listContent: {
        paddingVertical: 10,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    unreadNotification: {
        backgroundColor: '#e6f0f0', // a light background for unread items
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#30706D',
        position: 'absolute',
        left: 5,
    },
    profilePicture: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginHorizontal: 15,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    notificationContent: {
        flex: 1,
        justifyContent: 'center',
    },
    notificationText: {
        fontSize: 15,
        color: '#333',
    },
    actionIcon: {
        marginRight: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: '#888',
    },
});

export default NotificationsPage;