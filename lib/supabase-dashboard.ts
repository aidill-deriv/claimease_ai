import type { SupabaseClient } from "@supabase/supabase-js"
import { getAuthHeaders } from "./session"

const summaryTable =
  process.env.NEXT_PUBLIC_SUPABASE_SUMMARY_TABLE ||
  process.env.NEXT_PUBLIC_SUPABASE_BALANCE_TABLE ||
  "claim_summary"
const analysisTable =
  process.env.NEXT_PUBLIC_SUPABASE_ANALYSIS_TABLE ||
  process.env.NEXT_PUBLIC_SUPABASE_CLAIMS_TABLE ||
  "claim_analysis"
const employeeTable = process.env.NEXT_PUBLIC_SUPABASE_EMPLOYEE_TABLE || "employee_email"

const CATEGORY_COLORS = ["#FF9C13", "#2C9AFF", "#00C390", "#FF444F", "#A855F7", "#6366F1"]
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const RECENT_CLAIMS_FETCH_LIMIT = 100

const getRestrictedCountries = (): string[] => {
  const envValue =
    process.env.BENEFIT_INELIGIBLE_COUNTRIES ||
    process.env.NEXT_PUBLIC_BENEFIT_INELIGIBLE_COUNTRIES ||
    "France,Malta"

  return envValue
    .split(",")
    .map((country) => country.trim().toLowerCase())
    .filter(Boolean)
}

const toNumber = (value?: number | string | null): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const titleCase = (value: string): string => {
  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

const parseDate = (value?: string | null): Date | null => {
  if (!value) {
    return null
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export interface BalanceData {
  total: number
  used: number
  remaining: number
  currency: string
}

export interface MonthlySpendingEntry {
  month: string
  amount: number
  currency: string
}

export interface CategorySpendingEntry {
  name: string
  value: number
  color: string
}

export interface ProcessingStats {
  averageDays: number
  paidCount: number
}

export interface RecentClaim {
  id: string
  date: string
  category: string
  amount: number
  status: string
  currency: string
  title: string
  reference?: string
  description?: string
}

export interface DashboardData {
  balance: BalanceData
  monthlySpending: MonthlySpendingEntry[]
  categorySpending: CategorySpendingEntry[]
  recentClaims: RecentClaim[]
  processing: ProcessingStats
  employeeCountry: string | null
  isBenefitRestricted: boolean
}

export const DEFAULT_DASHBOARD_DATA: DashboardData = {
  balance: {
    total: 2000,
    used: 0,
    remaining: 0,
    currency: "USD",
  },
  monthlySpending: [
    { month: "Jan", amount: 450, currency: "USD" },
    { month: "Feb", amount: 380, currency: "USD" },
    { month: "Mar", amount: 520, currency: "USD" },
    { month: "Apr", amount: 410, currency: "USD" },
    { month: "May", amount: 590, currency: "USD" },
  ],
  categorySpending: [
    { name: "Medical", value: 1200, color: "#FF9C13" },
    { name: "Dental", value: 450, color: "#2C9AFF" },
    { name: "Optical", value: 350, color: "#00C390" },
    { name: "Wellness", value: 350, color: "#FF444F" },
  ],
  recentClaims: [
    {
      id: "CLM-2025-001",
      date: "2025-05-15",
      category: "Medical",
      amount: 250,
      status: "Approved",
      currency: "USD",
      title: "Medical Claim",
      reference: "CLM-2025-001",
      description: "Medical reimbursement",
    },
    {
      id: "CLM-2025-002",
      date: "2025-05-10",
      category: "Dental",
      amount: 180,
      status: "Approved",
      currency: "USD",
      title: "Dental Claim",
      reference: "CLM-2025-002",
      description: "Dental reimbursement",
    },
    {
      id: "CLM-2025-003",
      date: "2025-05-05",
      category: "Optical",
      amount: 120,
      status: "Pending",
      currency: "USD",
      title: "Optical Claim",
      reference: "CLM-2025-003",
      description: "Optical reimbursement",
    },
    {
      id: "CLM-2025-004",
      date: "2025-04-28",
      category: "Wellness",
      amount: 90,
      status: "Approved",
      currency: "USD",
      title: "Wellness Claim",
      reference: "CLM-2025-004",
      description: "Wellness reimbursement",
    },
  ],
  processing: {
    averageDays: 0,
    paidCount: 0,
  },
  employeeCountry: null,
  isBenefitRestricted: false,
}

type ClaimSummaryRow = {
  max_amount?: number | null
  total_transaction_amount?: number | null
  remaining_balance?: number | null
  currency?: string | null
  country?: string | null
}

type ClaimAnalysisRow = {
  id?: string | number | null
  record_key?: string | null
  sup_doc_id?: string | null
  claim_type?: string | null
  claim_description?: string | null
  line_description?: string | null
  description?: string | null
  transaction_amount?: number | null
  transaction_currency?: string | null
  date_paid?: string | null
  date_submitted?: string | null
  state?: string | null
}

type EmployeeRow = {
  email?: string | null
  country?: string | null
}

const mapSummaryRow = (row: ClaimSummaryRow | null): BalanceData => {
  if (!row) {
    return {
      total: 0,
      used: 0,
      remaining: 0,
      currency: "USD",
    }
  }

  const total = toNumber(row.max_amount)
  const used = toNumber(row.total_transaction_amount)
  const fallbackRemaining = Math.max(total - used, 0)
  const remaining =
    row.remaining_balance !== null && row.remaining_balance !== undefined
      ? toNumber(row.remaining_balance)
      : fallbackRemaining

  return { total, used, remaining, currency: row.currency || "USD" }
}

const mapMonthlyFromAnalysis = (rows: ClaimAnalysisRow[]): MonthlySpendingEntry[] => {
  if (rows.length === 0) {
    return []
  }

  const grouped = new Map<
    string,
    {
      month: string
      amount: number
      sortIndex: number
      currency: string
    }
  >()

  rows.forEach((row) => {
    const date = parseDate(row.date_paid) || parseDate(row.date_submitted)
    if (!date) {
      return
    }

    const currentYear = new Date().getUTCFullYear()
    if (date.getUTCFullYear() !== currentYear) {
      return
    }

    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
    const month = MONTH_LABELS[date.getUTCMonth()]
    const sortIndex = date.getUTCFullYear() * 12 + date.getUTCMonth()
    const amount = toNumber(row.transaction_amount)

    const currency = row.transaction_currency || "USD"
    const existing = grouped.get(key)
    if (existing) {
      existing.amount += amount
    } else {
      grouped.set(key, { month, amount, sortIndex, currency })
    }
  })

  return Array.from(grouped.values())
    .sort((a, b) => a.sortIndex - b.sortIndex)
    .map(({ month, amount, currency }) => ({ month, amount, currency }))
}

const mapCategoryFromAnalysis = (rows: ClaimAnalysisRow[]): CategorySpendingEntry[] => {
  if (rows.length === 0) {
    return []
  }

  const currentYear = new Date().getUTCFullYear()
  const totals = new Map<string, number>()

  rows.forEach((row) => {
    const date = parseDate(row.date_paid) || parseDate(row.date_submitted)
    if (!date || date.getUTCFullYear() !== currentYear) {
      return
    }

    const rawName = row.claim_description || row.line_description || row.claim_type || row.description || "General"
    const name = titleCase(rawName)
    const current = totals.get(name) ?? 0
    totals.set(name, current + toNumber(row.transaction_amount))
  })

  return Array.from(totals.entries()).map(([name, value], index) => ({
    name,
    value,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }))
}

const mapProcessingStats = (rows: ClaimAnalysisRow[]): ProcessingStats => {
  if (rows.length === 0) {
    return { averageDays: 0, paidCount: 0 }
  }

  const benefitRows = rows.filter((row) => row.claim_type?.toLowerCase() === "employee benefit")
  if (benefitRows.length === 0) {
    return { averageDays: 0, paidCount: 0 }
  }

  let totalDays = 0
  let count = 0

  benefitRows.forEach((row) => {
    if (!row.date_paid || !row.date_submitted || row.state?.toLowerCase() !== "paid") {
      return
    }

    const paid = parseDate(row.date_paid)
    const submitted = parseDate(row.date_submitted)
    if (!paid || !submitted) {
      return
    }

    const diffDays = Math.max(0, Math.round((paid.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24)))
    totalDays += diffDays
    count += 1
  })

  return {
    averageDays: count > 0 ? Number((totalDays / count).toFixed(1)) : 0,
    paidCount: count,
  }
}

const mapRecentClaimsFromAnalysis = (rows: ClaimAnalysisRow[]): RecentClaim[] => {
  if (rows.length === 0) {
    return []
  }

  return rows
    .filter((row) => row.claim_type?.toLowerCase() === "employee benefit")
    .map((row) => {
      const paidDate = parseDate(row.date_paid)
      const submittedDate = parseDate(row.date_submitted)
      const date = paidDate ?? submittedDate
      const descriptor =
        row.claim_description ||
        row.line_description ||
        row.description ||
        (row.claim_type ? titleCase(row.claim_type) : "Employee Benefit Claim")
      const fallbackTitle = row.claim_type ? titleCase(row.claim_type) : "Employee Benefit Claim"
      const descriptorTrimmed = descriptor && descriptor.trim().length > 0 ? descriptor.trim() : ""
      const title =
        descriptorTrimmed.length > 0
          ? descriptorTrimmed
          : date
            ? `${fallbackTitle} • ${date.toISOString().slice(0, 10)}`
            : fallbackTitle
      const descriptionText =
        typeof row.description === "string" && row.description.trim().length > 0 ? row.description.trim() : undefined

      return {
        id: (row.record_key || row.id || `${row.claim_type || "CLAIM"}-${row.date_paid || row.date_submitted || "UNK"}`).toString(),
        date: date ? date.toISOString().slice(0, 10) : "—",
        category: titleCase(row.claim_description || row.claim_type || "General"),
        amount: toNumber(row.transaction_amount),
        status: titleCase(row.state || "Pending"),
        currency: row.transaction_currency || "USD",
        title,
        reference: row.record_key?.toString() || row.sup_doc_id?.toString() || undefined,
        description: descriptionText,
        sortValue: date ? date.getTime() : 0,
      }
    })
    .sort((a, b) => b.sortValue - a.sortValue)
    .map(({ sortValue, ...rest }) => rest)
}

const buildSectionError = (section: string, errorMessage: string) =>
  `${section}: ${errorMessage}`.trim()

export const getDashboardDataFromSupabase = async (
  supabaseClient: SupabaseClient,
  userEmail: string,
): Promise<DashboardData> => {
  if (!userEmail) {
    throw new Error("User email is required to fetch dashboard data.")
  }

  const summaryPromise = supabaseClient
    .from(summaryTable)
    .select("max_amount, total_transaction_amount, remaining_balance, currency, email, year")
    .eq("email", userEmail)
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle()

  const analysisPromise = supabaseClient
    .from(analysisTable)
    .select(
      "id, record_key, sup_doc_id, state, claim_type, claim_description, line_description, description, transaction_amount, transaction_currency, date_paid, date_submitted",
    )
    .eq("email", userEmail)
    .neq("state", "Complete")
    .order("date_paid", { ascending: false })
    .limit(RECENT_CLAIMS_FETCH_LIMIT)

  const employeePromise = supabaseClient
    .from(employeeTable)
    .select("email, country")
    .eq("email", userEmail)
    .maybeSingle()

  const [summaryResult, analysisResult, employeeResult] = await Promise.all([
    summaryPromise,
    analysisPromise,
    employeePromise,
  ])

  const errors = [
    summaryResult.error && buildSectionError(`Table "${summaryTable}"`, summaryResult.error.message),
    analysisResult.error && buildSectionError(`Table "${analysisTable}"`, analysisResult.error.message),
    employeeResult.error && buildSectionError(`Table "${employeeTable}"`, employeeResult.error.message),
  ].filter(Boolean) as string[]

  if (errors.length > 0) {
    throw new Error(`Supabase dashboard sync failed: ${errors.join(" | ")}`)
  }

  const summaryRow = (summaryResult.data as ClaimSummaryRow | null) ?? null
  const analysisRows = (analysisResult.data as ClaimAnalysisRow[] | null) ?? []
  const employeeRow = (employeeResult.data as EmployeeRow | null) ?? null
  const employeeCountry = employeeRow?.country?.trim() || summaryRow?.country?.trim() || null
  const restrictedCountries = getRestrictedCountries()
  const normalizedCountry = employeeCountry?.toLowerCase()
  const isBenefitRestricted = normalizedCountry ? restrictedCountries.includes(normalizedCountry) : false

  const benefitRows = analysisRows.filter(
    (row) => row.claim_type?.toLowerCase() === "employee benefit",
  )

  return {
    balance: mapSummaryRow(summaryRow),
    monthlySpending: mapMonthlyFromAnalysis(benefitRows),
    categorySpending: mapCategoryFromAnalysis(benefitRows),
    recentClaims: mapRecentClaimsFromAnalysis(analysisRows),
    processing: mapProcessingStats(analysisRows),
    employeeCountry,
    isBenefitRestricted,
  }
}

export const fetchDashboardData = async (userEmail: string): Promise<DashboardData> => {
  if (!userEmail) {
    throw new Error("User email is required to fetch dashboard data.")
  }

  const response = await fetch("/api/dashboard-data", {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ email: userEmail }),
  })

  const raw = await response.text()
  let payload: { data?: DashboardData; error?: string } = {}

  if (raw) {
    try {
      payload = JSON.parse(raw)
    } catch (error) {
      console.warn("Failed to parse dashboard API response:", error)
    }
  }

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to load dashboard data from Supabase.")
  }

  if (!payload.data) {
    throw new Error("Dashboard data is missing from the server response.")
  }

  return payload.data
}
