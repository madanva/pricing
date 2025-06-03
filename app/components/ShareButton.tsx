"use client"

import { useState, useEffect } from "react"
import { Share2, Copy, Check } from "lucide-react"

interface ShareButtonProps {
  className?: string
  buttonText?: boolean
  iconSize?: number
}

export default function ShareButton({ className = "", buttonText = true, iconSize = 20 }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [webShareSupported, setWebShareSupported] = useState(false)

  // Check if Web Share API is supported
  useEffect(() => {
    setWebShareSupported(
      typeof navigator !== "undefined" && !!navigator.share && typeof window !== "undefined" && window.isSecureContext,
    )
  }, [])

  // Handle sharing
  const handleShare = async () => {
    try {
      if (webShareSupported) {
        try {
          await navigator.share({
            title: "Clothes Swiper",
            text: "Check out this cool clothes pricing app!",
            url: window.location.href,
          })
          console.log("Content shared successfully")
          return // Exit if sharing was successful
        } catch (error) {
          console.log("Share failed, falling back to clipboard", error)
          // Fall through to clipboard method if sharing fails
        }
      }

      // Clipboard fallback
      await copyToClipboard()
    } catch (error) {
      console.error("Error in share handler:", error)
    }
  }

  // Clipboard functionality with fallbacks
  const copyToClipboard = async () => {
    const url = window.location.href

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
        showCopiedFeedback()
      } else {
        fallbackCopyToClipboard(url)
      }
    } catch (error) {
      console.error("Clipboard API failed:", error)
      fallbackCopyToClipboard(url)
    }
  }

  // Fallback copy method
  const fallbackCopyToClipboard = (text: string) => {
    try {
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      const successful = document.execCommand("copy")
      document.body.removeChild(textArea)

      if (successful) {
        showCopiedFeedback()
      } else {
        alert("Copy this link to share: " + text)
      }
    } catch (err) {
      console.error("Fallback copy failed:", err)
      alert("Copy this link to share: " + text)
    }
  }

  // Show copied feedback
  const showCopiedFeedback = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleShare}
      className={`flex items-center justify-center gap-2 ${className}`}
      aria-label={webShareSupported ? "Share" : "Copy Link"}
    >
      {copied ? (
        <>
          <Check size={iconSize} />
          {buttonText && "Copied!"}
        </>
      ) : (
        <>
          {webShareSupported ? <Share2 size={iconSize} /> : <Copy size={iconSize} />}
          {buttonText && (webShareSupported ? "Share" : "Copy Link")}
        </>
      )}
    </button>
  )
}
