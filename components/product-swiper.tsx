"use client"

import { useState, useRef, useEffect } from "react"
import { useSprings, animated, useSpring } from "@react-spring/web"
import { useDrag } from "@use-gesture/react"
import Image from "next/image"
import { ArrowDown, ArrowUp, Check, X, Hand } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import { getProductsFromFirebase } from "@/lib/firebase"

// Replace the products array with a placeholder that will be filled from Firebase
const placeholderProducts = [
  {
    id: 1,
    name: "Loading...",
    description: "Loading product details",
    price: 0,
    image: "/placeholder.svg?height=400&width=300",
    category: "loading",
  },
  {
    id: 2,
    name: "Loading...",
    description: "Loading product details",
    price: 0,
    image: "/placeholder.svg?height=400&width=300",
    category: "loading",
  },
  {
    id: 3,
    name: "Loading...",
    description: "Loading product details",
    price: 0,
    image: "/placeholder.svg?height=400&width=300",
    category: "loading",
  },
  {
    id: 4,
    name: "Loading...",
    description: "Loading product details",
    price: 0,
    image: "/placeholder.svg?height=400&width=300",
    category: "loading",
  },
]

// Feedback types
type FeedbackType = "fair" | "higher" | "lower" | "dislike" | null

// Replace the ProductSwiper component with this updated version
export default function ProductSwiper() {
  const isMobile = useMobile()
  const [gone] = useState(() => new Set())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [feedback, setFeedback] = useState<FeedbackType>(null)
  const [feedbackHistory, setFeedbackHistory] = useState<Array<{ productId: number | string; feedback: FeedbackType }>>(
    [],
  )
  const [showTutorial, setShowTutorial] = useState(true)

  // State for Firebase products
  const [products, setProducts] = useState(placeholderProducts)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch products from Firebase on component mount
  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true)
      const firebaseProducts = await getProductsFromFirebase()

      if (firebaseProducts.length > 0) {
        setProducts(firebaseProducts)
      }
      setIsLoading(false)
    }

    loadProducts()
  }, [])

  // Create a ref for the container to calculate bounds
  const containerRef = useRef<HTMLDivElement>(null)

  // Animation for the tutorial hand
  const tutorialAnimation = useSpring({
    from: { x: 0, y: 0, opacity: 0 },
    to: async (next) => {
      if (showTutorial) {
        await next({ opacity: 1, delay: 500 })
        await next({ x: 100, y: 0 }) // Swipe right (Fair)
        await next({ x: 0, y: 0, delay: 300 })
        await next({ x: -100, y: 0 }) // Swipe left (Dislike)
        await next({ x: 0, y: 0, delay: 300 })
        await next({ x: 0, y: -100 }) // Swipe up (Higher)
        await next({ x: 0, y: 0, delay: 300 })
        await next({ x: 0, y: 100 }) // Swipe down (Lower)
        await next({ x: 0, y: 0, delay: 300 })
        await next({ opacity: 0 })
      }
    },
    config: { tension: 120, friction: 14 },
    onRest: () => {
      setShowTutorial(false)
    },
  })

  const [springs, api] = useSprings(products.length, (i) => ({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: i === currentIndex ? 1 : 0,
    zIndex: products.length - i,
    immediate: false,
  }))

  // Gesture handler for drag
  const bind = useDrag(({ args: [index], active, movement: [mx, my], direction: [xDir, yDir], velocity: [vx, vy] }) => {
    // Only process the current card
    if (index !== currentIndex) return

    const trigger = Math.max(vx, vy) > 0.2
    const dir = getSwipeDirection(mx, my, xDir, yDir)

    if (!active && trigger) {
      // Card has been swiped enough to be removed
      gone.add(index)

      // Record feedback based on swipe direction
      const newFeedback = dir === "right" ? "fair" : dir === "up" ? "higher" : dir === "down" ? "lower" : "dislike"

      setFeedback(newFeedback)
      setFeedbackHistory([
        ...feedbackHistory,
        {
          productId: products[index].id,
          feedback: newFeedback,
        },
      ])

      // Animate the card off screen
      api.start((i) => {
        if (i !== index) return
        const x = dir === "left" ? -500 : dir === "right" ? 500 : 0
        const y = dir === "up" ? -500 : dir === "down" ? 500 : 0
        return {
          x,
          y,
          rotation: dir === "left" || dir === "right" ? mx / 10 : 0,
          opacity: 0,
          config: { friction: 50, tension: 200 },
        }
      })

      setTimeout(() => {
        if (currentIndex < products.length - 1) {
          setCurrentIndex(currentIndex + 1)
          setFeedback(null)
        } else {
          // We've reached the end of products, show summary
          setCurrentIndex(products.length)
        }
      }, 300)
    } else {
      // Update the card position during drag
      api.start((i) => {
        if (i !== index) return

        // Determine feedback during drag
        const tempDir = getSwipeDirection(mx, my, xDir, yDir)
        const tempFeedback =
          tempDir === "right"
            ? "fair"
            : tempDir === "up"
              ? "higher"
              : tempDir === "down"
                ? "lower"
                : tempDir === "left"
                  ? "dislike"
                  : null

        if (tempFeedback !== feedback) {
          setFeedback(tempFeedback)
        }

        return {
          x: active ? mx : 0,
          y: active ? my : 0,
          rotation: mx / 10,
          scale: active ? 1.05 : 1,
          config: { friction: 50, tension: active ? 800 : 500 },
        }
      })
    }
  })

  // Helper function to determine swipe direction
  const getSwipeDirection = (mx: number, my: number, xDir: number, yDir: number) => {
    const absX = Math.abs(mx)
    const absY = Math.abs(my)

    if (absX > absY) {
      return mx > 50 ? "right" : mx < -50 ? "left" : null
    } else {
      return my < -50 ? "up" : my > 50 ? "down" : null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (currentIndex >= products.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-4">
        <h2 className="text-xl font-bold mb-4">Thank you for your feedback!</h2>
        <p className="mb-6">Your input will help improve our pricing recommendations.</p>
        <button
          onClick={() => {
            setCurrentIndex(0)
            setFeedbackHistory([])
            gone.clear()
          }}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Start Again
        </button>

        {feedbackHistory.length > 0 && (
          <div className="mt-8 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Your Feedback Summary:</h3>
            <ul className="space-y-2">
              {feedbackHistory.map((item, index) => {
                const product = products.find((p) => p.id === item.productId)
                return (
                  <li key={index} className="flex justify-between p-2 bg-gray-100 rounded">
                    <span>{product?.name}</span>
                    <span
                      className={cn({
                        "text-green-600": item.feedback === "fair",
                        "text-purple-600": item.feedback === "higher",
                        "text-amber-600": item.feedback === "lower",
                        "text-red-600": item.feedback === "dislike",
                      })}
                    >
                      {item.feedback === "fair"
                        ? "Fair Price"
                        : item.feedback === "higher"
                          ? "Price Higher"
                          : item.feedback === "lower"
                            ? "Price Lower"
                            : "Not Interested"}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative h-[70vh] w-full" ref={containerRef}>
      {/* Repositioned feedback indicators */}
      <div className="absolute top-0 left-0 right-0 flex justify-center z-10 p-2 pointer-events-none">
        <div className="flex flex-col items-center">
          <ArrowUp size={24} className="text-purple-500" />
          <span className="text-sm font-medium">Higher</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex justify-center z-10 p-2 pointer-events-none">
        <div className="flex flex-col items-center">
          <ArrowDown size={24} className="text-amber-500" />
          <span className="text-sm font-medium">Lower</span>
        </div>
      </div>

      <div className="absolute top-1/2 left-0 -translate-y-1/2 flex flex-col items-center z-10 p-2 pointer-events-none">
        <div className="flex flex-col items-center">
          <X size={24} className="text-red-500" />
          <span className="text-sm font-medium">Dislike</span>
        </div>
      </div>

      <div className="absolute top-1/2 right-0 -translate-y-1/2 flex flex-col items-center z-10 p-2 pointer-events-none">
        <div className="flex flex-col items-center">
          <Check size={24} className="text-green-500" />
          <span className="text-sm font-medium">Fair</span>
        </div>
      </div>

      {/* Tutorial animation */}
      {showTutorial && (
        <animated.div
          style={tutorialAnimation}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
        >
          <div className="bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg">
            <Hand size={40} className="text-primary" />
          </div>
        </animated.div>
      )}

      {/* Cards */}
      {springs.map((props, i) => {
        const product = products[i]
        return (
          <animated.div
            key={i}
            style={{
              ...props,
              position: "absolute",
              width: "100%",
              height: "100%",
              willChange: "transform",
              touchAction: "none",
            }}
            {...(i === currentIndex ? bind(i) : {})}
          >
            <div className="relative w-full h-full bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Product image */}
              <div className="relative w-full h-[60%]">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Product info */}
              <div className="p-4 h-[40%] flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold">{product.name}</h2>
                  <p className="text-gray-600">{product.description}</p>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-primary">฿{(product.price * 33.39).toFixed(2)}</p>
                </div>
              </div>

              {/* Feedback indicators that appear during swipe */}
              <div
                className={cn(
                  "absolute top-1/2 right-8 -translate-y-1/2 p-3 rounded-full text-white font-bold transform transition-all duration-200",
                  {
                    "opacity-0 scale-0": feedback !== "fair",
                    "opacity-100 scale-100": feedback === "fair",
                    "bg-green-500": true,
                  },
                )}
              >
                <Check size={32} />
              </div>

              <div
                className={cn(
                  "absolute top-8 left-1/2 -translate-x-1/2 p-3 rounded-full text-white font-bold transform transition-all duration-200",
                  {
                    "opacity-0 scale-0": feedback !== "higher",
                    "opacity-100 scale-100": feedback === "higher",
                    "bg-purple-500": true,
                  },
                )}
              >
                <ArrowUp size={32} />
              </div>

              <div
                className={cn(
                  "absolute bottom-8 left-1/2 -translate-x-1/2 p-3 rounded-full text-white font-bold transform transition-all duration-200",
                  {
                    "opacity-0 scale-0": feedback !== "lower",
                    "opacity-100 scale-100": feedback === "lower",
                    "bg-amber-500": true,
                  },
                )}
              >
                <ArrowDown size={32} />
              </div>

              <div
                className={cn(
                  "absolute top-1/2 left-8 -translate-y-1/2 p-3 rounded-full text-white font-bold transform transition-all duration-200",
                  {
                    "opacity-0 scale-0": feedback !== "dislike",
                    "opacity-100 scale-100": feedback === "dislike",
                    "bg-red-500": true,
                  },
                )}
              >
                <X size={32} />
              </div>
            </div>
          </animated.div>
        )
      })}

      {/* Progress indicator */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <p className="text-sm text-gray-500">
          {currentIndex + 1}/{products.length}
        </p>
      </div>
    </div>
  )
}
