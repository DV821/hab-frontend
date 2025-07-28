"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, UserPlus } from "lucide-react";
import { registerUser, loginUser, fetchUserSubscription } from "@/lib/api-client";
import type { AppState } from "@/app/page";

interface RegisterPageProps {
  updateAppState: (updates: Partial<AppState>) => void;
}

export default function RegisterPage({ updateAppState }: RegisterPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username.trim().length < 6) {
      setError("Username must be at least 6 characters.");
      return;
    }
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }

    setLoading(true);

    try {
      await registerUser(username, password, "free");
      // Auto-login after registration
      await loginUser(username, password);
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
          : "Registration failed. Please try a different username."
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
          <CardTitle className="text-teal-700 text-xl text-center">Register</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter username (min 6 characters)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
              minLength={6}
            />
            <Input
              type="password"
              placeholder="Enter password (min 10 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={10}
            />
            <div className="bg-green-50 border border-green-200 rounded text-green-700 text-xs px-3 py-2 mb-2">
              <ul className="list-disc pl-4">
                <li>Free tier access with map predictions</li>
                <li>3 API calls per month</li>
                <li>Upgrade options available</li>
              </ul>
            </div>
            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading}>
              {loading ? (
                <>
                  <UserPlus className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register
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
            onClick={() => updateAppState({ page: "login" })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}