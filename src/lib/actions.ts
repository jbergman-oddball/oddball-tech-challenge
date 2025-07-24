
"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import {
  generateCustomChallenge,
  GenerateCustomChallengeInput,
} from "@/ai/flows/generate-custom-challenge";
import {
  promptChallengeCreation,
} from "@/ai/flows/prompt-challenge-creation";
import { CustomChallengeFormSchema, PromptChallengeFormSchema } from "@/lib/schemas";
import { getFirebaseAdmin } from "./firebase/server";
import type { UserProfile } from "@/types";
import { sendApprovalConfirmationEmail } from "./email";

const sessionCookieName = 'codealchemist-session';

export async function createCustomChallengeAction(
  formData: FormData // Accept FormData directly
) {
  const { db } = getFirebaseAdmin();

  // Extract data from FormData
  const candidateName = formData.get('candidateName') as string;
  const candidateEmail = formData.get('candidateEmail') as string;
  const jobTitle = formData.get('jobTitle') as string;
  const resumeFile = formData.get('resumeFile') as File | null; // Get the file
  const resumeText = formData.get('resumeText') as string | null; // Get resume text if provided

  // Basic validation (you might want more robust validation)
  if (!candidateName || !candidateEmail || !jobTitle || (!resumeFile && !resumeText)) {
      throw new Error("Missing required form data.");
  }

  let resumeContent = '';

  if (resumeFile) {
      // **TODO: Implement actual resume file upload to storage**
      // Example: Upload resumeFile to Firebase Storage and get a download URL
      console.log(`Handling resume file upload: ${resumeFile.name}, type: ${resumeFile.type}, size: ${resumeFile.size} bytes`);

      // Placeholder for file upload logic
      // const resumeUrl = await uploadFileToStorage(resumeFile);
      // resumeContent = `[Resume uploaded: ${resumeUrl}]`; // Or store the URL
       resumeContent = `[Resume file: ${resumeFile.name}]`; // Placeholder

      // **TODO: Extract text from the resume file if needed for AI flow**
       // For now, we'll just use a placeholder or rely on resumeText if provided
       if (resumeText) {
            resumeContent = resumeText; // Use text if provided
       }

  } else if (resumeText) {
       resumeContent = resumeText;
  }

  if (!resumeContent) {
       throw new Error("Resume content is missing.");
  }

  const aiInput: GenerateCustomChallengeInput = { jobTitle, resume: resumeContent };
  const result = await generateCustomChallenge(aiInput);

  const newChallenge = {
    candidateName,
    candidateEmail,
    jobTitle,
    ...result,
    status: "Pending",
    createdAt: new Date(),
     // **TODO: Store resume file URL or reference in the challenge document**
     // resumeUrl: resumeUrl, 
  };

  try {
     await db.collection("challenges").add(newChallenge);
  } catch (e) {
     console.error("Error adding document: ", e);
     throw new Error("Could not save challenge to database.");
  }

  return result;
}

export async function createPromptedChallengeAction(
  data: z.infer<typeof PromptChallengeFormSchema>
) {
  const { db } = getFirebaseAdmin();
  const validatedData = PromptChallengeFormSchema.safeParse(data);
  if (!validatedData.success) {
    throw new Error("Invalid form data.");
  }

  const result = await promptChallengeCreation(validatedData.data);

  const newChallenge = {
    // Assuming a generic challenge or tied to a req
    candidateName: "N/A (Prompted)",
    candidateEmail: "N/A",
    jobTitle: "Prompted Challenge",
    ...result,
    status: "Pending",
    createdAt: new Date(),
  };
  
  try {
    await db.collection("challenges").add(newChallenge);
  } catch (e) {
    console.error("Error adding document: ", e);
    throw new Error("Could not save challenge to database.");
  }

  return result;
}

export async function setSession(idToken: string) {
  const { auth } = getFirebaseAdmin();
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
  cookies().set(sessionCookieName, sessionCookie, {
    maxAge: expiresIn,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  cookies().delete(sessionCookieName);
}

export async function getAllUsers(): Promise<UserProfile[]> {
    const { db } = getFirebaseAdmin();
    const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
    const users: UserProfile[] = [];
    usersSnapshot.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt._seconds * 1000);
        users.push({
            ...data,
            createdAt: createdAt,
        } as UserProfile);
    });
    return users;
}

export async function approveUser(uid: string): Promise<{ success: boolean; error?: string }> {
    const { db } = getFirebaseAdmin();
    try {
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return { success: false, error: 'User not found.' };
        }
        const userData = userDoc.data() as UserProfile;

        await userRef.update({
            status: 'active',
            role: 'user',
        });
        
        await sendApprovalConfirmationEmail(userData.email, userData.name);
        
        return { success: true };
    } catch (error: any) {
        console.error('Error approving user:', error);
        return { success: false, error: 'An unexpected error occurred during approval.' };
    }
}

export async function extendSession(): Promise<{ success: boolean; error?: string }> {
  const { auth } = getFirebaseAdmin();
  const sessionCookie = cookies().get(sessionCookieName)?.value;

  if (!sessionCookie) {
    return { success: false, error: 'No session cookie found.' };
  }

  try {
    // Verify the session cookie and get the user's UID
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    const uid = decodedClaims.uid;

    // **TODO: Implement session refreshing logic**
    // This is a placeholder. You might need to get a new ID token using a refresh token
    // stored on the server, or re-mint the session cookie based on your setup.
    console.log('Extending session for user:', uid);

    // For demonstration, re-minting the session cookie with the existing ID token
    // This might not be the most secure or robust way to extend a session in production.
    // Consider using refresh tokens or other mechanisms provided by Firebase Auth.
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // Renew for 5 days
    const newSessionCookie = await auth.createSessionCookie(sessionCookie, { expiresIn }); // Using old session cookie to create new one (check Firebase docs for best practice)

     cookies().set(sessionCookieName, newSessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error extending session:', error);
    cookies().delete(sessionCookieName); // Clear cookie on error
    return { success: false, error: error.message || 'Failed to extend session.' };
  }
}
