


// signup.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomButton from '../../components/CustomButton';
import InputField from '../../components/InputField';
import Logo from '../../components/Logo';
import { Ionicons } from '@expo/vector-icons';

// Import Firebase authentication and Firestore functions
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore'; // Import doc and setDoc
import { auth, db } from '../../firebaseConfig'; 

const { width, height } = Dimensions.get('window');

const SignupScreen = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    nic: '',
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.nic) {
      Alert.alert('Error', 'All fields are required!');
      return;
    }

    setLoading(true);

    try {
      // 1. Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      console.log('Firebase auth user created successfully:', userCredential.user.uid);

      // 2. Save additional user data to Firestore
      // Use setDoc to create a document with the user's UID as the document ID
      await setDoc(doc(db, "newusers", userCredential.user.uid), {
        Name: formData.name,
        Email: formData.email,
        NIC: formData.nic,
      });
      console.log('User data saved to Firestore successfully!');

      Alert.alert('Success', 'Signup successful!');
      router.replace('/auth/profile-setup');
    
    } catch (error: any) {
      console.error('Error during signup:', error);
      let errorMessage = 'Signup failed. Please try again.';

      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email address is already in use.';
            break;
          case 'auth/weak-password':
            errorMessage = 'The password is too weak. Please use at least 6 characters.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
          default:
            errorMessage = `An unexpected error occurred: ${error.message}`;
        }
      }

      Alert.alert('Signup Failed', errorMessage);

    } finally {
      setLoading(false);
    }
  };

  const handleTermsAndConditions = () => {
    console.log('Terms & Conditions link pressed!');
  };

  const handlePrivacyPolicy = () => {
    console.log('Privacy Policy link pressed!');
  };

  const handleLogin = () => {
    console.log('Login link pressed!');
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Logo />
        <Text style={styles.signupHeader}>Sign Up</Text>

        <InputField
          art={<Ionicons name="person-outline" size={20} color="#888" />}
          placeholder="Name"
          keyboardType="default"
          value={formData.name}
          onChangeText={(text: string) => handleInputChange('name', text)}
        />

        <InputField
          art={<Ionicons name="mail-outline" size={20} color="#888" />}
          placeholder="Email ID"
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(text: string) => handleInputChange('email', text)}
        />
        <InputField
          art={<Ionicons name="lock-closed-outline" size={20} color="#888" />}
          placeholder="Password"
          secureTextEntry={true}
          value={formData.password}
          onChangeText={(text: string) => handleInputChange('password', text)}
        />
        <InputField
          art={<Ionicons name="id-card-outline" size={20} color="#888" />}
          placeholder="NIC Number"
          keyboardType="default"
          value={formData.nic}
          onChangeText={(text: string) => handleInputChange('nic', text)}
        />

        <CustomButton 
        title={loading ? <ActivityIndicator color="#FFFFFF" /> : 'Sign Up'} // Changed the color of the indicator to white
        onPress={handleSubmit}
        type="primary"
        disabled={loading}
        // Pass the new style directly here
        color="#30706D"
      />

        <Text style={styles.agreementText}>
          {"By signing up, you agree to our "}
          <Text onPress={handleTermsAndConditions} style={styles.agreementLink}>
            Terms & Conditions
          </Text>
          {" and "}
          <Text onPress={handlePrivacyPolicy} style={styles.agreementLink}>
            Privacy Policy
          </Text>
          {"."}
        </Text>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: width * 0.1, // Uses 10% of screen width for horizontal padding
    alignItems: 'center',
    justifyContent: 'center',
    // Removed paddingBottom: 100 to allow content to adjust naturally
  },
  signupHeader: {
    fontSize: width * 0.08, // Uses 8% of screen width for a larger header font size
    fontWeight: 'bold',
    color: '#333333',
    alignSelf: 'flex-start',
    marginBottom: height * 0.04, // Uses 4% of screen height for bottom margin
  },
  agreementText: {
    fontSize: width * 0.035, // Uses 3.5% of screen width for a smaller text font size
    color: '#888888',
    textAlign: 'center',
    marginTop: height * 0.015, // Uses 1.5% of screen height for top margin
    marginBottom: height * 0.015, // Uses 1.5% of screen height for bottom margin
    lineHeight: height * 0.025, // Uses 2.5% of screen height for line height
  },
  agreementLink: {
    color: '#30706D',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    fontSize: width * 0.035, // Ensure the link has the same font size as the text
  },
  loginContainer: {
    flexDirection: 'row',
    marginTop: height * 0.05, // Uses 5% of screen height for top margin
  },
  loginText: {
    fontSize: width * 0.04, // Uses 4% of screen width for text font size
    color: '#333333',
  },
  loginLink: {
    fontSize: width * 0.04, // Uses 4% of screen width for link font size
    color: '#30706D',
    fontWeight: 'bold',
  },
});

export default SignupScreen;