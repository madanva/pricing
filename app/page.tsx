"use client"

import { useState, useEffect } from "react"
import ProductSwiper from "./components/ProductSwiper"
import LandingPage from "./components/LandingPage"
import { db, doc, getDoc, updateDoc, arrayUnion } from "./firebase"
// Add import for mock data
import { mockProducts } from "./components/mock-data"
import { LanguageProvider } from "@/contexts/LanguageContext"

// Fixed product IDs
const PRODUCT_IDS = ["21-40092", "24S5A-FD182", "Y5435WR", "L901986Da"]

// Fallback products in case Firebase fails
const fallbackProducts = PRODUCT_IDS.map((id) => ({
  id,
  image: `/placeholder.svg?height=400&width=300&text=${id}`,
  price: 20,
}))

// Function to convert USD to THB
const convertToTHB = (usdPrice: number): number => {
  const exchangeRate = 33.39 // THB per 1 USD
  return usdPrice * exchangeRate
}

type Product = {
  id: string
  image: string
  price: number
}

type FeedbackType = "fair" | "higher" | "lower" | "dislike" | null

export default function Home() {
  const [showSwiper, setShowSwiper] = useState(false)
  const [products, setProducts] = useState<Product[]>(fallbackProducts)
  const [isLoading, setIsLoading] = useState(true)

  // Calculate average of numbers less than 100
  const calculateAveragePrice = (quizResults: any[]): number => {
    if (!Array.isArray(quizResults) || quizResults.length === 0) {
      return 20 // Default price if no valid quiz results
    }

    // Filter for numbers less than 100
    const validScores = quizResults.filter((score) => typeof score === "number" && !isNaN(score) && score < 100)

    if (validScores.length === 0) {
      return 20 // Default price if no valid scores
    }

    // Calculate average
    const sum = validScores.reduce((total, score) => total + score, 0)
    const average = sum / validScores.length

    // Round to 2 decimal places
    return Math.round(average * 100) / 100
  }

  // Modify the loadProducts function to use mock data if Firebase fails
  async function loadProducts() {
    setIsLoading(true)
    const fetchedProducts: Product[] = []

    try {
      for (const id of PRODUCT_IDS) {
        try {
          const docRef = doc(db, "products", id)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            const data = docSnap.data()

            // Calculate price from classQuizResults
            const quizResults = data.classQuizResults || []
            const calculatedPrice = calculateAveragePrice(quizResults)

            console.log(`Product ${id} quiz results:`, quizResults)
            console.log(`Product ${id} calculated price:`, calculatedPrice)

            fetchedProducts.push({
              id,
              image: data.image_url || `/placeholder.svg?height=400&width=300&text=${id}`,
              price: calculatedPrice,
            })
          } else {
            console.log(`Product ${id} not found, using fallback`)
            // Find the mock product with matching ID
            const mockProduct = mockProducts.find((p) => p.id === id)
            fetchedProducts.push({
              id,
              image: mockProduct?.image || `/placeholder.svg?height=400&width=300&text=${id}`,
              price: mockProduct?.price || 20,
            })
          }
        } catch (error) {
          console.error(`Error loading product ${id}:`, error)
          // Find the mock product with matching ID
          const mockProduct = mockProducts.find((p) => p.id === id)
          fetchedProducts.push({
            id,
            image: mockProduct?.image || `/placeholder.svg?height=400&width=300&text=${id}`,
            price: mockProduct?.price || 20,
          })
        }
      }

      if (fetchedProducts.length > 0) {
        setProducts(fetchedProducts)
      }
    } catch (error) {
      console.error("Error in product loading:", error)
      // Use mock products as fallback
      setProducts(
        mockProducts.map((p) => ({
          id: p.id,
          image: p.image,
          price: p.price,
        })),
      )
    }

    setIsLoading(false)
  }

  // Fetch product data from Firebase
  useEffect(() => {
    loadProducts()
  }, [])

  // Function to store feedback in Firebase
  const storeFeedback = async (productId: string, price: number, feedback: FeedbackType) => {
    try {
      const docRef = doc(db, "products", productId)
      const thbPrice = convertToTHB(price)

      // Store feedback as an object with both USD and THB prices
      await updateDoc(docRef, {
        responses: arrayUnion({
          priceUSD: price,
          priceTHB: thbPrice,
          feedback: feedback,
          timestamp: new Date().toISOString(),
          currency: "THB",
        }),
      })

      console.log(
        `Stored feedback for product ${productId}: ${feedback} at price ฿${thbPrice.toFixed(2)} (${price} USD)`,
      )
    } catch (error) {
      console.error(`Error storing feedback for product ${productId}:`, error)
    }
  }

  // Handle quiz completion
  const handleQuizComplete = () => {
    setShowSwiper(false)
  }

  return (
    <LanguageProvider>
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="w-full max-w-md mx-auto">
          {showSwiper ? (
            <ProductSwiper products={products} onComplete={handleQuizComplete} storeFeedback={storeFeedback} />
          ) : (
            <LandingPage onBegin={() => setShowSwiper(true)} isLoading={isLoading} />
          )}
        </div>
      </main>
    </LanguageProvider>
  )
}
