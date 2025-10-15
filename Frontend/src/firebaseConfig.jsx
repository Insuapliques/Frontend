import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// ✅ Nueva configuración del proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDj8z6GlcXBr_K-narXAQhq3QOq2b0Yf5M",
  authDomain: "chat-bot-7ffe3.firebaseapp.com",
  projectId: "chat-bot-7ffe3",
  storageBucket: "chat-bot-7ffe3.firebasestorage.app", 
  messagingSenderId: "794774375240",
  appId: "1:794774375240:web:00e5f876ac9fe128f8017d",
  measurementId: "G-47142H1TW3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };





