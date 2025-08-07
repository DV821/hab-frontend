"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  Crown,
  Shield,
  BarChart3,
  Bell,
  Heart,
  ArrowLeft,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
} from "lucide-react"
import {
  fetchAllUsers,
  fetchAllSubscriptions,
  fetchAllUpgradeRequests,
  approveUpgradeRequest,
  rejectUpgradeRequest,
} from "@/lib/api-client"
import type { AppState } from "@/app/page"
import type { SubscriptionTier, UserSubscription } from "@/types/subscription"
import { TIER_CONFIG } from "@/types/subscription"
import type { UpgradeRequest } from "@/types/upgrade-request"

interface AdminPanelProps {
  username: string
  userTier: SubscriptionTier
  updateAppState: (updates: Partial<AppState>) => void
}

interface AdminUser {
  username: string
  tier: SubscriptionTier
  subscription: UserSubscription
}

export default function AdminPanel({ username, userTier, updateAppState }: AdminPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState<"users" | "requests">("users")
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})

  // Load all users and requests
  const loadAllData = async () => {
    setLoading(true)
    try {
      const [usersData, subsData, requestsData] = await Promise.all([
        fetchAllUsers(),
        fetchAllSubscriptions(),
        fetchAllUpgradeRequests(),
      ])
      const mergedUsers: AdminUser[] = usersData.map((user) => ({
        ...user,
        subscription: subsData[user.username] || {
          username: user.username,
          tier: user.tier,
          apiCallsUsed: 0,
          lastResetDate: "",
        },
      }))
      setUsers(mergedUsers)
      setUpgradeRequests(requestsData)
    } catch (err) {
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
    // eslint-disable-next-line
  }, [])

  // Stats
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const pendingRequests = upgradeRequests.filter((req) => req.status === "pending")
  const stats = {
    totalUsers: users.length,
    tierCounts: users.reduce(
      (acc, user) => {
        acc[user.tier] = (acc[user.tier] || 0) + 1
        return acc
      },
      {} as Record<SubscriptionTier, number>
    ),
    pendingRequests: pendingRequests.length,
  }

  // Badge color for tier
  const getTierBadgeColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case "free":
        return "bg-gray-500"
      case "tier1":
        return "bg-blue-500"
      case "tier2":
        return "bg-purple-500"
      case "admin":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
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

  // Approve/Reject handlers
  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequest(requestId)
    setError("")
    try {
      await approveUpgradeRequest(requestId, adminNotes[requestId] || "")
      await loadAllData()
      setSuccess("Upgrade request approved successfully")
      setAdminNotes((prev) => ({ ...prev, [requestId]: "" }))
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Failed to approve request")
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequest(requestId)
    setError("")
    try {
      await rejectUpgradeRequest(requestId, adminNotes[requestId] || "")
      await loadAllData()
      setSuccess("Upgrade request rejected")
      setAdminNotes((prev) => ({ ...prev, [requestId]: "" }))
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Failed to reject request")
    } finally {
      setProcessingRequest(null)
    }
  }

  // Only allow admin
  // if (userTier !== "admin" || username !== "admin") {
  if (userTier !== "admin") {

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

  // Sort requests: pending first, then approved/rejected
  const sortedUpgradeRequests = [...upgradeRequests].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1
    if (a.status !== "pending" && b.status === "pending") return 1
    return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
  })

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
        <div className="grid md:grid-cols-5 gap-4 mb-6">
          <Card className="backdrop-blur-sm bg-white/80 border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-teal-600" />
                <div>
                  <div className="text-xl font-bold">{stats.totalUsers}</div>
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
                  <div className="text-xl font-bold">{stats.tierCounts.tier2 || 0}</div>
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
                  <div className="text-xl font-bold">{stats.tierCounts.tier1 || 0}</div>
                  <div className="text-sm text-gray-600">Pro Users</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-sm bg-white/80 border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-gray-500" />
                <div>
                  <div className="text-xl font-bold">{stats.tierCounts.free || 0}</div>
                  <div className="text-sm text-gray-600">Free Users</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-sm bg-white/80 border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Bell className="w-8 h-8 text-orange-600" />
                <div>
                  <div className="text-xl font-bold">{stats.pendingRequests}</div>
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
            variant="default"
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold transition-all ${
              activeTab === "users"
                ? "bg-teal-600 text-white shadow"
                : "bg-white text-teal-700 border border-teal-200 hover:bg-teal-50"
            }`}
            onClick={() => setActiveTab("users")}
          >
            <Users className="w-4 h-4 mr-2" />
            User Management
          </Button>
          <Button
            variant="default"
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold transition-all ${
              activeTab === "requests"
                ? "bg-orange-600 text-white shadow"
                : "bg-white text-orange-700 border border-orange-200 hover:bg-orange-50"
            }`}
            onClick={() => setActiveTab("requests")}
          >
            <Bell className="w-4 h-4 mr-2" />
            Upgrade Requests
            {pendingRequests.length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs">{pendingRequests.length}</Badge>
            )}
          </Button>
          <Button
            onClick={loadAllData}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* User Management Table */}
        {activeTab === "users" && (
          <Card className="backdrop-blur-sm bg-white/80 border-0 mb-6">
            <CardHeader>
              <CardTitle className="text-teal-700">All Users ({filteredUsers.length})</CardTitle>
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
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Username</th>
                      <th className="text-left py-3 px-2">Subscription</th>
                      <th className="text-left py-3 px-2">API Usage</th>
                      <th className="text-left py-3 px-2">Last Reset</th>
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
                          <Badge className={`${getTierBadgeColor(user.tier)} text-white`}>
                            {TIER_CONFIG[user.tier].displayName}
                          </Badge>
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
                          {user.subscription.lastResetDate
                            ? new Date(user.subscription.lastResetDate).toLocaleDateString()
                            : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upgrade Requests Section */}
        {activeTab === "requests" && (
          <Card className="backdrop-blur-sm bg-white/80 border-0">
            <CardHeader>
              <CardTitle className="text-teal-700">Upgrade Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedUpgradeRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No upgrade requests found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedUpgradeRequests.map((request) => (
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
                                value={adminNotes[request.id] || ""}
                                onChange={(e) =>
                                  setAdminNotes((prev) => ({ ...prev, [request.id]: e.target.value }))
                                }
                                className="w-full h-24"
                              />
                            </div>
                            <div className="flex gap-3">
                              <Button
                                onClick={() => handleApproveRequest(request.id)}
                                disabled={processingRequest === request.id || !(adminNotes[request.id] || "").trim()}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve Financial Aid
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleRejectRequest(request.id)}
                                disabled={processingRequest === request.id || !(adminNotes[request.id] || "").trim()}
                                className="text-red-600 hover:text-red-700 border-red-300"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Decline Application
                              </Button>
                            </div>
                            {!(adminNotes[request.id] || "").trim() && (
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