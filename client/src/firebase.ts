import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: any = null;
let auth: any = null;

export function initFirebase() {
  console.log("Firebase config:", { 
    hasApiKey: !!firebaseConfig.apiKey,
    hasAppId: !!firebaseConfig.appId, 
    hasProjectId: !!firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
  });
  
  if (firebaseConfig.apiKey && firebaseConfig.appId && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log("Firebase initialized successfully");
  } else {
    console.error("Firebase config missing required fields");
  }
}

export function googleLogin() {
  if (!auth) {
    console.error("Firebase not initialized");
    return;
  }
  
  console.log("Starting Google sign-in with redirect...");
  const provider = new GoogleAuthProvider();
  signInWithRedirect(auth, provider);
}

export function handleGoogleRedirect() {
  if (!auth) {
    console.error("Firebase not initialized");
    return Promise.resolve(null);
  }
  
  console.log("Checking for Google redirect result...");
  return getRedirectResult(auth).then(result => {
    if (result) {
      console.log("✅ Google redirect result found:", { 
        user: !!result.user, 
        email: result.user?.email,
        uid: result.user?.uid 
      });
    } else {
      console.log("ℹ️ No redirect result found (this is normal on regular page loads)");
    }
    return result;
  }).catch(error => {
    console.error("❌ Error getting redirect result:", error);
    throw error;
  });
}

export { auth };