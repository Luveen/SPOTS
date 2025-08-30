// TripCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Changed from Feather to Ionicons

const TripCard = ({ title, organizer, location, date, budget, description }) => {
  return (
    <View style={styles.cardContainer}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.organizer}>Organized by: {organizer}</Text>
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          {/* Changed Icon */}
          <Ionicons name="location-outline" size={18} color="#3F7D58" />
          <Text style={styles.detailText}>{location}</Text>
        </View>
        <View style={styles.detailItem}>
          {/* Changed Icon */}
          <Ionicons name="calendar-outline" size={18} color="#3F7D58" />
          <Text style={styles.detailText}>{date}</Text>
        </View>
        <View style={styles.detailItem}>
          {/* Changed Icon */}
          <Ionicons name="cash-outline" size={18} color="#3F7D58" />
          <Text style={styles.detailText}>Budget: {budget}</Text>
        </View>
      </View>

      <Text style={styles.description}>{description}</Text>

      <TouchableOpacity style={styles.joinButton}>
        <Text style={styles.joinButtonText}>Join Trip</Text>
      </TouchableOpacity>
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
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


export default TripCard;