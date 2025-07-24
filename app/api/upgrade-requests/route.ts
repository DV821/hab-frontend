import { type NextRequest, NextResponse } from "next/server"
import { writeFile, readFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import type { UpgradeRequest } from "@/types/upgrade-request"
import type { User } from "@/app/page"
import type { UserSubscription } from "@/types/subscription"

const DATA_DIR = path.join(process.cwd(), "data")
const UPGRADE_REQUESTS_FILE = path.join(DATA_DIR, "upgrade-requests.json")
const USERS_FILE = path.join(DATA_DIR, "users.json")
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, "subscriptions.json")

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
}

export async function GET() {
  try {
    await ensureDataDir()
    if (!existsSync(UPGRADE_REQUESTS_FILE)) {
      await writeFile(UPGRADE_REQUESTS_FILE, JSON.stringify([], null, 2))
      return NextResponse.json([])
    }
    const data = await readFile(UPGRADE_REQUESTS_FILE, "utf-8")
    return NextResponse.json(JSON.parse(data))
  } catch (error) {
    console.error("Error loading upgrade requests:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (action === "create") {
      // Create new upgrade request
      const { username, currentTier, requestedTier } = data

      await ensureDataDir()
      let requests: UpgradeRequest[] = []

      if (existsSync(UPGRADE_REQUESTS_FILE)) {
        const requestsData = await readFile(UPGRADE_REQUESTS_FILE, "utf-8")
        requests = JSON.parse(requestsData)
      }

      // Check if there's already a pending request
      const existingRequest = requests.find((req) => req.username === username && req.status === "pending")
      if (existingRequest) {
        return NextResponse.json({ error: "You already have a pending upgrade request" }, { status: 400 })
      }

      const newRequest: UpgradeRequest = {
        id: Date.now().toString(),
        username,
        currentTier,
        requestedTier,
        requestDate: new Date().toISOString(),
        status: "pending",
        financialAidReason: data.financialAidReason,
        currentSituation: data.currentSituation,
        howItHelps: data.howItHelps,
        additionalInfo: data.additionalInfo || "",
      }

      requests.push(newRequest)
      await writeFile(UPGRADE_REQUESTS_FILE, JSON.stringify(requests, null, 2))
      return NextResponse.json({ success: true })
    } else if (action === "approve") {
      // Approve upgrade request
      const { requestId, adminNotes } = data

      // Load all data
      const requestsData = await readFile(UPGRADE_REQUESTS_FILE, "utf-8")
      const requests: UpgradeRequest[] = JSON.parse(requestsData)

      const usersData = await readFile(USERS_FILE, "utf-8")
      const users: Record<string, User> = JSON.parse(usersData)

      const subscriptionsData = await readFile(SUBSCRIPTIONS_FILE, "utf-8")
      const subscriptions: Record<string, UserSubscription> = JSON.parse(subscriptionsData)

      const requestIndex = requests.findIndex((req) => req.id === requestId)
      if (requestIndex === -1) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 })
      }

      const request = requests[requestIndex]

      // Update user tier
      if (users[request.username]) {
        users[request.username].tier = request.requestedTier as any
      }

      // Update subscription
      if (subscriptions[request.username]) {
        subscriptions[request.username].tier = request.requestedTier as any
      }

      // Update request status
      requests[requestIndex] = {
        ...request,
        status: "approved",
        adminNotes,
      }

      // Save all data
      await writeFile(USERS_FILE, JSON.stringify(users, null, 2))
      await writeFile(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2))
      await writeFile(UPGRADE_REQUESTS_FILE, JSON.stringify(requests, null, 2))

      return NextResponse.json({ success: true })
    } else if (action === "reject") {
      // Reject upgrade request
      const { requestId, adminNotes } = data

      const requestsData = await readFile(UPGRADE_REQUESTS_FILE, "utf-8")
      const requests: UpgradeRequest[] = JSON.parse(requestsData)

      const requestIndex = requests.findIndex((req) => req.id === requestId)
      if (requestIndex === -1) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 })
      }

      requests[requestIndex] = {
        ...requests[requestIndex],
        status: "rejected",
        adminNotes,
      }

      await writeFile(UPGRADE_REQUESTS_FILE, JSON.stringify(requests, null, 2))
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error processing upgrade request:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
