import * as admin from 'firebase-admin';

let firebaseAdminApp: admin.app.App | null = null;

function initializeFirebaseAdmin() {
  // If the app is already initialized, do nothing.
  if (admin.apps.length > 0) {
    firebaseAdminApp = admin.app();
    return;
  }

  // --- Add these checks ---
  if (!admin || !admin.INTERNAL) {
    console.error("Firebase Admin SDK not loaded correctly. 'admin' or 'admin.INTERNAL' is undefined.");
    // Depending on how critical this is, you might throw an error here
    // or just return and let the getFirebaseAdmin() handle the uninitialized state.
    return;
  }
  // --- End of checks ---


  // Use individual environment variables for reliability.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  // Get the private key string directly - expect actual newlines in the env var
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.error('Firebase Admin SDK environment variables (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL) are not set. Please check your .env.local file.');
    return;
  }

  try {
    // Pass the private key string directly, assuming it has actual newlines
    firebaseAdminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId as string, // Add type assertion
        privateKey: privateKey, // Pass the private key string directly
        clientEmail: clientEmail as string, // Add type assertion
      }),
    });

    console.log("Firebase Admin SDK initialized successfully!"); // Add this log


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
