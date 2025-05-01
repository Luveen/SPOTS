

// // index.js (This should be your only server file)
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
//  // Make sure this path is correct
// const NewUser = require('./models/UserRegister');

// const app = express();
// app.use(express.json());
// app.use(cors());



// mongoose.connect('mongodb://127.0.0.1:27017/spots')
//   .then(() => console.log('✅ Connected to MongoDB'))
//   .catch((err) => console.error('❌ Error connecting to MongoDB:', err));

//  // This is your user registration endpoint
//  app.post('/auth/signup',  (req, res) => {
//   console.log('✅ Signup request received:', req.body);

//   const { firebaseUid, name, email, nic } = req.body;

//   if (!firebaseUid || !name || !email || !nic) {
//     console.log('Validation failed: Missing required fields');
//     return res.status(400).json({ error: 'firebaseUid, name, email, and nic are required' });
//   }

//   try {
//     const existingUser = NewUser.findOne({ $or: [{ email }, { firebaseUid }] });
//     if (existingUser) {
//       console.log('Validation failed: User already exists');
//       return res.status(400).json({ error: 'A user with this email or UID already exists' });
//     }

//     const newUser = new UserRegister({
//       firebaseUid,
//       name,
//       email,
//       nic,
//     });
    
//     newUser.save();

//     console.log('✅ User saved to MongoDB:', newUser);
//     res.status(201).json({ message: 'User registered successfully', user: newUser });
//   } catch (error) {
//     console.error('❌ Error during signup:', error);
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({ error: error.message });
//     }
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// const PORT = 8081;
// app.listen(PORT, () => {
//   console.log(`🚀 Server is running on port ${PORT}`);
// });


// index.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Removed: MongoDB connection
// Removed: require('./models/UserRegister');

// This is your user registration endpoint.
// IMPORTANT: With MongoDB removed, this endpoint currently does NOT save user data anywhere.
// You should be handling user registration and profile storage directly with Firebase Authentication and Firestore.
app.post('/auth/signup', (req, res) => {
  console.log('✅ Signup request received (Note: MongoDB is removed, data is not saved via this server):', req.body);

  const { firebaseUid, name, email, nic } = req.body;

  if (!firebaseUid || !name || !email || !nic) {
    console.log('Validation failed: Missing required fields');
    return res.status(400).json({ error: 'firebaseUid, name, email, and nic are required' });
  }

  // --- MongoDB-specific logic removed below ---
  // The original code here would check for existing users in MongoDB
  // and then save a new user to MongoDB.
  // Since MongoDB is removed, you would handle this directly with Firebase.

  console.log('User data received, but no database operation performed by this server.');
  console.log('To save user profile data, ensure it is handled directly in your Firebase setup (e.g., Firestore).');
  
  // Respond as if the "registration" was received, but clarify no backend save occurred via this server.
  // You might want to remove this endpoint entirely if registration is fully Firebase client-side.
  res.status(200).json({ 
      message: 'Signup request processed. Data should be handled by Firebase client-side or functions.', 
      receivedData: { firebaseUid, name, email, nic }
  });
  // --- End of MongoDB-specific logic removal ---
});

const PORT = 8081;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  // Removed: MongoDB connection status log
});