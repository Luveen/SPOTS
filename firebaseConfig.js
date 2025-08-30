// firebaseConfig.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'; // Import initializeAuth and getReactNativePersistence
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyApFg-bWnMwIK4wokGqrwpWcnFIFl8xFcw",
    authDomain: "spots-5ced8.firebaseapp.com",
    projectId: "spots-5ced8",
    storageBucket: "spots-5ced8.firebasestorage.app",
    messagingSenderId: "8469245735",
    appId: "1:8469245735:web:bcf9867d3f6d59af6f8302",
    measurementId: "G-8RXNQ9T2M2"
};

// Initialize Firebase only if it hasn't been initialized already
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// Initialize and export services
export const auth = initializeAuth(app, { // Use initializeAuth to handle persistence
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);

// You can also export the app instance
export { app };