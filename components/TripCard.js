import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TripCard = ({ id, title, organizer, location, date, budget, description, onJoin, isJoining, isJoined }) => {
    const [daysLeft, setDaysLeft] = useState(null);

    useEffect(() => {
        // Ensure that both the user has joined and the date exists before trying to calculate
        if (isJoined && date && typeof date === 'string') {
            const parts = date.split(' ');
            if (parts.length >= 3) {
                const [month, day, year] = parts;
                const monthMap = { 
                    'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
                    'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
                };
                
                // Remove the comma from the day part
                const cleanDay = parseInt(day.replace(',', ''), 10);
                
                const tripDate = new Date(year, monthMap[month], cleanDay);
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const timeDifference = tripDate.getTime() - today.getTime();
                const remainingDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

                setDaysLeft(remainingDays >= 0 ? remainingDays : 0);
            } else {
                setDaysLeft(null); // Clear the countdown if the date format is incorrect
            }
        }
    }, [isJoined, date]);

    const renderJoinButton = () => {
        if (isJoined) {
            return (
                <View style={[styles.joinButton, styles.joinedButton]}>
                    <Text style={styles.joinedText}>
                        Joined: {daysLeft !== null ? `${daysLeft} days left` : ''}
                    </Text>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginLeft: 5 }} />
                </View>
            );
        }

        if (isJoining) {
            return (
                <View style={[styles.joinButton, { backgroundColor: '#5A8B7B' }]}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
            );
        }

        return (
            <TouchableOpacity style={styles.joinButton} onPress={() => onJoin(id)}>
                <Text style={styles.joinButtonText}>Join Trip</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.cardContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.organizer}>Organized by: {organizer}</Text>
            
            <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={18} color="#3F7D58" />
                    <Text style={styles.detailText}>{location}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={18} color="#3F7D58" />
                    <Text style={styles.detailText}>{date}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Ionicons name="cash-outline" size={18} color="#3F7D58" />
                    <Text style={styles.detailText}>Budget: {budget}</Text>
                </View>
            </View>
            
            <Text style={styles.description}>{description}</Text>
            
            {renderJoinButton()}
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    organizer: {
        fontSize: 13,
        color: '#777',
        marginTop: 2,
        marginBottom: 15,
    },
    detailsContainer: {
        marginBottom: 15,
        gap: 10,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#555',
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 20,
    },
    joinButton: {
        backgroundColor: '#30706D',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row', // Ensures text and icon are in one row
    },
    joinButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    joinedButton: {
        backgroundColor: '#2E8B57',
        flexDirection: 'row', // Ensures text and icon are in one row
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'nowrap', // Prevents text wrapping
        gap: 5, // Adds spacing between text and icon
    },
    joinedText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    countdownTextSmall: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TripCard;