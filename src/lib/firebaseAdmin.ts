import * as admin from 'firebase-admin';

// Helper to format private key correctly for OpenSSL 3.0
const formatPrivateKey = (key: string | undefined) => {
  if (!key) return undefined;
  
  // 1. Remove any surrounding double or single quotes that platforms might add
  let formattedKey = key.replace(/^["']|["']$/g, '');
  
  // 2. Handle escaped \n sequences
  formattedKey = formattedKey.replace(/\\n/g, '\n');
  
  // 3. Ensure it starts and ends correctly
  return formattedKey.trim(); 
};

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

if (!admin.apps.length) {
  if (projectId && clientEmail && privateKey && privateKey.includes('BEGIN PRIVATE KEY')) {
    try {
      console.log("[FirebaseAdmin] Attempting initialization...");
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("[FirebaseAdmin] Initialized successfully.");
    } catch (error) {
      console.error('[FirebaseAdmin] Initialization error:', error);
    }
  } else {
    console.warn("[FirebaseAdmin] Credentials missing or invalid format.");
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;
