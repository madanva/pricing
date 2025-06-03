import { initializeApp } from "firebase/app"
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore"

// Replace the existing firebaseConfig object with the user's provided credentials
const firebaseConfig = {
  apiKey: "AIzaSyBeHHOeAVX1AHpnL8h5v8gd6yLyDGIGUv4",
  authDomain: "fir-db-gdx2.firebaseapp.com",
  projectId: "firebase-db-gdx2",
  storageBucket: "firebase-db-gdx2.firebasestorage.app",
  messagingSenderId: "102895449534",
  appId: "1:102895449534:web:c0426dbfd2c9eb947d35ef",
  measurementId: "G-7KTWCSEZ7Y",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Export Firestore instance and functions
export { db, doc, getDoc, updateDoc, arrayUnion }
