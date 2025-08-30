import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Logo = () => {
  return (
    <View style={styles.logoContainer}>
      <MaterialCommunityIcons name="map-marker-outline" size={80} color="#30706D" />
      <Text style={styles.logoText}>SPOTS</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 80, // Adjust as needed
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333333',
    letterSpacing: 4, // To mimic the spacing in your design
  },
});

export default Logo;