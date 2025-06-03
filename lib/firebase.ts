import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore"

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

// Product IDs we want to fetch
const PRODUCT_IDS = ["21-40092", "24S5A-FD182", "Y5435WR", "L901986Da"]

export async function getProductsFromFirebase() {
  try {
    const productsRef = collection(db, "products")
    const productsQuery = query(productsRef, where("title", "in", PRODUCT_IDS))
    const querySnapshot = await getDocs(productsQuery)

    const products = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.title || "Unknown Product",
        description: data.description || "",
        price: data.price || 0,
        image: data.image_url || "/placeholder.svg?height=400&width=300",
        category: data.category || "unknown",
      }
    })

    // If no products were found, throw an error to trigger fallback
    if (products.length === 0) {
      throw new Error("No products found in Firebase")
    }

    return products
  } catch (error) {
    console.error("Error fetching products from Firebase:", error)
    // Return an empty array to trigger fallback in the component
    return []
  }
}
