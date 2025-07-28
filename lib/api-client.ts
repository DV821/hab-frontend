import type { User } from "@/app/page";
import type { UserSubscription } from "@/types/subscription";
import type { UpgradeRequest } from "@/types/upgrade-request";

// Get API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Helper to get JWT token from localStorage
function getAuthHeaders() {
  const token = localStorage.getItem("hab_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// -------------------- AUTH --------------------

// Register user
export async function registerUser(username: string, password: string, tier: string = "free") {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, tier }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// Login user
export async function loginUser(username: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  localStorage.setItem("hab_token", data.access_token);
  return data;
}

// Logout user
export function logoutUser() {
  localStorage.removeItem("hab_token");
}

// -------------------- USERS (Admin) --------------------

// Admin: get all users
export async function fetchAllUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE_URL}/api/users/`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// -------------------- SUBSCRIPTIONS --------------------

// Get current user's subscription
export async function fetchUserSubscription(): Promise<UserSubscription> {
  const res = await fetch(`${API_BASE_URL}/api/subscriptions/me`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// Admin: get all subscriptions
export async function fetchAllSubscriptions(): Promise<Record<string, UserSubscription>> {
  const res = await fetch(`${API_BASE_URL}/api/subscriptions/`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// -------------------- UPGRADE REQUESTS --------------------

// Get current user's upgrade requests
export async function fetchMyUpgradeRequests(): Promise<UpgradeRequest[]> {
  const res = await fetch(`${API_BASE_URL}/api/upgrade-requests/me`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// Admin: get all upgrade requests
export async function fetchAllUpgradeRequests(): Promise<UpgradeRequest[]> {
  const res = await fetch(`${API_BASE_URL}/api/upgrade-requests/`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// Create upgrade request (user)
export async function createUpgradeRequest(payload: {
  username: string;
  currentTier: string;
  requestedTier: string;
  financialAidReason: string;
  currentSituation: string;
  howItHelps: string;
  additionalInfo?: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/upgrade-requests/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ action: "create", ...payload }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to create upgrade request");
}

// Admin: approve upgrade request
export async function approveUpgradeRequest(requestId: string, adminNotes?: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/upgrade-requests/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ action: "approve", requestId, adminNotes }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to approve request");
}

// Admin: reject upgrade request
export async function rejectUpgradeRequest(requestId: string, adminNotes?: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/upgrade-requests/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ action: "reject", requestId, adminNotes }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to reject request");
}

// -------------------- PREDICTION --------------------

// Map prediction
export async function makePrediction(payload: any) {
  const res = await fetch(`${API_BASE_URL}/api/predict/map`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// Image upload prediction (tier1/tier2 only)
export async function uploadPredictionImage(file: File, tier: string) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("tier", tier);

  const res = await fetch(`${API_BASE_URL}/api/predict/imageupload`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}