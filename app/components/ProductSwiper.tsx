"use client"

import { useState, useEffect, useRef } from "react"
import { useSprings, animated, useSpring } from "@react-spring/web"
import { useDrag } from "@use-gesture/react"
import Image from "next/image"
import { ArrowDown, ArrowUp, Check, X, Hand, ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import ShareButton from "./ShareButton"
import LanguageToggle from "../../components/LanguageToggle"
import { useLanguage } from "@/contexts/LanguageContext"

type Product = {
  id: string
  image: string
  price: number
}

type FeedbackType = "fair" | "higher" | "lower" | "dislike" | null
type Direction = "up" | "down" | "left" | "right" | null

interface ProductSwiperProps {
  products: Product[]
  onComplete: () => void
  storeFeedback: (productId: string, price: number, feedback: FeedbackType) => Promise<void>
}

export default function ProductSwiper({ products, onComplete, storeFeedback }: ProductSwiperProps) {
  const { t } = useLanguage()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [feedback, setFeedback] = useState<FeedbackType>(null)
  const [feedbackHistory, setFeedbackHistory] = useState<Array<{ productId: string; feedback: FeedbackType }>>([])
  const [showTutorial, setShowTutorial] = useState(true)
  const [showInstructions, setShowInstructions] = useState(true)
  const isMobile = useMobile()

  // Ref to track if component is mounted
  const isMounted = useRef(true)

  // Tutorial animation - show a hand swiping in different directions
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
    onRest: () => setShowTutorial(false),
  })

  // Create a set to track which cards have been swiped
  const [gone] = useState(() => new Set())

  // Helper function to determine swipe direction with very low threshold
  const getSwipeDirection = (mx: number, my: number): Direction => {
    const absX = Math.abs(mx)
    const absY = Math.abs(my)

    // Very low threshold for easier detection
    const threshold = 20

    // Check if we have enough movement in any direction
    if (mx > threshold) return "right"
    if (mx < -threshold) return "left"
    if (my < -threshold) return "up"
    if (my > threshold) return "down"

    return null
  }

  // Function to handle card removal and next card display
  const removeCard = async (index: number, dir: Direction) => {
    // Prevent duplicate removal
    if (gone.has(index)) return

    console.log(`Removing card ${index}, direction: ${dir}`)

    // Debug the feedback type based on direction
    const debugFeedback = dir === "right" ? "fair" : dir === "up" ? "higher" : dir === "down" ? "lower" : "dislike"
    console.log(`Direction: ${dir}, Feedback: ${debugFeedback}`)

    // Mark this card as gone
    gone.add(index)

    // Determine feedback based on swipe direction
    const newFeedback: FeedbackType =
      dir === "right" ? "fair" : dir === "up" ? "higher" : dir === "down" ? "lower" : "dislike"

    // Update feedback state
    setFeedback(newFeedback)

    const product = products[index]

    // Add to feedback history
    setFeedbackHistory((prev) => [
      ...prev,
      {
        productId: product.id,
        feedback: newFeedback,
      },
    ])

    // Store feedback in Firebase
    try {
      await storeFeedback(product.id, product.price, newFeedback)
    } catch (error) {
      console.error("Error storing feedback:", error)
    }

    // Animate the card off screen
    api.start((i) => {
      if (i !== index) return

      const x = dir === "left" ? -500 : dir === "right" ? 500 : 0
      const y = dir === "up" ? -500 : dir === "down" ? 500 : 0

      return {
        x,
        y,
        rotation: dir === "left" || dir === "right" ? (dir === "left" ? -30 : 30) : 0,
        opacity: 0,
        config: { friction: 50, tension: 200 },
      }
    })

    // Move to next card after a short delay
    setTimeout(() => {
      if (isMounted.current) {
        console.log(`Moving to next card, current: ${index}, next: ${index + 1}`)
        setCurrentIndex(index + 1)
        setFeedback(null)
      }
    }, 300)
  }

  // Set up springs for card animations
  const [springs, api] = useSprings(products.length, (i) => ({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: i === currentIndex ? 1 : 0,
    zIndex: products.length - i,
    config: { friction: 50, tension: 500 },
  }))

  // Completely rewritten drag binding for more reliable swipe detection
  const bind = useDrag(
    ({ args: [index], active, movement: [mx, my], direction: [dx, dy], velocity }) => {
      // Only process the current card
      if (index !== currentIndex) return

      // Get current direction based on movement
      const dir = getSwipeDirection(mx, my)

      // Update feedback indicator during drag
      const tempFeedback: FeedbackType =
        dir === "right"
          ? "fair"
          : dir === "up"
            ? "higher"
            : dir === "down"
              ? "lower"
              : dir === "left"
                ? "dislike"
                : null

      if (tempFeedback !== feedback) {
        setFeedback(tempFeedback)
      }

      // If we're actively dragging, update the card position
      if (active) {
        api.start((i) => {
          if (i !== index) return

          return {
            x: mx,
            y: my,
            rotation: mx / 10,
            scale: 1.05,
            config: { friction: 50, tension: 800 },
          }
        })
      }
      // When released
      else {
        // If we have a direction and moved enough
        if (dir) {
          // Calculate total movement distance
          const distance = Math.sqrt(mx * mx + my * my)

          console.log(`Swipe detected: ${dir}, distance: ${distance}, movement: [${mx}, ${my}]`)

          // If moved enough distance, process the swipe
          if (distance > 30) {
            // Lower threshold for easier swipe detection
            removeCard(index, dir)
            // Hide instructions after first successful swipe
            setShowInstructions(false)
          } else {
            // Not enough movement, return to center
            api.start((i) => {
              if (i !== index) return
              return {
                x: 0,
                y: 0,
                rotation: 0,
                scale: 1,
                config: { friction: 50, tension: 500 },
              }
            })
          }
        } else {
          // No direction detected, return to center
          api.start((i) => {
            if (i !== index) return
            return {
              x: 0,
              y: 0,
              rotation: 0,
              scale: 1,
              config: { friction: 50, tension: 500 },
            }
          })
        }
      }
    },
    { filterTaps: true },
  )

  // Update card visibility when currentIndex changes
  useEffect(() => {
    console.log(`Current index changed to ${currentIndex}`)

    // Reset the springs for all cards
    api.start((i) => {
      if (i < currentIndex) {
        // Cards that have been swiped
        return {
          opacity: 0,
          x: 0,
          y: 0,
          immediate: true,
        }
      } else if (i === currentIndex) {
        // Current card
        return {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          immediate: false,
        }
      } else {
        // Cards that haven't been shown yet
        return {
          opacity: 0,
          x: 0,
          y: 0,
          immediate: true,
        }
      }
    })
  }, [currentIndex, api])

  // Update springs when products change
  useEffect(() => {
    if (products.length > 0) {
      api.start((i) => ({
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        opacity: i === currentIndex ? 1 : 0,
        zIndex: products.length - i,
      }))
    }
  }, [products, api, currentIndex])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Handle button clicks for feedback
  const handleButtonFeedback = (feedbackType: FeedbackType) => {
    if (currentIndex < products.length) {
      const dir: Direction =
        feedbackType === "fair"
          ? "right"
          : feedbackType === "higher"
            ? "up"
            : feedbackType === "lower"
              ? "down"
              : "left"

      removeCard(currentIndex, dir)
      setShowInstructions(false)
    }
  }

  // Show summary when all products have been swiped
  if (currentIndex >= products.length) {
    return (
      <div className="relative flex flex-col items-center justify-center h-[70vh] text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
        {/* Language Toggle */}
        <div className="absolute top-4 right-4">
          <LanguageToggle />
        </div>

        <h2 className="text-xl font-bold mb-4">{t("thankYou")}</h2>
        <p className="mb-6">{t("helpImprove")}</p>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => {
              // Reset state and go back to landing page
              setCurrentIndex(0)
              setFeedbackHistory([])
              gone.clear()
              setShowInstructions(true)
              onComplete()
            }}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            {t("startAgain")}
          </button>

          <ShareButton className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" />
        </div>

        {feedbackHistory.length > 0 && (
          <div className="mt-4 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">{t("feedbackSummary")}</h3>
            <ul className="space-y-2">
              {feedbackHistory.map((item, index) => {
                const product = products.find((p) => p.id === item.productId)
                return (
                  <li key={index} className="flex justify-between p-2 bg-white/80 rounded">
                    <span>
                      {t("product")} {item.productId}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="text-gray-500 text-sm">฿{(product?.price * 33.39).toFixed(2)}</span>
                      <span
                        className={cn({
                          "text-green-600": item.feedback === "fair",
                          "text-purple-600": item.feedback === "higher",
                          "text-amber-600": item.feedback === "lower",
                          "text-red-600": item.feedback === "dislike",
                        })}
                      >
                        {item.feedback === "fair"
                          ? t("fairPriceText")
                          : item.feedback === "higher"
                            ? t("priceHigherText")
                            : item.feedback === "lower"
                              ? t("priceLowerText")
                              : t("notInterestedText")}
                      </span>
                    </div>
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
    <div className="relative h-[70vh] w-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
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

      {/* Language Toggle and Share button */}
      <div className="absolute top-2 right-2 z-30 flex gap-2">
        <LanguageToggle showText={false} />
        <ShareButton className="bg-white/80 p-2 rounded-full shadow-sm hover:bg-white" buttonText={false} />
      </div>

      {/* Tinder-style overlay instructions */}
      {showInstructions && (
        <div className="absolute inset-0 bg-black/50 z-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl max-w-xs text-center">
            <h3 className="text-xl font-bold mb-4">{t("howToRate")}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col items-center">
                <div className="bg-green-100 p-3 rounded-full mb-2">
                  <ThumbsUp className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm">{t("swipeRightFair")}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-red-100 p-3 rounded-full mb-2">
                  <ThumbsDown className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-sm">{t("swipeLeftDislike")}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-purple-100 p-3 rounded-full mb-2">
                  <ArrowUp className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-sm">{t("swipeUpHigher")}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-amber-100 p-3 rounded-full mb-2">
                  <ArrowDown className="h-6 w-6 text-amber-600" />
                </div>
                <p className="text-sm">{t("swipeDownLower")}</p>
              </div>
            </div>
            <button onClick={() => setShowInstructions(false)} className="w-full bg-primary text-white py-2 rounded-md">
              {t("gotIt")}
            </button>
          </div>
        </div>
      )}

      {/* Tinder-style swipe indicators that appear during swipe */}
      <div
        className={cn(
          "absolute top-8 left-0 right-0 flex justify-center z-30 transition-opacity duration-200",
          feedback === "higher" ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="bg-purple-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center">
          <ArrowUp className="mr-2 h-6 w-6" />
          <span className="font-bold text-lg">{t("priceHigher")}</span>
        </div>
      </div>

      <div
        className={cn(
          "absolute bottom-8 left-0 right-0 flex justify-center z-30 transition-opacity duration-200",
          feedback === "lower" ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="bg-amber-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center">
          <ArrowDown className="mr-2 h-6 w-6" />
          <span className="font-bold text-lg">{t("priceLower")}</span>
        </div>
      </div>

      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 left-8 z-30 transition-opacity duration-200",
          feedback === "dislike" ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center">
          <X className="mr-2 h-6 w-6" />
          <span className="font-bold text-lg">{t("notInterestedText")}</span>
        </div>
      </div>

      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 right-8 z-30 transition-opacity duration-200",
          feedback === "fair" ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center">
          <Check className="mr-2 h-6 w-6" />
          <span className="font-bold text-lg">{t("fairPriceText")}</span>
        </div>
      </div>

      {/* Product cards */}
      {springs.map((props, i) => {
        if (i >= products.length) return null
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
              cursor: i === currentIndex ? "grab" : "auto",
              pointerEvents: i === currentIndex ? "auto" : "none",
            }}
            {...(i === currentIndex ? bind(i) : {})}
            className={i === currentIndex ? "active-card" : ""}
          >
            <div className="relative w-full h-full bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Product image */}
              <div className="relative w-full h-[55%] flex items-center justify-center mt-4">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={`Product ${product.id}`}
                  width={300}
                  height={400}
                  className="max-h-full max-w-full object-contain"
                  priority
                />
              </div>

              {/* Price section with better spacing */}
              <div className="flex-1 flex items-start justify-center px-4 py-4 pt-2">
                <p className="text-4xl font-bold text-primary">฿{(product.price * 33.39).toFixed(2)}</p>
              </div>

              {/* Tinder-style feedback indicators that appear on the card during swipe */}
              <div
                className={cn(
                  "absolute top-4 right-4 p-3 rounded-full text-white transform transition-all duration-200",
                  feedback === "fair" ? "opacity-100 scale-100 bg-green-500" : "opacity-0 scale-0",
                )}
              >
                <Check size={32} />
              </div>
              <div
                className={cn(
                  "absolute top-4 left-4 p-3 rounded-full text-white transform transition-all duration-200",
                  feedback === "dislike" ? "opacity-100 scale-100 bg-red-500" : "opacity-0 scale-0",
                )}
              >
                <X size={32} />
              </div>
              <div
                className={cn(
                  "absolute top-4 left-1/2 -translate-x-1/2 p-3 rounded-full text-white transform transition-all duration-200",
                  feedback === "higher" ? "opacity-100 scale-100 bg-purple-500" : "opacity-0 scale-0",
                )}
              >
                <ArrowUp size={32} />
              </div>
              <div
                className={cn(
                  "absolute bottom-24 left-1/2 -translate-x-1/2 p-3 rounded-full text-white transform transition-all duration-200",
                  feedback === "lower" ? "opacity-100 scale-100 bg-amber-500" : "opacity-0 scale-0",
                )}
              >
                <ArrowDown size={32} />
              </div>
            </div>
          </animated.div>
        )
      })}

      {/* Tinder-style button controls for alternative to swiping */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 z-20">
        <button
          onClick={() => handleButtonFeedback("dislike")}
          className="bg-red-500 text-white p-3 rounded-full shadow-md hover:bg-red-600 transition-colors"
          aria-label="Dislike"
        >
          <X size={24} />
        </button>
        <button
          onClick={() => handleButtonFeedback("lower")}
          className="bg-amber-500 text-white p-3 rounded-full shadow-md hover:bg-amber-600 transition-colors"
          aria-label="Price too low"
        >
          <ArrowDown size={24} />
        </button>
        <button
          onClick={() => handleButtonFeedback("higher")}
          className="bg-purple-500 text-white p-3 rounded-full shadow-md hover:bg-purple-600 transition-colors"
          aria-label="Price too high"
        >
          <ArrowUp size={24} />
        </button>
        <button
          onClick={() => handleButtonFeedback("fair")}
          className="bg-green-500 text-white p-3 rounded-full shadow-md hover:bg-green-600 transition-colors"
          aria-label="Fair price"
        >
          <Check size={24} />
        </button>
      </div>

      {/* Progress indicator */}
      <div className="absolute top-2 left-0 right-0 flex justify-center">
        <div className="bg-white/80 px-3 py-1 rounded-full text-xs text-gray-500 flex items-center">
          <span>{currentIndex + 1}</span>
          <span className="mx-1">/</span>
          <span>{products.length}</span>
        </div>
      </div>
    </div>
  )
}
