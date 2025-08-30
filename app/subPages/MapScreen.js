import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const MapScreen = () => {
    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: 7.8731,     // Latitude for the center of Sri Lanka
                    longitude: 80.7718,    // Longitude for the center of Sri Lanka
                    latitudeDelta: 4,      // Adjust this to zoom in/out
                    longitudeDelta: 4,     // Adjust this to zoom in/out
                }}
            >
                {/* You can add markers for visited spots if you have their coordinates */}
                {/* <Marker
                    coordinate={{ latitude: 7.9567, longitude: 80.7570 }}
                    title="Sigiriya"
                    description="Famous rock fortress"
                /> */}
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
});

export default MapScreen;