import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
  Linking,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { format } from 'date-fns'; // For formatting the date nicely

const NewsTab = () => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('https://rss.app/feeds/v1.1/kGU7KOLzi6afFFUb.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // This is correct, the news articles are in the 'items' array
        setNewsData(data.items || []);
      } catch (e) {
        setError(e.message);
        console.error("Failed to fetch news:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const handleLinkPress = (url) => {
    if (url && typeof url === 'string') {
      Linking.openURL(url).catch(() => {
        Alert.alert("Error", "Could not open this link.");
      });
    } else {
      Alert.alert("Error", "This story does not have a valid link.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading news...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text>Could not load news. Please try again later.</Text>
      </View>
    );
  }

  const renderNewsItem = ({ item }) => {
    // UPDATED: Use 'item.date_published' and format it
    const publishedDate = new Date(item.date_published);
    const displayDate = !isNaN(publishedDate)
      ? format(publishedDate, 'MMMM dd, yyyy') // Example: "July 23, 2025"
      : 'Invalid Date';

    return (
      // UPDATED: Call handleLinkPress with 'item.url'
      <TouchableOpacity onPress={() => handleLinkPress(item.url)} style={styles.newsItemContainer}>
        
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.newsImage} />
        )}
        <Text style={styles.newsTitle}>{item.title}</Text>
        <Text style={styles.newsDate}>{displayDate}</Text>
        
        <Text style={styles.newsDescription}>{item.content_text}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>TRAVEL NEWS</Text>
      {newsData.length > 0 ? (
        <FlatList
          data={newsData}
          // This is correct, 'item.id' is the unique key
          keyExtractor={(item) => item.id}
          renderItem={renderNewsItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.centered}>
          <Text>No news available at the moment.</Text>
        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 10,
    paddingBottom: 80,
  },
  header: {
    fontSize: 24,
    color: '#4CAF50',
    paddingTop: 30,
    backgroundColor: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 10,
  },
  newsItemContainer: {
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  newsImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  newsDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  newsDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default NewsTab;