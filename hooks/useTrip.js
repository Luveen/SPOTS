import { useState } from 'react';

export const useTrip = () => {
    const [tripData, setTripData] = useState({
        tripTitle: '',
        startLocation: { name: '', geo: null },
        endLocation: { name: '', geo: null },
        modeOfTransport: '',
        startDate: null,
        endDate: null,
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