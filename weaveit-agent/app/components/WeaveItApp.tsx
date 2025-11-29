"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useSolanaPayment } from "../../hooks/use-solana-payment"
import {
  Download,
  Play,
  Pause,
  Share2,
  AlertCircle,
  CheckCircle,
  DollarSign,
  FileText,
  ArrowRight,
  Video,
  Sparkles,
  LogOut,
  User,
  Wallet,
  Volume2,
  VolumeX,
  Maximize,
  Zap,
  Shield,
} from "lucide-react"

// Enhanced Video Display Component
interface VideoDisplayProps {
  videoUrl: string
  title?: string
  onClose?: () => void
}


const getBackendUrl = (path: string) => {
  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
  if (!path || typeof path !== 'string') {
    return backendBaseUrl
  }
  if (!path.startsWith("http")) {
    // Remove trailing slash if present
    return backendBaseUrl.replace(/\/$/, "") + path
  }
  return path
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({ videoUrl, title = "Generated Tutorial Video", onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Always use absolute backend URL for video
  const absoluteVideoUrl = getBackendUrl(videoUrl)

  // Log when video URL changes
  useEffect(() => {
    console.log("Video URL in display component:", absoluteVideoUrl)
  }, [absoluteVideoUrl])

  const handleDownload = async () => {
    try {
      const response = await fetch(absoluteVideoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: "Check out this AI-generated tutorial video!",
          url: absoluteVideoUrl,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      try {
        await navigator.clipboard.writeText(absoluteVideoUrl)
        // Show toast notification
        const toast = document.createElement("div")
        toast.className = "fixed top-4 right-4 bg-weaveit-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
        toast.textContent = "Video URL copied to clipboard!"
        document.body.appendChild(toast)
        setTimeout(() => document.body.removeChild(toast), 3000)
      } catch (error) {
        console.error("Failed to copy URL:", error)
      }
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current && videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen()
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-weaveit-500 to-weaveit-600 rounded-xl flex items-center justify-center">
            <Play className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <p className="text-sm text-gray-400">AI-generated tutorial video</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleShare}
            className="bg-gray-800/50 hover:bg-weaveit-500/20 text-white p-3 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-gray-700/50"
            title="Share video"
          >
            <Share2 className="w-5 h-5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-gray-800/50 hover:bg-red-500/20 text-white p-3 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-gray-700/50"
              title="Close video"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Video Container */}
      <div
        className="relative bg-black rounded-2xl overflow-hidden shadow-2xl group border border-gray-800/50"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={absoluteVideoUrl}
          className="w-full h-auto max-h-[60vh] object-contain"
          preload="metadata"
          controls
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => {
            if (videoRef.current) {
              setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100)
              setCurrentTime(videoRef.current.currentTime)
            }
          }}
          onLoadedMetadata={(e) => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration)
            }
          }}
        >
          Your browser does not support the video tag.
        </video>

        {/* Custom Controls Overlay */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 transition-all duration-300 ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        >
          {/* Progress Bar */}
          <div className="w-full bg-gray-700/50 rounded-full h-1 mb-4">
            <div
              className="bg-gradient-to-r from-weaveit-500 to-weaveit-600 h-1 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="bg-weaveit-500 hover:bg-weaveit-600 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 shadow-lg"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleMute}
                className="bg-gray-800/70 hover:bg-gray-700 text-white p-2 rounded-full transition-all duration-200"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <span className="text-white text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <button
              onClick={toggleFullscreen}
              className="bg-gray-800/70 hover:bg-gray-700 text-white p-2 rounded-full transition-all duration-200"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleDownload}
          className="flex-1 min-w-[200px] bg-gradient-to-r from-weaveit-500 to-weaveit-600 hover:from-weaveit-600 hover:to-weaveit-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
        >
          <Download className="w-5 h-5" />
          <span>Download Video</span>
        </button>

        <button
          onClick={handleShare}
          className="flex-1 min-w-[200px] bg-gray-800/50 hover:bg-gray-700/50 text-white font-semibold py-4 px-6 rounded-xl border border-gray-700/50 hover:border-weaveit-500/50 transition-all duration-200 flex items-center justify-center space-x-3 backdrop-blur-sm"
        >
          <Share2 className="w-5 h-5" />
          <span>Share Video</span>
        </button>
      </div>

      {/* Video Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-weaveit-500/10 to-weaveit-600/10 rounded-xl p-4 border border-weaveit-500/20 text-center backdrop-blur-sm">
          <div className="text-3xl mb-2">✨</div>
          <div className="text-sm text-white font-semibold">AI Generated</div>
          <div className="text-xs text-gray-400">Powered by WeaveIt</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/20 text-center backdrop-blur-sm">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-sm text-white font-semibold">High Quality</div>
          <div className="text-xs text-gray-400">Professional output</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20 text-center backdrop-blur-sm">
          <div className="text-3xl mb-2">⚡</div>
          <div className="text-sm text-white font-semibold">Fast Creation</div>
          <div className="text-xs text-gray-400">Generated in minutes</div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Script Form Component with Payment Integration
interface ScriptFormProps {
  onVideoGenerated: (videoUrl: string, title: string) => void
}

const ScriptForm: React.FC<ScriptFormProps> = ({ onVideoGenerated }) => {
  const [script, setScript] = useState("")
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loadingStep, setLoadingStep] = useState("")
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [generationType, setGenerationType] = useState<"video" | "audio">("video")
  const { publicKey } = useWallet()

  const { sendPayment, getSolPrice, isProcessing } = useSolanaPayment()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!script.trim()) {
      setError("Please enter a script for your tutorial")
      return
    }

    if (!title.trim()) {
      setError("Please enter a title for your video")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // PAYMENT TEMPORARILY DISABLED FOR TESTING
      // Uncomment the block below to re-enable payment
      /*
      setLoadingStep("Processing payment...")
      setPaymentProcessing(true)

      const paymentResult = await sendPayment(0.5) // $0.50 in SOL
      console.log("Payment completed:", paymentResult)

      setPaymentProcessing(false)

      //check fee payment result
      if (!paymentResult || !paymentResult.success) {
        console.warn("Payment not successful, aborting generation", paymentResult)
        setError(paymentResult?.error || "Payment failed or was rejected")
        setLoading(false)
        setLoadingStep("")
        setPaymentProcessing(false)
        return
      }

      setLoadingStep("Payment confirmed! Generating video...")
      */

      // Skip payment for testing
      setLoadingStep("Generating video...")

      const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"

      // Choose endpoint based on generation type
      const endpoint = generationType === "audio" ? "/api/generate/audio" : "/api/generate"
      
      const response = await fetch(`${backendBaseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script,
          title,
          transactionSignature: "TEST_MODE", // paymentResult.signature when payment is enabled
          walletAddress: publicKey?.toBase58(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Backend error:", errorData)
        throw new Error(errorData.error || "Failed to start video generation")
      }

      const videoData = await response.json()
      console.log("Generation response:", videoData)

      // Construct URL based on generation type and response data
      let contentUrl: string | null = null
      let contentId: string | null = null
      
      if (generationType === "audio") {
        // For audio generation, use audio-specific endpoint
        const audioId = videoData.audioId || videoData.audio_id
        contentId = audioId
        if (audioId) {
          contentUrl = `${backendBaseUrl}/api/audio/${audioId}`
          console.log(`Audio generation successful. ID: ${audioId}, URL: ${contentUrl}`)
        } else {
          console.warn("No audioId in response:", videoData)
        }
      } else {
        // For video generation, use video endpoint
        const contentIdFromResponse = videoData.contentId || videoData.content_id || videoData.videoId || videoData.video_id
        contentId = contentIdFromResponse
        if (contentIdFromResponse) {
          contentUrl = `${backendBaseUrl}/api/videos/${contentIdFromResponse}`
          console.log(`Video generation successful. ID: ${contentIdFromResponse}, URL: ${contentUrl}`)
        } else {
          console.warn("No videoId/contentId in response:", videoData)
        }
      }
      
      if (!contentUrl) {
        throw new Error(`No ${generationType} URL or content ID received from backend. Response: ${JSON.stringify(videoData)}`)
      }

      console.log("Content URL constructed:", contentUrl)
      onVideoGenerated(contentUrl, videoData.title || title)
      setSuccess(`${generationType === "video" ? "Video" : "Audio"} generated successfully!`)
      setScript("")
      setTitle("")
    } catch (err: any) {
      console.error("Generation failed:", err)
      if (err.message?.includes("Wallet not connected")) {
        setError("Please connect your wallet to generate videos")
      } else if (err.message?.includes("insufficient funds")) {
        setError("Insufficient SOL balance for payment")
      } else {
        setError("Failed to generate video. Please try again.")
      }
    } finally {
      setLoading(false)
      setLoadingStep("")
      setPaymentProcessing(false)
    }
  }

  const pollVideoStatus = async (contentId: string, videoTitle: string) => {
    if (!contentId) {
      console.error("No content ID provided for polling")
      setError("Missing video ID")
      return
    }

    const steps = [
      "Analyzing your script...",
      "Generating AI narration...",
      "Creating visual elements...",
      "Rendering video...",
      "Finalizing output...",
    ]

    let stepIndex = 0
    const maxAttempts = 60 // 5 minutes max
    let attempts = 0

    const poll = async () => {
      try {
        // const statusResponse = await fetch(`/api/videos/status/${contentId}`)
        const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
        const statusResponse = await fetch(`${backendBaseUrl}/api/videos/status/${contentId}`)
        const statusData = await statusResponse.json()

        console.log("Status response:", statusData)

        if (statusData.ready && statusData.contentUrl) {
          // console.log("Video ready with URL:", statusData.contentUrl)
          const videoUrl = `${backendBaseUrl}${statusData.contentUrl}`
          console.log("Video ready with URL:", videoUrl)
          setSuccess("Video generated successfully! 🎉")
          onVideoGenerated(videoUrl, videoTitle)
          // onVideoGenerated(statusData.contentUrl, videoTitle)
          setScript("")
          setTitle("")
          return
        }

        // Update loading step
        if (stepIndex < steps.length - 1) {
          setLoadingStep(steps[stepIndex])
          stepIndex++
        }

        attempts++
        if (attempts >= maxAttempts) {
          throw new Error("Video generation timed out")
        }

        // Continue polling
        setTimeout(poll, 5000) // Check every 5 seconds
      } catch (error) {
        console.error("Status polling error:", error)
        throw error
      }
    }

    await poll()
  }

  const estimateVideoLength = (text: string) => {
    const words = text.trim().split(/\s+/).length
    const avgWordsPerMinute = 150
    const minutes = Math.ceil(words / avgWordsPerMinute)
    return minutes
  }

  const getScriptQuality = (text: string) => {
    const wordCount = text.trim().split(/\s+/).length
    if (wordCount < 50) return { quality: "Too short", color: "text-red-400" }
    if (wordCount < 150) return { quality: "Good", color: "text-yellow-400" }
    if (wordCount < 500) return { quality: "Excellent", color: "text-green-400" }
    return { quality: "Very long", color: "text-blue-400" }
  }

  const scriptQuality = getScriptQuality(script)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Generation Type Toggle */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-white mb-3">Generation Type</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setGenerationType("video")}
            className={`relative overflow-hidden py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 ${
              generationType === "video"
                ? "bg-gradient-to-r from-weaveit-500 to-weaveit-600 text-white shadow-lg shadow-weaveit-500/30 scale-[1.02]"
                : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 border border-gray-700/50"
            }`}
          >
            <Video className="w-5 h-5" />
            <span>Full Video</span>
            {generationType === "video" && (
              <div className="absolute top-2 right-2">
                <CheckCircle className="w-4 h-4" />
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setGenerationType("audio")}
            className={`relative overflow-hidden py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 ${
              generationType === "audio"
                ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30 scale-[1.02]"
                : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 border border-gray-700/50"
            }`}
          >
            <Volume2 className="w-5 h-5" />
            <span>Audio Only</span>
            {generationType === "audio" && (
              <div className="absolute top-2 right-2">
                <CheckCircle className="w-4 h-4" />
              </div>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {generationType === "video"
            ? "Generate a complete video tutorial with visuals and narration"
            : "Generate only the audio narration (faster and lighter)"}
        </p>
      </div>

      {/* Title Input */}
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-semibold text-white">
          Video Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a descriptive title for your tutorial video..."
          className="w-full px-4 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-weaveit-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
          disabled={loading}
        />
      </div>

      {/* Script Input */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="script" className="block text-sm font-semibold text-white">
            Tutorial Script
          </label>
          <div className="flex items-center space-x-4 text-xs">
            {script.trim() && (
              <>
                <span className="text-gray-400">~{estimateVideoLength(script)} min video</span>
                <span className={`${scriptQuality.color} font-medium`}>{scriptQuality.quality}</span>
              </>
            )}
          </div>
        </div>
        <textarea
          id="script"
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Enter your tutorial script here. Explain your code, concepts, or step-by-step instructions that you want to turn into a video tutorial..."
          rows={12}
          className="w-full px-4 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-weaveit-500 focus:border-transparent transition-all duration-200 resize-vertical backdrop-blur-sm"
          disabled={loading}
        />
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>
            {script.length} characters •{" "}
            {
              script
                .trim()
                .split(/\s+/)
                .filter((word) => word.length > 0).length
            }{" "}
            words
          </span>
          {script.length > 5000 && (
            <span className="text-amber-400 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              Very long script may take more time to process
            </span>
          )}
        </div>
      </div>

      {/* Generation Button */}
      <button
        type="submit"
        disabled={loading || !script.trim() || !title.trim() || isProcessing}
        className={`relative overflow-hidden w-full py-6 px-8 rounded-xl font-semibold text-lg flex items-center justify-center space-x-3 ${loading || isProcessing ? "bg-gray-700/50 cursor-not-allowed" : generationType === "video" ? "bg-gradient-to-r from-weaveit-500 to-weaveit-600 hover:from-weaveit-600 hover:to-weaveit-700" : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"} text-white shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 border ${generationType === "video" ? "border-weaveit-500/20" : "border-purple-500/20"}`}
      >
        {loading || paymentProcessing ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
              <span>{paymentProcessing ? "Processing Payment..." : `Generating Your ${generationType === "video" ? "Video" : "Audio"}...`}</span>
            </div>
            {loadingStep && <span className="text-sm text-weaveit-200">{loadingStep}</span>}
          </div>
        ) : (
          <>
            <Zap className="w-6 h-6" />
            <span>Generate {generationType === "video" ? "Tutorial Video" : "Audio Narration"} (FREE - Testing Mode)</span>
            <ArrowRight className="w-6 h-6" />
          </>
        )}
      </button>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center space-x-3 backdrop-blur-sm">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center space-x-3 backdrop-blur-sm">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="text-green-400">{success}</span>
        </div>
      )}

      {/* Cost Information */}
      <div className="bg-gradient-to-r from-weaveit-500/10 to-weaveit-600/10 border border-weaveit-500/30 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-weaveit-500/20 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-weaveit-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white">Generation Cost</h4>
            <p className="text-sm text-gray-400">Transparent pricing</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 mb-2">
          Video generation requires a payment of <strong className="text-weaveit-400">$0.50</strong> in SOL to cover AI
          processing costs.
        </p>
        <p className="text-xs text-gray-400">💡 Payment is processed securely through your connected Solana wallet</p>
      </div>

      {/* Tips Section */}
      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30 backdrop-blur-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white">💡 Tips for Better Videos</h4>
            <p className="text-sm text-gray-400">Optimize your script for best results</p>
          </div>
        </div>
        <ul className="text-sm text-gray-300 space-y-2">
          <li className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-weaveit-500 rounded-full"></div>
            <span>Be clear and specific in your explanations</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-weaveit-500 rounded-full"></div>
            <span>Include step-by-step instructions</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-weaveit-500 rounded-full"></div>
            <span>Mention specific code examples or concepts</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-weaveit-500 rounded-full"></div>
            <span>Keep sections organized with clear transitions</span>
          </li>
        </ul>
      </div>
    </form>
  )
}

// Enhanced Wallet Connect Component
const WalletConnect: React.FC<{ onConnect: () => void }> = ({ onConnect }) => {
  const { connected, connecting } = useWallet()

  if (connected) {
    onConnect()
    return null
  }

  return (
    <div className="space-y-6">
      {connecting && (
        <div className="bg-weaveit-500/10 border border-weaveit-500/30 rounded-xl p-4 flex items-center space-x-3 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-weaveit-500 border-t-transparent"></div>
          <span className="text-white">Connecting to wallet...</span>
        </div>
      )}

      <div className="flex justify-center">
        <WalletMultiButton className="!bg-gradient-to-r !from-weaveit-500 !to-weaveit-600 hover:!from-weaveit-600 hover:!to-weaveit-700 !rounded-xl !font-semibold !py-4 !px-8 !text-lg !transition-all !duration-200 !transform hover:!scale-105" />
      </div>

      {/* Security Features */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="w-5 h-5 text-green-400" />
            <h4 className="font-semibold text-white">Secure Connection</h4>
          </div>
          <p className="text-sm text-gray-400">
            Your wallet connection is encrypted and secure. We never store your private keys.
          </p>
        </div>

        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-2">
            <Zap className="w-5 h-5 text-weaveit-500" />
            <h4 className="font-semibold text-white">Fast & Easy</h4>
          </div>
          <p className="text-sm text-gray-400">
            Connect in seconds and start generating videos immediately. No complex setup required.
          </p>
        </div>
      </div>
    </div>
  )
}

// Main WeaveIt App Component
export default function WeaveItApp() {
  const { connected, disconnect, publicKey } = useWallet()
  const [currentVideo, setCurrentVideo] = useState<{ url: string; title: string } | null>(null)
  const [videos, setVideos] = useState<Array<{ id: string; title: string; url: string; createdAt: string }>>([])
  const [loadingVideos, setLoadingVideos] = useState(false)

  // Fetch user's videos and audio when wallet connects
  useEffect(() => {
    const fetchUserContent = async () => {
      if (!connected || !publicKey) {
        setVideos([])
        return
      }

      setLoadingVideos(true)
      try {
        const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
        const walletAddress = publicKey.toBase58()
        
        console.log(`Fetching content for wallet: ${walletAddress}`)
        console.log(`Backend URL: ${backendBaseUrl}`)
        
        // Fetch all content (videos and audio) from unified endpoint
        const response = await fetch(`${backendBaseUrl}/api/wallet/${walletAddress}/content`)

        if (!response.ok) {
          console.error("Failed to fetch content:", response.status, response.statusText)
          setVideos([])
          return
        }

        const data = await response.json()
        console.log("Fetched content data:", data)

        if (!data.content || !Array.isArray(data.content)) {
          console.warn("Response missing content array", data)
          setVideos([])
          return
        }

        // Transform backend response to match our content format
        const fetchedContent = data.content.map((item: any) => {
          const itemUrl = item.url ? `${backendBaseUrl}${item.url}` : item.url
          console.log(`Processing content item: id=${item.id}, url=${itemUrl}`)
          return {
            id: item.id,
            title: item.title || `${item.content_type === 'video' ? 'Video' : 'Audio'} ${item.id.slice(0, 8)}`,
            url: itemUrl,
            createdAt: item.created_at,
            contentType: item.content_type,
          }
        })

        console.log("Processed content:", fetchedContent)
        setVideos(fetchedContent)
      } catch (error) {
        console.error("Error fetching content:", error)
        setVideos([])
      } finally {
        setLoadingVideos(false)
      }
    }

    fetchUserContent()
  }, [connected, publicKey])

  const handleConnect = () => {
    // Connection is handled by the wallet adapter
  }

  const handleDisconnect = () => {
    disconnect()
    setCurrentVideo(null)
  }

  const handleVideoGenerated = (videoUrl: string, title: string) => {
    console.log("Content generated with URL:", videoUrl)
    
    // Extract content ID from URL (works for both /api/videos/ and /api/audio/)
    const contentIdMatch = videoUrl.match(/\/api\/(?:videos|audio)\/([a-f0-9-]+)/i)
    const contentId = contentIdMatch ? contentIdMatch[1] : `local-${Date.now()}`
    
    const newContent = {
      id: contentId,
      title,
      url: videoUrl,
      createdAt: new Date().toISOString(),
    }
    
    // Avoid duplicates - check if content already exists
    setVideos((prev) => {
      const existingIndex = prev.findIndex(v => v.id === contentId)
      if (existingIndex >= 0) {
        // Update existing content
        const updated = [...prev]
        updated[existingIndex] = newContent
        return updated
      }
      // Add new content at the beginning
      return [newContent, ...prev]
    })
    
    setCurrentVideo({ url: videoUrl, title })
    console.log("Current content set to:", { url: videoUrl, title })
  }

  // Show wallet connection if not connected
  if (!connected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800/30 backdrop-blur-xl rounded-3xl p-12 border border-gray-700/30 shadow-2xl text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-weaveit-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-10 h-10 text-weaveit-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">
              Connect your Solana wallet to start creating AI-powered tutorial videos
            </p>
          </div>
          <WalletConnect onConnect={handleConnect} />
        </div>
      </div>
    )
  }

  // App View
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0a0e17] to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/80 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-weaveit-500 to-weaveit-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">WeaveIt Studio</h1>
                <p className="text-sm text-gray-400">AI Video Generator</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-700/50 backdrop-blur-sm">
                <div className="w-8 h-8 bg-weaveit-500/20 rounded-lg flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-weaveit-400" />
                </div>
                <div>
                  <div className="text-sm text-white font-medium">Connected</div>
                  <div className="text-xs text-gray-400">
                    {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
                  </div>
                </div>
              </div>

              <button
                onClick={handleDisconnect}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center space-x-2 transition-all duration-200 backdrop-blur-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Script Form */}
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/30 shadow-2xl">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-12 bg-weaveit-500/20 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-weaveit-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Create Tutorial Video</h2>
                  <p className="text-gray-400">Transform your script into an engaging video</p>
                </div>
              </div>
              <ScriptForm onVideoGenerated={handleVideoGenerated} />
            </div>

            {/* Video Display */}
            {currentVideo && (
              <div className="bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/30 shadow-2xl">
                <VideoDisplay
                  videoUrl={currentVideo.url}
                  title={currentVideo.title}
                  onClose={() => setCurrentVideo(null)}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-3xl p-6 border border-gray-700/30 sticky top-28 shadow-2xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Video className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Your Content</h3>
                  <p className="text-sm text-gray-400">{videos.length} items created</p>
                </div>
              </div>

              {loadingVideos ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-weaveit-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading your content...</p>
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-700/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Video className="w-10 h-10 text-gray-500" />
                  </div>
                  <p className="text-gray-400 mb-2">No content yet</p>
                  <p className="text-sm text-gray-500">Create your first tutorial to get started!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30 hover:border-weaveit-500/30 transition-all duration-200 cursor-pointer hover:transform hover:scale-[1.02] backdrop-blur-sm group"
                      onClick={() => setCurrentVideo({ url: video.url, title: video.title })}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-weaveit-500/20 rounded-lg flex items-center justify-center group-hover:bg-weaveit-500/30 transition-colors">
                          <Play className="w-5 h-5 text-weaveit-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white text-sm truncate">
                            {video.title || "Untitled Video"}
                          </h4>
                          <p className="text-xs text-gray-400">{new Date(video.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}