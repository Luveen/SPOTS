// import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import { useRouter } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import {
//   SafeAreaView, ActivityIndicator, Alert, FlatList, Image, ScrollView, StyleSheet, Text,
//   TextInput, TouchableOpacity, View, Dimensions
// } from 'react-native';

// import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
// import { auth, db } from '../../firebaseConfig';
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// const storage = getStorage();
// const { width, height } = Dimensions.get('window');

// const AVAILABLE_TAGS = [
//   'Surfing', 'Hiking', 'Beach', 'Food', 'Historical',
//   'Nature', 'City', 'Adventure', 'Relaxing',
// ];

// const AddPostScreen = () => {
//   const router = useRouter();
//   const [images, setImages] = useState([]);
//   const [caption, setCaption] = useState('');
//   const [selectedTags, setSelectedTags] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [userData, setUserData] = useState({
//     username: 'User',
//     handle: '@user',
//     profilePictureUrl: null
//   });

//   useEffect(() => {
//     const fetchUserData = async () => {
//       const user = auth.currentUser;
//       if (user) {
//         const userDocRef = doc(db, 'newusers', user.uid);
//         const userDoc = await getDoc(userDocRef);
//         if (userDoc.exists()) {
//           const fetchedData = userDoc.data();
//           setUserData({
//             username: fetchedData.Name || user.displayName || 'User',
//             handle: `@${fetchedData.Name || 'user'}`,
//             profilePictureUrl: fetchedData.profilePictureUrl || null
//           });
//         }
//       }
//     };
//     fetchUserData();
//   }, []);

//   const pickImageAsync = async () => {
//     try {
//       const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

//       if (status !== 'granted') {
//         Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
//         return;
//       }

//       let result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsMultipleSelection: true,
//         quality: 0.8,
//       });

//       if (!result.canceled) {
//         setImages(result.assets || []);
//       }
//     } catch (error) {
//       console.error("Error picking image: ", error);
//       Alert.alert('Error', 'Failed to open image library. Please check your app permissions and try again.');
//     }
//   };

//   const removeImage = (uri) => {
//     setImages(images.filter(image => image.uri !== uri));
//   };

//   const handleTagPress = (tag) => {
//     if (selectedTags.includes(tag)) {
//       setSelectedTags(currentTags => currentTags.filter(t => t !== tag));
//     } else {
//       setSelectedTags(currentTags => [...currentTags, tag]);
//     }
//   };

//   const handlePost = async () => {
//     if (images.length === 0 || !caption.trim()) {
//       Alert.alert('Incomplete Post', 'Please select at least one image and write a caption.');
//       return;
//     }

//     setLoading(true);
//     const user = auth.currentUser;

//     try {
//       const imageUrls = [];
//       for (const image of images) {
//         const response = await fetch(image.uri);
//         const blob = await response.blob();
//         const filename = `posts/${user.uid}/${Date.now()}_${image.fileName || 'post-image.jpg'}`;
//         const storageRef = ref(storage, filename);

//         await uploadBytes(storageRef, blob);
//         const downloadURL = await getDownloadURL(storageRef);
//         imageUrls.push(downloadURL);
//       }

//       await addDoc(collection(db, "posts"), {
//         userId: user.uid,
//         username: userData.username,
//         handle: userData.handle,
//         profilePictureUrl: userData.profilePictureUrl,
//         caption: caption,
//         tags: selectedTags,
//         imageUrls: imageUrls,
//         likes: 0,
//         comments: 0,
//         createdAt: serverTimestamp(),
//       });

//       Alert.alert('Success!', 'Your post has been published.');
//       setImages([]);
//       setCaption('');
//       setSelectedTags([]);
//       router.push('/tabs/main');

//     } catch (error) {
//       console.error("Error posting document: ", error);
//       Alert.alert('Error', 'Something went wrong while trying to post.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         <Text style={styles.header}>Create Post</Text>

//         <View style={styles.section}>
//           <TouchableOpacity style={styles.imagePickerButton} onPress={pickImageAsync}>
//             <Ionicons name="images-outline" size={width * 0.055} color="#fff" />
//             <Text style={styles.imagePickerButtonText}>Select Photos from Library</Text>
//           </TouchableOpacity>

//           {images.length > 0 && (
//             <FlatList
//               horizontal
//               data={images}
//               keyExtractor={item => item.uri}
//               showsHorizontalScrollIndicator={false}
//               style={styles.imagePreviewContainer}
//               renderItem={({ item }) => (
//                 <View style={styles.imageWrapper}>
//                   <Image source={{ uri: item.uri }} style={styles.previewImage} />
//                   <TouchableOpacity
//                     style={styles.removeImageButton}
//                     onPress={() => removeImage(item.uri)}>
//                     <Ionicons name="close-circle" size={width * 0.06} color="#E21818" />
//                   </TouchableOpacity>
//                 </View>
//               )}
//             />
//           )}
//         </View>

//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Caption</Text>
//           <TextInput
//             style={styles.captionInput}
//             placeholder="Share details about your trip..."
//             multiline
//             value={caption}
//             onChangeText={setCaption}
//           />
//         </View>

//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Add Tags</Text>
//           <View style={styles.tagsContainer}>
//             {AVAILABLE_TAGS.map(tag => (
//               <TouchableOpacity
//                 key={tag}
//                 style={[
//                   styles.tag,
//                   selectedTags.includes(tag) && styles.tagSelected,
//                 ]}
//                 onPress={() => handleTagPress(tag)}>
//                 <Text style={[
//                   styles.tagText,
//                   selectedTags.includes(tag) && styles.tagTextSelected,
//                 ]}>
//                   {tag}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </View>

//         <TouchableOpacity
//           style={styles.postButton}
//           onPress={handlePost}
//           disabled={loading}>
//           {loading ? (
//             <ActivityIndicator color="#fff" />
//           ) : (
//             <Text style={styles.postButtonText}>Publish Post</Text>
//           )}
//         </TouchableOpacity>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F5F5F5',
//   },
//   scrollContent: {
//     paddingTop: height * 0.02,
//     paddingHorizontal: width * 0.05,
//     paddingBottom: height * 0.06,
//     flexGrow: 1,
//   },
//   header: {
//     fontSize: width * 0.07,
//     fontWeight: 'bold',
//     marginBottom: height * 0.02,
//     marginTop: height * 0.04,
//   },
//   section: {
//     marginBottom: height * 0.03,
//   },
//   sectionTitle: {
//     fontSize: width * 0.045,
//     fontWeight: '600',
//     marginBottom: height * 0.015,
//     color: '#333',
//   },
//   imagePickerButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#30706D',
//     paddingVertical: height * 0.015,
//     borderRadius: 10,
//   },
//   imagePickerButtonText: {
//     color: '#fff',
//     fontSize: width * 0.04,
//     fontWeight: 'bold',
//     marginLeft: width * 0.025,
//   },
//   imagePreviewContainer: {
//     marginTop: height * 0.02,
//   },
//   imageWrapper: {
//     position: 'relative',
//     marginRight: width * 0.025,
//   },
//   previewImage: {
//     width: width * 0.25,
//     height: width * 0.25,
//     borderRadius: 10,
//   },
//   removeImageButton: {
//     position: 'absolute',
//     top: -2,
//     right: -2,
//     backgroundColor: '#fff',
//     borderRadius: width * 0.08,
//   },
//   captionInput: {
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     padding: width * 0.04,
//     fontSize: width * 0.04,
//     minHeight: height * 0.15,
//     textAlignVertical: 'top',
//     borderColor: '#E0E0E0',
//     borderWidth: 1,
//   },
//   tagsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   tag: {
//     backgroundColor: '#E0E0E0',
//     borderRadius: 20,
//     paddingVertical: height * 0.01,
//     paddingHorizontal: width * 0.04,
//     marginRight: width * 0.02,
//     marginBottom: height * 0.01,
//   },
//   tagSelected: {
//     backgroundColor: '#30706D',
//   },
//   tagText: {
//     color: '#333',
//     fontWeight: '500',
//     fontSize: width * 0.035,
//   },
//   tagTextSelected: {
//     color: '#fff',
//   },
//   postButton: {
//     backgroundColor: '#30706D',
//     paddingVertical: height * 0.018,
//     borderRadius: 10,
//     alignItems: 'center',
//     marginTop: height * 0.025,
//   },
//   postButtonText: {
//     color: '#fff',
//     fontSize: width * 0.045,
//     fontWeight: 'bold',
//   },
// });

// export default AddPostScreen;

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

const AddScreen = () => {
    const router = useRouter();

    useEffect(() => {
        // Automatically navigate to the trip creation homepage when this screen is mounted
        router.replace('/trip/CreateTripHomepage');
    }, [router]);

    // You can return a simple loading view or a null component
    // while the navigation takes place.
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Redirecting to Trip Creation...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 18,
        color: '#666',
    },
});

export default AddScreen;