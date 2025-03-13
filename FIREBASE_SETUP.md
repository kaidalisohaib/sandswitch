# Firebase Setup for SandSwitch

This guide will help you set up Firebase for your SandSwitch application.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click "Add project" and follow the steps to create a new Firebase project.
3. Name your project (e.g., "sandswitch").
4. Enable Google Analytics if desired (optional).
5. Accept the terms and click "Create project".

## Step 2: Set Up Authentication

1. In the Firebase Console, select your project.
2. Go to the "Authentication" section in the left sidebar.
3. Click on the "Get started" button.
4. Enable the "Email/Password" sign-in method by clicking on it and toggling the switch.
5. Click "Save".

## Step 3: Set Up Firestore Database

1. In the Firebase Console, select your project.
2. Go to the "Firestore Database" section in the left sidebar.
3. Click "Create database".
4. Start in production mode (or test mode if you're just testing).
5. Choose a location closest to your users (e.g., "us-central").
6. Click "Enable".

## Step 4: Set Up Firestore Security Rules

1. In the Firestore Database section, go to the "Rules" tab.
2. Replace the default rules with the following:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if isOwner(userId);
    }
    
    // Services collection
    match /services/{serviceId} {
      // Allow anyone to read services - no authentication required
      allow read: if true;
      
      // Keep all write operations authenticated
      allow create: if isAuthenticated();
      
      // Prevent updates to deleted services
      allow update: if isAuthenticated() && 
                     isOwner(resource.data.userId) && 
                     resource.data.status != "deleted";
                     
      allow delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Matches collection
    match /matches/{matchId} {
      allow read: if isAuthenticated() && (
        isOwner(resource.data.requesterId) || 
        isOwner(resource.data.providerId) ||
        // Allow service owner to read matches for their service
        exists(/databases/$(database)/documents/services/$(resource.data.serviceId)) && 
        isOwner(get(/databases/$(database)/documents/services/$(resource.data.serviceId)).data.userId)
      );
      
      allow create: if isAuthenticated();
      
      // Prevent updates to cancelled matches
      allow update: if isAuthenticated() && 
                     (isOwner(resource.data.requesterId) || 
                      isOwner(resource.data.providerId)) && 
                     resource.data.status != "cancelled";
                     
      allow delete: if isAuthenticated() && (
        isOwner(resource.data.requesterId) || 
        isOwner(resource.data.providerId) ||
        // Allow service owner to delete matches for their service
        exists(/databases/$(database)/documents/services/$(resource.data.serviceId)) && 
        isOwner(get(/databases/$(database)/documents/services/$(resource.data.serviceId)).data.userId)
      );
    }
  }
}
```

3. Click "Publish".

## Step 5: Register Your Web App

1. In the Firebase Console, select your project.
2. Click the web icon (</>) on the project overview page.
3. Register your app with a nickname (e.g., "sandswitch-web").
4. (Optional) Check the box for "Also set up Firebase Hosting".
5. Click "Register app".
6. Copy the Firebase configuration object.

## Step 6: Set Up Environment Variables

1. Create a `.env.local` file in the root of your project (use the provided `.env.local.example` file as a template).
2. Add your Firebase configuration values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Step 7: Create Initial Firestore Indexes

Some of the queries in the application require composite indexes. You can create them in advance or wait until you encounter an error and follow the link to create them:

1. In the Firebase Console, select your project.
2. Go to the "Firestore Database" section.
3. Go to the "Indexes" tab.
4. Click "Add index".
5. Create the following composite indexes:

Collection ID 	Fields indexed	                                          Query scope 		Status 	
services 	      userId Ascending created Descending __name__ Descending	  Collection 		  Enabled	
users 	        name Ascending id Ascending __name__ Ascending	          Collection 		  Enabled

## Step 8: Initialize the App

1. Start your Next.js app with `pnpm run dev`.
2. The application should now connect to your Firebase project.
3. Register a user to start using the application.

## Troubleshooting

- If you encounter authentication errors, make sure your Firebase project has the Email/Password sign-in method enabled.
- If you see database permission errors, check your Firestore security rules.
- If you see missing index errors, follow the provided link to create the required index. 