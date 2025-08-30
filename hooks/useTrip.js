import { useState } from 'react';

export const useTrip = () => {
    const [tripData, setTripData] = useState({
        tripTitle: '',
        startLocation: { name: '', geo: null }, // Updated: Initialize with an object to prevent null access
        endLocation: { name: '', geo: null },   // Updated: Initialize endLocation as well
        modeOfTransport: '',
        startDate: null, // Updated: Initialize as null
        endDate: null,   // Updated: Initialize as null
        stops: [],
        totalKm: 0,
    });

    const updateTripData = (newData) => {
        setTripData(prevData => ({ ...prevData, ...newData }));
    };

    const addStop = (stop) => {
        setTripData(prevData => ({
            ...prevData,
            stops: [...prevData.stops, stop],
        }));
    };

    return { tripData, updateTripData, addStop };
};