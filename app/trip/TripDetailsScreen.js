import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTrip } from '../../hooks/useTrip';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Geocoder from 'react-native-geocoding';
import axios from 'axios';
import Constants from 'expo-constants';
import { collection, addDoc, serverTimestamp, GeoPoint } from "firebase/firestore";
import { db, auth} from '../../firebaseConfig';

const { width } = Dimensions.get('window');

const modesOfTransport = [
    { name: 'Car', icon: 'car-hatchback' },
    { name: 'Train', icon: 'train' },
    { name: 'Boat', icon: 'ship-wheel' },
    { name: 'Bike', icon: 'bike' },
];

const googleMapsApiKey = Constants.expoConfig.extra.googleMapsApiKey;
if (googleMapsApiKey) {
    Geocoder.init(googleMapsApiKey);
} else {
    console.error('Google Maps API key not found in app.json');
}

export default function TripDetailsScreen() {
    const router = useRouter();
    const { tripData, updateTripData } = useTrip();
    const params = useLocalSearchParams();

    const [tripTitle, setTripTitle] = useState(tripData.tripTitle || '');
    const [startLocationName, setStartLocationName] = useState(tripData.startLocation?.name || '');
    const [endLocationName, setEndLocationName] = useState(tripData.endLocation?.name || '');
    const [selectedTransport, setSelectedTransport] = useState(tripData.modeOfTransport || null);
    const [startLocationGeo, setStartLocationGeo] = useState(tripData.startLocation?.geo || null);

    const [startSuggestions, setStartSuggestions] = useState([]);
    const [endSuggestions, setEndSuggestions] = useState([]);
    const [showStartSuggestions, setShowStartSuggestions] = useState(false);
    const [showEndSuggestions, setShowEndSuggestions] = useState(false);

    const [startDate, setStartDate] = useState(tripData.startDate ? new Date(tripData.startDate) : null);
    const [endDate, setEndDate] = useState(tripData.endDate ? new Date(tripData.endDate) : null);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (params.startLocationName) {
            setStartLocationName(params.startLocationName);
            setStartLocationGeo([parseFloat(params.startLocationLat), parseFloat(params.startLocationLng)]);
        }
    }, [params]);

    const handleContinue = async () => {
        if (!tripTitle.trim() || !startLocationName.trim()) {
            Alert.alert("Incomplete Information", "Please provide a trip title and a start location.");
            return;
        }

        setIsSaving(true);
        try {
            let startGeo = startLocationGeo;
            if (!startGeo) {
                const startGeoResult = await Geocoder.from(startLocationName);
                if (startGeoResult && startGeoResult.results.length > 0) {
                    const { lat, lng } = startGeoResult.results[0].geometry.location;
                    startGeo = [lat, lng];
                } else {
                    Alert.alert("Location Not Found", "Could not find a valid location for the start point. Please try again or be more specific.");
                    setIsSaving(false);
                    return;
                }
            }

            let endGeo = null;
            if (endLocationName) {
                const endGeoResult = await Geocoder.from(endLocationName);
                if (endGeoResult && endGeoResult.results.length > 0) {
                    const { lat, lng } = endGeoResult.results[0].geometry.location;
                    endGeo = [lat, lng];
                }
            }

            const tripDataToSave = {
                tripTitle,
                userId: auth.currentUser.uid,
                modeOfTransport: selectedTransport,
                startDate: startDate ? startDate.toISOString() : null,
                endDate: endDate ? endDate.toISOString() : null,
                startLocation: {
                    name: startLocationName,
                    geo: new GeoPoint(startGeo[0], startGeo[1]),
                },
                endLocation: endLocationName ? {
                    name: endLocationName,
                    geo: new GeoPoint(endGeo[0], endGeo[1]),
                } : null,
                stops: [],
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, "tripDiaries"), tripDataToSave);
            console.log("Trip document written with ID: ", docRef.id);

            updateTripData({
                ...tripDataToSave,
                id: docRef.id
            });

            router.push({
                pathname: './AddStopScreen',
                params: {
                    tripId: docRef.id,
                }
            });

        } catch (error) {
            console.error("Error saving trip details: ", error);
            Alert.alert("Error", "There was an issue saving trip details. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const fetchSuggestions = async (text, locationType) => {
        if (!text) {
            if (locationType === 'start') setStartSuggestions([]);
            if (locationType === 'end') setEndSuggestions([]);
            return;
        }
        try {
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${googleMapsApiKey}&components=country:lk&language=en`
            );
            if (response.data.status === 'OK') {
                const suggestions = response.data.predictions.map(prediction => prediction.description);
                if (locationType === 'start') {
                    setStartSuggestions(suggestions);
                }
                if (locationType === 'end') {
                    setEndSuggestions(suggestions);
                }
            } else {
                console.error("Google Places API error:", response.data.status);
            }
        } catch (error) {
            console.error("Failed to fetch suggestions:", error);
        }
    };

    const handleSelectSuggestion = async (suggestion, locationType) => {
        if (locationType === 'start') {
            setStartLocationName(suggestion);
            setShowStartSuggestions(false);
            const geoResult = await Geocoder.from(suggestion);
            if (geoResult && geoResult.results.length > 0) {
                const { lat, lng } = geoResult.results[0].geometry.location;
                setStartLocationGeo([lat, lng]);
            }
        } else {
            setEndLocationName(suggestion);
            setShowEndSuggestions(false);
        }
    };

    const onStartDateChange = (event, selectedDate) => {
        setShowStartDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setStartDate(selectedDate);
        }
    };

    const onEndDateChange = (event, selectedDate) => {
        setShowEndDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setEndDate(selectedDate);
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const year = d.getFullYear();
        return `${month}/${day}/${year}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.header}>Trip Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.progressBarContainer}>
                <View style={styles.progressBarFill} />
                <Text style={styles.progressText}>Creating Trip 1/4</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Trip Title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Weekend in Mirissa"
                        value={tripTitle}
                        onChangeText={setTripTitle}
                    />
                </View>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Start Location</Text>
                    <View style={styles.locationInputContainer}>
                        <Ionicons name="location-outline" size={20} color="#666" style={styles.icon} />
                        <TextInput
                            style={styles.textInput}
                            placeholder="Add start location"
                            value={startLocationName}
                            onChangeText={(text) => {
                                setStartLocationName(text);
                                fetchSuggestions(text, 'start');
                            }}
                            onFocus={() => setShowStartSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowStartSuggestions(false), 200)}
                        />
                    </View>
                    {showStartSuggestions && startSuggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            {startSuggestions.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.suggestionItem}
                                    onPress={() => handleSelectSuggestion(item, 'start')}
                                >
                                    <Text style={styles.suggestionText}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>End Location</Text>
                    <View style={styles.locationInputContainer}>
                        <Ionicons name="location-outline" size={20} color="#666" style={styles.icon} />
                        <TextInput
                            style={styles.textInput}
                            placeholder="Add end location"
                            value={endLocationName}
                            onChangeText={(text) => {
                                setEndLocationName(text);
                                fetchSuggestions(text, 'end');
                            }}
                            onFocus={() => setShowEndSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowEndSuggestions(false), 200)}
                        />
                    </View>
                    {showEndSuggestions && endSuggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            {endSuggestions.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.suggestionItem}
                                    onPress={() => handleSelectSuggestion(item, 'end')}
                                >
                                    <Text style={styles.suggestionText}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mode of Transport</Text>
                    <View style={styles.transportGrid}>
                        {modesOfTransport.map((mode) => (
                            <TouchableOpacity
                                key={mode.name}
                                style={[styles.transportButton, selectedTransport === mode.name && styles.selectedTransport]}
                                onPress={() => setSelectedTransport(mode.name)}
                            >
                                <MaterialCommunityIcons name={mode.icon} size={30} color={selectedTransport === mode.name ? '#fff' : '#333'} />
                                <Text style={[styles.transportText, selectedTransport === mode.name && styles.selectedTransportText]}>
                                    {mode.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Start Date</Text>
                    <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateInputContainer}>
                        <TextInput
                            style={styles.dateInput}
                            placeholder="mm/dd/yyyy"
                            value={formatDate(startDate)}
                            editable={false}
                        />
                        <MaterialCommunityIcons name="calendar-month-outline" size={24} color="#666" />
                    </TouchableOpacity>
                    {showStartDatePicker && (
                        <DateTimePicker
                            value={startDate || new Date()}
                            mode="date"
                            display="default"
                            onChange={onStartDateChange}
                        />
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>End Date</Text>
                    <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.dateInputContainer}>
                        <TextInput
                            style={styles.dateInput}
                            placeholder="mm/dd/yyyy"
                            value={formatDate(endDate)}
                            editable={false}
                        />
                        <MaterialCommunityIcons name="calendar-month-outline" size={24} color="#666" />
                    </TouchableOpacity>
                    {showEndDatePicker && (
                        <DateTimePicker
                            value={endDate || new Date()}
                            mode="date"
                            display="default"
                            onChange={onEndDateChange}
                        />
                    )}
                </View>
            </ScrollView>

            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                {isSaving ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.continueButtonText}>Continue</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 50,
        justifyContent: 'space-between',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    progressBarContainer: {
        backgroundColor: '#E6F0E6',
        height: 8,
        borderRadius: 4,
        marginBottom: 15,
        position: 'relative',
    },
    progressBarFill: {
        backgroundColor: '#3F7D58',
        height: 8,
        borderRadius: 4,
        width: '25%',
    },
    progressText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 5,
    },
    content: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 15,
    },
    locationInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 15,
        justifyContent: 'space-between',
    },
    icon: {
        marginRight: 10,
    },
    textInput: {
        flex: 1,
        paddingVertical: 15,
    },
    transportGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    transportButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: width / 4.5,
        aspectRatio: 1,
        borderRadius: 10,
        backgroundColor: '#F0F0F0',
        marginBottom: 10,
    },
    selectedTransport: {
        backgroundColor: '#3F7D58',
    },
    transportText: {
        fontSize: 12,
        marginTop: 5,
        color: '#333',
    },
    selectedTransportText: {
        color: '#fff',
    },
    dateInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 15,
        justifyContent: 'space-between',
    },
    dateInput: {
        flex: 1,
        paddingVertical: 15,
    },
    continueButton: {
        backgroundColor: '#3F7D58',
        padding: 18,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 10,
        zIndex: 10,
        maxHeight: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    suggestionItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    suggestionText: {
        fontSize: 16,
    },
});