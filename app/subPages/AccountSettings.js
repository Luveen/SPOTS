// screens/settings/AccountSettings.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, Alert, TextInput, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db, storage } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore'; // Import addDoc and Timestamp
import { updatePassword, updateProfile } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useIsFocused } from '@react-navigation/native'; // Import useIsFocused

const SIX_MONTHS_IN_MS = 15552000000;

const AccountSettings = () => {
    const router = useRouter();
    const isFocused = useIsFocused(); // Use the hook to track screen focus
    const [profileData, setProfileData] = useState({
        username: '',
        bio: '',
        profilePictureUrl: null,
    });
    const [newBio, setNewBio] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [reEnterPassword, setReEnterPassword] = useState('');
    const [isOrganizer, setIsOrganizer] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [canApply, setCanApply] = useState(false); // New state for eligibility

    useEffect(() => {
        const fetchUserData = async () => {
            setLoadingStatus(true);
            try {
                const user = auth.currentUser;
                if (user) {
                    const userDocRef = doc(db, 'newusers', user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setProfileData({
                            username: data.username || 'User',
                            bio: data.userbio || '',
                            profilePictureUrl: data.profilePictureUrl || null,
                        });
                        setNewBio(data.userbio || '');
                        setNewUsername(data.username || 'User');
                        setIsOrganizer(data.role === 'organizer');
                        
                        // Check if the user is eligible to apply
                        if (data.createdAt) {
                            const createdTime = data.createdAt.toMillis();
                            const now = Timestamp.now().toMillis();
                            if (now - createdTime > SIX_MONTHS_IN_MS) {
                                setCanApply(true);
                            } else {
                                setCanApply(false);
                            }
                        }
                    }

                    // Check for existing organizer application
                    const q = query(collection(db, 'organizerApplications'), where('userId', '==', user.uid));
                    const querySnapshot = await getDocs(q);
                    setHasApplied(!querySnapshot.empty);
                }
            } catch (error) {
                console.error("Error fetching user data: ", error);
                Alert.alert("Error", "Failed to load user data. Please try again.");
            } finally {
                setLoadingStatus(false);
            }
        };

        if (isFocused) {
            fetchUserData();
        }
    }, [isFocused]);

    const handleLogout = async () => {
        await auth.signOut();
        router.replace('../auth/login');
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri) => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const user = auth.currentUser;
            const storageRef = ref(storage, `profile_pictures/${user.uid}`);

            await uploadBytes(storageRef, blob);
            const downloadUrl = await getDownloadURL(storageRef);

            const userDocRef = doc(db, 'newusers', user.uid);
            await updateDoc(userDocRef, {
                profilePictureUrl: downloadUrl,
            });

            setProfileData({ ...profileData, profilePictureUrl: downloadUrl });
            Alert.alert("Success", "Profile picture updated!");
        } catch (error) {
            console.error("Error uploading image: ", error);
            Alert.alert("Error", "Failed to update profile picture.");
        }
    };

    const handleSaveUsername = async () => {
        const user = auth.currentUser;
        if (user) {
            try {
                await updateProfile(user, {
                    displayName: newUsername,
                });
                const userDocRef = doc(db, 'newusers', user.uid);
                await updateDoc(userDocRef, {
                    username: newUsername,
                });
                setProfileData({ ...profileData, username: newUsername });
                setIsEditingUsername(false);
                Alert.alert("Success", "Username updated successfully!");
            } catch (error) {
                console.error("Error updating username: ", error);
                Alert.alert("Error", "Failed to update username.");
            }
        }
    };

    const handleSaveBio = async () => {
        const user = auth.currentUser;
        if (user) {
            try {
                const userDocRef = doc(db, 'newusers', user.uid);
                await updateDoc(userDocRef, {
                    userbio: newBio,
                });
                setProfileData({ ...profileData, bio: newBio });
                setIsEditingBio(false);
                Alert.alert("Success", "Bio updated successfully!");
            } catch (error) {
                console.error("Error updating bio: ", error);
                Alert.alert("Error", "Failed to update bio.");
            }
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== reEnterPassword) {
            Alert.alert("Error", "Passwords do not match!");
            return;
        }

        const user = auth.currentUser;
        if (user) {
            try {
                await updatePassword(user, newPassword);
                Alert.alert("Success", "Password updated successfully!");
                setNewPassword('');
                setReEnterPassword('');
                setIsEditingPassword(false);
            } catch (error) {
                console.error("Error updating password: ", error);
                Alert.alert("Error", "Failed to update password. Please log out and log in again to update your password.");
            }
        }
    };
    
    const handleToggleOrganizer = async (value) => {
        const user = auth.currentUser;
        if (user) {
            try {
                // If turning on, check eligibility
                if (value && !canApply) {
                    Alert.alert("Not Eligible", "You must be a member for at least 6 months to become an organizer.");
                    setIsOrganizer(false); // Revert the toggle back to off
                    return;
                }

                const userDocRef = doc(db, 'newusers', user.uid);
                await updateDoc(userDocRef, {
                    role: value ? 'organizer' : 'user',
                });
                setIsOrganizer(value);
                Alert.alert("Success", `You are now a${value ? 'n' : ''} ${value ? 'organizer' : 'regular user'}.`);
            } catch (error) {
                console.error("Error updating organizer status: ", error);
                Alert.alert("Error", "Failed to update your organizer status. Please try again.");
            }
        }
    };
    
    if (loadingStatus) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#30706D" />
            </View>
        );
    }
    
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Account Settings</Text>
            </View>
            <ScrollView>
                <View style={styles.profileSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
                        <Image
                            source={
                                profileData.profilePictureUrl
                                    ? { uri: profileData.profilePictureUrl }
                                    : require('../../assets/blank-profile-picture.webp')
                            }
                            style={styles.profileImage}
                        />
                        <Ionicons name="camera" size={24} color="#fff" style={styles.cameraIcon} />
                    </TouchableOpacity>
                    <View style={styles.usernameContainer}>
                        {isEditingUsername ? (
                            <TextInput
                                style={styles.usernameInput}
                                value={newUsername}
                                onChangeText={setNewUsername}
                            />
                        ) : (
                            <Text style={styles.username}>{profileData.username}</Text>
                        )}
                        <TouchableOpacity onPress={() => isEditingUsername ? handleSaveUsername() : setIsEditingUsername(true)}>
                            <Ionicons name={isEditingUsername ? "save" : "create-outline"} size={24} color="#30706D" />
                        </TouchableOpacity>
                    </View>
                </View>
                
                <View style={styles.settingsSection}>
                    {/* BIO Edit Section */}
                    <View style={styles.settingItemBio}>
                        <Text style={styles.settingText}>Bio</Text>
                        <View style={styles.bioEditContainer}>
                            {isEditingBio ? (
                                <TextInput
                                    style={styles.bioInput}
                                    value={newBio}
                                    onChangeText={setNewBio}
                                    multiline
                                    placeholder="Write a short bio..."
                                />
                            ) : (
                                <Text style={styles.bioText}>{profileData.bio}</Text>
                            )}
                            <TouchableOpacity onPress={() => isEditingBio ? handleSaveBio() : setIsEditingBio(true)}>
                                <Ionicons name={isEditingBio ? "save" : "create-outline"} size={24} color="#30706D" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Organizer Toggle Section */}
                    <View style={styles.settingItem}>
                        <Text style={styles.settingText}>Become an Organizer</Text>
                        <Switch
                            onValueChange={handleToggleOrganizer}
                            value={isOrganizer}
                            trackColor={{ false: "#767577", true: "#30706D" }}
                            thumbColor={isOrganizer ? "#fff" : "#f4f3f4"}
                            ios_backgroundColor="#3e3e3e"
                        />
                    </View>

                    {/* Change Password Section */}
                    <TouchableOpacity style={styles.settingItem} onPress={() => setIsEditingPassword(!isEditingPassword)}>
                        <Text style={styles.settingText}>Change Password</Text>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>

                    {isEditingPassword && (
                        <View style={styles.passwordFieldsContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="New Password"
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Re-enter New Password"
                                secureTextEntry
                                value={reEnterPassword}
                                onChangeText={setReEnterPassword}
                            />
                            <TouchableOpacity style={styles.savePasswordButton} onPress={handleChangePassword}>
                                <Text style={styles.savePasswordButtonText}>Save Password</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    
                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>Logout</Text>
                        <Ionicons name="log-out-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingTop: 50,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 20,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    profileImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        position: 'relative',
        marginBottom: 10,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
        padding: 5,
    },
    usernameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        marginRight: 10,
    },
    usernameInput: {
        fontSize: 24,
        fontWeight: 'bold',
        marginRight: 10,
        borderBottomWidth: 1,
        borderColor: '#ccc',
    },
    settingsSection: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    settingItemBio: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    settingText: {
        fontSize: 16,
    },
    bioText: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
        flex: 1,
    },
    bioEditContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    bioInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginRight: 10,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    passwordFieldsContainer: {
        paddingVertical: 10,
    },
    passwordInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    savePasswordButton: {
        backgroundColor: '#30706D',
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    savePasswordButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    logoutButton: {
        backgroundColor: '#D9534F',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 25,
        marginTop: 20,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 10,
    },
});

export default AccountSettings;