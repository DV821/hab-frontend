import { type NextRequest, NextResponse } from "next/server"
import { writeFile, readFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import type { User } from "@/app/page"

const DATA_DIR = path.join(process.cwd(), "data")
const USERS_FILE = path.join(DATA_DIR, "users.json")

// Default users
const DEFAULT_USERS: Record<string, User> = {
  admin: { username: "admin", password: "admin", tier: "tier2" },
  abc: { username: "abc", password: "abc", tier: "free" },
  test: { username: "test", password: "test", tier: "tier1" },
}

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
}

export async function GET() {
  try {
    await ensureDataDir()
    if (!existsSync(USERS_FILE)) {
      await writeFile(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2))
      return NextResponse.json(DEFAULT_USERS)
    }
    const data = await readFile(USERS_FILE, "utf-8")
    return NextResponse.json(JSON.parse(data))
  } catch (error) {
    console.error("Error loading users:", error)
    return NextResponse.json(DEFAULT_USERS)
  }
}

export async function POST(request: NextRequest) {
  try {
    const users = await request.json()
    await ensureDataDir()
    await writeFile(USERS_FILE, JSON.stringify(users, null, 2))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving users:", error)
    return NextResponse.json({ error: "Failed to save users" }, { status: 500 })
  }
}
