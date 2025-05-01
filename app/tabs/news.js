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
import { format } from 'date-fns';

const NewsTab = () => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      const rssFeedUrl = 'https://www.bluelankatours.com/feed/';
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssFeedUrl}`;
      const maxRetries = 3;
      let attempt = 0;

      while (attempt < maxRetries) {
        try {
          const response = await fetch(apiUrl);

          if (!response.ok) {
            // Throw an error to be caught by the catch block
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();

          setNewsData(data.items || []);
          setError(null); // Clear any previous errors
          break; // Exit the loop on success

        } catch (e) {
          console.error(`Attempt ${attempt + 1} failed:`, e.message);
          attempt++;
          if (attempt < maxRetries) {
            // Wait fo
            
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            // All retries failed
            setError(`Failed to load news after ${maxRetries} attempts. Error: ${e.message}`);
          }
        }
      }
      setLoading(false);
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
        <Text>Loading Sri Lanka Travel News...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Text>Please check your network connection or try again later.</Text>
      </View>
    );
  }

  const renderNewsItem = ({ item }) => {
    const publishedDate = new Date(item.pubDate);
    const displayDate = !isNaN(publishedDate.getTime())
      ? format(publishedDate, 'MMMM dd, yyyy')
      : 'Invalid Date';

    const imageUrl = item.enclosure?.link || item.thumbnail;

    return (
      <TouchableOpacity onPress={() => handleLinkPress(item.link)} style={styles.newsItemContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.newsImage} />
        ) : null}
        <Text style={styles.newsTitle}>{item.title}</Text>
        <Text style={styles.newsDate}>{displayDate}</Text>
        <Text style={styles.newsDescription}>{item.description.replace(/<[^>]+>/g, '')}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>TRAVEL NEWS - SRI LANKA</Text>
      {newsData.length > 0 ? (
        <FlatList
          data={newsData}
          keyExtractor={(item, index) => item.guid || String(index)}
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