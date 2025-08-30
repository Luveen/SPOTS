import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CustomButton = ({ title, onPress, type, icon, color }) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        type === 'google' && styles.googleButton,
        type === 'primary' && styles.primaryButton,
        { backgroundColor: color || (type === 'primary' ? '#0D3331' : null) } // <-- Apply custom color here, with a fallback
      ]}
      onPress={onPress}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    width: '100%',
    paddingHorizontal: 30,
    borderRadius: 5,
    marginVertical: 40,
  },
  primaryButton: {
    backgroundColor: '#C5DDCF',
  },
  googleButton: {
    // You can define a specific style for your google button here if needed
  },
  buttonText: {
    color: '#FFFFFF', // White text color
    fontSize: 17,
    fontWeight: 'bold',
  },
  iconContainer: {
    marginRight: 18, // Add spacing between the icon and the text
  },
});

export default CustomButton;