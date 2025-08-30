// screens/SearchScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const SearchScreen = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (text) => {
        setSearchQuery(text);
        if (text.length > 2) { // Only search after a few characters are typed
            setLoading(true);
            try {
                // Query to search for usernames that start with the search text
                const q = query(
                    collection(db, 'newusers'),
                    where('username', '>=', text),
                    where('username', '<=', text + '\uf8ff')
                );
                const querySnapshot = await getDocs(q);
                const results = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setSearchResults(results);
            } catch (error) {
                console.error("Error searching for users:", error);
            } finally {
                setLoading(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const renderItem = ({ item }) => (
        <View>
        <TouchableOpacity 
            style={styles.resultItem}
            onPress={() => router.push({ pathname: '/subPages/OtherUserProfileScreen', params: { userId: item.id } })}
        >
            <Image 
                source={{ uri: item.profilePictureUrl || 'https://via.placeholder.com/150' }}
                style={styles.profileImage}
            />
            <Text style={styles.username}>{item.username}</Text>
        </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search for users..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                    autoFocus
                />
            </View>
            
            {loading ? (
                <ActivityIndicator size="large" color="#3F7D58" style={styles.loader} />
            ) : (
                <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ListEmptyComponent={() => (
                        <View>
                        <Text style={styles.noResultsText}>
                            {searchQuery.length > 2 ? "No users found." : "Start typing to search for users."}
                        </Text>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    backButton: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#E0E0E0',
        borderRadius: 20,
        paddingHorizontal: 15,
    },
    loader: {
        marginTop: 50,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    username: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    noResultsText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#888',
    }
});

export default SearchScreen;