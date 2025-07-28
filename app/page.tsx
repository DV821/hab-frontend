"use client"

import { useState, useEffect } from "react"
import LoginPage from "@/components/login-page"
import RegisterPage from "@/components/register-page"
import MainMenu from "@/components/main-menu"
import PredictionPage from "@/components/prediction-page"
import ImageUploadPage from "@/components/image-upload-page"
import SubscriptionPage from "@/components/subscription-page"
import AdminPanel from "@/components/admin-panel"
import type { SubscriptionTier, UserSubscription } from "@/types/subscription"
import { TIER_CONFIG } from "@/types/subscription"
import {
  registerUser,
  loginUser,
  fetchAllUsers,
  fetchUserSubscription,
  fetchAllSubscriptions,
  fetchMyUpgradeRequests,
  fetchAllUpgradeRequests,
  createUpgradeRequest,
  approveUpgradeRequest,
  rejectUpgradeRequest,
  makePrediction,
  uploadPredictionImage,
  logoutUser,
} from "@/lib/api-client"
import "leaflet/dist/leaflet.css";

export type Page = "login" | "register" | "main" | "prediction" | "image-upload" | "subscription" | "admin"

export interface User {
  username: string
  password: string
  tier: SubscriptionTier
}

export interface PredictionResponse {
  prediction_for_date: string
  predicted_label: "toxic" | "non_toxic"
  confidence_scores: {
    non_toxic: string
    toxic: string
  }
  location?: {
    latitude: number
    longitude: number
  }
  processing_time?: string
  model_used?: string
}

export interface AppState {
  page: Page
  loggedIn: boolean
  username: string
  userTier: SubscriptionTier
  prediction: PredictionResponse | null
}

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    page: "login",
    loggedIn: false,
    username: "",
    userTier: "free",
    prediction: null,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load session state from localStorage on component mount
  useEffect(() => {
    const savedSession = localStorage.getItem("hab_session")
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession)
        setAppState(sessionData)
      } catch (error) {
        localStorage.removeItem("hab_session")
      }
    }
    setIsLoading(false)
  }, [])

  // Save session state to localStorage whenever appState changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("hab_session", JSON.stringify(appState))
    }
  }, [appState, isLoading])

  // Get current user's subscription from backend
  const getUserSubscription = async (): Promise<UserSubscription | null> => {
    try {
      return await fetchUserSubscription()
    } catch (error) {
      return null
    }
  }

  // Update API usage is now handled by backend, so this can be a no-op or refetch subscription if needed
  const updateApiUsage = async () => {
    // Optionally refetch subscription after prediction
  }

  // Check if user can make API call (based on subscription info)
  const canMakeApiCall = async (): Promise<boolean> => {
    try {
      const subscription = await fetchUserSubscription()
      if (!subscription) return false
      const tierConfig = TIER_CONFIG[subscription.tier]
      return subscription.apiCallsUsed < tierConfig.apiCallsPerMonth
    } catch (error) {
      return false
    }
  }

  const updateAppState = (updates: Partial<AppState>) => {
    setAppState((prev) => ({ ...prev, ...updates }))
  }

  // Show loading spinner while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-teal-700 font-medium">Loading HAB Detection System...</p>
        </div>
      </div>
    )
  }

  const renderCurrentPage = () => {
    switch (appState.page) {
      case "login":
        return <LoginPage updateAppState={updateAppState} />
      case "register":
        return <RegisterPage updateAppState={updateAppState} />
      case "main":
        return appState.loggedIn ? (
          <MainMenu username={appState.username} userTier={appState.userTier} updateAppState={updateAppState} />
        ) : (
          <LoginPage updateAppState={updateAppState} />
        )
      case "prediction":
        return appState.loggedIn ? (
          <PredictionPage
            username={appState.username}
            userTier={appState.userTier}
            updateAppState={updateAppState}
            prediction={appState.prediction}
            canMakeApiCall={canMakeApiCall}
            updateApiUsage={updateApiUsage}
            getUserSubscription={getUserSubscription}
          />
        ) : (
          <LoginPage updateAppState={updateAppState} />
        )
      case "image-upload":
        return appState.loggedIn ? (
          <ImageUploadPage username={appState.username} userTier={appState.userTier} updateAppState={updateAppState} />
        ) : (
          <LoginPage updateAppState={updateAppState} />
        )
      case "subscription":
        return appState.loggedIn ? (
          <SubscriptionPage
            username={appState.username}
            userTier={appState.userTier}
            updateAppState={updateAppState}
            getUserSubscription={getUserSubscription}
          />
        ) : (
          <LoginPage updateAppState={updateAppState} />
        )
      case "admin":
        return appState.loggedIn ? (
          <AdminPanel username={appState.username} userTier={appState.userTier} updateAppState={updateAppState} />
        ) : (
          <LoginPage updateAppState={updateAppState} />
        )
      default:
        return <LoginPage updateAppState={updateAppState} />
    }
  }

  return <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">{renderCurrentPage()}</div>
}