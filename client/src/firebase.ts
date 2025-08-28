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
  if (firebaseConfig.apiKey && firebaseConfig.appId && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
}

export function googleLogin() {
  if (!auth) {
    console.error("Firebase not initialized");
    return;
  }
  
  const provider = new GoogleAuthProvider();
  signInWithRedirect(auth, provider);
}

export function handleGoogleRedirect() {
  if (!auth) {
    console.error("Firebase not initialized");
    return Promise.resolve(null);
  }
  
  return getRedirectResult(auth);
}

export { auth };