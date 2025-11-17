// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCia9-esucVF8XuSevij8n9YgBim6yKHhQ",
  authDomain: "pipettepro-30895.firebaseapp.com",
  projectId: "pipettepro-30895",
  storageBucket: "pipettepro-30895.firebasestorage.app",
  messagingSenderId: "65064220080",
  appId: "1:65064220080:web:ab70788f9fd429e069d275",
  measurementId: "G-YNCR7NGRFX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };
