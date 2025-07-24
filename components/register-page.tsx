"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { AppState } from "@/app/page"
import type { SubscriptionTier } from "@/types/subscription"

interface RegisterPageProps {
  loadUsers: () => Promise<Record<string, any>>
  saveUser: (username: string, password: string, tier?: SubscriptionTier) => Promise<void>
  updateAppState: (updates: Partial<AppState>) => void
}

export default function RegisterPage({ loadUsers, saveUser, updateAppState }: RegisterPageProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!username || !password) {
      setError("Username and Password cannot be empty")
      return
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters long")
      return
    }

    if (password.length < 3) {
      setError("Password must be at least 3 characters long")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      console.log("Checking if user exists...")
      const users = await loadUsers()

      if (username in users) {
        setError("Username already exists")
        return
      }

      console.log("Creating new user...")
      await saveUser(username, password, "free")

      setSuccess("Registration successful. Please log in.")
      setTimeout(() => {
        updateAppState({ page: "login" })
      }, 2000)
    } catch (error) {
      console.error("Error during registration:", error)
      setError("Failed to create account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-cyan-100 to-blue-100 opacity-50" />
      <Card className="w-full max-w-md relative backdrop-blur-sm bg-white/80 shadow-xl border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Register
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Choose Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username (min 3 characters)"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Choose Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (min 3 characters)"
              disabled={loading}
              onKeyPress={(e) => e.key === "Enter" && handleRegister()}
            />
          </div>

          {/* Registration Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs">
            <div className="font-semibold text-green-800 mb-1">New Account Benefits:</div>
            <div className="text-green-700">
              • Free tier access with map predictions • 3 API calls per month • Upgrade options available
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Button onClick={handleRegister} className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading}>
              {loading ? "Creating Account..." : "Register"}
            </Button>
            <Button
              variant="outline"
              onClick={() => updateAppState({ page: "login" })}
              className="w-full"
              disabled={loading}
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
