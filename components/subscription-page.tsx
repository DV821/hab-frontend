"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { AppState } from "@/app/page"
import type { SubscriptionTier, UserSubscription } from "@/types/subscription"
import { TIER_CONFIG } from "@/types/subscription"
import { ArrowLeft, Crown, Check, X, Clock, Heart } from "lucide-react"
import FinancialAidForm from "./financial-aid-form"

interface SubscriptionPageProps {
  username: string
  userTier: SubscriptionTier
  updateAppState: (updates: Partial<AppState>) => void
  getUserSubscription: () => UserSubscription | null
}

export default function SubscriptionPage({
  username,
  userTier,
  updateAppState,
  getUserSubscription,
}: SubscriptionPageProps) {
  const currentTierConfig = TIER_CONFIG[userTier]
  const subscription = getUserSubscription()
  const [showFinancialAidForm, setShowFinancialAidForm] = useState(false)
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>("tier1")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

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

  const handleFinancialAidRequest = (targetTier: SubscriptionTier) => {
    setSelectedTier(targetTier)
    setShowFinancialAidForm(true)
  }

  const handleFinancialAidSuccess = () => {
    setShowFinancialAidForm(false)
    setMessage(
      `Financial aid application for ${TIER_CONFIG[selectedTier].displayName} has been submitted successfully. You will be notified once your request is reviewed.`,
    )
    setError("")
  }

  const apiUsagePercentage = subscription ? (subscription.apiCallsUsed / currentTierConfig.apiCallsPerMonth) * 100 : 0

  if (showFinancialAidForm) {
    return (
      <div className="min-h-screen p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-cyan-100 to-blue-100 opacity-30" />
        <div className="relative max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-teal-700">Financial Aid Application</h1>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>

          <FinancialAidForm
            username={username}
            currentTier={userTier}
            requestedTier={selectedTier}
            onBack={() => setShowFinancialAidForm(false)}
            onSuccess={handleFinancialAidSuccess}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-cyan-100 to-blue-100 opacity-30" />
      <div className="relative max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-teal-700">Subscription Management</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        {/* Messages */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-green-800">{message}</AlertDescription>
          </Alert>
        )}

        {/* Current Plan */}
        <Card className="backdrop-blur-sm bg-white/80 border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-teal-700 flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold">{currentTierConfig.displayName}</h3>
                <Badge className={`${getTierBadgeColor(userTier)} text-white`}>Active</Badge>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Plan Features</h4>
                <ul className="space-y-2">
                  {currentTierConfig.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Usage This Month</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>API Calls</span>
                      <span>
                        {subscription?.apiCallsUsed || 0} / {currentTierConfig.apiCallsPerMonth}
                      </span>
                    </div>
                    <Progress value={apiUsagePercentage} className="h-2" />
                  </div>
                  <div className="text-xs text-gray-500">Resets monthly on the {new Date().getDate()}th</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Aid Banner */}
        <Card className="backdrop-blur-sm bg-gradient-to-r from-red-50 to-pink-50 border-red-200 mb-6">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-500" />
              <div>
                <h4 className="font-semibold text-red-800 mb-1">Need Financial Assistance?</h4>
                <p className="text-red-700 text-sm">
                  We offer financial aid for students, researchers, and individuals who demonstrate genuine need. Apply
                  for subsidized access to our premium features.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Plans Comparison */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {Object.entries(TIER_CONFIG).map(([tierKey, config]) => {
            const isCurrentTier = tierKey === userTier
            const tierName = tierKey as SubscriptionTier
            const isUpgrade =
              tierName !== "free" && (userTier === "free" || (userTier === "tier1" && tierName === "tier2"))

            return (
              <Card
                key={tierKey}
                className={`backdrop-blur-sm bg-white/80 border-0 ${isCurrentTier ? "ring-2 ring-teal-500" : ""}`}
              >
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CardTitle className="text-lg">{config.displayName}</CardTitle>
                    {isCurrentTier && <Badge className="bg-teal-500 text-white text-xs">Current</Badge>}
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {tierName === "free" ? "Free" : tierName === "tier1" ? "$29/mo" : "$99/mo"}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {config.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentTier ? (
                    <Button className="w-full bg-transparent" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : isUpgrade ? (
                    <div className="space-y-2">
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleFinancialAidRequest(tierName)}
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Apply for Financial Aid
                      </Button>
                      <p className="text-xs text-center text-gray-600">Can't afford full price? Apply for assistance</p>
                    </div>
                  ) : (
                    <Button className="w-full bg-transparent" variant="outline" disabled>
                      Downgrade Not Available
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Financial Aid Info */}
        <Card className="backdrop-blur-sm bg-blue-50 border-blue-200 mb-6">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">How Financial Aid Works</h4>
                <p className="text-blue-700 text-sm mb-2">
                  Our financial aid program provides subsidized access to premium features for qualifying individuals.
                  You'll need to complete an application explaining your situation and how the upgrade would help you.
                </p>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Applications are reviewed by our admin team within 3-5 business days</li>
                  <li>• Priority given to students, researchers, and non-profit organizations</li>
                  <li>• Approved aid typically covers 50-100% of subscription costs</li>
                  <li>• Only one pending application allowed at a time</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Comparison Table */}
        <Card className="backdrop-blur-sm bg-white/80 border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-teal-700">Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Feature</th>
                    <th className="text-center py-2">Free</th>
                    <th className="text-center py-2">Tier 1</th>
                    <th className="text-center py-2">Tier 2</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b">
                    <td className="py-2">Map Access (Global)</td>
                    <td className="text-center">
                      <Check className="w-4 h-4 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center">
                      <Check className="w-4 h-4 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center">
                      <Check className="w-4 h-4 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Image Upload & Detection</td>
                    <td className="text-center">
                      <X className="w-4 h-4 text-red-500 mx-auto" />
                    </td>
                    <td className="text-center">
                      <Check className="w-4 h-4 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center">
                      <Check className="w-4 h-4 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Prediction Days</td>
                    <td className="text-center">5 days</td>
                    <td className="text-center">10 days</td>
                    <td className="text-center">10 days</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">API Calls/Month</td>
                    <td className="text-center">3</td>
                    <td className="text-center">100</td>
                    <td className="text-center">1000</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Processing Time</td>
                    <td className="text-center">3-5 min</td>
                    <td className="text-center">1-2 min</td>
                    <td className="text-center">&lt;30 sec</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Model Accuracy</td>
                    <td className="text-center">85%</td>
                    <td className="text-center">92%</td>
                    <td className="text-center">97%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Button onClick={() => updateAppState({ page: "main" })} variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
