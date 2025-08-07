"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { AppState } from "@/app/page"
import type { SubscriptionTier, UserSubscription } from "@/types/subscription"
import { TIER_CONFIG } from "@/types/subscription"
import { ArrowLeft, Crown, Check, X, Clock, Heart, Loader2 } from "lucide-react"
import FinancialAidForm from "./financial-aid-form"

interface SubscriptionPageProps {
  username: string
  userTier: SubscriptionTier
  updateAppState: (updates: Partial<AppState>) => void
  getUserSubscription: () => Promise<UserSubscription | null>
}

export default function SubscriptionPage({
  username,
  userTier,
  updateAppState,
  getUserSubscription,
}: SubscriptionPageProps) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>("tier1")
  const [showFinancialAidForm, setShowFinancialAidForm] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getUserSubscription()
      .then(setSubscription)
      .finally(() => setLoading(false))
  }, [getUserSubscription])

  const currentTierConfig = TIER_CONFIG[userTier]
  const apiUsagePercentage =
    subscription && currentTierConfig
      ? Math.min(
          (subscription.apiCallsUsed / currentTierConfig.apiCallsPerMonth) * 100,
          100
        )
      : 0

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

  const handleUpgrade = () => {
    setError("")
    setMessage("")
    if (selectedTier === userTier) {
      setError("You are already on this tier.")
      return
    }
    setUpgradeLoading(true)
    setTimeout(() => {
      setShowFinancialAidForm(true)
      setUpgradeLoading(false)
    }, 300) // Simulate async, or remove if not needed
  }

  // This function is called by FinancialAidForm's onSuccess
  const handleFinancialAidSuccess = () => {
    setMessage("Upgrade request submitted successfully!")
    setShowFinancialAidForm(false)
  }
  interface ProgressProps {
    value: number;
    className?: string;
  }
  const Progress: React.FC<ProgressProps> = ({ value, className }) => (
    <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
      <div
        className={className}
        style={{ width: `${value}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );

  if (showFinancialAidForm) {
    return (
      <div className="min-h-screen p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-cyan-100 to-blue-100 opacity-30" />
        <div className="relative max-w-2xl mx-auto">
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-100 via-cyan-100 to-blue-100">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
          <div className="text-teal-700 font-semibold text-lg">Loading your subscription...</div>
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
              {currentTierConfig.displayName}
              <Badge className="ml-2">{userTier.toUpperCase()}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>
                    Requests Used : {subscription?.apiCallsUsed || 0} / {currentTierConfig.apiCallsPerMonth}
                    </span>
                  </div>
                  <Progress value={apiUsagePercentage} className={`h-2 ${apiUsagePercentage > 80 ? 'bg-red-600' : 'bg-green-600'}`} />
                </div>
                <div className="text-xs text-gray-500">Resets every month on the {1}st</div> 
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tier Comparison Table */}
        <Card className="backdrop-blur-sm bg-white/80 border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-teal-700">Compare Subscription Tiers</CardTitle>
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
                    <td className="py-2">Prediction For</td>
                    <td className="text-center">5 days</td>
                    <td className="text-center">10 days</td>
                    <td className="text-center">10 days</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Requests Per Month</td>
                    <td className="text-center">3</td>
                    <td className="text-center">100</td>
                    <td className="text-center">1000</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Processing Time</td>
                    <td className="text-center">2-3 min</td>
                    <td className="text-center">1-2 min</td>
                    <td className="text-center">&lt;1 min</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Accuracy</td>
                    <td className="text-center">70%</td>
                    <td className="text-center">80%</td>
                    <td className="text-center">94%</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Price</td>
                    <td className="text-center">$0</td>
                    <td className="text-center">$20</td>
                    <td className="text-center">$50</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Plan */}
        <Card className="backdrop-blur-sm bg-white/80 border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-teal-700">Upgrade Your Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value as SubscriptionTier)}
                className="border rounded px-3 py-2"
              >
                <option value="tier1">Tier 1</option>
                <option value="tier2">Tier 2</option>
              </select>
              <Button
                onClick={handleUpgrade}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={upgradeLoading}
              >
                {upgradeLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Opening Form...
                  </>
                ) : (
                  <>Request Upgrade / Financial Aid</>
                )}
              </Button>
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