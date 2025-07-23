
import * as admin from 'firebase-admin';

let firebaseAdminApp: admin.app.App | null = null;

function initializeFirebaseAdmin() {
  // If the app is already initialized, do nothing.
  if (admin.apps.length > 0) {
    firebaseAdminApp = admin.app();
    return;
  }

  // Use individual environment variables for reliability.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.error('Firebase Admin SDK environment variables (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL) are not set. Please check your .env.local file.');
    // Do not throw an error here, as it might be expected in some environments (like client-side).
    // The getFirebaseAdmin function will throw if it's called without a successful initialization.
    return;
  }

  try {
    // The private key from environment variables often has escaped newlines.
    // We need to replace them with actual newline characters.
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    firebaseAdminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: formattedPrivateKey,
        clientEmail,
      }),
    });
  } catch (e: any) {
    console.error('Firebase Admin SDK initialization from individual variables failed. Error:', e.message);
    throw new Error('Firebase Admin SDK initialization failed. Check server logs for details.');
  }
}

// Initialize on module load.
initializeFirebaseAdmin();

export function getFirebaseAdmin() {
  if (!firebaseAdminApp) {
    // This will now only be called if the initial attempt failed.
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
