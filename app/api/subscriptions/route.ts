import { type NextRequest, NextResponse } from "next/server"
import { writeFile, readFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import type { UserSubscription } from "@/types/subscription"

const DATA_DIR = path.join(process.cwd(), "data")
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, "subscriptions.json")

// Default subscriptions
const DEFAULT_SUBSCRIPTIONS: Record<string, UserSubscription> = {
  admin: {
    username: "admin",
    tier: "tier2",
    apiCallsUsed: 0,
    lastResetDate: new Date().toISOString(),
  },
  abc: {
    username: "abc",
    tier: "free",
    apiCallsUsed: 0,
    lastResetDate: new Date().toISOString(),
  },
  test: {
    username: "test",
    tier: "tier1",
    apiCallsUsed: 0,
    lastResetDate: new Date().toISOString(),
  },
}

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
}

export async function GET() {
  try {
    await ensureDataDir()
    if (!existsSync(SUBSCRIPTIONS_FILE)) {
      await writeFile(SUBSCRIPTIONS_FILE, JSON.stringify(DEFAULT_SUBSCRIPTIONS, null, 2))
      return NextResponse.json(DEFAULT_SUBSCRIPTIONS)
    }
    const data = await readFile(SUBSCRIPTIONS_FILE, "utf-8")
    return NextResponse.json(JSON.parse(data))
  } catch (error) {
    console.error("Error loading subscriptions:", error)
    return NextResponse.json(DEFAULT_SUBSCRIPTIONS)
  }
}

export async function POST(request: NextRequest) {
  try {
    const subscriptions = await request.json()
    await ensureDataDir()
    await writeFile(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving subscriptions:", error)
    return NextResponse.json({ error: "Failed to save subscriptions" }, { status: 500 })
  }
}
