import type { User } from "@/app/page"
import type { UserSubscription } from "@/types/subscription"
import type { UpgradeRequest } from "@/types/upgrade-request"

// Users API
export async function loadUsers(): Promise<Record<string, User>> {
  try {
    const response = await fetch("/api/users")
    if (!response.ok) throw new Error("Failed to load users")
    return await response.json()
  } catch (error) {
    console.error("Error loading users:", error)
    return {}
  }
}

export async function saveUsers(users: Record<string, User>): Promise<void> {
  try {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(users),
    })
    if (!response.ok) throw new Error("Failed to save users")
  } catch (error) {
    console.error("Error saving users:", error)
    throw new Error("Failed to save users")
  }
}

// Subscriptions API
export async function loadSubscriptions(): Promise<Record<string, UserSubscription>> {
  try {
    const response = await fetch("/api/subscriptions")
    if (!response.ok) throw new Error("Failed to load subscriptions")
    return await response.json()
  } catch (error) {
    console.error("Error loading subscriptions:", error)
    return {}
  }
}

export async function saveSubscriptions(subscriptions: Record<string, UserSubscription>): Promise<void> {
  try {
    const response = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscriptions),
    })
    if (!response.ok) throw new Error("Failed to save subscriptions")
  } catch (error) {
    console.error("Error saving subscriptions:", error)
    throw new Error("Failed to save subscriptions")
  }
}

// Upgrade Requests API
export async function loadUpgradeRequests(): Promise<UpgradeRequest[]> {
  try {
    const response = await fetch("/api/upgrade-requests")
    if (!response.ok) throw new Error("Failed to load upgrade requests")
    return await response.json()
  } catch (error) {
    console.error("Error loading upgrade requests:", error)
    return []
  }
}

export async function createUpgradeRequest(
  username: string,
  currentTier: string,
  requestedTier: string,
  financialAidData: {
    financialAidReason: string
    currentSituation: string
    howItHelps: string
    additionalInfo?: string
  },
): Promise<void> {
  try {
    const response = await fetch("/api/upgrade-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        username,
        currentTier,
        requestedTier,
        ...financialAidData,
      }),
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || "Failed to create upgrade request")
    }
  } catch (error) {
    console.error("Error creating upgrade request:", error)
    throw error
  }
}

export async function approveUpgradeRequest(requestId: string, adminNotes?: string): Promise<void> {
  try {
    const response = await fetch("/api/upgrade-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "approve",
        requestId,
        adminNotes,
      }),
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || "Failed to approve request")
    }
  } catch (error) {
    console.error("Error approving upgrade request:", error)
    throw error
  }
}

export async function rejectUpgradeRequest(requestId: string, adminNotes?: string): Promise<void> {
  try {
    const response = await fetch("/api/upgrade-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reject",
        requestId,
        adminNotes,
      }),
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || "Failed to reject request")
    }
  } catch (error) {
    console.error("Error rejecting upgrade request:", error)
    throw error
  }
}
