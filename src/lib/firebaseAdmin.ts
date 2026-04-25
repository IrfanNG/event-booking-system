import * as admin from 'firebase-admin';

// Helper to format private key correctly
const formatPrivateKey = (key: string | undefined) => {
  if (!key) return undefined;
  // Handle escaped \n strings and ensure no accidental wrapping quotes
  return key.replace(/\\n/g, '\n').trim(); 
};

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

if (!admin.apps.length) {
  if (projectId && clientEmail && privateKey && privateKey.includes('BEGIN PRIVATE KEY')) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("Firebase Admin initialized successfully.");
    } catch (error) {
      console.error('Firebase admin initialization error:', error);
    }
  } else {
    console.warn("Firebase Admin credentials missing or format invalid. Auth verification will fail gracefully.");
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;
