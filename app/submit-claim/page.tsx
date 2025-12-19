"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  ShieldOff,
  HeartPulse,
  Plane,
  ReceiptText,
  GraduationCap,
  Loader2,
  Sparkles,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  Send,
} from "lucide-react"
import { submitClaimToSupabase } from "@/lib/supabase-claims"
import { fetchDashboardData, type BalanceData } from "@/lib/supabase-dashboard"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useSession } from "@/hooks/useSession"
import { getAuthHeaders } from "@/lib/session"

const appendMerchantToDescription = (description: string, merchantName: string) => {
  const trimmedMerchant = merchantName.trim()
  if (!trimmedMerchant) {
    return description
  }
  const trimmedDescription = description.trim()
  if (!trimmedDescription) {
    return trimmedMerchant
  }
  if (trimmedDescription.toLowerCase().includes(trimmedMerchant.toLowerCase())) {
    return trimmedDescription
  }
  return `${trimmedDescription} - ${trimmedMerchant}`
}

const normalizeDateForInput = (value?: string | null) => {
  if (!value) {
    return ""
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  const date = new Date(trimmed)
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10)
  }

  const datePartsMatch = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/)
  if (datePartsMatch) {
    const [, part1, part2, yearPart] = datePartsMatch
    const year = yearPart.length === 2 ? `20${yearPart}` : yearPart
    const first = parseInt(part1, 10)
    const second = parseInt(part2, 10)

    if (second > 12 && first <= 12) {
      return `${year}-${String(first).padStart(2, "0")}-${String(second).padStart(2, "0")}`
    }
    if (first > 12 && second <= 12) {
      return `${year}-${String(second).padStart(2, "0")}-${String(first).padStart(2, "0")}`
    }
    return `${year}-${String(second).padStart(2, "0")}-${String(first).padStart(2, "0")}`
  }

  return ""
}

const createFilePreviewUrl = (file: File | null) => {
  if (file && file.type.startsWith("image/")) {
    return URL.createObjectURL(file)
  }
  return null
}

const computeFileHash = async (file: File) => {
  try {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("")
  } catch (error) {
    console.error("Failed to hash file", error)
    return `${file.name}-${file.size}`
  }
}

const normalizeBenefitType = (value?: string | null): (typeof employeeBenefitTypeOptions)[number] | "" => {
  if (!value) {
    return ""
  }
  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return ""
  }

  if (normalized.includes("optic") || normalized.includes("vision") || normalized.includes("lens")) {
    return "Optical"
  }
  if (normalized.includes("dental") || normalized.includes("dentist") || normalized.includes("orthodont")) {
    return "Dental"
  }
  if (
    normalized.includes("health screening") ||
    normalized.includes("medical check") ||
    normalized.includes("screening") ||
    normalized.includes("wellness")
  ) {
    return "Health Screening"
  }
  return ""
}

const maxClaimEntries = 10
const profileFallbackMessage =
  "We couldn't auto-fill your employee details. Please complete the fields manually."

const locationOptions = [
  "All",
  "Belarus",
  "British Virgin Islands",
  "Cayman Islands",
  "Cook Islands",
  "Cyprus (Limassol)",
  "Cyprus (Nicosia)",
  "dsl",
  "Dubai (Al Hamra Industrial Zone)",
  "Dubai (Business Bay)",
  "Dubai (Business Centre 2)",
  "Dubai (JLT)",
  "France",
  "Germany",
  "Guernsey",
  "Hong Kong",
  "Iran",
  "Jordan",
  "Malaysia (Cyberjaya)",
  "Malaysia (Ipoh)",
  "Malaysia (Labuan)",
  "Malaysia (Melaka)",
  "Malta",
  "Mauritius",
  "Not Applicable",
  "Paraguay (Asuncion)",
  "Paraguay (Ciudad del Este - CDE)",
  "Rwanda",
  "Senegal",
  "Singapore",
  "SVG - Saint Vincent And The Grenadines",
  "Telecommuter",
  "UK (London)",
  "UK (Reading)",
  "Vanuatu",
  "Cyprus (dont use)",
  "Panama",
  "djl",
]

const departmentOptions = [
  "Accounting & Finance",
  "Business Intelligence",
  "Customer Support",
  "Engineering",
  "Facilities",
  "Legal & Compliance",
  "Marketing",
  "People & Culture",
  "Product",
  "Risk & Compliance",
  "Sales & Partnerships",
  "Trading Operations",
  "Other",
]

const hiringCompanyOptions = [
  "Deriv Services Sdn Bhd",
  "Deriv (BVI) Ltd",
  "Deriv (Cayman) Ltd",
  "Deriv (France) SAS",
  "Deriv (Guernsey) Ltd",
  "Deriv (Malta) Ltd",
  "Deriv (Mauritius) Ltd",
  "Deriv (SVG) LLC",
  "Regent Markets Group",
  "Regent Markets Holdings",
  "Other",
]

const staffClaimTypeTabs = [
  {
    value: "Employee Benefit",
    label: "Employee Benefit",
    description: "Dental, optical, health screening reimbursements",
    icon: HeartPulse,
  },
  {
    value: "Travel Reimbursement",
    label: "Travel Reimbursement",
    description: "Travel, parking, taxi, mileage expenses",
    icon: Plane,
  },
  {
    value: "Other Reimbursement",
    label: "Other Reimbursement",
    description: "Team building, meals, other approved costs",
    icon: ReceiptText,
  },
  {
    value: "Educational Assistance/Training",
    label: "Educational Assistance",
    description: "Courses, certifications, training fees",
    icon: GraduationCap,
  },
]

const receiptCountOptions = ["-", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

const currencyOptions = ["AED", "EUR", "GBP", "MYR", "SGD", "USD"]

const employeeBenefitTypeOptions = ["Optical", "Dental", "Health Screening"] as const

type ClaimEntry = {
  description: string
  currency: string
  amount: string
  attachment: File | null
  attachmentHash?: string | null
  supportingAttachments: File[]
  attachmentPreviewUrl: string | null
  supportingAttachmentPreviewUrls: (string | null)[]
  serviceDate: string
  claimantName: string
  merchantName: string
  isOpticalReceipt: boolean
  benefitType: (typeof employeeBenefitTypeOptions)[number] | ""
  opticalVerification?: {
    verified: boolean
    hasPrescriptionDetails?: boolean
    note?: string | null
  }
}

const createEmptyClaimEntry = (): ClaimEntry => ({
  description: "",
  currency: "",
  amount: "",
  attachment: null,
  attachmentHash: null,
  supportingAttachments: [],
  attachmentPreviewUrl: null,
  supportingAttachmentPreviewUrls: [],
  serviceDate: "",
  claimantName: "",
  merchantName: "",
  isOpticalReceipt: false,
  benefitType: "",
  opticalVerification: undefined,
})

const revokePreviewUrl = (url?: string | null) => {
  if (url) {
    URL.revokeObjectURL(url)
  }
}

const cleanupEntryPreviews = (entries: ClaimEntry[]) => {
  entries.forEach((entry) => {
    revokePreviewUrl(entry.attachmentPreviewUrl)
    entry.supportingAttachmentPreviewUrls.forEach((url) => revokePreviewUrl(url || undefined))
  })
}

type FormState = {
  fullName: string
  employeeId: string
  department: string
  regentEmail: string
  location: string
  hiringCompany: string
  staffClaimType: string
  receiptCount: string
  clinicName: string
  headcount: string
  localCurrency: string
}

type ReceiptOcrExtraction = {
  description?: string | null
  amount?: number | string | null
  currency?: string | null
  merchantName?: string | null
  serviceDate?: string | null
  notes?: string | null
  customerName?: string | null
  isOpticalReceipt?: boolean | null
  hasPrescriptionDetails?: boolean | null
  opticalVerificationNote?: string | null
  benefitType?: string | null
}

type ReceiptOcrApiResponse = {
  data?: ReceiptOcrExtraction
  error?: string
}

type ReceiptOcrState = {
  state: "idle" | "processing" | "success" | "error"
  message?: string
}

type DuplicateStatus = {
  isDuplicate: boolean
  reason: string
  matches: number[]
}

type FxRates = {
  base: string
  rates: Record<string, number>
  fetchedAt: string
  provider: string
  source: "live" | "cache" | "fallback"
}

type FxState =
  | { status: "idle" | "loading"; data?: FxRates; error?: string }
  | { status: "success"; data: FxRates; error?: string }
  | { status: "error"; data?: FxRates; error: string }

type ConversionResult = {
  converted: number | null
  rate: number | null // rate of local -> entry currency (as returned)
  inverseRate: number | null // rate of entry currency -> local
  hasRate: boolean
}

const receiptOcrFeatureEnabled = true

export default function SubmitClaim() {
  const router = useRouter()
  const { state, user } = useSession({
    redirectIfUnauthorized: () => router.push("/no-access"),
  })
  const userEmail = user?.email ?? ""
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [isProfileVerified, setIsProfileVerified] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [claimEntries, setClaimEntries] = useState<ClaimEntry[]>([])
  const [ocrStatuses, setOcrStatuses] = useState<Record<number, ReceiptOcrState>>({})
  const [duplicateStatuses, setDuplicateStatuses] = useState<Record<number, DuplicateStatus>>({})
  const [fxState, setFxState] = useState<FxState>({ status: "idle" })
  const claimEntriesRef = useRef<ClaimEntry[]>([])
  const [formData, setFormData] = useState<FormState>({
    fullName: "",
    employeeId: "",
    department: "",
    regentEmail: "",
    location: "",
    hiringCompany: "",
    staffClaimType: "",
    receiptCount: "",
    clinicName: "",
    headcount: "",
    localCurrency: "",
  })
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  useEffect(() => {
    claimEntriesRef.current = claimEntries
  }, [claimEntries])

  useEffect(() => {
    return () => {
      cleanupEntryPreviews(claimEntriesRef.current)
    }
  }, [])
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)

  const formatAmountForInput = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) {
      return null
    }
    const numericValue = typeof value === "number" ? value : parseFloat(value)
    if (Number.isNaN(numericValue) || !Number.isFinite(numericValue)) {
      return null
    }
    return numericValue.toFixed(2)
  }

  const formatCurrency = (amount: number, currencyCode?: string) => {
    const currency = currencyCode?.trim() || "USD"
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(amount)
    } catch {
      return `${currency} ${amount.toFixed(2)}`
    }
  }

  const updateOcrStatus = useCallback((index: number, status: ReceiptOcrState) => {
    if (!receiptOcrFeatureEnabled) {
      return
    }
    setOcrStatuses((prev) => ({ ...prev, [index]: status }))
  }, [])

  const runReceiptOcr = useCallback(
    async (
      entryIndex: number,
      file: File,
      options: { staffClaimType?: string; localCurrency?: string; location?: string; benefitType?: string } = {},
    ) => {
      if (!receiptOcrFeatureEnabled) {
        return
      }

      updateOcrStatus(entryIndex, { state: "processing", message: "Scanning receipt..." })

      try {
        const payload = new FormData()
        payload.append("file", file)
        if (options.staffClaimType) {
          payload.append("claimType", options.staffClaimType)
        }
        if (options.localCurrency) {
          payload.append("currencyHint", options.localCurrency)
        }
        if (options.location) {
          payload.append("localeHint", options.location)
        }
        if (options.benefitType) {
          payload.append("benefitTypeHint", options.benefitType)
        }

        const response = await fetch("/api/receipt-ocr", {
          method: "POST",
          headers: getAuthHeaders(),
          body: payload,
        })

        const result = (await response.json().catch(() => null)) as ReceiptOcrApiResponse | null

        if (!response.ok) {
          throw new Error(result?.error || "Receipt scan failed.")
        }

        if (!result?.data) {
          throw new Error("Receipt OCR returned no data.")
        }

        const extraction = result.data
        const formattedAmount = formatAmountForInput(extraction.amount)

        setClaimEntries((prev) => {
          const next = [...prev]
          const existingEntry = next[entryIndex]

          if (!existingEntry) {
            return next
          }

          const entry: ClaimEntry = { ...existingEntry }

          if (extraction.description) {
            entry.description = extraction.description.trim()
          }

          if (formattedAmount) {
            entry.amount = formattedAmount
          }

          if (extraction.currency) {
            entry.currency = extraction.currency
          } else if (!entry.currency && options.localCurrency) {
            entry.currency = options.localCurrency
          }

          if (extraction.serviceDate) {
            const normalizedDate = normalizeDateForInput(extraction.serviceDate)
            if (normalizedDate) {
              entry.serviceDate = normalizedDate
            }
          }

          if (extraction.customerName) {
            entry.claimantName = extraction.customerName
          }

          if (extraction.merchantName) {
            entry.merchantName = extraction.merchantName.trim()
            entry.description = appendMerchantToDescription(entry.description, extraction.merchantName)
          }

          if (typeof extraction.isOpticalReceipt === "boolean") {
            entry.isOpticalReceipt = extraction.isOpticalReceipt
          }

          if (
            typeof extraction.hasPrescriptionDetails === "boolean" ||
            typeof extraction.opticalVerificationNote === "string"
          ) {
            entry.opticalVerification = {
              verified: Boolean(extraction.hasPrescriptionDetails || extraction.opticalVerificationNote),
              hasPrescriptionDetails: Boolean(extraction.hasPrescriptionDetails),
              note: extraction.opticalVerificationNote || undefined,
            }
          } else if (entry.isOpticalReceipt) {
            entry.opticalVerification = entry.opticalVerification || {
              verified: false,
              note: undefined,
            }
          } else {
            entry.opticalVerification = undefined
          }

          if (options.staffClaimType === "Employee Benefit") {
            const normalizedBenefitType =
              normalizeBenefitType(extraction.benefitType) ||
              (extraction.isOpticalReceipt ? "Optical" : "")

            if (normalizedBenefitType) {
              entry.benefitType = normalizedBenefitType
            }
          } else {
            entry.benefitType = ""
          }

          next[entryIndex] = entry
          return next
        })

        setFormData((prev) => {
          const updates: Partial<FormState> = {}

          if (!prev.localCurrency && extraction.currency) {
            updates.localCurrency = extraction.currency
          }

          if (
            extraction.merchantName &&
            prev.staffClaimType === "Employee Benefit" &&
            !prev.clinicName
          ) {
            updates.clinicName = extraction.merchantName
          }

          if (Object.keys(updates).length === 0) {
            return prev
          }

          return { ...prev, ...updates }
        })

        updateOcrStatus(entryIndex, { state: "success", message: "Receipt scan completed." })
      } catch (error) {
        console.error("Receipt OCR failed", error)
        updateOcrStatus(entryIndex, {
          state: "error",
          message: error instanceof Error ? error.message : "Receipt scan failed.",
        })
      }
    },
    [updateOcrStatus],
  )

  useEffect(() => {
    if (userEmail) {
      setFormData((prev) => ({ ...prev, regentEmail: prev.regentEmail || userEmail }))
    }
  }, [userEmail])

  useEffect(() => {
    if (!userEmail || state.status !== "authenticated") {
      return
    }

    let isCancelled = false

    const loadRemainingBalance = async () => {
      setIsBalanceLoading(true)
      setBalanceError(null)

      try {
        const data = await fetchDashboardData(userEmail)
        if (isCancelled) {
          return
        }
        setBalanceData(data.balance)
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load remaining balance", error)
          setBalanceError(
            error instanceof Error ? error.message : "Failed to load remaining balance from Supabase.",
          )
          setBalanceData(null)
        }
      } finally {
        if (!isCancelled) {
          setIsBalanceLoading(false)
        }
      }
    }

    void loadRemainingBalance()

    return () => {
      isCancelled = true
    }
  }, [state.status, userEmail])

  useEffect(() => {
    if (!userEmail) {
      return
    }

    let isCancelled = false
    const fetchEmployeeProfile = async () => {
      setIsLoadingProfile(true)
      setProfileError("")

      try {
        const response = await fetch("/api/employee-profile", {
          method: "POST",
          headers: getAuthHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ email: userEmail }),
        })

        if (isCancelled) {
          return
        }

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null
          const message = payload?.error || profileFallbackMessage
          setProfileError(message)
          setIsProfileVerified(false)
          return
        }

        const payload = (await response.json()) as {
          data: {
            fullName?: string | null
            employeeId?: string | null
            department?: string | null
            email?: string | null
            location?: string | null
            company?: string | null
            hiringCompany?: string | null
            localCurrency?: string | null
            country?: string | null
          }
        }

        const profile = payload.data
        setFormData((prev) => ({
          ...prev,
          fullName: profile.fullName ?? prev.fullName,
          employeeId: profile.employeeId ?? prev.employeeId,
          department: profile.department ?? prev.department,
          regentEmail: profile.email ?? prev.regentEmail,
          location: profile.location ?? prev.location,
          hiringCompany: profile.hiringCompany ?? profile.company ?? prev.hiringCompany,
          localCurrency: profile.localCurrency ?? prev.localCurrency,
        }))
        setIsProfileVerified(Boolean(profile.fullName || profile.employeeId || profile.department))
      } catch (err) {
        if (!isCancelled) {
          console.error("Unexpected error fetching employee profile", err)
          setProfileError(profileFallbackMessage)
          setIsProfileVerified(false)
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingProfile(false)
        }
      }
    }

    fetchEmployeeProfile()

    return () => {
      isCancelled = true
    }
  }, [userEmail])

  const activeReceiptCount = useMemo(() => {
    const parsed = parseInt(formData.receiptCount, 10)
    if (Number.isNaN(parsed)) {
      return 0
    }
    return Math.min(parsed, maxClaimEntries)
  }, [formData.receiptCount])

  useEffect(() => {
    setClaimEntries((prev) => {
      if (activeReceiptCount === 0) {
        if (prev.length === 0) {
          return prev
        }
        cleanupEntryPreviews(prev)
        return []
      }

      if (activeReceiptCount > prev.length) {
        const additions = Array.from({ length: activeReceiptCount - prev.length }, () => createEmptyClaimEntry())
        return [...prev, ...additions]
      }

      if (activeReceiptCount < prev.length) {
        for (let i = activeReceiptCount; i < prev.length; i += 1) {
          revokePreviewUrl(prev[i].attachmentPreviewUrl)
          prev[i].supportingAttachmentPreviewUrls.forEach((url) => revokePreviewUrl(url))
        }
        return prev.slice(0, activeReceiptCount)
      }

      return prev
    })
  }, [activeReceiptCount])

  useEffect(() => {
    if (!receiptOcrFeatureEnabled) {
      return
    }
    setOcrStatuses((prev) => {
      const next: Record<number, ReceiptOcrState> = {}
      for (let i = 0; i < activeReceiptCount; i += 1) {
        next[i] = prev[i] || { state: "idle" }
      }
      return next
    })
  }, [activeReceiptCount])

  useEffect(() => {
    const nextStatuses: Record<number, DuplicateStatus> = {}

    claimEntries.forEach((entry, index) => {
      if (!entry.attachment) {
        nextStatuses[index] = { isDuplicate: false, reason: "", matches: [] }
        return
      }

      const matches = new Set<number>()
      const reasons = new Set<string>()

      claimEntries.forEach((other, otherIndex) => {
        if (otherIndex === index || !other.attachment) {
          return
        }

        if (entry.attachment.name.toLowerCase() === other.attachment.name.toLowerCase()) {
          matches.add(otherIndex)
          reasons.add("same filename")
        }

        if (entry.attachmentHash && other.attachmentHash && entry.attachmentHash === other.attachmentHash) {
          matches.add(otherIndex)
          const amountA = parseFloat(entry.amount)
          const amountB = parseFloat(other.amount)
          const amountsMatch = !Number.isNaN(amountA) && !Number.isNaN(amountB) && amountA === amountB
          reasons.add(amountsMatch ? "identical file & amount" : "identical file content")
        }
      })

      if (matches.size > 0) {
        const matchList = Array.from(matches.values())
        const reasonText = `Matches claim ${matchList.map((idx) => idx + 1).join(", ")} (${Array.from(reasons).join(
          " + ",
        )})`
        nextStatuses[index] = { isDuplicate: true, reason: reasonText, matches: matchList }
      } else {
        nextStatuses[index] = { isDuplicate: false, reason: "", matches: [] }
      }
    })

    setDuplicateStatuses(nextStatuses)
  }, [claimEntries])

  useEffect(() => {
    const base = formData.localCurrency?.trim()
    if (!base) {
      return
    }

    const requiresRates = claimEntries.some(
      (entry) => entry.currency && entry.currency !== base && entry.amount && !Number.isNaN(parseFloat(entry.amount)),
    )

    if (!requiresRates) {
      return
    }

    let isCancelled = false
    const fetchRates = async () => {
      setFxState((prev) => ({ ...prev, status: "loading", error: undefined }))
      try {
        const response = await fetch("/api/fx-rates", {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ base }),
        })
        const payload = (await response.json().catch(() => null)) as { error?: string } & FxRates

        if (!response.ok || payload.error) {
          throw new Error(payload.error || "Failed to load FX rates.")
        }

        if (!isCancelled) {
          setFxState({ status: "success", data: payload })
        }
      } catch (error) {
        console.error("FX rates fetch failed", error)
        if (!isCancelled) {
          setFxState((prev) => {
            const fallback = prev.data
            return {
              status: fallback ? "success" : "error",
              data: fallback,
              error: error instanceof Error ? error.message : "Failed to load FX rates.",
            }
          })
        }
      }
    }

    void fetchRates()

    return () => {
      isCancelled = true
    }
  }, [formData.localCurrency, claimEntries])

  const conversionResults: ConversionResult[] = useMemo(() => {
    const base = formData.localCurrency?.trim()
    return claimEntries.map((entry) => {
      const amount = parseFloat(entry.amount)
      if (!base || Number.isNaN(amount) || !entry.currency) {
        return { converted: null, rate: null, inverseRate: null, hasRate: false }
      }
      if (entry.currency === base) {
        return { converted: amount, rate: 1, inverseRate: 1, hasRate: true }
      }
      const rate = fxState.data?.rates?.[entry.currency] || null
      if (!rate || rate <= 0) {
        return { converted: null, rate: null, inverseRate: null, hasRate: false }
      }
      const inverseRate = 1 / rate
      return { converted: amount * inverseRate, rate, inverseRate, hasRate: true }
    })
  }, [claimEntries, formData.localCurrency, fxState.data])

  const calculatedTotal = useMemo(() => {
    if (!formData.localCurrency) {
      return 0
    }
    return conversionResults.reduce((sum, result) => {
      if (!result.hasRate || result.converted === null || Number.isNaN(result.converted)) {
        return sum
      }
      return sum + result.converted
    }, 0)
  }, [conversionResults, formData.localCurrency])

  const hasDuplicates = useMemo(
    () => Object.values(duplicateStatuses).some((status) => status?.isDuplicate),
    [duplicateStatuses],
  )

  const hasMissingConversion = useMemo(() => {
    if (!formData.localCurrency) {
      return true
    }
    return conversionResults.some((result, idx) => {
      const entry = claimEntries[idx]
      if (!entry.currency || !entry.amount) return true
      if (entry.currency === formData.localCurrency) return false
      return !result.hasRate
    })
  }, [conversionResults, claimEntries, formData.localCurrency])

  const step2Validation = useMemo(() => {
    if (!formData.staffClaimType) {
      return { valid: false, reason: "Select a Staff Claim Type." }
    }
    if (activeReceiptCount === 0 || claimEntries.length === 0) {
      return { valid: false, reason: "Add at least one claim entry." }
    }
    for (let i = 0; i < claimEntries.length; i += 1) {
      const entry = claimEntries[i]
      if (!entry.description) return { valid: false, reason: `Claim ${i + 1} description is required.` }
      if (!entry.currency) return { valid: false, reason: `Claim ${i + 1} currency is required.` }
      if (!entry.amount) return { valid: false, reason: `Claim ${i + 1} amount is required.` }
      if (!entry.serviceDate) return { valid: false, reason: `Claim ${i + 1} receipt date is required.` }
      if (!entry.claimantName) return { valid: false, reason: `Claim ${i + 1} person/patient name is required.` }
      if (!entry.merchantName) return { valid: false, reason: `Claim ${i + 1} merchant is required.` }
      if (formData.staffClaimType === "Employee Benefit" && !entry.benefitType) {
        return { valid: false, reason: `Claim ${i + 1} benefit type is required.` }
      }
    }
    return { valid: true, reason: "" }
  }, [formData.staffClaimType, activeReceiptCount, claimEntries])
  const isStep2Valid = step2Validation.valid

  const lockPersonalFields = isProfileVerified && !profileError
  const lockedFieldClass = lockPersonalFields ? "bg-muted/60 text-muted-foreground cursor-not-allowed" : ""

  const entryRequiresOpticalProof = useCallback(
    (entry: ClaimEntry) =>
      formData.staffClaimType === "Employee Benefit" && entry.benefitType === "Optical" && !entry.opticalVerification?.verified,
    [formData.staffClaimType],
  )

  const verifiedProfileFields = useMemo(
    () => [
      { label: "Full Name", value: formData.fullName || "Not available" },
      { label: "Employee ID", value: formData.employeeId || "Not available" },
      { label: "Department", value: formData.department || "Not available" },
      { label: "Regent Email", value: formData.regentEmail || "Not available" },
      { label: "Location", value: formData.location || "Not available" },
      { label: "Hiring Company", value: formData.hiringCompany || "Not available" },
    ],
    [
      formData.fullName,
      formData.employeeId,
      formData.department,
      formData.regentEmail,
      formData.location,
      formData.hiringCompany,
    ],
  )

  const resetClaimEntryState = useCallback(() => {
    setClaimEntries((prev) => {
      if (prev.length > 0) {
        cleanupEntryPreviews(prev)
      }
      return []
    })
    setOcrStatuses({})
  }, [])

  const handleFormStateChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleClaimTypeChange = useCallback(
    (nextType: string) => {
      if (!nextType) {
        setFormData((prev) => ({
          ...prev,
          staffClaimType: "",
          receiptCount: "",
        }))
        resetClaimEntryState()
        return
      }

      let didChange = false
      setFormData((prev) => {
        if (prev.staffClaimType === nextType) {
          return prev
        }
        didChange = true
        return {
          ...prev,
          staffClaimType: nextType,
          receiptCount: "",
        }
      })

      if (didChange) {
        resetClaimEntryState()
      }
    },
    [resetClaimEntryState],
  )

  const handleReceiptCountChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target
    setFormData((prev) => ({ ...prev, receiptCount: value }))
  }

  const handleClaimEntryChange = (
    index: number,
    field: keyof Omit<
      ClaimEntry,
      "attachment" | "supportingAttachments" | "opticalVerification" | "attachmentPreviewUrl" | "supportingAttachmentPreviewUrls"
    >,
    value: string,
  ) => {
    setClaimEntries((prev) => {
      const next = [...prev]
      const existing = next[index]
      if (!existing) {
        return prev
      }

      const updated: ClaimEntry = { ...existing, [field]: value }

      if (field === "merchantName" && value) {
        updated.description = appendMerchantToDescription(updated.description, value)
      }

      if (field === "serviceDate") {
        updated.serviceDate = normalizeDateForInput(value) || value
      }

      if (field === "benefitType") {
        updated.benefitType = normalizeBenefitType(value)
      }

      next[index] = updated
      return next
    })
  }

  const handleClaimEntryFileChange = (index: number, file: File | null) => {
    const currentEntry = claimEntries[index]
    setClaimEntries((prev) => {
      const next = [...prev]
      const existing = next[index]
      if (!existing) {
        return prev
      }
      if (existing.attachmentPreviewUrl) {
        revokePreviewUrl(existing.attachmentPreviewUrl)
      }
      const previewUrl = createFilePreviewUrl(file)
      next[index] = { ...existing, attachment: file, attachmentPreviewUrl: previewUrl, attachmentHash: file ? undefined : null }
      return next
    })

    if (file) {
      void (async () => {
        const hash = await computeFileHash(file)
        setClaimEntries((prev) => {
          const next = [...prev]
          const existing = next[index]
          if (!existing || existing.attachment !== file) {
            return prev
          }
          next[index] = { ...existing, attachmentHash: hash }
          return next
        })
      })()
    }

    if (!receiptOcrFeatureEnabled) {
      return
    }

    if (!file) {
      updateOcrStatus(index, { state: "idle" })
      return
    }

    runReceiptOcr(index, file, {
      staffClaimType: formData.staffClaimType,
      localCurrency: formData.localCurrency,
      location: formData.location,
      benefitType:
        formData.staffClaimType === "Employee Benefit" ? currentEntry?.benefitType || undefined : undefined,
    })
  }

  const addSupportingAttachments = (index: number, files: FileList | File[]) => {
    const newFiles = Array.from(files || []).filter(Boolean)
    if (!newFiles.length) return

    setClaimEntries((prev) => {
      const next = [...prev]
      const existing = next[index]
      if (!existing) {
        return prev
      }
      const previews = newFiles.map((file) => createFilePreviewUrl(file))
      next[index] = {
        ...existing,
        supportingAttachments: [...existing.supportingAttachments, ...newFiles],
        supportingAttachmentPreviewUrls: [...existing.supportingAttachmentPreviewUrls, ...previews],
      }
      return next
    })
  }

  const removeSupportingAttachment = (entryIndex: number, attachmentIndex: number) => {
    setClaimEntries((prev) => {
      const next = [...prev]
      const existing = next[entryIndex]
      if (!existing) return prev

      const previewToRemove = existing.supportingAttachmentPreviewUrls[attachmentIndex]
      if (previewToRemove) {
        revokePreviewUrl(previewToRemove)
      }

      const updatedFiles = existing.supportingAttachments.filter((_, idx) => idx !== attachmentIndex)
      const updatedPreviews = existing.supportingAttachmentPreviewUrls.filter((_, idx) => idx !== attachmentIndex)

      next[entryIndex] = {
        ...existing,
        supportingAttachments: updatedFiles,
        supportingAttachmentPreviewUrls: updatedPreviews,
      }
      return next
    })
  }
  const handleAttachmentDrop = (
    event: React.DragEvent<HTMLDivElement>,
    index: number,
    type: "primary" | "supporting",
  ) => {
    event.preventDefault()
    event.stopPropagation()
    const droppedFiles = event.dataTransfer?.files
    if (!droppedFiles || droppedFiles.length === 0) {
      return
    }
    if (type === "primary") {
      handleClaimEntryFileChange(index, droppedFiles[0])
    } else {
      addSupportingAttachments(index, droppedFiles)
    }
  }

  const departmentSelectOptions = useMemo(() => {
    if (formData.department && !departmentOptions.includes(formData.department)) {
      return [...departmentOptions, formData.department]
    }
    return departmentOptions
  }, [formData.department])

  const locationSelectOptions = useMemo(() => {
    if (formData.location && !locationOptions.includes(formData.location)) {
      return [...locationOptions, formData.location]
    }
    return locationOptions
  }, [formData.location])

  const hiringCompanySelectOptions = useMemo(() => {
    if (formData.hiringCompany && !hiringCompanyOptions.includes(formData.hiringCompany)) {
      return [...hiringCompanyOptions, formData.hiringCompany]
    }
    return hiringCompanyOptions
  }, [formData.hiringCompany])

  const localCurrencyOptions = useMemo(() => {
    if (formData.localCurrency && !currencyOptions.includes(formData.localCurrency)) {
      return [...currencyOptions, formData.localCurrency]
    }
    return currencyOptions
  }, [formData.localCurrency])

  const isRegentEmailValid = formData.regentEmail.endsWith("@regentmarkets.com")

  const isFormValid = useMemo(() => {
    const requiredFields: (keyof FormState)[] = [
      "fullName",
      "employeeId",
      "department",
      "regentEmail",
      "location",
      "hiringCompany",
      "staffClaimType",
      "receiptCount",
      "localCurrency",
    ]

    if (requiredFields.some((field) => !formData[field])) {
      return false
    }

    if (!isRegentEmailValid) {
      return false
    }

    if (activeReceiptCount === 0 || activeReceiptCount !== claimEntries.length) {
      return false
    }

    const invalidEntry = claimEntries.some((entry) => {
      if (!entry.description || !entry.currency || !entry.amount) {
        return true
      }
      if (!entry.serviceDate || !entry.claimantName || !entry.merchantName) {
        return true
      }
      if (formData.staffClaimType === "Employee Benefit" && !entry.benefitType) {
        return true
      }
      const parsedAmount = parseFloat(entry.amount)
      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        return true
      }
      if (entry.attachment === null) {
        return true
      }
      if (entryRequiresOpticalProof(entry) && entry.supportingAttachments.length === 0) {
        return true
      }
      return false
    })

    if (invalidEntry) {
      return false
    }

    if (!formData.localCurrency || calculatedTotal <= 0) {
      return false
    }

    if (hasMissingConversion) {
      return false
    }

    return true
  }, [formData, claimEntries, activeReceiptCount, calculatedTotal, isRegentEmailValid, hasMissingConversion])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitError("")

    try {
      if (!userEmail) {
        throw new Error("Unable to determine user. Please sign in again.")
      }

      if (!isFormValid) {
        throw new Error("Please complete all required fields before submitting.")
      }

      const result = await submitClaimToSupabase({
        userEmail,
        staffClaimType: formData.staffClaimType,
        totalAmount: Number(calculatedTotal.toFixed(2)),
        localCurrency: formData.localCurrency,
        receiptCount: activeReceiptCount,
        personalInformation: {
          fullName: formData.fullName,
          employeeId: formData.employeeId,
          regentEmail: formData.regentEmail,
        },
        workDetails: {
          department: formData.department,
          location: formData.location,
          hiringCompany: formData.hiringCompany,
        },
        clinicName: formData.clinicName || undefined,
        headcount: formData.headcount || undefined,
        claimEntries: claimEntries.map((entry, idx) => ({
          description: entry.description,
          currency: entry.currency,
          amount: parseFloat(entry.amount),
          attachment: entry.attachment,
          supportingAttachments: entry.supportingAttachments,
          serviceDate: entry.serviceDate,
          claimantName: entry.claimantName,
          merchantName: entry.merchantName,
          isOpticalReceipt: entry.isOpticalReceipt,
          benefitType: entry.benefitType || undefined,
          opticalVerification: entry.opticalVerification,
          convertedAmountLocal: conversionResults[idx]?.converted ?? null,
          localCurrency: formData.localCurrency,
          fxRateUsed:
            entry.currency === formData.localCurrency
              ? 1
              : conversionResults[idx]?.inverseRate || null,
        })),
        fxSnapshot:
          fxState.data && formData.localCurrency
            ? {
                base: fxState.data.base,
                rates: fxState.data.rates,
                fetchedAt: fxState.data.fetchedAt,
                provider: fxState.data.provider,
                source: fxState.data.source,
              }
            : null,
      })

      const allowDemoFallback = !result.success && result.error?.toLowerCase().includes("bucket not found")
      if (!result.success && !allowDemoFallback) {
        throw new Error(result.error || "Failed to submit claim.")
      }

      setFormData({
        fullName: "",
        employeeId: "",
        department: "",
        regentEmail: userEmail,
        location: "",
        hiringCompany: "",
        staffClaimType: "",
        receiptCount: "",
        clinicName: "",
        headcount: "",
        localCurrency: "",
      })
      setClaimEntries((prev) => {
        if (prev.length > 0) {
          cleanupEntryPreviews(prev)
        }
        return []
      })
      setOcrStatuses({})

      setSubmitSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit claim. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (state.status === "loading") {
    const SkeletonCard = () => (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-900" />
        </div>
      </div>
    )

    const SkeletonList = () => (
      <div className="space-y-3">
        {[...Array(2)].map((_, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse"
          >
            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-slate-900" />
              <div className="h-3 w-2/5 rounded bg-slate-100 dark:bg-slate-900" />
            </div>
          </div>
        ))}
      </div>
    )

    const SkeletonForm = () => (
      <div className="space-y-6">
        {[...Array(2)].map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 animate-pulse"
          >
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800 mb-4" />
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(4)].map((__, jdx) => (
                <div key={jdx} className="space-y-2">
                  <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-10 w-full rounded-lg bg-slate-100 dark:bg-slate-900" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-coral-50 dark:from-slate-1100 dark:via-slate-1000 dark:to-slate-900 lg:pl-72">
        <Navigation />
        <div className="container mx-auto px-4 py-8 space-y-8">
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-64 rounded bg-slate-100 dark:bg-slate-900" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonForm />
          <SkeletonList />
        </div>
      </div>
    )
  }

  if (state.status === "unauthorized") {
    return null
  }

  const balanceSnapshot: BalanceData = balanceData ?? {
    total: 0,
    used: 0,
    remaining: 0,
    currency: "USD",
  }

  const hasBalanceData = Boolean(balanceData)
  const claimExceedsBalance = hasBalanceData && calculatedTotal > balanceSnapshot.remaining
  const claimOverageAmount = hasBalanceData ? Math.max(calculatedTotal - balanceSnapshot.remaining, 0) : 0
  const projectedRemainingBalance = hasBalanceData ? Math.max(balanceSnapshot.remaining - calculatedTotal, 0) : 0
  const canShowProjectedBalance = hasBalanceData && !claimExceedsBalance && calculatedTotal > 0

  const steps = [
    { number: 1, title: "Upload Receipt", description: "Upload main receipt for OCR scanning" },
    { number: 2, title: "Claim Details", description: "Review and complete claim information" },
    { number: 3, title: "Supporting Documents", description: "Add optional supporting documents" },
  ]

  const isStep1Valid =
    activeReceiptCount > 0 &&
    claimEntries.length > 0 &&
    claimEntries.every((entry) => entry.attachment) &&
    !hasDuplicates
  const isStep3Valid = claimEntries.every((entry) => {
    if (!entryRequiresOpticalProof(entry)) {
      return true
    }
    return entry.supportingAttachments.length > 0
  })

  const handleNextStep = () => {
    if (currentStep === 1 && hasDuplicates) {
      return
    }
    if (currentStep === 3 && !isStep3Valid) {
      return
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canNavigateToStep = (stepNumber: number) => {
    if (stepNumber === 1) return true
    if (stepNumber === 2) return isStep1Valid
    if (stepNumber === 3) return isStep1Valid && isStep2Valid
    if (stepNumber === 4) return isStep1Valid && isStep2Valid
    return false
  }

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber === 4 && !isStep3Valid) {
      return
    }
    if (canNavigateToStep(stepNumber)) {
      setCurrentStep(stepNumber)
    }
  }

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isClickable = canNavigateToStep(step.number)
          const isActive = currentStep === step.number
          const isCompleted = currentStep > step.number
          
          return (
            <div key={step.number} className="flex-1">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleStepClick(step.number)}
                  disabled={!isClickable}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    isCompleted
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : isActive
                        ? "bg-coral-500 text-white"
                        : isClickable
                          ? "bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 cursor-pointer"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                  )}
                  title={isClickable ? `Go to ${step.title}` : `Complete previous steps to access ${step.title}`}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    step.number
                  )}
                </button>
                <div className="ml-4 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleStepClick(step.number)}
                    disabled={!isClickable}
                    className={cn(
                      "text-left w-full",
                      isClickable ? "cursor-pointer" : "cursor-not-allowed"
                    )}
                    title={isClickable ? `Go to ${step.title}` : `Complete previous steps to access ${step.title}`}
                  >
                    <p className={cn(
                      "text-sm font-medium",
                      currentStep >= step.number ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400",
                      isClickable && !isActive ? "hover:text-coral-600 dark:hover:text-coral-400" : ""
                    )}>
                      {step.title}
                    </p>
                    <p className={cn(
                      "text-xs",
                      currentStep >= step.number ? "text-gray-600 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"
                    )}>
                      {step.description}
                    </p>
                  </button>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div 
                  className={cn(
                    "mt-2 h-0.5 w-full",
                    currentStep > step.number ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-coral-50 dark:from-slate-1100 dark:via-slate-1000 dark:to-slate-900 lg:pl-72">
      {submitSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-100 animate-pulse">
              <Check className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Your Claim Submission has been sent.</h3>
            <p className="mt-2 text-sm text-muted-foreground">Redirecting you to the Dashboard…</p>
          </div>
        </div>
      )}
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Submit Claim</h1>
          <p className="text-muted-foreground">
            Follow the 3-step process to submit your claim with better user experience
          </p>
        </div>

        {renderStepIndicator()}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Submission Guide</CardTitle>
            <CardDescription>Key reminders from the official Staff Claim Form Guide</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <div>
              <p className="font-medium text-foreground">Prepare these documents before you start:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Clear image of every receipt/invoice with your name on it</li>
                <li>Approval conversation from an authorised approver (mandatory)</li>
                <li>Supporting documents tied to the claim type (certificates, approvals, etc.)</li>
                <li>Approved team-building proposal form for team building/lunch claims</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">Submission rules:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Only one form per staff claim type, with a maximum of 10 receipts</li>
                <li>Select the number of entries to expand the matching claim blocks</li>
                <li>Use Sage People for Employee ID (Work Details → Unique ID) and Department (Team Level 1)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">E-invoicing notice (Malaysia staff only):</p>
              <p>
                Request an e-invoice with company details from suppliers for every claim type except Employee Benefit. Refer to
                the “[Announcement] Changes to Staff Claim Process - E-Invoicing Implementation” email for the full process.
              </p>
            </div>
          </CardContent>
        </Card>

        {submitError && (
          <Card className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-100">Submission failed</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {lockPersonalFields && (
          <Card className="mb-6 border-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-950/20">
            <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
                  <ShieldCheck className="h-5 w-5" />
                  Status Verified
                </CardTitle>
              </div>
              <Badge variant="success">Verified</Badge>
            </CardHeader>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Upload Main Receipt */}
          {currentStep === 1 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Step 1: Upload Main Receipt for OCR</CardTitle>
                  <CardDescription>Start by selecting claim type and uploading receipts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label>Staff Claim Type*</Label>
                    <div role="tablist" className="grid gap-3 md:grid-cols-2">
                      {staffClaimTypeTabs.map((option) => {
                        const Icon = option.icon
                        const active = formData.staffClaimType === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => handleClaimTypeChange(option.value)}
                            className={cn(
                              "flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500",
                              active
                                ? "border-coral-500 bg-coral-50 text-coral-900 dark:border-coral-400 dark:bg-coral-900/25 dark:text-coral-50"
                                : "border-slate-200 text-slate-700 hover:border-coral-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:border-coral-400 dark:hover:bg-slate-900",
                            )}
                          >
                            <div
                              className={cn(
                                "rounded-xl p-2",
                                active
                                  ? "bg-white text-coral-600 dark:bg-coral-800/40 dark:text-coral-50"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200",
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold">{option.label}</p>
                              <p className="text-xs text-muted-foreground">{option.description}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receiptCount">How many receipts are you claiming?* (Max 10)</Label>
                    <select
                      id="receiptCount"
                      name="receiptCount"
                      value={formData.receiptCount}
                      onChange={handleReceiptCountChange}
                      required
                      disabled={!formData.staffClaimType}
                      className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        !formData.staffClaimType ? "bg-muted text-muted-foreground cursor-not-allowed" : "",
                      )}
                    >
                      <option value="">Select receipt count</option>
                      {receiptCountOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {!formData.staffClaimType && (
                      <p className="text-xs text-muted-foreground">Choose a staff claim type first to set receipt count.</p>
                    )}
                  </div>

                  {activeReceiptCount > 0 && (
                    <div className="space-y-8">
                      {claimEntries.map((entry, index) => {
                        const entryStatus = ocrStatuses[index] || { state: "idle" }
                        const duplicateStatus = duplicateStatuses[index]
                        const statusMessage =
                          entryStatus.message ||
                          (entryStatus.state === "success"
                          ? "Values updated from the scanned receipt."
                          : entryStatus.state === "processing"
                              ? "Scanning receipt…"
                              : entryStatus.state === "error"
                                ? "Receipt scan failed. Update manually or try again."
                                : entry.attachment
                                  ? "Use AI scan if the details look incorrect."
                                  : "Upload a receipt to auto-fill amount, currency, and description.")

                        const statusColor =
                          entryStatus.state === "error"
                            ? "text-red-500"
                            : entryStatus.state === "success"
                              ? "text-emerald-500"
                              : entryStatus.state === "processing"
                                ? "text-amber-500"
                                : "text-muted-foreground"

                        const statusIcon =
                          entryStatus.state === "processing" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : entryStatus.state === "success" ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : entryStatus.state === "error" ? (
                            <AlertCircle className="h-3.5 w-3.5" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5" />
                          )

                        return (
                          <div key={`claim-entry-${index}`} className="space-y-4 border-b border-border pb-6 last:border-b-0">
                            <h3 className="font-semibold">Claim {index + 1} Attachment</h3>
                            <div
                              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center transition-colors hover:border-coral-300 dark:hover:border-coral-600"
                              onDragOver={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                                event.dataTransfer.dropEffect = "copy"
                              }}
                              onDrop={(event) => handleAttachmentDrop(event, index, "primary")}
                            >
                              <input
                                id={`claim-${index}-attachment`}
                                type="file"
                                className="hidden"
                                required
                                onChange={(event) => {
                                  const file = event.target.files ? event.target.files[0] : null
                                  handleClaimEntryFileChange(index, file)
                                  event.target.value = ""
                                }}
                                accept=".pdf,.jpg,.jpeg,.png"
                              />
                              <label htmlFor={`claim-${index}-attachment`} className="cursor-pointer block">
                                {entry.attachment ? (
                                  <div className="flex items-center justify-between gap-4 text-left">
                                    <div className="flex items-center gap-3">
                                      <div className="h-14 w-14 rounded-md border border-muted-foreground/20 bg-white dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                                        {entry.attachmentPreviewUrl ? (
                                          <img
                                            src={entry.attachmentPreviewUrl}
                                            alt={`Receipt preview for claim ${index + 1}`}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <FileText className="h-6 w-6 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium break-all">{entry.attachment.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {((entry.attachment.size || 0) / 1024).toFixed(2)} KB
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.preventDefault()
                                        event.stopPropagation()
                                        handleClaimEntryFileChange(index, null)
                                      }}
                                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 hover:border-coral-300 dark:hover:border-coral-600"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                      Click or drag a receipt (PDF/JPG/PNG, max 5MB)
                                    </p>
                                  </div>
                                )}
                              </label>
                            </div>
                            {receiptOcrFeatureEnabled && (
                              <div className="mt-3 space-y-2 text-left">
                                <p className={cn("flex items-center gap-2 text-xs", statusColor)}>
                                  {statusIcon}
                                  <span>{statusMessage}</span>
                                </p>
                                {entry.attachment && entryStatus.state !== "processing" && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-fit text-xs"
                                    onClick={() =>
                                      runReceiptOcr(index, entry.attachment as File, {
                                        staffClaimType: formData.staffClaimType,
                                        localCurrency: formData.localCurrency,
                                        location: formData.location,
                                        benefitType:
                                          formData.staffClaimType === "Employee Benefit"
                                            ? entry.benefitType || undefined
                                            : undefined,
                                      })
                                    }
                                  >
                                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                                    Re-run receipt scan
                                  </Button>
                                )}
                              </div>
                            )}
                            {duplicateStatus?.isDuplicate && (
                              <div className="mt-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                  <p className="font-semibold">Possible duplicate receipt</p>
                                  <p>{duplicateStatus.reason || "This looks identical to another claim entry."}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4">
                    {hasDuplicates && (
                      <p className="text-xs text-red-600">
                        Resolve duplicate receipts before continuing.
                      </p>
                    )}
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      disabled={!isStep1Valid}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Step 2: Claim Details */}
          {currentStep === 2 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Step 2: Complete Claim Details</CardTitle>
                  <CardDescription>Review and complete the auto-filled information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {claimEntries.map((entry, index) => (
                    <div key={`claim-details-${index}`} className="space-y-4 border-b border-border pb-6 last:border-b-0">
                      <h3 className="font-semibold">Claim {index + 1}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`claim-${index}-description`}>Claim {index + 1} Description*</Label>
                          <Input
                            id={`claim-${index}-description`}
                            value={entry.description}
                            onChange={(event) => handleClaimEntryChange(index, "description", event.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`claim-${index}-currency`}>Claim {index + 1} Currency*</Label>
                          <select
                            id={`claim-${index}-currency`}
                            value={entry.currency}
                            onChange={(event) => handleClaimEntryChange(index, "currency", event.target.value)}
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">Select currency</option>
                            {currencyOptions.map((currency) => (
                              <option key={currency} value={currency}>
                                {currency}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`claim-${index}-date`}>Receipt Date*</Label>
                          <Input
                            id={`claim-${index}-date`}
                            type="date"
                            value={entry.serviceDate}
                            onChange={(event) => handleClaimEntryChange(index, "serviceDate", event.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`claim-${index}-claimant`}>Person / Patient Name*</Label>
                          <Input
                            id={`claim-${index}-claimant`}
                            value={entry.claimantName}
                            onChange={(event) => handleClaimEntryChange(index, "claimantName", event.target.value)}
                            placeholder="Enter the staff or dependent name shown on receipt"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`claim-${index}-merchant`}>Company / Vendor Name*</Label>
                        <Input
                          id={`claim-${index}-merchant`}
                          value={entry.merchantName}
                          onChange={(event) => handleClaimEntryChange(index, "merchantName", event.target.value)}
                          placeholder="Clinic, hospital, airline, merchant, etc."
                          required
                        />
                      </div>
                      {formData.staffClaimType === "Employee Benefit" && (
                        <div className="space-y-2">
                          <Label htmlFor={`claim-${index}-benefitType`}>Benefit Type*</Label>
                          <select
                            id={`claim-${index}-benefitType`}
                            value={entry.benefitType}
                            onChange={(event) => handleClaimEntryChange(index, "benefitType", event.target.value)}
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">Select benefit type</option>
                            {employeeBenefitTypeOptions.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor={`claim-${index}-amount`}>Claim {index + 1} Amount*</Label>
                        <Input
                          id={`claim-${index}-amount`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={entry.amount}
                          onChange={(event) => handleClaimEntryChange(index, "amount", event.target.value)}
                          required
                        />
                        {formData.localCurrency && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {entry.currency === formData.localCurrency ? (
                              <span>
                                Converted: {entry.amount || "0.00"} {formData.localCurrency} (same as local currency)
                              </span>
                            ) : conversionResults[index]?.hasRate ? (
                              <span>
                                Converted:{" "}
                                {conversionResults[index]?.converted?.toFixed(2) || "0.00"} {formData.localCurrency}{" "}
                                {conversionResults[index]?.inverseRate
                                  ? `(1 ${entry.currency} = ${conversionResults[index]?.inverseRate?.toFixed(
                                      4,
                                    )} ${formData.localCurrency})`
                                  : ""}
                              </span>
                            ) : (
                              <span className="text-red-600">
                                FX rate missing for {entry.currency}. We’ll fetch rates when available.
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      {formData.staffClaimType === "Employee Benefit" && entry.benefitType === "Optical" && (
                        <div
                          className={cn(
                            "rounded-md border px-3 py-2 text-xs",
                            entry.opticalVerification?.verified
                              ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100"
                              : "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {entry.opticalVerification?.verified ? (
                              <ShieldCheck className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                            <p className="font-medium">
                              {entry.opticalVerification?.verified
                                ? "Verified optical receipt"
                                : "Prescription evidence not detected"}
                            </p>
                          </div>
                          <p className="mt-1 text-[13px]">
                            {entry.opticalVerification?.note ||
                              (entry.opticalVerification?.verified
                                ? "Detected prescription details for eyewear reimbursement."
                                : entry.isOpticalReceipt
                                  ? "Upload the prescription page or ensure the receipt mentions prescription lenses."
                                  : "Mark this as optical only if the receipt or invoice shows prescription eyewear or attach the prescription page.")}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={handlePreviousStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <div className="flex items-center gap-3">
                    {!isStep2Valid && step2Validation.reason && (
                      <p className="text-xs text-red-600">{step2Validation.reason}</p>
                    )}
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      disabled={!isStep2Valid}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            </>
          )}

          {/* Step 3: Supporting Documents */}
          {currentStep === 3 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Step 3: Supporting Documents (Optional)</CardTitle>
                  <CardDescription>Add any additional supporting documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {claimEntries.map((entry, index) => (
                    <div key={`supporting-${index}`} className="space-y-4 border-b border-border pb-6 last:border-b-0">
                      <h3 className="font-semibold">Supporting Documents for Claim {index + 1}</h3>
                      {entryRequiresOpticalProof(entry) && (
                        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <p className="font-semibold">Prescription evidence required</p>
                            <p>
                              Upload a prescription page or a receipt that clearly states prescription lenses for this optical claim.
                            </p>
                          </div>
                        </div>
                      )}
                      <div
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center transition-colors hover:border-coral-300 dark:hover:border-coral-600"
                        onDragOver={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          event.dataTransfer.dropEffect = "copy"
                        }}
                        onDrop={(event) => handleAttachmentDrop(event, index, "supporting")}
                      >
                        <input
                          id={`claim-${index}-supporting-attachment`}
                          type="file"
                          className="hidden"
                          multiple
                          required={entryRequiresOpticalProof(entry)}
                          onChange={(event) => {
                            if (event.target.files) {
                              addSupportingAttachments(index, event.target.files)
                            }
                            event.target.value = ""
                          }}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <label htmlFor={`claim-${index}-supporting-attachment`} className="cursor-pointer block space-y-3">
                          <div className="space-y-2">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Drag or click to add approvals, proposals, or extra receipts (you can attach multiple)
                            </p>
                          </div>
                          {entry.supportingAttachments.length > 0 && (
                            <div className="space-y-3 text-left">
                              {entry.supportingAttachments.map((file, fileIdx) => (
                                <div key={`${file.name}-${fileIdx}`} className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-md border border-muted-foreground/20 bg-white dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                                      {entry.supportingAttachmentPreviewUrls[fileIdx] ? (
                                        <img
                                          src={entry.supportingAttachmentPreviewUrls[fileIdx] as string}
                                          alt={`Supporting document preview ${fileIdx + 1}`}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium break-all">{file.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {((file.size || 0) / 1024).toFixed(2)} KB
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.preventDefault()
                                      event.stopPropagation()
                                      removeSupportingAttachment(index, fileIdx)
                                    }}
                                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 hover:border-coral-300 dark:hover:border-coral-600"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={handlePreviousStep}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <div className="flex items-center gap-3">
                      {!isStep3Valid && (
                        <p className="text-xs text-red-600">
                          Upload prescription proof for optical claims before continuing.
                        </p>
                      )}
                      <Button
                        type="button"
                        onClick={() => isStep3Valid && setCurrentStep(4)}
                        disabled={!isStep3Valid}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      >
                        Review
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Step 4: Review and Personal Info */}
          {currentStep === 4 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>All details must match Sage People records</CardDescription>
                </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingProfile && (
              <p className="text-xs text-muted-foreground">Auto-filling your profile from HR records...</p>
            )}
            {profileError && <p className="text-xs text-red-500">{profileError}</p>}
            {!profileError && (
              <div
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                  lockPersonalFields
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-50"
                    : "border-slate-200 bg-muted text-muted-foreground"
                }`}
              >
                {lockPersonalFields ? (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verified via HR records. Contact People & Culture if any detail is incorrect.</span>
                  </>
                ) : (
                  <>
                    <ShieldOff className="h-4 w-4" />
                    <span>Provide accurate details exactly as listed in Sage People.</span>
                  </>
                )}
              </div>
            )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="fullName">Your Full Name*</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleFormStateChange}
                  required
                  readOnly={lockPersonalFields}
                  disabled={lockPersonalFields}
                  className={lockedFieldClass}
                />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID*</Label>
                <Input
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleFormStateChange}
                  required
                  readOnly={lockPersonalFields}
                  disabled={lockPersonalFields}
                  className={lockedFieldClass}
                />
                  <p className="text-xs text-muted-foreground">Refer to Sage People → Work Details → Unique ID.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department*</Label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleFormStateChange}
                  required
                  disabled={lockPersonalFields}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    lockPersonalFields ? "bg-muted cursor-not-allowed text-muted-foreground" : ""
                  }`}
                >
                    <option value="">Select department</option>
                    {departmentSelectOptions.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regentEmail">Your Regentmarkets Email Address*</Label>
                <Input
                  id="regentEmail"
                  name="regentEmail"
                  type="email"
                  value={formData.regentEmail}
                  onChange={handleFormStateChange}
                  required
                  placeholder="name@regentmarkets.com"
                  readOnly={lockPersonalFields}
                  disabled={lockPersonalFields}
                  className={lockedFieldClass}
                />
                  {!isRegentEmailValid && formData.regentEmail && (
                    <p className="text-[13px] text-red-500">Email must end with @regentmarkets.com</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Work Details</CardTitle>
              <CardDescription>Match your Work Details in Sage People</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Your Location*</Label>
                <select
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleFormStateChange}
                  required
                  disabled={lockPersonalFields}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    lockPersonalFields ? "bg-muted cursor-not-allowed text-muted-foreground" : ""
                  }`}
                >
                    <option value="">Select location</option>
                    {locationSelectOptions.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hiringCompany">Your Hiring Company*</Label>
                <select
                  id="hiringCompany"
                  name="hiringCompany"
                  value={formData.hiringCompany}
                  onChange={handleFormStateChange}
                  required
                  disabled={lockPersonalFields}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    lockPersonalFields ? "bg-muted cursor-not-allowed text-muted-foreground" : ""
                  }`}
                >
                    <option value="">Select hiring company</option>
                    {hiringCompanySelectOptions.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
              
              <Card>
            <CardHeader>
              <CardTitle>Summary & Submission</CardTitle>
              <CardDescription>Confirm totals and supporting information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 dark:border-amber-900 dark:bg-amber-950/25 space-y-2 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-50">Remaining Balance</p>
                    <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
                      Mirrors your Employee Benefit dashboard
                    </p>
                  </div>
                  {isBalanceLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-700 dark:text-amber-200" />
                  ) : balanceError ? (
                    <Badge variant="outline" className="border-red-200 text-red-700 dark:border-red-800 dark:text-red-300">
                      Error
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-200"
                    >
                      Synced
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {hasBalanceData && !balanceError
                    ? formatCurrency(balanceSnapshot.remaining, balanceSnapshot.currency)
                    : "—"}
                </div>
                {balanceError ? (
                  <p className="text-xs text-red-600 dark:text-red-300">{balanceError}</p>
                ) : (
                  <p className="text-xs text-amber-900/80 dark:text-amber-100/70">
                    You are entitled to this balance for the current plan year. Based on the receipts you submit, you can
                    only claim up to this number.
                  </p>
                )}
                {claimExceedsBalance && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-white">
                    <p>
                      Your claim total exceeds your remaining balance by{" "}
                      {formatCurrency(claimOverageAmount, balanceSnapshot.currency)}.
                    </p>
                    <p className="text-xs mt-1 text-red-600 dark:text-white/80">
                      You will only receive {formatCurrency(balanceSnapshot.remaining, balanceSnapshot.currency)} after submission.
                    </p>
                  </div>
                )}
                {canShowProjectedBalance && (
                  <div className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        Balance after this claim
                      </span>
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {formatCurrency(balanceSnapshot.remaining, balanceSnapshot.currency)} −{" "}
                          {formatCurrency(calculatedTotal, balanceSnapshot.currency)}
                        </div>
                        <div className="text-lg font-bold">
                          {formatCurrency(projectedRemainingBalance, balanceSnapshot.currency)}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        We’ll update your balance with this figure once Finance approves the claim.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="localCurrency">Local Currency*</Label>
                  <select
                    id="localCurrency"
                    name="localCurrency"
                    value={formData.localCurrency}
                    onChange={handleFormStateChange}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select local currency</option>
                    {localCurrencyOptions.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                </select>
              </div>
            </div>

              {formData.localCurrency && claimEntries.length > 0 && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-4 text-sm shadow-sm dark:border-emerald-900/60 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-emerald-50">Claim amounts (converted)</p>
                      <p className="text-xs text-muted-foreground">
                        Showing totals in {formData.localCurrency}. Rates auto-refresh when needed.
                      </p>
                    </div>
                    <div className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-100">
                      {formData.localCurrency}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200 dark:divide-emerald-900/40 rounded-xl border border-slate-100 bg-white shadow-xs dark:border-emerald-900/60 dark:bg-slate-950/70">
                    {claimEntries.map((entry, index) => {
                      const converted = conversionResults[index]?.converted
                      const hasRate = conversionResults[index]?.hasRate
                      const inverse = conversionResults[index]?.inverseRate
                      return (
                        <div key={`conversion-${index}`} className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-3 sm:items-center">
                          <div className="text-xs font-semibold text-slate-700 dark:text-emerald-50">Claim {index + 1}</div>
                          <div className="text-sm text-slate-900 dark:text-white">
                            {entry.amount || "0.00"} {entry.currency || "—"}{" "}
                            {hasRate && converted !== null ? (
                              <span className="text-emerald-700 dark:text-emerald-200">
                                → {converted?.toFixed(2)} {formData.localCurrency}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground sm:text-right">
                            {hasRate && inverse ? (
                              <span>
                                1 {entry.currency} = {inverse?.toFixed(4)} {formData.localCurrency}
                              </span>
                            ) : (
                              <span className="text-red-600">Rate missing for {entry.currency}</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {fxState.data?.fetchedAt ? (
                      <span>
                        Rates as of {fxState.data.fetchedAt} ({fxState.data.provider}
                        {fxState.data.source ? `, ${fxState.data.source}` : ""})
                      </span>
                    ) : (
                      <span>Rates will load when a different currency is detected.</span>
                    )}
                    {fxState.error && <span className="text-red-600">{fxState.error}</span>}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="totalAmount">
                  Total Amount* {formData.localCurrency ? `(in ${formData.localCurrency})` : ""}
                </Label>
                <Input id="totalAmount" name="totalAmount" value={calculatedTotal.toFixed(2)} readOnly placeholder="0.00" />
                <p className="text-xs text-muted-foreground">
                  Automatically calculated based on all claim entry amounts. Ensure it matches your supporting documents.
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={handlePreviousStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!isFormValid || isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Claim
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
            </>
          )}
        </form>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Form Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Only one form per staff claim type with up to 10 receipts.</p>
            <p>• Upload clear receipts plus approval conversations for every entry.</p>
            <p>• Malaysia staff (except Employee Benefit claims) must request supplier e-invoices.</p>
            <p>• Use Sage People to confirm Unique ID, Department, Hiring Company, and location.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
