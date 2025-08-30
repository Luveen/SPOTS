import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const JoinMeCard = ({ onPress, userProfilePicture }) => {
  return (
    <View style={styles.planTripCard}>
      <Image
        source={userProfilePicture ? { uri: userProfilePicture } : require('../assets/blank-profile-picture.webp')}
        resizeMode="cover"
        style={styles.planTripAvatar}
      />
      <View>
        <Text style={styles.planTripText}>Plan on a Trip</Text>
        <TouchableOpacity onPress={onPress} style={styles.joinMeButton}>
          <Text style={styles.joinMeButtonText}>Join me </Text>
          <Ionicons name="map-outline" size={18} color="#fff" style={styles.joinMeIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  planTripCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planTripAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },
  planTripText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  joinMeButton: {
    flexDirection: 'row',
    backgroundColor: '#30706D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  joinMeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 5,
  },
  joinMeIcon: {
    marginLeft: 3,
  },
});

export default JoinMeCard;