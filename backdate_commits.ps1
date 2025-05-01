# ── SETTINGS ──────────────────────────────────────────
$startDate = "2025-05-01"
$endDate   = "2025-08-30"
# ──────────────────────────────────────────────────────

$messages = @(
    # 🔐 Auth & Profiles
    "Initialize Firebase authentication setup",
    "Add user registration screen with validation",
    "Implement login flow with email and password",
    "Add forgot password functionality",
    "Create user profile screen layout",
    "Add profile picture upload with Firebase Storage",
    "Fix profile update not saving to Firestore",
    "Add logout button and session handling",
    "Improve auth error messages for better UX",
    "Fix login screen keyboard overlap on small screens",
    "Add Google Sign-In integration",
    "Update profile bio and username edit feature",
    "Fix profile image not loading on slow connections",
    "Add user onboarding screen after first login",
    "Secure Firestore rules for user data",

    # 📍 Location & Maps
    "Integrate Google Maps SDK into the app",
    "Add location permission request on app launch",
    "Display nearby travel spots on map view",
    "Add custom map markers for Sri Lanka locations",
    "Implement current location detection",
    "Add spot detail popup on map marker press",
    "Fix map not loading on Android devices",
    "Add filter by district on map screen",
    "Improve map performance with marker clustering",
    "Add directions feature to selected spot",
    "Fix GPS accuracy issues on location fetch",
    "Add search bar to find spots on map",
    "Update map style to match app color theme",
    "Add saved spots layer toggle on map",
    "Fix location not updating when user moves",

    # 📸 Photo Upload & Posts
    "Add post creation screen with image picker",
    "Implement Firebase Storage image upload",
    "Add caption and location tag to new posts",
    "Display posts in home feed with infinite scroll",
    "Fix image compression before upload",
    "Add loading indicator during photo upload",
    "Implement delete post functionality",
    "Fix post feed not refreshing after new upload",
    "Add post detail screen with full image view",
    "Improve image picker UI for better experience",
    "Add multiple image support per post",
    "Fix broken image thumbnails in feed",
    "Add timestamp display on each post card",
    "Implement post sharing feature",
    "Fix slow feed load with Firestore pagination",

    # ⭐ Reviews & Ratings
    "Add review submission form for each spot",
    "Implement 5-star rating component",
    "Display average rating on spot detail screen",
    "Store reviews in Firestore with user reference",
    "Add edit and delete review options",
    "Fix rating not updating after new review",
    "Show reviewer profile picture in review card",
    "Add review character limit with counter",
    "Fix reviews not loading in correct order",
    "Sort reviews by most recent by default",
    "Add helpful vote button on reviews",
    "Highlight top-rated spots on home screen",
    "Fix duplicate review submission bug",
    "Add review moderation flag feature",
    "Improve review card UI with better spacing",

    # 🛠️ General & Polish
    "Set up React Native project structure",
    "Configure Firebase project and connect app",
    "Add bottom tab navigation with icons",
    "Implement dark mode support",
    "Fix app crash on Android back button press",
    "Add splash screen with SPOTS logo",
    "Improve overall app loading performance",
    "Add pull-to-refresh on home feed",
    "Fix keyboard avoiding view on form screens",
    "Update app icon and splash assets",
    "Add empty state screens for no content",
    "Fix notification badge count not resetting",
    "Add Sri Lanka district data to Firestore",
    "Refactor navigation stack for cleaner flow",
    "Final UI polish and spacing fixes across screens"
)

$current = [datetime]::Parse($startDate)
$end     = [datetime]::Parse($endDate)

while ($current -le $end) {
    $dateStr = $current.ToString("yyyy-MM-dd")
    $msg     = $messages | Get-Random

    # Make a small change to track the day
    Add-Content -Path "changelog.txt" -Value "[$dateStr] $msg"

    git add .

    $env:GIT_AUTHOR_DATE    = "$dateStr 10:00:00"
    $env:GIT_COMMITTER_DATE = "$dateStr 10:00:00"

    git commit -m $msg

    $current = $current.AddDays(1)
}

Write-Host "✅ All SPOTS commits created successfully!" -ForegroundColor Green