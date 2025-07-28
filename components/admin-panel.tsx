"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Crown, CheckCircle, XCircle, Edit, Trash2, Loader2 } from "lucide-react";
import type { AppState } from "@/app/page";
import type { SubscriptionTier, UserSubscription } from "@/types/subscription";
import type { UpgradeRequest } from "@/types/upgrade-request";
import { TIER_CONFIG } from "@/types/subscription";
import {
  fetchAllUsers,
  fetchAllSubscriptions,
  fetchAllUpgradeRequests,
  approveUpgradeRequest,
  rejectUpgradeRequest,
} from "@/lib/api-client";

interface AdminPanelProps {
  username: string;
  userTier: SubscriptionTier;
  updateAppState: (updates: Partial<AppState>) => void;
}

interface AdminUser {
  username: string;
  tier: SubscriptionTier;
  subscription: UserSubscription;
}

export default function AdminPanel({ username, userTier, updateAppState }: AdminPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, UserSubscription>>({});
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "requests">("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all users and subscriptions
    const fetchData = async () => {
      setLoading(true);
      try {
        const usersData = await fetchAllUsers();
        const subsData = await fetchAllSubscriptions();
        setSubscriptions(subsData);

        // Merge user and subscription info
        const mergedUsers: AdminUser[] = usersData.map((user) => ({
          ...user,
          subscription: subsData[user.username] || {
            username: user.username,
            tier: user.tier,
            apiCallsUsed: 0,
            lastResetDate: "",
          },
        }));
        setUsers(mergedUsers);

        const requestsData = await fetchAllUpgradeRequests();
        setUpgradeRequests(requestsData);
      } catch (err) {
        setError("Failed to fetch admin data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    setError("");
    setSuccess("");
    try {
      await approveUpgradeRequest(requestId, adminNotes);
      setSuccess("Upgrade request approved");
      setAdminNotes("");
      setTimeout(() => setSuccess(""), 3000);
      // Refresh requests and users
      const requestsData = await fetchAllUpgradeRequests();
      setUpgradeRequests(requestsData);
      const usersData = await fetchAllUsers();
      const subsData = await fetchAllSubscriptions();
      setSubscriptions(subsData);
      const mergedUsers: AdminUser[] = usersData.map((user) => ({
        ...user,
        subscription: subsData[user.username] || {
          username: user.username,
          tier: user.tier,
          apiCallsUsed: 0,
          lastResetDate: "",
        },
      }));
      setUsers(mergedUsers);
    } catch (error) {
      setError("Failed to approve request");
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    setError("");
    setSuccess("");
    try {
      await rejectUpgradeRequest(requestId, adminNotes);
      setSuccess("Upgrade request rejected");
      setAdminNotes("");
      setTimeout(() => setSuccess(""), 3000);
      // Refresh requests
      const requestsData = await fetchAllUpgradeRequests();
      setUpgradeRequests(requestsData);
    } catch (error) {
      setError("Failed to reject request");
    } finally {
      setProcessingRequest(null);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pendingRequests = upgradeRequests.filter((req) => req.status === "pending");

  const getUsageStats = () => {
    const totalUsers = users.length;
    const tierCounts = users.reduce(
      (acc, user) => {
        acc[user.tier] = (acc[user.tier] || 0) + 1;
        return acc;
      },
      {} as Record<SubscriptionTier, number>
    );
    const totalApiCalls = users.reduce((sum, user) => sum + user.subscription.apiCallsUsed, 0);
    return { totalUsers, tierCounts, totalApiCalls, pendingRequests: pendingRequests.length };
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-100 via-cyan-100 to-blue-100">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
          <div className="text-purple-700 font-semibold text-lg">Loading admin data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-cyan-100 to-blue-100 opacity-30" />
      <div className="relative max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-purple-700">Admin Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        {/* Stats */}
        <Card className="backdrop-blur-sm bg-white/80 border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-purple-700">System Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8">
              <div>
                <div className="font-semibold text-lg">{getUsageStats().totalUsers}</div>
                <div className="text-xs text-gray-600">Total Users</div>
              </div>
              <div>
                <div className="font-semibold text-lg">{getUsageStats().tierCounts["free"] || 0}</div>
                <div className="text-xs text-gray-600">Free Tier</div>
              </div>
              <div>
                <div className="font-semibold text-lg">{getUsageStats().tierCounts["tier1"] || 0}</div>
                <div className="text-xs text-gray-600">Tier 1</div>
              </div>
              <div>
                <div className="font-semibold text-lg">{getUsageStats().tierCounts["tier2"] || 0}</div>
                <div className="text-xs text-gray-600">Tier 2</div>
              </div>
              <div>
                <div className="font-semibold text-lg">{getUsageStats().totalApiCalls}</div>
                <div className="text-xs text-gray-600">Total API Calls</div>
              </div>
              <div>
                <div className="font-semibold text-lg">{getUsageStats().pendingRequests}</div>
                <div className="text-xs text-gray-600">Pending Requests</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === "users" ? "default" : "outline"}
            onClick={() => setActiveTab("users")}
          >
            Users
          </Button>
          <Button
            variant={activeTab === "requests" ? "default" : "outline"}
            onClick={() => setActiveTab("requests")}
          >
            Upgrade Requests
          </Button>
        </div>

        {/* Error/Success */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <Card className="backdrop-blur-sm bg-white/80 border-0 mb-6">
            <CardHeader>
              <CardTitle className="text-purple-700">All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border rounded px-3 py-2 w-64"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Username</th>
                      <th className="text-center py-2">Tier</th>
                      <th className="text-center py-2">API Calls Used</th>
                      <th className="text-center py-2">Last Reset</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.username} className="border-b">
                        <td className="py-2">{user.username}</td>
                        <td className="text-center">
                          <Badge className="text-xs">
                            {TIER_CONFIG[user.tier].displayName}
                          </Badge>
                        </td>
                        <td className="text-center">{user.subscription.apiCallsUsed}</td>
                        <td className="text-center">{user.subscription.lastResetDate?.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <Card className="backdrop-blur-sm bg-white/80 border-0 mb-6">
            <CardHeader>
              <CardTitle className="text-purple-700">Upgrade Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {pendingRequests.length === 0 && (
                  <div className="text-gray-600">No pending requests.</div>
                )}
                {pendingRequests.map((request) => (
                  <Card key={request.id} className="mb-4 border">
                    <CardHeader>
                      <CardTitle>
                        {request.username} requests upgrade to{" "}
                        <Badge className="text-xs">
                          {TIER_CONFIG[request.requestedTier].displayName}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Current Tier:</strong>{" "}
                          {TIER_CONFIG[request.currentTier].displayName}
                        </div>
                        <div>
                          <strong>Financial Aid Reason:</strong>{" "}
                          {request.financialAidReason}
                        </div>
                        <div>
                          <strong>Current Situation:</strong>{" "}
                          {request.currentSituation}
                        </div>
                        <div>
                          <strong>How It Helps:</strong>{" "}
                          {request.howItHelps}
                        </div>
                        {request.additionalInfo && (
                          <div>
                            <strong>Additional Info:</strong>{" "}
                            {request.additionalInfo}
                          </div>
                        )}
                        <div>
                          <strong>Request Date:</strong>{" "}
                          {new Date(request.requestDate).toLocaleString()}
                        </div>
                        <div>
                          <strong>Status:</strong>{" "}
                          <Badge className="text-xs">{request.status}</Badge>
                        </div>
                        <div className="mt-3">
                          <textarea
                            placeholder="Admin notes (required)"
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            className="border rounded px-3 py-2 w-full"
                            rows={2}
                          />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="default"
                            onClick={() => handleApproveRequest(request.id)}
                            disabled={processingRequest === request.id || !adminNotes.trim()}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {processingRequest === request.id ? "Processing..." : "Approve Financial Aid"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleRejectRequest(request.id)}
                            disabled={processingRequest === request.id || !adminNotes.trim()}
                            className="text-red-600 hover:text-red-700 border-red-300"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            {processingRequest === request.id ? "Processing..." : "Decline Application"}
                          </Button>
                        </div>
                        {!adminNotes.trim() && (
                          <p className="text-xs text-gray-500 mt-2">
                            Please provide admin notes before making a decision
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Button onClick={() => updateAppState({ page: "main" })} variant="outline" className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}