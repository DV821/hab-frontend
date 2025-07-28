"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, LogIn } from "lucide-react";
import { loginUser, fetchUserSubscription } from "@/lib/api-client";
import type { AppState } from "@/app/page";

interface LoginPageProps {
  updateAppState: (updates: Partial<AppState>) => void;
}

export default function LoginPage({ updateAppState }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 border-0">
        <CardHeader>
          <CardTitle className="text-teal-700">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
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
            Register New Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}