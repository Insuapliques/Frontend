import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Firebase configuration - Uses environment variables when available, falls back to defaults
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDj8z6GlcXBr_K-narXAQhq3QOq2b0Yf5M",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "chat-bot-7ffe3.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "chat-bot-7ffe3",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "chat-bot-7ffe3.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "794774375240",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:794774375240:web:00e5f876ac9fe128f8017d",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-47142H1TW3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://us-central1-chat-bot-7ffe3.cloudfunctions.net/api/v1";

export { db, storage, auth };





