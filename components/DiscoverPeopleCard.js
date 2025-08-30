// components/DiscoverPeopleCard.js
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const DiscoverPeopleCard = ({ user, onPress }) => {
    return (
        <View>
        <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
            <View style={styles.innerCard}>
                <Image
                    source={{ uri: user.profilePictureUrl || 'https://via.placeholder.com/150' }}
                    style={styles.profileImage}
                />
                <Text style={styles.username}>{user.username}</Text>
                <Text style={styles.userbio}>{user.userbio || 'Explorer'}</Text>
                <TouchableOpacity style={styles.followButton}>
                    <Text style={styles.followButtonText}>Follow</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        width: (width - 60) / 2, // 2 cards per view with margin (20px left, 20px right, 10px between)
        marginHorizontal: 5, // half of the gap between cards
        marginVertical: 5,
    },
    innerCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#ddd',
        marginBottom: 10,
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
    },
    userbio: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
        marginBottom: 10,
    },
    followButton: {
        backgroundColor: '#30706D',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 5,
    },
    followButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default DiscoverPeopleCard;