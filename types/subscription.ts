export type SubscriptionTier = "free" | "tier1" | "tier2"

export interface TierFeatures {
  name: string
  displayName: string
  mapAccess: boolean
  imageUpload: boolean
  modalities: number
  predictionDays: number
  threads: number | "unlimited"
  model: string
  apiCallsPerMonth: number
  processingTime: string
  color: string
  features: string[]
}

export const TIER_CONFIG: Record<SubscriptionTier, TierFeatures> = {
  free: {
    name: "free",
    displayName: "Free Tier",
    mapAccess: true,
    imageUpload: false,
    modalities: 1,
    predictionDays: 5,
    threads: 1,
    model: "85% Accuracy",
    apiCallsPerMonth: 3,
    processingTime: "3-5 minutes",
    color: "gray",
    features: ["Map, coordinates", "1 modality", "5-day predictions", "85% Model Accuracy", "3 API calls per month"],
  },
  tier1: {
    name: "tier1",
    displayName: "Tier 1 (Pro)",
    mapAccess: true,
    imageUpload: true,
    modalities: 3,
    predictionDays: 10,
    threads: 4,
    model: "92% Accuracy",
    apiCallsPerMonth: 100,
    processingTime: "1-2 minutes",
    color: "blue",
    features: [
      "Map, coordinates & image upload",
      "3 modalities",
      "10-day predictions",
      "92% Model Accuracy",
      "100 API calls per month",
    ],
  },
  tier2: {
    name: "tier2",
    displayName: "Tier 2 (Enterprise)",
    mapAccess: true,
    imageUpload: true,
    modalities: 3,
    predictionDays: 10,
    threads: "unlimited",
    model: "97% Accuracy",
    apiCallsPerMonth: 1000,
    processingTime: "< 30 seconds",
    color: "purple",
    features: [
      "Map, coordinates & image upload",
      "3 modalities",
      "10-day predictions",
      "97% Model Accuracy",
      "1000 API calls per month",
      "Priority processing",
    ],
  },
  admin: {
    name: "admin",
    displayName: "Administrator",
    mapAccess: true,
    imageUpload: true,
    modalities: 3,
    predictionDays: 10,
    threads: "unlimited",
    model: "Full Access",
    apiCallsPerMonth: 10000,
    processingTime: "< 10 seconds",
    color: "red",
    features: [
      "All features unlocked",
      "Admin dashboard access",
      "Unlimited management",
      "Priority support"
    ],
  },
}

export interface UserSubscription {
  username: string
  tier: SubscriptionTier
  apiCallsUsed: number
  lastResetDate: string
}
