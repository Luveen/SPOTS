
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection,getDoc, addDoc, doc, updateDoc, GeoPoint, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
  ScrollView, // Changed from FlatList
  FlatList, // Still use for suggestions if needed, but keep its container tight
} from "react-native";
import { auth, db, storage } from "../../firebaseConfig";

import { useTrip } from '../../hooks/useTrip';

const { width, height } = Dimensions.get("window"); // Get height as well

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
  const GOOGLE_PLACES_API_KEY = "AIzaSyB8PNvLpjKD6cKLCFWAGyTd8D7jhE0O51o"; // Make sure this is valid
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
    } else if (data.status === "REQUEST_DENIED") {
        console.error("Google Places API error: REQUEST_DENIED. Check your API key and restrictions in Google Cloud Console.");
        // Optionally, show an alert to the user or log this more prominently
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

  
 
  const [locationName, setLocationName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isAddingStop, setIsAddingStop] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false); // To control suggestion visibility

  const [stopName, setStopName] = useState('');
  const [showOnMap, setShowOnMap] = useState(false); // <--- New state for this stop

  const { tripData, setTripData, updateTripData, addStop } = useTrip();

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
      setSuggestions([]); // Clear suggestions after setting current location
      setShowSuggestions(false);
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

  const handleLocationChange = async (text) => {
    setLocationName(text);
    if (text.length > 2) {
      const places = await getPlaceSuggestions(text);
      setSuggestions(places);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setLocationName(suggestion.description);
    setSuggestions([]); // Clear suggestions
    setShowSuggestions(false);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7, // Lower quality for faster upload and less data usage
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
        // Use Location.geocodeAsync directly as react-native-geocoding isn't explicitly imported
        // Ensure you have `import * as Location from 'expo-location';` at the top
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
        // The tripData.stops here refers to the in-memory state or the initial loaded state.
        // It's more reliable to read the 'stops' subcollection directly if you need to be sure.
        // For calculation, using the passed tripData is fine if it's kept up-to-date.
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
            router.push("./TripDetailsScreen"); // Navigate back to set start location
            setIsAddingStop(false);
            return;
        }

        const distance = haversine(lastLocationGeo, [
            stopGeo.latitude,
            stopGeo.longitude,
        ]);
        const totalKm = (tripData.totalKm || 0) + distance;

        const photoUrl = await uploadImage(imageUri); // Assuming uploadImage function exists and works

        // Create the new stop object, including showOnMap
        const newStop = {
            stopName,
            location: { name: locationName, geo: stopGeo },
            photos: [photoUrl],
            categories: selectedCategories,
            description,
            timestamp: serverTimestamp(), // Use serverTimestamp for Firestore
            showOnMap: showOnMap,       // <--- HERE: Include the state of the toggle
            createdBy: auth.currentUser.uid, // <--- Correct field for the user who created the stop
        };

        // Add the new stop document to the 'stops' subcollection
        // IMPORTANT: The tripId comes from useLocalSearchParams or a parent state
        await addDoc(collection(db, "tripDiaries", tripId, "stops"), newStop); // <--- Use newStop here, not stopDataToSave

        // Update the main trip document's totalKm field.
        // We are no longer storing 'stops' as an array directly on the trip document
        // because we are managing them as a subcollection.
        const tripDocRef = doc(db, "tripDiaries", tripId);
        await updateDoc(tripDocRef, {
            totalKm: totalKm,
            // You might want to update a lastUpdated field or similar here
            updatedAt: serverTimestamp(),
        });

        // Optionally, update the local context (if useTrip manages it)
        // This part needs careful consideration if 'useTrip' expects 'stops' as an array on tripData
        // If 'useTrip' only manages the main trip details and not subcollections,
        // then updating `updateTripData` with a modified `stops` array won't reflect subcollection changes.
        // You might need to refetch the trip with its subcollections or update `useTrip` to
        // handle subcollection data separately.
        // For now, we'll just show success and let the main data refresh if needed.
        updateTripData(prevData => ({
            ...prevData,
            stops: [...prevData.stops, stop]
            // Note: `prevData.stops` here would not reflect the newly added subcollection stop.
            // If `useTrip` needs to know about the new stop, you'd need to fetch it
            // or modify `useTrip` to handle subcollection additions differently.
        }));


        // Reset form fields
        setStopName("");
        setLocationName("");
        setSelectedCategories([]);
        setDescription("");
        setImageUri(null);
        setShowOnMap(false); // Reset toggle for next stop
        
        Alert.alert("Success", "Stop added successfully!");
        // If you want to go back or navigate to a different screen after adding
        // router.back();
        // Or if you want to keep adding stops on this screen:
        // No explicit navigation needed here.

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
    <View style={styles.container}> {/* Changed to View */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>Add a Stop</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: "50%" }]} />

      </View>

      <ScrollView contentContainerStyle={styles.content}> {/* Changed to ScrollView */}
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
              onChangeText={handleLocationChange}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click on suggestion
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
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsListContainer}>
                <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.suggestionItem}
                            onPress={() => handleSelectSuggestion(item)}
                        >
                            <Text style={styles.suggestionText}>
                                {item.description}
                            </Text>
                        </TouchableOpacity>
                    )}
                    style={styles.suggestionsList}
                    nestedScrollEnabled={true}
                />
            </View>
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
          selectedCategories.includes(cat.name) && styles.selectedCategory,
        ]}
        onPress={() => handleCategorySelect(cat.name)}
      >
        <FontAwesome5
          name={cat.icon}
          size={20} // Icon size
          color={
            selectedCategories.includes(cat.name) ? "#fff" : "#333"
          }
        />
        <Text
          style={[
            styles.categoryLabel,
            selectedCategories.includes(cat.name) && styles.selectedCategoryLabel,
          ]}
        >
          {cat.name}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</View>

        <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Show on Map</Text>
            <Switch
                trackColor={{ false: "#767577", true: "#3F7D58" }} // Green track for true
                thumbColor={showOnMap ? "#4CAF50" : "#f4f3f4"} // Brighter green thumb
                onValueChange={setShowOnMap}
                value={showOnMap}
            />
        </View>

        <View style={styles.inputGroup}> {/* Changed from descriptionContainer */}
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
      </ScrollView>

      {/* Button container fixed at the bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.addStopButton} onPress={handleAddStop} disabled={isAddingStop}>
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
    </View>
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
    marginBottom: 5, // Reduced margin
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
    marginBottom: 10, // Reduced margin
    position: "relative",
  },
  progressBarFill: {
    backgroundColor: "#3F7D58",
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12, // Slightly smaller font
    color: "#666",
    textAlign: "center",
    marginTop: 3, // Reduced margin
  },
  content: {
    flexGrow: 1, // Allows content to grow within ScrollView, but we'll try to prevent actual scrolling
    paddingBottom: 10, // Reduced padding
  },
  inputGroup: {
    marginBottom: 10, // Reduced margin
  },
  label: {
    fontSize: 14, // Slightly smaller label
    fontWeight: "bold",
    marginBottom: 5, // Reduced margin
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8, // Slightly smaller border radius
    padding: 12, // Reduced padding
    fontSize: 14,
  },
  locationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8, // Slightly smaller border radius
    paddingHorizontal: 10, // Reduced padding
    justifyContent: "space-between",
  },
  icon: {
    marginRight: 8, // Reduced margin
  },
  textInput: {
    flex: 1,
    paddingVertical: 12, // Reduced padding
    fontSize: 14,
  },
  gpsButton: {
    padding: 3, // Reduced padding
    justifyContent: "center",
    alignItems: "center",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly", // Evenly distribute items
    paddingVertical: 5, // Add some vertical padding
    marginBottom: 5,
  },
  categoryButton: {
    alignItems: "center",
    justifyContent: "center",
    width: width / 5, // Smaller size, fits more items in one row
    aspectRatio: 1,
    borderRadius: (width / 7) / 2, // Half of width for perfect circle
    backgroundColor: "#F0F0F0",
    marginBottom: 5, // Reduced margin
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 }, // Lighter shadow
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedCategory: {
    backgroundColor: "#3F7D58",
  },
  categoryLabel: {
    fontSize: 12, // Smaller font for labels
    color: "#333",
    marginTop: 5, // Space between icon and label
    textAlign: "center",
  },
  selectedCategoryLabel: {
    color: "#fff", // Change label color for selected categories
  },
  // Removed categoryText styles as icons are self-explanatory now
  // For 'Show on Map' toggle
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10, // Reduced margin
    paddingVertical: 5,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10, // Reduced padding
    height: 60, // Reduced height for description
    textAlignVertical: "top",
    fontSize: 14,
  },
  photoPicker: {
    borderWidth: 1, // Slightly thinner border
    borderColor: "#ccc", // Lighter border color
    borderStyle: "dashed",
    borderRadius: 8,
    width: 80, // Smaller photo picker
    height: 80, // Smaller photo picker
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15, // Reduced margin
    marginBottom: 5, // Reduced margin
  },
  addStopButton: {
    backgroundColor: "#3F7D58",
    padding: 14, // Reduced padding
    borderRadius: 25, // Smaller border radius for buttons
    alignItems: "center",
    flex: 1,
    marginRight: 8, // Reduced margin
  },
  continueButton: {
    backgroundColor: "#fff",
    borderColor: "#3F7D58",
    borderWidth: 1,
    padding: 14, // Reduced padding
    borderRadius: 25, // Smaller border radius
    alignItems: "center",
    flex: 1,
    marginLeft: 8, // Reduced margin
  },
  buttonText: {
    color: "#fff",
    fontSize: 16, // Slightly smaller font
    fontWeight: "bold",
  },
  continueButtonText: {
    color: "#3F7D58",
    fontSize: 16, // Slightly smaller font
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Styles for suggestions list
  suggestionsListContainer: {
    position: 'absolute',
    width: '100%',
    top: 90, // Position it below the location input
    zIndex: 100, // Ensure it's above other elements
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    maxHeight: 150, // Limit height to avoid overflowing the screen
  },
  suggestionsList: {
    // These styles are applied to the FlatList itself, not its container
  },
  suggestionItem: {
    padding: 12, // Reduced padding
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionText: {
    fontSize: 14,
    color: "#333",
  },
});