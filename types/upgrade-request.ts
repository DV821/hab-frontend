export interface UpgradeRequest {
  id: string
  username: string
  currentTier: string
  requestedTier: string
  requestDate: string
  status: "pending" | "approved" | "rejected"

  // Financial Aid Information
  financialAidReason: string
  currentSituation: string
  howItHelps: string
  additionalInfo?: string

  adminNotes?: string
}
