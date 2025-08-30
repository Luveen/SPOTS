// app/auth/profile-setup.tsx
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Firebase imports
import { updateProfile } from 'firebase/auth';
import { collection, doc, getDocs, query, setDoc, where, serverTimestamp } from 'firebase/firestore'; 
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../../firebaseConfig';

const ProfileSetupScreen = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [userbio, setUserBio] = useState(''); // Correctly initialized state
  const [usernameError, setUsernameError] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const usernameCheckTimeoutRef = React.useRef(null);

  // Request media library permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Sorry, we need camera roll permissions to set your profile picture!');
        }
      }
    })();
  }, []);

  // Check username availability with a debounce
  const handleUsernameChange = (text) => {
    setUsername(text);
    setUsernameError('');
    setUsernameAvailable(null); // Reset availability status

    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }

    if (text.length < 3) {
      setUsernameError('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(text)) {
      setUsernameError('Username can only contain letters, numbers, underscores, or periods.');
      return;
    }

    setUsernameChecking(true);
    usernameCheckTimeoutRef.current = setTimeout(async () => {
      await checkUsernameAvailability(text);
      setUsernameChecking(false);
    }, 500); // Debounce for 500ms
  };

  const checkUsernameAvailability = async (uname) => {
    if (!uname || uname.length < 3) {
      setUsernameAvailable(false);
      return false;
    }
    try {
      const usersRef = collection(db, 'newusers'); 
      const q = query(usersRef, where('username', '==', uname.toLowerCase())); 
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setUsernameError('This username is already taken.');
        setUsernameAvailable(false);
        return false;
      } else {
        setUsernameError('');
        setUsernameAvailable(true);
        return true;
      }
    } catch (error) {
      console.error('Error checking username availability:', error);
      setUsernameError('Error checking username. Please try again.');
      setUsernameAvailable(false);
      return false;
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for profile picture
      quality: 0.7, // Reduce quality for faster upload
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSetupProfile = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'No active user found. Please log in again.');
      router.replace('/auth/login');
      return;
    }

    if (usernameChecking) {
      Alert.alert('Please Wait', 'Checking username availability...');
      return;
    }

    if (usernameError || usernameAvailable === false) {
      Alert.alert('Invalid Username', usernameError || 'Please choose an available username.');
      return;
    }
    if (!username || username.length < 3) {
      Alert.alert('Invalid Username', 'Please enter a valid username.');
      return;
    }

    setLoading(true);
    let photoURL = '';

    try {
      if (profileImage) {
        const response = await fetch(profileImage);
        const blob = await response.blob();
        
        const storageRef = ref(storage, `profile_pictures/${user.uid}.jpg`);
        
        console.log('Uploading image to Firebase Storage...');
        await uploadBytes(storageRef, blob);
        
        photoURL = await getDownloadURL(storageRef);
        console.log('Image uploaded. Download URL:', photoURL);
      }

      await updateProfile(user, {
        displayName: username,
        photoURL: photoURL || null,
      });
      console.log('Firebase Auth profile updated.');

      // --- CRITICAL CHANGE: ADDING 'userbio' TO FIRESTORE ---
      await setDoc(doc(db, 'newusers', user.uid), {
        userId: user.uid,
        email: user.email,
        username: username,
        userbio: userbio, // The new field to save
        profilePictureUrl: photoURL || null, 
        createdAt: serverTimestamp(),
      }, { merge: true });
      // --------------------------------------------------------

      console.log('User data saved to Firestore.');

      Alert.alert('Success', 'Profile setup complete!');
      router.replace('../tabs/main'); 

    } catch (error) {
      console.error('Error setting up profile:', error);
      Alert.alert('Profile Setup Failed', `Failed to set up profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Set Up Your Profile</Text>
        
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={50} color="#ccc" />
              <Text style={styles.imagePlaceholderText}>Tap to choose profile picture</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          style={[styles.input, usernameError ? styles.inputError : null]}
          placeholder="Choose a username"
          placeholderTextColor="#888"
          value={username}
          onChangeText={handleUsernameChange}
          autoCapitalize="none"
          maxLength={20}
        />
        {usernameChecking ? (
          <ActivityIndicator size="small" color="#007BFF" style={styles.usernameStatus} />
        ) : usernameAvailable === true ? (
          <Text style={[styles.usernameStatus, styles.usernameAvailable]}>
            <Ionicons name="checkmark-circle" size={16} color="green" /> Username available!
          </Text>
        ) : usernameAvailable === false ? (
          <Text style={[styles.usernameStatus, styles.usernameTaken]}>
            <Ionicons name="close-circle" size={16} color="red" /> {usernameError || 'Username unavailable.'}
          </Text>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Write a short bio about yourself"
          placeholderTextColor="#888"
          value={userbio}
          onChangeText={setUserBio}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={150} // Limit bio length to 150 characters
          autoCapitalize="none"
        />
        
        <TouchableOpacity
          style={styles.setupButton}
          onPress={handleSetupProfile}
          disabled={loading || usernameChecking || usernameAvailable === false || usernameError !== ''}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.setupButtonText}>Complete Profile Setup</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'android' ? 20 :0, 
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: 'red',
  },
  usernameStatus: {
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameAvailable: {
    color: 'green',
  },
  usernameTaken: {
    color: 'red',
  },
  imagePicker: {
    width: 180,
    height: 180,
    borderRadius: 80,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#30706D',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  imagePlaceholderText: {
    marginTop: 10,
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  profileImagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  setupButton: {
    backgroundColor: '#30706D',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileSetupScreen;