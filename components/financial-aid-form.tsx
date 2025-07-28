"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type { SubscriptionTier } from "@/types/subscription"
import { TIER_CONFIG } from "@/types/subscription"
import { createUpgradeRequest } from "@/lib/api-client"
import { ArrowLeft, Heart, Send, HelpCircle } from "lucide-react"

interface FinancialAidFormProps {
  username: string
  currentTier: SubscriptionTier
  requestedTier: SubscriptionTier
  onBack: () => void
  onSuccess: () => void
}

export default function FinancialAidForm({
  username,
  currentTier,
  requestedTier,
  onBack,
  onSuccess,
}: FinancialAidFormProps) {
  const [formData, setFormData] = useState({
    financialAidReason: "",
    currentSituation: "",
    howItHelps: "",
    additionalInfo: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const currentTierConfig = TIER_CONFIG[currentTier]
  const requestedTierConfig = TIER_CONFIG[requestedTier]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.financialAidReason.trim()) {
      setError("Please explain why you need financial assistance")
      return
    }

    if (!formData.currentSituation.trim()) {
      setError("Please describe your current situation")
      return
    }

    if (!formData.howItHelps.trim()) {
      setError("Please explain how this upgrade would help you")
      return
    }

    if (formData.financialAidReason.length < 50) {
      setError("Please provide a more detailed explanation (at least 50 characters)")
      return
    }

    setLoading(true)
    setError("")

    try {
      await createUpgradeRequest({
        username,
        currentTier,
        requestedTier,
        financialAidReason: formData.financialAidReason,
        currentSituation: formData.currentSituation,
        howItHelps: formData.howItHelps,
        additionalInfo: formData.additionalInfo,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit financial aid request")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="backdrop-blur-sm bg-white/80 border-0 mb-6">
        <CardHeader>
          <CardTitle className="text-teal-700 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Financial Aid Application
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span>Current Plan:</span>
              <Badge className="bg-gray-500 text-white">{currentTierConfig.displayName}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span>Requesting:</span>
              <Badge className="bg-purple-500 text-white">{requestedTierConfig.displayName}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">About Financial Aid</h4>
                <p className="text-blue-700 text-sm mb-2">
                  We understand that not everyone can afford premium subscriptions. Our financial aid program helps
                  students, researchers, and individuals who can demonstrate genuine need access our advanced HAB
                  detection tools.
                </p>
                <p className="text-blue-700 text-sm">
                  Please be honest and detailed in your responses. All applications are reviewed by our admin team.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="financialAidReason" className="text-base font-semibold">
                Why do you need financial assistance? *
              </Label>
              <p className="text-sm text-gray-600 mb-2">
                Please explain your financial situation and why you cannot afford the regular subscription price.
              </p>
              <Textarea
                id="financialAidReason"
                value={formData.financialAidReason}
                onChange={(e) => handleInputChange("financialAidReason", e.target.value)}
                placeholder="Example: I am a graduate student with limited income, currently working on research related to water quality monitoring..."
                className="min-h-[120px]"
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 text-right">
                {formData.financialAidReason.length}/1000 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentSituation" className="text-base font-semibold">
                Describe your current situation *
              </Label>
              <p className="text-sm text-gray-600 mb-2">
                Tell us about your background - are you a student, researcher, non-profit worker, etc.?
              </p>
              <Textarea
                id="currentSituation"
                value={formData.currentSituation}
                onChange={(e) => handleInputChange("currentSituation", e.target.value)}
                placeholder="Example: I am a PhD student at XYZ University studying environmental science. My research focuses on harmful algal blooms in freshwater lakes..."
                className="min-h-[100px]"
                maxLength={800}
              />
              <div className="text-xs text-gray-500 text-right">{formData.currentSituation.length}/800 characters</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="howItHelps" className="text-base font-semibold">
                How would this upgrade help you? *
              </Label>
              <p className="text-sm text-gray-600 mb-2">
                Explain how access to advanced features would benefit your work, research, or studies.
              </p>
              <Textarea
                id="howItHelps"
                value={formData.howItHelps}
                onChange={(e) => handleInputChange("howItHelps", e.target.value)}
                placeholder="Example: Access to image upload and faster processing would allow me to analyze satellite data for my thesis research on lake ecosystems..."
                className="min-h-[100px]"
                maxLength={800}
              />
              <div className="text-xs text-gray-500 text-right">{formData.howItHelps.length}/800 characters</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo" className="text-base font-semibold">
                Additional Information (Optional)
              </Label>
              <p className="text-sm text-gray-600 mb-2">
                Any other information you'd like to share that supports your application.
              </p>
              <Textarea
                id="additionalInfo"
                value={formData.additionalInfo}
                onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
                placeholder="Example: I can provide verification of my student status, links to my research, or references from my advisor..."
                className="min-h-[80px]"
                maxLength={500}
              />
              <div className="text-xs text-gray-500 text-right">{formData.additionalInfo.length}/500 characters</div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Before You Submit</h4>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• Make sure all required fields are completed with detailed responses</li>
                <li>• Be honest and specific about your financial situation</li>
                <li>• Applications are reviewed within 3-5 business days</li>
                <li>• You can only have one pending request at a time</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 flex-1">
                {loading ? (
                  "Submitting Application..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Financial Aid Application
                  </>
                )}
              </Button>
              <Button type="button" onClick={onBack} variant="outline" disabled={loading}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
