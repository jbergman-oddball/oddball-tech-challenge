
import * as admin from 'firebase-admin';
import { decode } from 'base-64'; // Import the decode function

let firebaseAdminApp: admin.app.App | null = null;

function initializeFirebaseAdmin() {
  // If the app is already initialized, do nothing.
  if (admin.apps.length > 0) {
    firebaseAdminApp = admin.app();
    return;
  }

  // Use individual environment variables for reliability.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64; // Get the Base64 string
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKeyBase64 || !clientEmail) {
    console.error('Firebase Admin SDK environment variables (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY_BASE64, FIREBASE_CLIENT_EMAIL) are not set. Please check your .env.local file.');
    return;
  }

  try {
    // Decode the Base64 private key back to a string
    const formattedPrivateKey = decode(privateKeyBase64);

    firebaseAdminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId as string, // Add type assertion
        privateKey: formattedPrivateKey, // Pass the decoded string
        clientEmail: clientEmail as string, // Add type assertion
      }),
    });
  } catch (e: any) {
    console.error('Firebase Admin SDK initialization from individual variables failed. Error:', e.message);
    console.error('Full error object:', e); // Log the full error object
    throw new Error('Firebase Admin SDK initialization failed. Check server logs for details.');
  }
}

// Initialize on module load.
initializeFirebaseAdmin();

export function getFirebaseAdmin() {
  if (!firebaseAdminApp) {
    console.log("Firebase Admin App not initialized. Attempting re-initialization...");
    initializeFirebaseAdmin();
    if (!firebaseAdminApp) {
      throw new Error("Firebase Admin SDK is not initialized. Check your environment variables and server logs.");
    }
  }

  return {
    auth: admin.auth(firebaseAdminApp),
    db: admin.firestore(firebaseAdminApp)
  };
}
