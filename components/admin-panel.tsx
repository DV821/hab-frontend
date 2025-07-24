"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { AppState, User } from "@/app/page"
import type { SubscriptionTier, UserSubscription } from "@/types/subscription"
import { TIER_CONFIG } from "@/types/subscription"
import type { UpgradeRequest } from "@/types/upgrade-request"
import {
  ArrowLeft,
  Users,
  Crown,
  Edit,
  Trash2,
  Plus,
  Shield,
  BarChart3,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Bell,
  Heart,
} from "lucide-react"
import {
  loadUsers,
  saveUsers,
  loadSubscriptions,
  saveSubscriptions,
  loadUpgradeRequests,
  approveUpgradeRequest,
  rejectUpgradeRequest,
} from "@/lib/api-client"

interface AdminPanelProps {
  username: string
  userTier: SubscriptionTier
  updateAppState: (updates: Partial<AppState>) => void
}

interface UserWithSubscription extends User {
  subscription: UserSubscription
}

export default function AdminPanel({ username, userTier, updateAppState }: AdminPanelProps) {
  const [users, setUsers] = useState<UserWithSubscription[]>([])
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({ username: "", password: "", tier: "free" as SubscriptionTier })
  const [showAddUser, setShowAddUser] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState<"users" | "requests">("users")
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [pendingTierChange, setPendingTierChange] = useState<Record<string, SubscriptionTier>>({})

  const loadAllData = async () => {
    try {
      const [usersData, subscriptionsData, requestsData] = await Promise.all([
        loadUsers(),
        loadSubscriptions(),
        loadUpgradeRequests(),
      ])

      const combinedUsers: UserWithSubscription[] = Object.values(usersData).map((user) => ({
        ...user,
        subscription: subscriptionsData[user.username] || {
          username: user.username,
          tier: user.tier,
          apiCallsUsed: 0,
          lastResetDate: new Date().toISOString(),
        },
      }))

      setUsers(combinedUsers)
      setUpgradeRequests(requestsData)
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Failed to load data")
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  // Check if current user is admin
  if (userTier !== "tier2" || username !== "admin") {
    return (
      <div className="min-h-screen p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-cyan-100 to-blue-100 opacity-30" />
        <div className="relative max-w-4xl mx-auto">
          <Card className="backdrop-blur-sm bg-white/80 border-0 text-center py-12">
            <CardContent>
              <Shield className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
              <p className="text-gray-600 mb-6">Admin panel access is restricted to administrators only.</p>
              <Button onClick={() => updateAppState({ page: "main" })} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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

  const updateUserTier = async (targetUsername: string, newTier: SubscriptionTier) => {
    try {
      const usersData = await loadUsers()
      const subscriptionsData = await loadSubscriptions()

      if (usersData[targetUsername]) {
        usersData[targetUsername].tier = newTier
        await saveUsers(usersData)
      }

      if (subscriptionsData[targetUsername]) {
        subscriptionsData[targetUsername].tier = newTier
        await saveSubscriptions(subscriptionsData)
      }

      await loadAllData()
      setSuccess(`Successfully updated ${targetUsername}'s subscription to ${TIER_CONFIG[newTier].displayName}`)
      setEditingUser(null)
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error updating user tier:", error)
      setError("Failed to update user subscription")
    }
  }

  const resetApiUsage = async (targetUsername: string) => {
    try {
      const subscriptionsData = await loadSubscriptions()
      if (subscriptionsData[targetUsername]) {
        subscriptionsData[targetUsername].apiCallsUsed = 0
        subscriptionsData[targetUsername].lastResetDate = new Date().toISOString()
        await saveSubscriptions(subscriptionsData)
      }

      await loadAllData()
      setSuccess(`Successfully reset API usage for ${targetUsername}`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error resetting API usage:", error)
      setError("Failed to reset API usage")
    }
  }

  const deleteUser = async (targetUsername: string) => {
    if (targetUsername === "admin") {
      setError("Cannot delete admin user")
      return
    }

    if (confirm(`Are you sure you want to delete user "${targetUsername}"? This action cannot be undone.`)) {
      try {
        const usersData = await loadUsers()
        const subscriptionsData = await loadSubscriptions()

        delete usersData[targetUsername]
        delete subscriptionsData[targetUsername]

        await saveUsers(usersData)
        await saveSubscriptions(subscriptionsData)

        await loadAllData()
        setSuccess(`Successfully deleted user ${targetUsername}`)
        setTimeout(() => setSuccess(""), 3000)
      } catch (error) {
        console.error("Error deleting user:", error)
        setError("Failed to delete user")
      }
    }
  }

  const addNewUser = async () => {
    if (!newUser.username || !newUser.password) {
      setError("Username and password are required")
      return
    }

    try {
      const usersData = await loadUsers()
      const subscriptionsData = await loadSubscriptions()

      if (usersData[newUser.username]) {
        setError("Username already exists")
        return
      }

      // Add new user
      usersData[newUser.username] = {
        username: newUser.username,
        password: newUser.password,
        tier: newUser.tier,
      }

      // Add subscription
      subscriptionsData[newUser.username] = {
        username: newUser.username,
        tier: newUser.tier,
        apiCallsUsed: 0,
        lastResetDate: new Date().toISOString(),
      }

      await saveUsers(usersData)
      await saveSubscriptions(subscriptionsData)

      await loadAllData()
      setSuccess(`Successfully created user ${newUser.username}`)
      setNewUser({ username: "", password: "", tier: "free" })
      setShowAddUser(false)
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error adding user:", error)
      setError("Failed to create user")
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequest(requestId)
    try {
      await approveUpgradeRequest(requestId, adminNotes)
      await loadAllData()
      setSuccess("Upgrade request approved successfully")
      setAdminNotes("")
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      setError("Failed to approve request")
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequest(requestId)
    try {
      await rejectUpgradeRequest(requestId, adminNotes)
      await loadAllData()
      setSuccess("Upgrade request rejected")
      setAdminNotes("")
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      setError("Failed to reject request")
    } finally {
      setProcessingRequest(null)
    }
  }

  const filteredUsers = users.filter((user) => user.username.toLowerCase().includes(searchTerm.toLowerCase()))
  const pendingRequests = upgradeRequests.filter((req) => req.status === "pending")

  const getUsageStats = () => {
    const totalUsers = users.length
    const tierCounts = users.reduce(
      (acc, user) => {
        acc[user.tier] = (acc[user.tier] || 0) + 1
        return acc
      },
      {} as Record<SubscriptionTier, number>,
    )

    const totalApiCalls = users.reduce((sum, user) => sum + user.subscription.apiCallsUsed, 0)

    return { totalUsers, tierCounts, totalApiCalls, pendingRequests: pendingRequests.length }
  }

  const stats = getUsageStats()

  const confirmTierChange = async (targetUsername: string, newTier: SubscriptionTier) => {
    if (
      confirm(
        `Are you sure you want to change ${targetUsername}'s subscription from ${TIER_CONFIG[users.find((u) => u.username === targetUsername)?.tier || "free"].displayName} to ${TIER_CONFIG[newTier].displayName}?`,
      )
    ) {
      await updateUserTier(targetUsername, newTier)
      setPendingTierChange((prev) => {
        const updated = { ...prev }
        delete updated[targetUsername]
        return updated
      })
    }
  }

  const cancelTierChange = (targetUsername: string) => {
    setPendingTierChange((prev) => {
      const updated = { ...prev }
      delete updated[targetUsername]
      return updated
    })
  }

  return (
    <div className="min-h-screen p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-cyan-100 to-blue-100 opacity-30" />
      <div className="relative max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-teal-700">Admin Panel</h1>
            <Badge className="bg-purple-500 text-white">Administrator</Badge>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="backdrop-blur-sm bg-white/80 border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-teal-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/80 border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.tierCounts.tier2 || 0}</div>
                  <div className="text-sm text-gray-600">Enterprise Users</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/80 border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.tierCounts.tier1 || 0}</div>
                  <div className="text-sm text-gray-600">Pro Users</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/80 border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Bell className="w-8 h-8 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.pendingRequests}</div>
                  <div className="text-sm text-gray-600">Pending Requests</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "users" ? "default" : "outline"}
            onClick={() => setActiveTab("users")}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Users className="w-4 h-4 mr-2" />
            User Management
          </Button>
          <Button
            variant={activeTab === "requests" ? "default" : "outline"}
            onClick={() => setActiveTab("requests")}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Bell className="w-4 h-4 mr-2" />
            Upgrade Requests
            {pendingRequests.length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs">{pendingRequests.length}</Badge>
            )}
          </Button>
        </div>

        {activeTab === "users" && (
          <>
            {/* User Management Controls */}
            <Card className="backdrop-blur-sm bg-white/80 border-0 mb-6">
              <CardHeader>
                <CardTitle className="text-teal-700">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-center mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={() => setShowAddUser(!showAddUser)} className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                  <Button onClick={loadAllData} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                {/* Add New User Form */}
                {showAddUser && (
                  <Card className="mb-4 border-2 border-dashed border-gray-300">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">Add New User</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="new-username">Username</Label>
                          <Input
                            id="new-username"
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                            placeholder="Enter username"
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-password">Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            placeholder="Enter password"
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-tier">Subscription Tier</Label>
                          <Select
                            value={newUser.tier}
                            onValueChange={(value: SubscriptionTier) => setNewUser({ ...newUser, tier: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free Tier</SelectItem>
                              <SelectItem value="tier1">Tier 1 (Pro)</SelectItem>
                              <SelectItem value="tier2">Tier 2 (Enterprise)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button onClick={addNewUser} className="bg-green-600 hover:bg-green-700">
                          Create User
                        </Button>
                        <Button onClick={() => setShowAddUser(false)} variant="outline">
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="backdrop-blur-sm bg-white/80 border-0">
              <CardHeader>
                <CardTitle className="text-teal-700">All Users ({filteredUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Username</th>
                        <th className="text-left py-3 px-2">Subscription</th>
                        <th className="text-left py-3 px-2">API Usage</th>
                        <th className="text-left py-3 px-2">Last Reset</th>
                        <th className="text-left py-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.username} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.username}</span>
                              {user.username === "admin" && (
                                <Badge className="bg-red-500 text-white text-xs">Admin</Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            {editingUser === user.username ? (
                              <div className="flex items-center gap-2">
                                <Select
                                  value={pendingTierChange[user.username] || user.tier}
                                  onValueChange={(value: SubscriptionTier) =>
                                    setPendingTierChange((prev) => ({ ...prev, [user.username]: value }))
                                  }
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="free">Free Tier</SelectItem>
                                    <SelectItem value="tier1">Tier 1 (Pro)</SelectItem>
                                    <SelectItem value="tier2">Tier 2 (Enterprise)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <Badge className={`${getTierBadgeColor(user.tier)} text-white`}>
                                {TIER_CONFIG[user.tier].displayName}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <div className="text-sm">
                              <div className="font-mono">
                                {user.subscription.apiCallsUsed} / {TIER_CONFIG[user.tier].apiCallsPerMonth}
                              </div>
                              <div className="w-20 bg-gray-200 rounded-full h-1 mt-1">
                                <div
                                  className="bg-teal-500 h-1 rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      (user.subscription.apiCallsUsed / TIER_CONFIG[user.tier].apiCallsPerMonth) * 100,
                                      100,
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-600">
                            {new Date(user.subscription.lastResetDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex gap-1">
                              {editingUser === user.username ? (
                                // Show tick button when in edit mode
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (
                                      pendingTierChange[user.username] &&
                                      pendingTierChange[user.username] !== user.tier
                                    ) {
                                      confirmTierChange(user.username, pendingTierChange[user.username])
                                    } else {
                                      // Exit edit mode if no changes
                                      setEditingUser(null)
                                      setPendingTierChange((prev) => {
                                        const updated = { ...prev }
                                        delete updated[user.username]
                                        return updated
                                      })
                                    }
                                  }}
                                  className={`${
                                    pendingTierChange[user.username] && pendingTierChange[user.username] !== user.tier
                                      ? "bg-green-600 hover:bg-green-700"
                                      : "bg-gray-500 hover:bg-gray-600"
                                  } text-white`}
                                  title={
                                    pendingTierChange[user.username] && pendingTierChange[user.username] !== user.tier
                                      ? "Confirm subscription change"
                                      : "Exit edit mode"
                                  }
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                              ) : (
                                // Show edit button when not in edit mode
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingUser(user.username)}
                                  title="Edit subscription"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              )}
                              {user.username !== "admin" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteUser(user.username)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "requests" && (
          <Card className="backdrop-blur-sm bg-white/80 border-0">
            <CardHeader>
              <CardTitle className="text-teal-700">Upgrade Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {upgradeRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No upgrade requests found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upgradeRequests.map((request) => (
                    <Card key={request.id} className="border-2">
                      <CardContent className="p-6">
                        <div className="grid lg:grid-cols-2 gap-6">
                          {/* Request Info */}
                          <div>
                            <div className="flex items-center gap-3 mb-4">
                              <h4 className="font-semibold text-lg">{request.username}</h4>
                              <Badge
                                className={
                                  request.status === "pending"
                                    ? "bg-orange-500 text-white"
                                    : request.status === "approved"
                                      ? "bg-green-500 text-white"
                                      : "bg-red-500 text-white"
                                }
                              >
                                {request.status.toUpperCase()}
                              </Badge>
                              <Badge className="bg-red-100 text-red-800 border-red-300">
                                <Heart className="w-3 h-3 mr-1" />
                                Financial Aid
                              </Badge>
                            </div>

                            <div className="space-y-3 text-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <strong>Current Tier:</strong>
                                  <br />
                                  {TIER_CONFIG[request.currentTier as SubscriptionTier]?.displayName ||
                                    request.currentTier}
                                </div>
                                <div>
                                  <strong>Requested Tier:</strong>
                                  <br />
                                  {TIER_CONFIG[request.requestedTier as SubscriptionTier]?.displayName ||
                                    request.requestedTier}
                                </div>
                              </div>

                              <div>
                                <strong>Request Date:</strong>
                                <br />
                                {new Date(request.requestDate).toLocaleString()}
                              </div>

                              {request.adminNotes && (
                                <div className="bg-gray-50 p-3 rounded">
                                  <strong>Admin Notes:</strong>
                                  <br />
                                  {request.adminNotes}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Financial Aid Details */}
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h5 className="font-semibold text-blue-800 mb-3">Financial Aid Application</h5>

                            <div className="space-y-4 text-sm">
                              <div>
                                <strong className="text-blue-800">Why they need assistance:</strong>
                                <p className="mt-1 text-blue-700 bg-white p-2 rounded text-xs leading-relaxed">
                                  {request.financialAidReason}
                                </p>
                              </div>

                              <div>
                                <strong className="text-blue-800">Current situation:</strong>
                                <p className="mt-1 text-blue-700 bg-white p-2 rounded text-xs leading-relaxed">
                                  {request.currentSituation}
                                </p>
                              </div>

                              <div>
                                <strong className="text-blue-800">How it would help:</strong>
                                <p className="mt-1 text-blue-700 bg-white p-2 rounded text-xs leading-relaxed">
                                  {request.howItHelps}
                                </p>
                              </div>

                              {request.additionalInfo && (
                                <div>
                                  <strong className="text-blue-800">Additional information:</strong>
                                  <p className="mt-1 text-blue-700 bg-white p-2 rounded text-xs leading-relaxed">
                                    {request.additionalInfo}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Admin Actions */}
                        {request.status === "pending" && (
                          <div className="mt-6 pt-4 border-t">
                            <div className="mb-4">
                              <Label htmlFor={`notes-${request.id}`} className="font-semibold">
                                Admin Response (Required)
                              </Label>
                              <p className="text-sm text-gray-600 mb-2">
                                Provide feedback to the user about your decision
                              </p>
                              <Textarea
                                id={`notes-${request.id}`}
                                placeholder="Example: 'Approved based on student status and research needs' or 'Unable to approve at this time due to limited aid budget'"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="w-full h-24"
                              />
                            </div>
                            <div className="flex gap-3">
                              <Button
                                onClick={() => handleApproveRequest(request.id)}
                                disabled={processingRequest === request.id || !adminNotes.trim()}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve Financial Aid
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleRejectRequest(request.id)}
                                disabled={processingRequest === request.id || !adminNotes.trim()}
                                className="text-red-600 hover:text-red-700 border-red-300"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Decline Application
                              </Button>
                            </div>
                            {!adminNotes.trim() && (
                              <p className="text-xs text-gray-500 mt-2">
                                Please provide admin notes before making a decision
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Button onClick={() => updateAppState({ page: "main" })} variant="outline" className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
