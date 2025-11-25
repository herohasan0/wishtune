import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, signInWithCustomToken, Auth } from 'firebase/auth';

// Firebase client configuration (safe to expose in browser)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase client-side app
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (typeof window !== 'undefined') {
  // Only initialize in browser
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);
  auth = getAuth(app);
}

/**
 * Sign in to Firebase Auth using custom token from NextAuth session
 * This allows Firestore security rules to work properly
 */
export async function signInWithSessionToken(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Check if already signed in
    if (auth.currentUser) {
      return true;
    }

    // Fetch custom token from our API
    const response = await fetch('/api/firebase-token');

    if (!response.ok) {
      console.error('Failed to fetch Firebase token:', response.status);
      return false;
    }

    const { token } = await response.json();

    // Sign in with custom token
    await signInWithCustomToken(auth, token);

    return true;
  } catch (error) {
    console.error('Error signing in to Firebase:', error);
    return false;
  }
}

/**
 * Sign out from Firebase Auth
 */
export async function signOutFirebase(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out from Firebase:', error);
  }
}

export { db as clientDb, auth as clientAuth };
