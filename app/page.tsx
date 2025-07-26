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
import { loadUsers, loadSubscriptions, saveUsers, saveSubscriptions } from "@/lib/api-client"
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
        console.log("Restored session:", sessionData)
        setAppState(sessionData)
      } catch (error) {
        console.error("Error loading session:", error)
        localStorage.removeItem("hab_session")
      }
    }
    setIsLoading(false)
  }, [])

  // Save session state to localStorage whenever appState changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("hab_session", JSON.stringify(appState))
      console.log("Session saved:", appState)
    }
  }, [appState, isLoading])

  // Load users from file system via API
  const loadUsersData = async (): Promise<Record<string, User>> => {
    try {
      console.log("Loading users from API...")
      const users = await loadUsers()
      console.log("Successfully loaded users:", Object.keys(users))
      return users
    } catch (error) {
      console.error("Error loading users:", error)
      throw new Error("Failed to load users")
    }
  }

  // Save new user to file system via API
  const saveUser = async (username: string, password: string, tier: SubscriptionTier = "free") => {
    try {
      console.log(`Saving new user: ${username} with tier: ${tier}`)

      const users = await loadUsers()
      const subscriptions = await loadSubscriptions()

      // Add new user
      users[username] = { username, password, tier }

      // Add new subscription
      subscriptions[username] = {
        username,
        tier,
        apiCallsUsed: 0,
        lastResetDate: new Date().toISOString(),
      }

      await saveUsers(users)
      await saveSubscriptions(subscriptions)

      console.log(`Successfully saved user: ${username}`)
    } catch (error) {
      console.error("Error saving user:", error)
      throw new Error("Failed to save user")
    }
  }

  const getSubscriptions = async (): Promise<Record<string, UserSubscription>> => {
    try {
      return await loadSubscriptions()
    } catch (error) {
      console.error("Error loading subscriptions:", error)
      return {}
    }
  }

  const getUserSubscription = async (username: string): Promise<UserSubscription | null> => {
    try {
      const subscriptions = await getSubscriptions()
      return subscriptions[username] || null
    } catch (error) {
      console.error("Error getting user subscription:", error)
      return null
    }
  }

  const updateApiUsage = async (username: string) => {
    try {
      const subscriptions = await loadSubscriptions()
      if (subscriptions[username]) {
        subscriptions[username].apiCallsUsed += 1
        await saveSubscriptions(subscriptions)
        console.log(`Updated API usage for ${username}: ${subscriptions[username].apiCallsUsed}`)
      }
    } catch (error) {
      console.error("Error updating API usage:", error)
    }
  }

  const canMakeApiCall = async (username: string): Promise<boolean> => {
    try {
      const subscription = await getUserSubscription(username)
      if (!subscription) return false

      const tierConfig = TIER_CONFIG[subscription.tier]
      const canMake = subscription.apiCallsUsed < tierConfig.apiCallsPerMonth
      console.log(
        `API call check for ${username}: ${subscription.apiCallsUsed}/${tierConfig.apiCallsPerMonth} - ${canMake ? "allowed" : "blocked"}`,
      )
      return canMake
    } catch (error) {
      console.error("Error checking API call limit:", error)
      return false
    }
  }

  const updateAppState = (updates: Partial<AppState>) => {
    console.log("Updating app state:", updates)
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
        return <LoginPage loadUsers={loadUsersData} updateAppState={updateAppState} />
      case "register":
        return <RegisterPage loadUsers={loadUsersData} saveUser={saveUser} updateAppState={updateAppState} />
      case "main":
        return appState.loggedIn ? (
          <MainMenu username={appState.username} userTier={appState.userTier} updateAppState={updateAppState} />
        ) : (
          <LoginPage loadUsers={loadUsersData} updateAppState={updateAppState} />
        )
      case "prediction":
        return appState.loggedIn ? (
          <PredictionPage
            username={appState.username}
            userTier={appState.userTier}
            updateAppState={updateAppState}
            prediction={appState.prediction}
            canMakeApiCall={() => canMakeApiCall(appState.username)}
            updateApiUsage={() => updateApiUsage(appState.username)}
            getUserSubscription={() => getUserSubscription(appState.username)}
          />
        ) : (
          <LoginPage loadUsers={loadUsersData} updateAppState={updateAppState} />
        )
      case "image-upload":
        return appState.loggedIn ? (
          <ImageUploadPage username={appState.username} userTier={appState.userTier} updateAppState={updateAppState} />
        ) : (
          <LoginPage loadUsers={loadUsersData} updateAppState={updateAppState} />
        )
      case "subscription":
        return appState.loggedIn ? (
          <SubscriptionPage
            username={appState.username}
            userTier={appState.userTier}
            updateAppState={updateAppState}
            getUserSubscription={() => getUserSubscription(appState.username)}
          />
        ) : (
          <LoginPage loadUsers={loadUsersData} updateAppState={updateAppState} />
        )
      case "admin":
        return appState.loggedIn ? (
          <AdminPanel username={appState.username} userTier={appState.userTier} updateAppState={updateAppState} />
        ) : (
          <LoginPage loadUsers={loadUsersData} updateAppState={updateAppState} />
        )
      default:
        return <LoginPage loadUsers={loadUsersData} updateAppState={updateAppState} />
    }
  }

  return <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">{renderCurrentPage()}</div>
}
