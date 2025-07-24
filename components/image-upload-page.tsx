"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { AppState } from "@/app/page"
import type { SubscriptionTier } from "@/types/subscription"
import { TIER_CONFIG } from "@/types/subscription"
import { ArrowLeft, Upload, Crown, Loader2, Download, AlertTriangle } from "lucide-react"
import Image from "next/image"

// Constant API URL for image analysis
const IMAGE_API_URL = "http://localhost:5000/analyze-image"

interface ImageAnalysisResponse {
  success: boolean
  output_image_url?: string
  analysis_result?: {
    prediction: "toxic" | "non_toxic"
    confidence: number
    processing_time: string
    model_used: string
  }
  error?: string
}

interface ImageUploadPageProps {
  username: string
  userTier: SubscriptionTier
  updateAppState: (updates: Partial<AppState>) => void
}

export default function ImageUploadPage({ username, userTier, updateAppState }: ImageUploadPageProps) {
  const tierConfig = TIER_CONFIG[userTier]
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResponse | null>(null)

  const handleLogout = () => {
    localStorage.removeItem("hab_session")
    updateAppState({
      loggedIn: false,
      username: "",
      userTier: "free",
      page: "login",
      prediction: null,
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file (PNG, JPG, JPEG)")
        return
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }

      setUploadedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setError("")
      setAnalysisResult(null) // Clear previous results
    }
  }

  const handleAnalyze = async () => {
    if (!uploadedFile) {
      setError("Please select an image first")
      return
    }

    setLoading(true)
    setError("")

    const formData = new FormData()
    formData.append("image", uploadedFile)
    formData.append("tier", userTier)
    formData.append("username", username)

    try {
      console.log("Sending image analysis request to:", IMAGE_API_URL)

      const response = await fetch(IMAGE_API_URL, {
        method: "POST",
        body: formData,
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result: ImageAnalysisResponse = await response.json()
      console.log("Analysis result:", result)

      if (result.success) {
        setAnalysisResult(result)
      } else {
        setError(result.error || "Analysis failed")
      }
    } catch (err) {
      console.error("API Error:", err)
      if (err instanceof Error) {
        if (err.message.includes("fetch")) {
          setError(
            "Cannot connect to the image analysis server. Please ensure the backend is running at http://localhost:5000",
          )
        } else {
          setError(`API Error: ${err.message}`)
        }
      } else {
        setError("An unexpected error occurred during image analysis.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadResult = () => {
    if (analysisResult?.output_image_url) {
      const link = document.createElement("a")
      link.href = analysisResult.output_image_url
      link.download = `hab_analysis_result_${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const getTierBadgeColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case "free":
        return "bg-gray-500"
      case "tier1":
        return "bg-blue-500"
      case "tier2":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  // Check if user has access to image upload
  if (!tierConfig.imageUpload) {
    return (
      <div className="min-h-screen p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-cyan-100 to-blue-100 opacity-30" />
        <div className="relative max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-teal-700">HAB Image Detection</h1>
              <Badge className={`${getTierBadgeColor(userTier)} text-white`}>{tierConfig.displayName}</Badge>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>

          <Card className="backdrop-blur-sm bg-white/80 border-0 text-center py-12">
            <CardContent>
              <Crown className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Image Upload Not Available</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Image upload and analysis is only available for Tier 1 and Tier 2 subscribers. Upgrade your plan to
                access this feature.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <h3 className="font-semibold text-blue-800 mb-2">What you'll get with an upgrade:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Upload and analyze satellite images</li>
                  <li>• Get processed output images</li>
                  <li>• Advanced ML models</li>
                  <li>• Faster processing times</li>
                  <li>• More API calls per month</li>
                </ul>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => updateAppState({ page: "subscription" })}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
                <Button onClick={() => updateAppState({ page: "main" })} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-cyan-100 to-blue-100 opacity-30" />
      <div className="relative max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-teal-700">HAB Image Detection</h1>
            <Badge className={`${getTierBadgeColor(userTier)} text-white`}>{tierConfig.displayName}</Badge>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        {/* Tier Info Banner */}
        <Card className="backdrop-blur-sm bg-white/80 border-0 mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Crown className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="font-semibold">
                    {tierConfig.model} • {tierConfig.processingTime} • Advanced Image Analysis
                  </div>
                  <div className="text-sm text-gray-600">
                    Upload satellite or water-body images for HAB detection and get processed output images
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Image Upload Section */}
          <Card className="backdrop-blur-sm bg-white/80 border-0">
            <CardHeader>
              <CardTitle className="text-teal-700 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Image for Analysis
              </CardTitle>
              <p className="text-gray-600 text-sm">
                Upload a satellite or water-body image to analyze for harmful algal bloom (HAB) detection.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <input
                  type="file"
                  accept="image/png,image/jpg,image/jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
                >
                  Choose an image file
                </label>
                <p className="text-sm text-gray-500 mt-2">PNG, JPG, JPEG up to 10MB</p>
              </div>

              {previewUrl && (
                <div className="space-y-3">
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                    <Image
                      src={previewUrl || "/placeholder.svg"}
                      alt="Uploaded image"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm">
                    ✓ Image uploaded successfully: {uploadedFile?.name}
                  </div>
                </div>
              )}

              {uploadedFile && (
                <Button onClick={handleAnalyze} className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Image ({tierConfig.processingTime})...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Analyze Image for HAB
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="backdrop-blur-sm bg-white/80 border-0">
            <CardHeader>
              <CardTitle className="text-teal-700">Analysis Results</CardTitle>
              <p className="text-gray-600 text-sm">The processed output image and analysis results will appear here.</p>
            </CardHeader>
            <CardContent>
              {!analysisResult && !loading && (
                <div className="text-center py-12 text-gray-500">
                  <Upload className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p>Upload and analyze an image to see results here</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-12">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-teal-600 mb-3" />
                  <p className="text-gray-600">Processing your image...</p>
                  <p className="text-sm text-gray-500 mt-1">Expected time: {tierConfig.processingTime}</p>
                </div>
              )}

              {analysisResult && (
                <div className="space-y-4">
                  {/* Output Image */}
                  {analysisResult.output_image_url && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-700">Processed Output Image</h4>
                        <Button
                          onClick={handleDownloadResult}
                          size="sm"
                          variant="outline"
                          className="text-xs bg-transparent"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                      <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                        <Image
                          src={analysisResult.output_image_url || "/placeholder.svg"}
                          alt="Analysis result"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Analysis Details */}
                  {analysisResult.analysis_result && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-3">Analysis Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Prediction:</span>
                          <span
                            className={`font-semibold ${
                              analysisResult.analysis_result.prediction === "toxic" ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {analysisResult.analysis_result.prediction.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Confidence:</span>
                          <span className="font-mono">
                            {(analysisResult.analysis_result.confidence * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Processing Time:</span>
                          <span>{analysisResult.analysis_result.processing_time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Model Used:</span>
                          <span>{analysisResult.analysis_result.model_used}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button onClick={() => updateAppState({ page: "main" })} variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
