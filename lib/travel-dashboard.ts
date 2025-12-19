import type { SupabaseClient } from "@supabase/supabase-js"
import { getAuthHeaders } from "./session"

type TravelCategoryMap = Record<string, { normalized: string; display: string }>

const TRAVEL_CATEGORY_MAP: TravelCategoryMap = {
  null: { normalized: "uncategorized", display: "Uncategorized" },
  EXP: { normalized: "uncategorized", display: "Uncategorized" },
  Staff_companytrip: { normalized: "staff_events", display: "Staff Events" },
  Staff_teambuilding: { normalized: "staff_events", display: "Staff Events" },
  Staff_coteambuilding: { normalized: "staff_events", display: "Staff Events" },
  "Staff_ deptteambuilding": { normalized: "staff_events", display: "Staff Events" },
  Staff_festive: { normalized: "staff_events", display: "Staff Events" },
  Staff_annualdinner: { normalized: "staff_events", display: "Staff Events" },
  Marketing_permit_insurance: { normalized: "marketing", display: "Marketing" },
  Marketing: { normalized: "marketing", display: "Marketing" },
  Marketing_others: { normalized: "marketing", display: "Marketing" },
  Marketing_allowance: { normalized: "allowances", display: "Allowances" },
  Staff_daily_allowance: { normalized: "allowances", display: "Allowances" },
  Travel_daily_allowance: { normalized: "allowances", display: "Allowances" },
  Recruitment: { normalized: "recruitment", display: "Recruitment" },
  Travel_flight: { normalized: "travel_transport", display: "Travel & Transportation" },
  Travel_taxi: { normalized: "travel_transport", display: "Travel & Transportation" },
  Travel: { normalized: "travel_general", display: "Travel - General" },
  Travel_others: { normalized: "travel_others", display: "Travel - Others" },
  Travel_permit: { normalized: "travel_admin", display: "Travel Administration" },
  Staff_parking: { normalized: "staff_transport", display: "Staff Transportation" },
  Staff_taxi: { normalized: "staff_transport", display: "Staff Transportation" },
  Staff_milage_toll: { normalized: "staff_transport", display: "Staff Transportation" },
}

export interface TravelClaim {
  id: string
  amount: number
  currency: string
  date: string
  submittedYear: number | null
  classId?: string | null
  displayCategory: string
  description?: string
  state?: string
}

export interface TravelDashboardData {
  totalAmount: number
  currency: string
  claims: TravelClaim[]
  categories: { name: string; amount: number }[]
  years: number[]
}

const toNumber = (value?: number | string | null): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export const getTravelCategoryDisplay = (classId?: string | null): string => {
  if (!classId) return TRAVEL_CATEGORY_MAP.null.display
  const trimmed = classId.trim()
  return TRAVEL_CATEGORY_MAP[trimmed]?.display || TRAVEL_CATEGORY_MAP.null.display
}

export const fetchTravelDashboardDataFromSupabase = async (
  supabase: SupabaseClient,
  email: string,
): Promise<TravelDashboardData> => {
  if (!email) {
    throw new Error("User email is required to fetch travel dashboard data.")
  }

  const { data, error } = await supabase
    .from("claim_analysis")
    .select(
      "id, record_key, class_id, claim_type, claim_description, transaction_amount, transaction_currency, date_paid, date_submitted, state, email",
    )
    .eq("email", email)
    .eq("claim_type", "Travel Reimbursement")
    .neq("state", "Complete")
    .order("date_submitted", { ascending: false })

  if (error) {
    throw new Error(`Failed to load travel claims: ${error.message}`)
  }

  const claims: TravelClaim[] =
    data?.map((row) => {
      const amount = toNumber(row.transaction_amount)
      const currency = row.transaction_currency?.trim() || "USD"
      const date = row.date_paid || row.date_submitted || "—"
      const submittedYear = row.date_submitted ? new Date(row.date_submitted).getUTCFullYear() : null
      const displayCategory = getTravelCategoryDisplay((row as { class_id?: string | null }).class_id)
      const id =
        (row.record_key || row.id || `${row.claim_type || "TRAVEL"}-${row.date_submitted || "UNK"}`)?.toString() ||
        "TRAVEL-UNK"

      return {
        id,
        amount,
        currency,
        date,
        submittedYear,
        classId: (row as { class_id?: string | null }).class_id,
        displayCategory,
        description: row.claim_description || undefined,
        state: row.state || "Pending",
      }
    }) ?? []

  const categoriesMap = new Map<string, number>()
  claims.forEach((claim) => {
    const current = categoriesMap.get(claim.displayCategory) ?? 0
    categoriesMap.set(claim.displayCategory, current + claim.amount)
  })

  const categories = Array.from(categoriesMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)

  const years = Array.from(
    new Set(
      claims
        .map((claim) => claim.submittedYear)
        .filter((year): year is number => typeof year === "number" && !Number.isNaN(year)),
    ),
  ).sort((a, b) => b - a)

  return {
    totalAmount: claims.reduce((sum, claim) => sum + claim.amount, 0),
    currency: claims[0]?.currency || "USD",
    claims,
    categories,
    years,
  }
}

export const fetchTravelDashboardData = async (email: string): Promise<TravelDashboardData> => {
  if (!email) {
    throw new Error("User email is required to fetch travel dashboard data.")
  }

  const response = await fetch("/api/travel-dashboard", {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ email }),
  })

  const raw = await response.text()
  let payload: { data?: TravelDashboardData; error?: string } = {}

  if (raw) {
    try {
      payload = JSON.parse(raw)
    } catch (error) {
      console.warn("Failed to parse travel dashboard API response:", error)
    }
  }

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to load travel dashboard data from Supabase.")
  }

  if (!payload.data) {
    throw new Error("Travel dashboard data is missing from the server response.")
  }

  return payload.data
}
