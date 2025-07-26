"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { AppState, User } from "@/app/page"

interface LoginPageProps {
  loadUsers: () => Promise<Record<string, User>>
  updateAppState: (updates: Partial<AppState>) => void
}

export default function LoginPage({ loadUsers, updateAppState }: LoginPageProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter both username and password")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("Loading users from file system...")
      const users = await loadUsers()
      console.log("Loaded users:", Object.keys(users))

      if (username in users && users[username].password === password) {
        console.log(`Login successful for user: ${username}`)
        updateAppState({
          loggedIn: true,
          username: username,
          userTier: users[username].tier,
          page: "main",
        })
      } else {
        console.log(`Login failed for user: ${username}`)
        setError("Invalid username or password.")
      }
    } catch (error) {
      console.error("Error during login:", error)
      setError("Failed to load user data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-cyan-100 to-blue-100 opacity-50" />
      <Card className="w-full max-w-md relative backdrop-blur-sm bg-white/80 shadow-xl border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent animate-pulse">
            HAB Detection System
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">Tier-based Subscription Platform</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={loading}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Button onClick={handleLogin} className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
            <Button
              variant="outline"
              onClick={() => updateAppState({ page: "register" })}
              className="w-full"
              disabled={loading}
            >
              Go to Register
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
