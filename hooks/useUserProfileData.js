// hooks/useUserProfileData.js
import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, getAggregateFromServer, sum, count } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const useUserProfileData = () => {
    const [userData, setUserData] = useState(null);
    const [postsCount, setPostsCount] = useState(0);
    const [followersCount, setFollowersCount] = useState(0);
    const [totalKm, setTotalKm] = useState(0);
    const [spotsVisited, setSpotsVisited] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        const userDocRef = doc(db, 'newusers', user.uid);
        const postsRef = collection(db, 'posts');
        const userPostsQuery = query(postsRef, where('userId', '==', user.uid));
        const tripsRef = collection(db, 'tripDiaries');
        const userTripsQuery = query(tripsRef, where('userId', '==', user.uid));

        let unsubscribeUser, unsubscribePosts;

        const fetchData = async () => {
            try {
                // Fetch user profile data
                unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserData(data);
                        setFollowersCount(data.followers?.length || 0);
                    }
                });

                // Fetch posts count
                unsubscribePosts = onSnapshot(userPostsQuery, (querySnapshot) => {
                    setPostsCount(querySnapshot.size);
                });

                // Fetch trip stats
                const snapshot = await getAggregateFromServer(userTripsQuery, {
                    totalKmSum: sum('totalKm'),
                    spotsCount: count(),
                });

                setTotalKm(Math.round(Number(snapshot.data().totalKmSum)) || 0);
                setSpotsVisited(Number(snapshot.data().spotsCount) || 0);
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Cleanup listeners on unmount
        return () => {
            unsubscribeUser?.();
            unsubscribePosts?.();
        };
    }, []);

    return { userData, postsCount, followersCount, totalKm, spotsVisited, loading };
};

export default useUserProfileData;