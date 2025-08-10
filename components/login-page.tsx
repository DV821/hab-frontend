"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, LogIn, Eye, EyeOff } from "lucide-react";
import { loginUser, fetchUserSubscription } from "@/lib/api-client";
import type { AppState } from "@/app/page";

interface LoginPageProps {
  updateAppState: (updates: Partial<AppState>) => void;
}

export default function LoginPage({ updateAppState }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser(username, password);
      // Fetch user subscription to get tier
      const subscription = await fetchUserSubscription();
      updateAppState({
        loggedIn: true,
        username,
        userTier: subscription?.tier || "free",
        page: "main",
        prediction: null,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Title and subtitle */}
      <h1 className="text-3xl font-bold text-teal-700 mb-1">HAB Detection System</h1>
      <p className="text-gray-600 mb-8">Tier-based Subscription Platform</p>
      <Card className="w-[400px] shadow-lg backdrop-blur-sm bg-white/80 border-0">
        <CardHeader>
          <CardTitle className="text-teal-700 text-xl text-center">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                tabIndex={-1} // Avoids interfering with form tab order
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading}>
              {loading ? (
                <>
                  <LogIn className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </>
              )}
            </Button>
          </form>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => updateAppState({ page: "register" })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Register
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}