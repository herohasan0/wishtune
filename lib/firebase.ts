import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

// Initialize Firebase Admin SDK for server-side operations
let app: App;
if (getApps().length === 0) {
  let credential;

  // Option 1: Load from service account JSON file (recommended)
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
  if (serviceAccountPath) {
    try {
      const serviceAccount = JSON.parse(
        readFileSync(serviceAccountPath, 'utf8')
      );
      credential = cert(serviceAccount);
      console.log('✅ Firebase Admin initialized from service account JSON file');
    } catch (error) {
      console.error('❌ Error loading service account JSON file:', error);
      throw new Error('Failed to load Firebase service account key file');
    }
  }
  // Option 2: Use individual environment variables
  else if (
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    credential = cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
    console.log('✅ Firebase Admin initialized from environment variables');
  }
  // Option 3: Try to load from default location (firebase-service-account.json in project root)
  else {
    try {
      const defaultPath = join(process.cwd(), 'firebase-service-account.json');
      const serviceAccount = JSON.parse(readFileSync(defaultPath, 'utf8'));
      credential = cert(serviceAccount);
      console.log('✅ Firebase Admin initialized from default service account file');
    } catch (error) {
      // Option 4: Use application default credentials (for local development with gcloud)
      // Or use project ID only (will use default credentials if available)
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
                       process.env.FIREBASE_ADMIN_PROJECT_ID;
      
      if (projectId) {
        app = initializeApp({
          projectId: projectId,
        });
        console.log('✅ Firebase Admin initialized with project ID (using default credentials)');
      } else {
        throw new Error(
          'Firebase Admin initialization failed. Please provide either:\n' +
          '1. FIREBASE_SERVICE_ACCOUNT_KEY_PATH environment variable pointing to your service account JSON file, OR\n' +
          '2. firebase-service-account.json file in project root, OR\n' +
          '3. FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY environment variables'
        );
      }
    }
  }

  // Initialize with credential if we have one
  if (credential) {
    app = initializeApp({
      credential: credential,
    });
  }
} else {
  app = getApps()[0];
}

// Initialize Firestore
export const db: Firestore = getFirestore(app);
export default app;

