import { AntDesign, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import CustomButton from '../../components/CustomButton';
import InputField from '../../components/InputField';
import Logo from '../../components/Logo';

// Import Firebase authentication functions and auth instance
import {
  signInWithEmailAndPassword, // For Email/Password login
  GoogleAuthProvider,        // For Google Sign-in
  signInWithCredential,      // For Google Sign-in with token
} from 'firebase/auth';
import { auth } from '../../firebaseConfig'; // Adjust path to your firebaseConfig.js

// Import Expo Auth Session for Google Sign-in
import * as WebBrowser from 'expo-web-browser'; // To dismiss web browser after auth
import * as Google from 'expo-auth-session/providers/google'; // Google Auth provider for Expo

WebBrowser.maybeCompleteAuthSession(); // Necessary for redirect URLs to close the browser

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  const [request, response, promptAsync] = Google.useAuthRequest({
    // IMPORTANT: Use the Web client ID here! Even for mobile.
    clientId: '8469245735-3uvh5sbkgtamvl4s08565c06ik793bi2.apps.googleusercontent.com',
    // These are optional but good practice if you're building a standalone app
    androidClientId: '8469245735-3uvh5sbkgtamvl4s08565c06ik793bi2.apps.googleusercontent.com',
  });

  // --- Effect hook to handle Google Sign-in response ---
  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.authentication;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((userCredential) => {
          const user = userCredential.user;
          console.log('Google login successful with Firebase:', user.uid);
          Alert.alert('Login Successful', `Welcome, ${user.displayName || user.email}!`);
          
          axios.post('http://10.56.9.156:8081/syncGoogleUser', {
          firebaseUid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          }).then(res => console.log('Backend sync successful')).catch(err => console.error('Backend sync failed', err));

          router.replace('../tabs/main');
        })
        .catch((error) => {
          console.error('Firebase Google sign-in failed:', error);
          Alert.alert('Google Login Failed', 'Could not sign in with Google. Please try again.');
        });
    } else if (response?.type === 'cancel') {
      console.log('Google login cancelled.');
      // Optional: Show a message to the user that login was cancelled
    } else if (response?.type === 'error') {
      console.error('Google login error:', response.error);
      Alert.alert('Google Login Error', 'An error occurred during Google sign-in. Please try again.');
    }
  }, [response]); // Dependency array: run when 'response' changes

  // --- Email/Password Login ---
  const handleEmailPasswordLogin = async () => {
    if (!email || !password) {
      Alert.alert('Login Failed', 'Please enter both email and password.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Email/Password login successful with Firebase:', user.uid);
      Alert.alert('Login Successful', 'Welcome back!');

   
      router.replace('../tabs/main'); 
    } catch (error: any) {
      console.error('Firebase Email/Password login failed:', error);
      let errorMessage = 'Login failed. Please check your credentials.';
      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-email':
            errorMessage = 'The email address is invalid.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This user account has been disabled.';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No user found with this email.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password. Please try again.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed login attempts. Try again later.';
            break;
          default:
            errorMessage = `Firebase Error: ${error.message}`;
        }
      }
      Alert.alert('Login Failed', errorMessage);
    }
  };

  const handleGoogleLogin = () => {
    console.log('Login with Google pressed!');
    promptAsync(); // Initiates the Google sign-in flow
  };

  const handleForgotPassword = () => {
    console.log('Forgot Password pressed!');
    Alert.alert('Forgot Password', 'Please visit the password reset page in the future.');
    // for Reset Password
  };

  const handleSignUp = () => {
    console.log('Sign Up pressed!');
    router.push('/auth/signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Logo />
        <Text style={styles.loginHeader}>Login</Text>

        <InputField
          art={<Ionicons name="mail-outline" size={20} color="#888" />}
          placeholder="Email ID"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <InputField
          art={<Ionicons name="lock-closed-outline" size={20} color="#888" />}
          placeholder="Password"
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
        />

        <View>

        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        </View>

        <CustomButton title="Login" onPress={handleEmailPasswordLogin} type="primary" icon={undefined} color="#30706D" />

        <View style={styles.orContainer}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        <CustomButton
          icon={<AntDesign name="google" size={24} color="#FFFFFF" />}
          title="Login with Google"
          onPress={handleGoogleLogin} 
          type="google"
          color="#30706D"
        />

        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}> {"Don't have an Account?"} </Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signUpLink}>Sign-up</Text>
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
    paddingHorizontal: width * 0.1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: height * 0.1,
    marginBottom: 22, // Adjusted padding to ensure content is not cut off
    // The logo will handle its own sizing, so we can remove paddingBottom: 100
  },
  loginHeader: {
    fontSize: width * 0.08,
    fontWeight: 'bold',
    color: '#333333',
    alignSelf: 'flex-start',
    marginBottom: height * 0.01,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: height * 0.01,
  },
  forgotPasswordText: {
    color: '#30706D',
    fontSize: width * 0.035,
    fontWeight: '500',
    
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
   
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  orText: {
    marginHorizontal: width * 0.02,
    color: '#888888',
    fontSize: width * 0.04,
  },
  signUpContainer: {
    flexDirection: 'row',
  },
  signUpText: {
    fontSize: width * 0.04,
    color: '#333333',
  },
  signUpLink: {
    fontSize: width * 0.04,
    color: '#30706D',
    fontWeight: 'bold',
  },
});

export default LoginScreen;