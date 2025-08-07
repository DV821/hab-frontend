"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Upload,
  CheckCircle,
  AlertTriangle,
  Download,
} from "lucide-react";
import Image from "next/image";
import type { AppState } from "@/app/page";
import type { SubscriptionTier, UserSubscription } from "@/types/subscription";
import { TIER_CONFIG } from "@/types/subscription";
import { uploadPredictionImage, fetchUserSubscription } from "@/lib/api-client";
import { Crown } from "lucide-react";

interface ImageUploadPageProps {
  username: string;
  userTier: SubscriptionTier;
  updateAppState: (updates: Partial<AppState>) => void;
}

interface ImageAnalysisResponse {
  prediction: "toxic" | "non_toxic";
  confidence: number;
  processing_time?: string;
  model_used?: string;
  output_image_url?: string;
  success?: boolean;
  error?: string;
}

export default function ImageUploadPage({
  username,
  userTier,
  updateAppState,
}: ImageUploadPageProps) {
  const tierConfig = TIER_CONFIG[userTier];

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);

  // Fetch subscription info on mount
  React.useEffect(() => {
    fetchUserSubscription().then(setSubscription);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError("");
      setAnalysisResult(null); // Clear previous results
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Only allow tier1, tier2, admin
      if (!["tier1", "tier2", "admin"].includes(userTier)) {
        setError("Image upload is only available for tier1 and tier2 users.");
        setLoading(false);
        return;
      }

      // Check API call limits
      if (subscription && subscription.apiCallsUsed >= tierConfig.apiCallsPerMonth) {
        setError(`You've reached your monthly limit of ${tierConfig.apiCallsPerMonth} API calls.`);
        setLoading(false);
        return;
      }

      const result = await uploadPredictionImage(uploadedFile, userTier);

      if (result.error) {
        setError(result.error);
      } else {
        setAnalysisResult(result);
        setError("");
        // Optionally refetch subscription info
        fetchUserSubscription().then(setSubscription);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "API Error: Unable to analyze image.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResult = () => {
    if (analysisResult?.output_image_url) {
      const a = document.createElement('a');
      a.href = `data:image/jpeg;base64, ${analysisResult.output_image_url}`;
      a.download = 'output.jpeg'; // You can specify another name if desired
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("hab_session");
    updateAppState({
      loggedIn: false,
      username: "",
      userTier: "free",
      page: "login",
      prediction: null,
    });
  };

  const currentTierConfig = TIER_CONFIG[userTier]
  const apiUsagePercentage =
    subscription && currentTierConfig
      ? Math.min(
          (subscription.apiCallsUsed / currentTierConfig.apiCallsPerMonth) * 100,
          100
        )
      : 0
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
    

  return (
    <div className="min-h-screen p-4 relative">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-cyan-100 to-blue-100 opacity-30 pointer-events-none" />
      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-cyan-700">HAB Image Detection</h1>
            <Badge className={`${userTier === "tier1" ? "bg-blue-500" : "bg-purple-500"} text-white`}>
              {tierConfig.displayName}
            </Badge>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

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

        {/* Main Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Upload Card */}
          <Card className="backdrop-blur-sm bg-white/80 border-0">
            <CardHeader>
              <CardTitle className="text-cyan-700 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Image for Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-full min-h-[220px]">
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-cyan-300 rounded-lg cursor-pointer hover:bg-cyan-50 transition"
                >
                  <Upload className="w-8 h-8 text-cyan-400 mb-2" />
                  <span className="text-cyan-700 font-semibold mb-1">Choose an image file</span>
                  <span className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</span>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                </label>
                {previewUrl && (
                  <div className="w-full mt-4">
                    <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm flex justify-center items-center">
                      ✓ Image uploaded
                    </div>
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border mb-2">
                      <Image src={previewUrl} alt="Uploaded image" fill className="object-contain" />
                    </div>
                    
                  </div>
                )}
                <Button
                  onClick={handleAnalyze}
                  className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700"
                  disabled={loading || !uploadedFile}
                >
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
              </div>
            </CardContent>
          </Card>
          
          {/* Results Card */}
          <Card className="backdrop-blur-sm bg-white/80 border-0">
            <CardHeader>
              <CardTitle className="text-cyan-700 flex items-center gap-2">
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!analysisResult && (
                <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-gray-400">
                  <Upload className="w-12 h-12 mb-2" />
                  <div className="text-center text-gray-500">
                    Upload and analyze an image to see results here.
                  </div>
                  <span className="text-xs text-gray-500">For best results: Use an image with 640x640 dimensions</span>
                </div>
              )}
              {analysisResult && (
                <div className="space-y-4">
                  {analysisResult.output_image_url && (
                    <div className="space-y-3">
                      <div className="relative w-full h-80 rounded-lg overflow-hidden border" style = {{ aspectRatio: '1/1' }}>
                        <Image
                          src={analysisResult.output_image_url? `data:image/jpeg;base64, ${analysisResult.output_image_url}`: "/placeholder.svg"}
                          alt="Analysis result"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-center">
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

        <Button
          onClick={() => updateAppState({ page: "main" })}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}