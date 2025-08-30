// screens/PostViewScreen.js
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import PostComponent from '../../components/PostComponent';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const { height } = Dimensions.get('window');

const PostViewScreen = () => {
  const router = useRouter();
  const { post } = useLocalSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);

  // Parse the initial post data from the route parameters
  let initialPostData = null;
  if (post) {
    try {
      initialPostData = JSON.parse(post);
    } catch (e) {
      console.error("Failed to parse post data:", e);
    }
  }

  useEffect(() => {
    if (!initialPostData) {
      setLoading(false);
      return;
    }

    const fetchProfilePicture = async () => {
      try {
        const userDocRef = doc(db, 'newusers', initialPostData.userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setProfilePictureUrl(userDoc.data().profilePictureUrl);
        }
      } catch (e) {
        console.error("Error fetching user profile picture:", e);
      }
    };

    const postsRef = collection(db, 'posts');
    const q = query(postsRef, where('userId', '==', initialPostData.userId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoading(false);
    });

    fetchProfilePicture();

    return () => unsubscribe();
  }, [initialPostData]);

  const renderPost = ({ item }) => {
    // Pass both the post data and the profile picture URL to the PostComponent
    return (
      <View style={styles.postContainer}>
        <PostComponent post={{ ...item, profilePictureUrl }} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Posts</Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#30706D" />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          pagingEnabled
          snapToInterval={height}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 25,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 50,
  },
  backButton: {
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
    minHeight: '100%',
  },
  postContainer: {
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PostViewScreen;