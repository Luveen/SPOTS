// // firebaseConfig.js
// import { initializeApp, getApps, getApp  } from 'firebase/app';
// import { getAuth } from 'firebase/auth'; // Import getAuth for authentication services

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyApFg-bWnMwIK4wokGqrwpWcnFIFl8xFcw",
//   authDomain: "spots-5ced8.firebaseapp.com",
//   projectId: "spots-5ced8",
//   storageBucket: "spots-5ced8.firebasestorage.app",
//   messagingSenderId: "8469245735",
//   appId: "1:8469245735:web:bcf9867d3f6d59af6f8302",
//   measurementId: "G-8RXNQ9T2M2"
// };

// // Initialize Firebase ONLY if it hasn't been initialized already
// let app;
// if (!getApps().length) { // Checks if any Firebase apps are already initialized
//   app = initializeApp(firebaseConfig);
// } else {
//   app = getApp(); // If an app already exists, get the default one
// }

// // Initialize Firebase Authentication and get a reference to the service
// export const auth = getAuth(app);
// const db = getFirestore(app);
// const storage = getStorage(app);
// import { getFirestore } from 'firebase/firestore'; // Import Firestore
// import { getStorage } from 'firebase/storage'; // Import Storage

// // You can also export the app instance if you need it elsewhere
// export { app };



// export { db, storage };



// firebaseConfig.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; 
import { getFirestore } from 'firebase/firestore'; 
import { getStorage } from 'firebase/storage'; 

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
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// You can also export the app instance
export { app };