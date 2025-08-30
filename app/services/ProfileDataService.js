import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export const getProfileData = async (userId) => {
    let totalKm = 0;
    const trips = [];
    let lastTrip = null;

    try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(doc => {
            const postData = doc.data();
            // Sum the totalKm from each post
            if (postData.totalKm) {
                totalKm += postData.totalKm;
            }
            trips.push(postData);
        });

        // Find the last trip
        if (trips.length > 0) {
            trips.sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());
            lastTrip = trips[0];
        }

    } catch (error) {
        console.error("Error fetching profile data:", error);
    }
    
    return {
        totalKm,
        postsCount: trips.length,
        trips,
        lastTrip,
    };
};