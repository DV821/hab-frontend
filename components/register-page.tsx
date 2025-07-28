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
  const [tier, setTier] = useState("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await registerUser(username, password, tier);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 border-0">
        <CardHeader>
          <CardTitle className="text-teal-700">Register</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
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
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="border rounded px-3 py-2 w-full"
              disabled={loading}
            >
              <option value="free">Free</option>
              <option value="tier1">Tier 1</option>
              <option value="tier2">Tier 2</option>
            </select>
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