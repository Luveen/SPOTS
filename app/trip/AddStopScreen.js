import {
    FontAwesome5,
    Ionicons,
    MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, GeoPoint, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db, storage } from "../../firebaseConfig";

const { width } = Dimensions.get("window");

// Haversine formula to calculate distance between two lat/lng points
const haversine = (coords1, coords2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth's radius in km

  const dLat = toRad(coords2[0] - coords1[0]);
  const dLon = toRad(coords2[1] - coords1[1]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1[0])) *
      Math.cos(toRad(coords2[0])) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const categories = [
  { name: "Restaurant", icon: "utensils" },
  { name: "Café", icon: "coffee" },
  { name: "Hotel", icon: "hotel" },
  { name: "Attraction", icon: "landmark" },
  { name: "Shopping", icon: "shopping-bag" },
  { name: "Viewpoint", icon: "camera" },
  { name: "Favorite", icon: "heart" },
  { name: "Beach", icon: "umbrella-beach" },
];

// Placeholder for Google Places API logic
const getPlaceSuggestions = async (query) => {
  // This is a placeholder. You'll need to replace this with your actual API call.
  // Example: Using the Google Places Autocomplete API
  const GOOGLE_PLACES_API_KEY = "AIzaSyB8PNvLpjKD6cKLCFWAGyTd8D7jhE0O51o";
  const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${GOOGLE_PLACES_API_KEY}&input=${encodeURIComponent(
    query
  )}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data.status === "OK") {
      return data.predictions.map((prediction) => ({
        id: prediction.place_id,
        description: prediction.description,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching place suggestions: ", error);
    return [];
  }
};

export default function AddStopScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { tripId } = params;

  const [tripData, setTripData] = useState(null);
  const [stopName, setStopName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [suggestions, setSuggestions] = useState([]); // New state for suggestions
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isAddingStop, setIsAddingStop] = useState(false);

  useEffect(() => {
    const fetchTripData = async () => {
      if (tripId) {
        const docRef = doc(db, "tripDiaries", tripId);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setTripData({ id: docSnap.id, ...docSnap.data() });
          } else {
            Alert.alert(
              "Error",
              "Trip not found. Please go back and try again."
            );
            router.back();
          }
        } catch (error) {
          console.error("Error fetching trip data: ", error);
          Alert.alert("Error", "Could not load trip data. Please try again.");
          router.back();
        }
      } else {
        Alert.alert(
          "Invalid Trip",
          "Trip details are missing. Please start a new trip from the Trip Details screen."
        );
        router.push("./TripDetailsScreen");
      }
    };

    fetchTripData();
  }, [tripId]);

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Permission to access location was denied. Please enable it in your device settings."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode.length > 0) {
        const address = geocode[0];
        const formattedAddress = `${address.name || ""}, ${address.city || ""}`
          .replace(/^, |^,/g, "")
          .trim();
        setLocationName(formattedAddress || "Current Location");
      } else {
        setLocationName(
          `${location.coords.latitude}, ${location.coords.longitude}`
        );
      }
    } catch (error) {
      console.error("Error getting location: ", error);
      Alert.alert(
        "Error",
        "Could not get current location. Please enter it manually."
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  // New handler to fetch and display suggestions
  const handleLocationChange = async (text) => {
    setLocationName(text);
    if (text.length > 2) {
      const places = await getPlaceSuggestions(text);
      setSuggestions(places);
    } else {
      setSuggestions([]);
    }
  };

  // New handler to select a suggestion
  const handleSelectSuggestion = (suggestion) => {
    setLocationName(suggestion.description);
    setSuggestions([]); // Clear suggestions
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = uri.substring(uri.lastIndexOf("/") + 1);
    const storageRef = ref(
      storage,
      `trip_images/${auth.currentUser.uid}/${filename}`
    );
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    return url;
  };

  const handleCategorySelect = (categoryName) => {
    setSelectedCategories((prevCategories) => {
      if (prevCategories.includes(categoryName)) {
        return prevCategories.filter((cat) => cat !== categoryName);
      } else {
        return [...prevCategories, categoryName];
      }
    });
  };

  const handleAddStop = async () => {
    if (!tripData) {
      Alert.alert(
        "Loading Trip Data",
        "Trip data is still being loaded. Please wait a moment."
      );
      return;
    }

    if (
      !stopName.trim() ||
      !locationName.trim() ||
      !imageUri ||
      selectedCategories.length === 0
    ) {
      Alert.alert(
        "Incomplete Information",
        "Please fill in all the required information."
      );
      return;
    }

    setIsAddingStop(true);

    try {
      const geoResult = await Location.geocodeAsync(locationName);
      if (!geoResult || geoResult.length === 0) {
        Alert.alert(
          "Invalid Location",
          "Could not find a valid location. Please try a different name."
        );
        setIsAddingStop(false);
        return;
      }

      const { latitude, longitude } = geoResult[0];
      const stopGeo = new GeoPoint(latitude, longitude);

      let lastLocationGeo;
      if (tripData.stops && tripData.stops.length > 0) {
        const lastStop = tripData.stops[tripData.stops.length - 1];
        lastLocationGeo = [
          lastStop.location.geo.latitude,
          lastStop.location.geo.longitude,
        ];
      } else if (tripData.startLocation && tripData.startLocation.geo) {
        lastLocationGeo = [
          tripData.startLocation.geo.latitude,
          tripData.startLocation.geo.longitude,
        ];
      } else {
        Alert.alert(
          "Missing Start Location",
          "The trip's starting location is missing. Please go back and set it."
        );
        router.push("./TripDetailsScreen");
        setIsAddingStop(false);
        return;
      }

      const distance = haversine(lastLocationGeo, [
        stopGeo.latitude,
        stopGeo.longitude,
      ]);
      const totalKm = (tripData.totalKm || 0) + distance;

      const photoUrl = await uploadImage(imageUri);

      const newStop = {
        stopName,
        location: { name: locationName, geo: stopGeo },
        photos: [photoUrl],
        categories: selectedCategories,
        description,
        timestamp: new Date().toISOString(),
      };

      const updatedStops = [...(tripData.stops || []), newStop];

      const tripDocRef = doc(db, "tripDiaries", tripId);
      await updateDoc(tripDocRef, {
        stops: updatedStops,
        totalKm: totalKm,
      });

      setStopName("");
      setLocationName("");
      setSelectedCategories([]);
      setDescription("");
      setImageUri(null);

      Alert.alert("Success", "Stop added successfully!");
    } catch (error) {
      console.error("Error adding stop: ", error);
      Alert.alert(
        "Error",
        "There was an issue adding the stop. Please try again."
      );
    } finally {
      setIsAddingStop(false);
    }
  };

  const handleContinue = () => {
    router.push({
      pathname: "./TripSummaryScreen",
      params: { tripId: tripId },
    });
  };

  if (!tripData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F7D58" />
        <Text>Loading trip data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>Add a Stop</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: "50%" }]} />
        <Text style={styles.progressText}>Creating Trip 2/4</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Stop Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Weligama Beach"
            value={stopName}
            onChangeText={setStopName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.locationInputContainer}>
            <Ionicons
              name="location-outline"
              size={20}
              color="#666"
              style={styles.icon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Address or Location Name"
              value={locationName}
              onChangeText={handleLocationChange} // Use new handler
            />
            <TouchableOpacity
              onPress={getCurrentLocation}
              style={styles.gpsButton}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#3F7D58" />
              ) : (
                <MaterialCommunityIcons
                  name="crosshairs-gps"
                  size={24}
                  color="#3F7D58"
                />
              )}
            </TouchableOpacity>
          </View>
          {suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <Text style={styles.suggestionText}>{item.description}</Text>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={[
                  styles.categoryButton,
                  selectedCategories.includes(cat.name) &&
                    styles.selectedCategory,
                ]}
                onPress={() => handleCategorySelect(cat.name)}
              >
                <FontAwesome5
                  name={cat.icon}
                  size={30}
                  color={
                    selectedCategories.includes(cat.name) ? "#fff" : "#333"
                  }
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategories.includes(cat.name) &&
                      styles.selectedCategoryText,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedCategories.length > 0 && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Selected Categories</Text>
            <FlatList
              horizontal
              data={selectedCategories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <View style={styles.selectedTag}>
                  <Text style={styles.selectedTagText}>{item}</Text>
                </View>
              )}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="What makes this place special?"
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Photos</Text>
          <TouchableOpacity style={styles.photoPicker} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <Ionicons name="add" size={40} color="#ccc" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.addStopButton} onPress={handleAddStop}>
          {isAddingStop ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Add Stop</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  progressBarContainer: {
    backgroundColor: "#E6F0E6",
    height: 8,
    borderRadius: 4,
    marginBottom: 15,
    position: "relative",
  },
  progressBarFill: {
    backgroundColor: "#3F7D58",
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
  content: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
  },
  locationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    justifyContent: "space-between",
  },
  icon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 15,
  },
  gpsButton: {
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryButton: {
    alignItems: "center",
    justifyContent: "center",
    width: width / 4.5,
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
    marginBottom: 10,
  },
  selectedCategory: {
    backgroundColor: "#3F7D58",
  },
  categoryText: {
    fontSize: 12,
    marginTop: 5,
    color: "#333",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  selectedTag: {
    backgroundColor: "#E6F0E6",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  selectedTagText: {
    fontSize: 14,
    color: "#3F7D58",
    fontWeight: "bold",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    height: 100,
    textAlignVertical: "top",
  },
  photoPicker: {
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 10,
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 10,
  },
  addStopButton: {
    backgroundColor: "#3F7D58",
    padding: 18,
    borderRadius: 30,
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  continueButton: {
    backgroundColor: "#fff",
    borderColor: "#3F7D58",
    borderWidth: 1,
    padding: 18,
    borderRadius: 30,
    alignItems: "center",
    flex: 1,
    marginLeft: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  continueButtonText: {
    color: "#3F7D58",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionsList: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginTop: 5,
    maxHeight: 200,
    backgroundColor: "#fff",
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionText: {
    fontSize: 16,
    color: "#333",
  },
});
