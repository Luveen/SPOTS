import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const InputField = ({ art, placeholder, value, onChangeText, keyboardType = 'default', secureTextEntry = false }) => {
  return (
    <View style={styles.inputContainer}>
      {art && <View style={styles.iconContainer}>{art}</View>} {/* Render the icon */}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row', // Align icon and input horizontally
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
    width: 320,
  },
  input: {
    flex: 1, // Take up remaining space
    fontSize: 16,
    paddingVertical: 10,
  },
  iconContainer: {
    marginRight: 10, // Add spacing between the icon and the text input
  },
});

export default InputField;