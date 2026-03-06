<div align="center">

<img src="assets/logo.png" alt="SPOTS Logo" width="300"/>

### Discover Sri Lanka Like Never Before

*A social travel application for explorers, wanderers, and locals*

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Google Maps](https://img.shields.io/badge/Google_Maps-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white)

</div>

---

## 📱 About SPOTS

**SPOTS** is a mobile-first social travel application designed exclusively for exploring Sri Lanka. Whether you're a local uncovering hidden gems or a tourist navigating a new city, SPOTS connects travelers through shared experiences, real reviews, and an interactive map of the island's most incredible destinations.

Think of it as Instagram meets TripAdvisor — but built entirely around the beauty of Sri Lanka. 🇱🇰

---

## ✨ Features

### 🔐 Authentication & Profiles
- Email & password registration with form validation
- Google Sign-In integration
- Personalized user profiles with profile pictures
- Edit bio, username, and profile details
- Secure session management with Firebase Auth

### 📍 Interactive Map
- Full Google Maps integration with Sri Lanka district data
- Custom map markers for travel spots across the island
- Real-time current location detection
- Search and filter spots by district or category
- Get directions to any spot directly from the app
- Marker clustering for a clean, fast map experience

### 📸 Posts & Photo Sharing
- Create posts with photos, captions, and location tags
- Scrollable home feed with infinite scroll pagination
- Multi-image support per post
- Like, share, and interact with other travelers' posts
- Delete and manage your own posts
- Fast image compression and upload via Firebase Storage

### ⭐ Reviews & Ratings
- 5-star rating system for each spot
- Write, edit, and delete reviews
- View average ratings on spot detail pages
- Sort reviews by most recent
- Flag inappropriate reviews
- See reviewer profiles and photos

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile Framework | React Native |
| Backend & Database | Firebase Firestore |
| Authentication | Firebase Auth |
| File Storage | Firebase Storage |
| Maps | Google Maps SDK |
| Language | JavaScript (ES6+) |
| Navigation | React Navigation |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [React Native CLI](https://reactnative.dev/docs/environment-setup)
- [Android Studio](https://developer.android.com/studio) (for Android)
- [Xcode](https://developer.apple.com/xcode/) (for iOS, macOS only)
- A [Firebase](https://firebase.google.com/) project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Luveen/SPOTS.git
   cd SPOTS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project (or use an existing one)
   - Add an Android/iOS app to your Firebase project
   - Download the `google-services.json` (Android) or `GoogleService-Info.plist` (iOS)
   - Place the file in the appropriate directory:
     - Android: `android/app/google-services.json`
     - iOS: `ios/SPOTS/GoogleService-Info.plist`

4. **Set up Google Maps**
   - Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Add it to your `android/app/src/main/AndroidManifest.xml`:
     ```xml
     <meta-data android:name="com.google.android.geo.API_KEY" android:value="YOUR_API_KEY"/>
     ```

5. **Run the app**

   For Android:
   ```bash
   npx react-native run-android
   ```

   For iOS:
   ```bash
   cd ios && pod install && cd ..
   npx react-native run-ios
   ```

---

## 📁 Project Structure

```
SPOTS/
├── android/                  # Android native files
├── ios/                      # iOS native files
├── src/
│   ├── components/           # Reusable UI components
│   ├── screens/              # App screens
│   │   ├── Auth/             # Login, Register, Forgot Password
│   │   ├── Home/             # Feed and home screen
│   │   ├── Map/              # Map and spot discovery
│   │   ├── Post/             # Post creation and detail
│   │   ├── Profile/          # User profile screens
│   │   └── Reviews/          # Review and rating screens
│   ├── navigation/           # React Navigation setup
│   ├── firebase/             # Firebase config and helpers
│   ├── hooks/                # Custom React hooks
│   └── utils/                # Helper functions
├── assets/                   # Images, icons, fonts
├── App.js                    # App entry point
└── package.json
```

---

## 🌏 About the App — Sri Lanka Focus

SPOTS was built with Sri Lanka at its heart. The app includes:

- Pre-loaded data for all **25 districts** of Sri Lanka
- Curated travel spots from Colombo to Jaffna, Kandy to Galle
- Support for both **local explorers** and **international tourists**
- A growing community of travelers sharing authentic experiences

---

## 🔒 Firebase Security

Firestore security rules are set to ensure:
- Users can only edit their own profiles and posts
- Reviews are tied to authenticated user accounts
- Public spots and posts are readable by all users
- Admin-only write access to core spot data

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve SPOTS:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Developer

**Luveen** — [GitHub Profile](https://github.com/Luveen)

---

<div align="center">

Made with ❤️ for Sri Lanka

*If you found this project useful, please consider giving it a ⭐ on GitHub!*

</div>
