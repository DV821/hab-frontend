"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AppState } from "@/app/page"
import type { SubscriptionTier } from "@/types/subscription"
import { TIER_CONFIG } from "@/types/subscription"
import { MapPin, Upload, Crown, Settings, Shield } from "lucide-react"

interface MainMenuProps {
  username: string
  userTier: SubscriptionTier
  updateAppState: (updates: Partial<AppState>) => void
}

export default function MainMenu({ username, userTier, updateAppState }: MainMenuProps) {
  const tierConfig = TIER_CONFIG[userTier]
  const isAdmin = userTier === "admin"


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

  return (
    <div className="min-h-screen p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-cyan-100 to-blue-100 opacity-30" />
      <div className="relative max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-teal-700">Welcome, {username}</h1>
            {!isAdmin && <Badge className={`${getTierBadgeColor(userTier)} text-white`}>{tierConfig.displayName}</Badge>}
            {isAdmin && <Badge className="bg-red-500 text-white">Administrator</Badge>}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => updateAppState({ page: "subscription" })} variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Subscription
            </Button>
            {isAdmin && (
              <Button onClick={() => updateAppState({ page: "admin" })} variant="outline" size="sm">
                <Shield className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        {/* Tier Features Overview */}
        <Card className="backdrop-blur-sm bg-white/80 border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-teal-700 flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Your Plan Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-semibold text-gray-700">Accuracy</div>
                <div className="text-gray-600">{tierConfig.accuracy}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-semibold text-gray-700">Processing Time</div>
                <div className="text-gray-600">{tierConfig.processingTime}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-semibold text-gray-700">Request Per Month</div>
                <div className="text-gray-600">{tierConfig.apiCallsPerMonth}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-semibold text-gray-700">Prediction For</div>
                <div className="text-gray-600">{tierConfig.predictionDays} days</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Available Features:</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Map Prediction Card */}
          <Card
            className={`cursor-pointer hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-white/80 border-0 h-48 ${
              tierConfig.mapAccess ? "" : "opacity-50 cursor-not-allowed"
            }`}
            onClick={() => tierConfig.mapAccess && updateAppState({ page: "prediction" })}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-teal-600" />
              </div>
              <CardTitle className="text-teal-700">Geospatial HAB Occurrence Predictor</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600"> {tierConfig.predictionDays}-day predictions • {tierConfig.modalities} modality </p>
            </CardContent>
          </Card>

          {/* Image Upload Card */}
          <Card
            className={`cursor-pointer hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-white/80 border-0 h-48 ${
              tierConfig.imageUpload ? "" : "opacity-50 cursor-not-allowed"
            }`}
            onClick={() => tierConfig.imageUpload && updateAppState({ page: "image-upload" })}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-cyan-600" />
              </div>
              <CardTitle className="text-cyan-700">HAB Detector</CardTitle>
              {!tierConfig.imageUpload && (
                <Badge variant="destructive" className="text-xs">
                  Upgrade Required
                </Badge>
              )}
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                {tierConfig.imageUpload
                  ? "Upload Image To Detect Algal Blooms"
                  : "Upgrade to Tier 1 or higher for image analysis"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Application Info Section - Tier Based */}
        <div className="mt-8 max-w-full mx-auto text-center">
          <Card className="backdrop-blur-sm bg-gradient-to-r from-blue-50 to-purple-50 border-0 mt-6">
            <CardContent className="p-6">
              
              {userTier === "free" && (
                <>
                  <p className="text-gray-700 mb-2">
                    You are currently on the <strong>Free Tier</strong>.  
                    Access basic HAB forecasts using the <em>chlor_a</em> modality for 5 days of data.  
                    This tier offers core prediction features with moderate accuracy and limited monthly requests.
                  </p>
                  <p className="text-gray-600 text-sm">
                    Upgrade to Tier 1 or Tier 2 to unlock more modalities, longer prediction horizons, image upload for bloom detection, and higher accuracy models.
                  </p>
                </>
              )}

              {userTier === "tier1" && (
                <>
                  <p className="text-gray-700 mb-2">
                    You are on <strong>Tier 1 (Pro)</strong>.  
                    Access 10‑day forecasts using multi-modal data (<em>chlor_a</em>, <em>rrs_412</em>, <em>rrs_442</em>) with enhanced accuracy powered by a CNN + LSTM model.
                  </p>
                  <p className="text-gray-600 text-sm">
                    You also have access to image uploads for direct algae detection.  
                    Upgrade to Tier 2 to gain bidirectional temporal modeling with attention for the most advanced forecasts.
                  </p>
                </>
              )}

              {userTier === "tier2" && (
                <>
                  <p className="text-gray-700 mb-2">
                    You are on <strong>Tier 2 (Enterprise)</strong>.  
                    Access 10‑day multi-modal forecasts with the highest accuracy using our CNN + BiLSTM + Attention architecture.
                  </p>
                  <p className="text-gray-600 text-sm">
                    This tier provides rich temporal insights, visual interpretability, and access to our YOLOv11 algae detection model for bounding‑box localisation of blooms.
                  </p>
                </>
              )}

              {userTier === "admin" && (
                <>
                  <p className="text-gray-700 mb-2">
                    You are logged in as an <strong>Administrator</strong>.  
                    You have full access to all features, models, and administrative tools.
                  </p>
                  <p className="text-gray-600 text-sm">
                    You can manage subscriptions requests and oversee monthly quota usage for each user.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Prompt for Free Users */}
        {userTier === "free" && (
          <Card className="backdrop-blur-sm bg-gradient-to-r from-blue-50 to-purple-50 border-0 mt-6">
            <CardContent className="text-center py-6">
              <Crown className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Unlock More Features</h3>
              <p className="text-gray-600 mb-4">
                Upgrade to access image upload, faster processing, and more API calls.
              </p>
              <Button
                onClick={() => updateAppState({ page: "subscription" })}
                className="bg-purple-600 hover:bg-purple-700"
              >
                View Upgrade Options
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
