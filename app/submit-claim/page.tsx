"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
} from "lucide-react"
import { submitClaimToSupabase } from "@/lib/supabase-claims"
import { fetchDashboardData, type BalanceData } from "@/lib/supabase-dashboard"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useSession } from "@/hooks/useSession"
import { getAuthHeaders } from "@/lib/session"

const isTruthyFlag = (value?: string | null) => {
  if (!value) {
    return false
  }
  return ["1", "true", "yes", "on"].includes(value.toLowerCase())
}

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

const currencyOptions = ["MYR", "USD", "EUR", "GBP", "SGD", "AED", "AUD", "JPY", "IDR", "Other"]

const employeeBenefitTypeOptions = ["Optical", "Dental", "Health Screening"] as const

type ClaimEntry = {
  description: string
  currency: string
  amount: string
  attachment: File | null
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

type FormState = {
  fullName: string
  employeeId: string
  department: string
  regentEmail: string
  location: string
  hiringCompany: string
  bankAccountNumber: string
  bankName: string
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

const receiptOcrFeatureEnabled = (() => {
  const flagValue =
    process.env.NEXT_PUBLIC_ENABLE_RECEIPT_OCR ||
    process.env.ENABLE_RECEIPT_OCR ||
    process.env.NEXT_PUBLIC_RECEIPT_OCR ||
    ""
  return isTruthyFlag(flagValue.toString())
})()

export default function SubmitClaim() {
  const router = useRouter()
  const { state, user } = useSession({
    redirectIfUnauthorized: () => router.push("/no-access"),
  })
  const userEmail = user?.email ?? ""
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [isProfileVerified, setIsProfileVerified] = useState(false)
  const [claimEntries, setClaimEntries] = useState<ClaimEntry[]>([])
  const [ocrStatuses, setOcrStatuses] = useState<Record<number, ReceiptOcrState>>({})
  const [formData, setFormData] = useState<FormState>({
    fullName: "",
    employeeId: "",
    department: "",
    regentEmail: "",
    location: "",
    hiringCompany: "",
    bankAccountNumber: "",
    bankName: "",
    staffClaimType: "",
    receiptCount: "",
    clinicName: "",
    headcount: "",
    localCurrency: "",
  })
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null)
  const [balanceError, setBalanceError] = useState<string | null>(null)
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
          hiringCompany: profile.company ?? prev.hiringCompany,
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
        return prev.length === 0 ? prev : []
      }

      if (activeReceiptCount > prev.length) {
        const additions = Array.from({ length: activeReceiptCount - prev.length }, () => ({
          description: "",
          currency: "",
          amount: "",
          attachment: null,
          serviceDate: "",
          claimantName: "",
          merchantName: "",
          isOpticalReceipt: false,
          benefitType: "",
          opticalVerification: undefined,
        }))
        return [...prev, ...additions]
      }

      if (activeReceiptCount < prev.length) {
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

  const calculatedTotal = useMemo(() => {
    return claimEntries.reduce((sum, entry) => {
      const parsedAmount = parseFloat(entry.amount)
      if (Number.isNaN(parsedAmount)) {
        return sum
      }
      return sum + parsedAmount
    }, 0)
  }, [claimEntries])

  const lockPersonalFields = isProfileVerified && !profileError
  const lockedFieldClass = lockPersonalFields ? "bg-muted/60 text-muted-foreground cursor-not-allowed" : ""

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
    setClaimEntries([])
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
    field: keyof Omit<ClaimEntry, "attachment" | "opticalVerification">,
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
      next[index] = { ...next[index], attachment: file }
      return next
    })

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

    if (formData.hiringCompany && (!formData.bankAccountNumber || !formData.bankName)) {
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
      return entry.attachment === null
    })

    if (invalidEntry) {
      return false
    }

    if (calculatedTotal <= 0) {
      return false
    }

    return true
  }, [formData, claimEntries, activeReceiptCount, calculatedTotal, isRegentEmailValid])

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
          bankAccountNumber: formData.bankAccountNumber || undefined,
          bankName: formData.bankName || undefined,
        },
        clinicName: formData.clinicName || undefined,
        headcount: formData.headcount || undefined,
        claimEntries: claimEntries.map((entry) => ({
          description: entry.description,
          currency: entry.currency,
          amount: parseFloat(entry.amount),
          attachment: entry.attachment,
          serviceDate: entry.serviceDate,
          claimantName: entry.claimantName,
          merchantName: entry.merchantName,
          isOpticalReceipt: entry.isOpticalReceipt,
          benefitType: entry.benefitType || undefined,
          opticalVerification: entry.opticalVerification,
        })),
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to submit claim.")
      }

      setSubmitSuccess(true)

      setFormData({
        fullName: "",
        employeeId: "",
        department: "",
        regentEmail: userEmail,
        location: "",
        hiringCompany: "",
        bankAccountNumber: "",
        bankName: "",
        staffClaimType: "",
        receiptCount: "",
        clinicName: "",
        headcount: "",
        localCurrency: "",
      })
      setClaimEntries([])
      setOcrStatuses({})

      setTimeout(() => {
        setSubmitSuccess(false)
      }, 4000)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit claim. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (state.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-coral-50 dark:from-slate-1100 dark:via-slate-1000 dark:to-slate-900">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-coral shadow-lg">
            <div className="w-10 h-10 border-4 border-white/70 border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">Loading ClaimEase</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Please wait a moment…</p>
          </div>
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
  const claimOverageAmount = claimExceedsBalance
    ? Math.max(calculatedTotal - balanceSnapshot.remaining, 0)
    : 0
  const predictedRemainingBalance =
    hasBalanceData && !claimExceedsBalance ? Math.max(balanceSnapshot.remaining - calculatedTotal, 0) : 0
  const canShowPredictedBalance = hasBalanceData && !claimExceedsBalance && calculatedTotal > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-coral-50 dark:from-slate-1100 dark:via-slate-1000 dark:to-slate-900 lg:pl-72">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Submit Claim</h1>
          <p className="text-muted-foreground">
            Complete every section below to match the official staff claim form requirements
          </p>
        </div>

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

        {submitSuccess && (
          <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">Claim submitted successfully!</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your claim has been received and is being processed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                  Profile Verified
                </CardTitle>
              </div>
              <Badge variant="success">Verified</Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {verifiedProfileFields.map((field) => (
                <div key={field.label}>
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">{field.label}</p>
                  <p className="font-semibold text-foreground">{field.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
                    {hiringCompanyOptions.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.hiringCompany && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountNumber">Bank Account Number*</Label>
                    <Input
                      id="bankAccountNumber"
                      name="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={handleFormStateChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name*</Label>
                    <Input
                      id="bankName"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleFormStateChange}
                      required
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Claim Configuration</CardTitle>
              <CardDescription>Select claim type and number of entries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Staff Claim Type*</Label>
                <p className="text-xs text-muted-foreground">
                  Choose the category that best matches the receipts you are submitting.
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-300">
                  Each submission supports one claim type only. Switching types clears the receipt count and claim entries so you can re-enter matching receipts.
                </p>
                <input type="hidden" name="staffClaimType" value={formData.staffClaimType} />
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
                {!formData.staffClaimType && (
                  <p className="text-xs text-red-500">Select a claim type to continue.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiptCount">How many receipts are you claiming?* (Max 10)</Label>
                <select
                  id="receiptCount"
                  name="receiptCount"
                  value={formData.receiptCount}
                  onChange={handleReceiptCountChange}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select receipt count</option>
                  {receiptCountOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Selecting a number will expand the form to show the required claim entry blocks.
                </p>
              </div>

            </CardContent>
          </Card>

          {activeReceiptCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Claim Entry Section</CardTitle>
                <CardDescription>Complete each entry with currency, amount, and attachment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {claimEntries.map((entry, index) => {
                  const entryStatus = ocrStatuses[index] || { state: "idle" }
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
                        <p className="text-xs text-muted-foreground">
                          We automatically append this name to your claim description for easier review.
                        </p>
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
                          <p className="text-xs text-muted-foreground">
                            We use this to auto-validate optical vs. dental vs. health screening claims.
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`claim-${index}-attachment`}>
                            Claim {index + 1} Attachment (Invoice, approval and related document)*
                          </Label>
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                            <input
                              id={`claim-${index}-attachment`}
                              type="file"
                              className="hidden"
                              required
                              onChange={(event) =>
                                handleClaimEntryFileChange(index, event.target.files ? event.target.files[0] : null)
                              }
                              accept=".pdf,.jpg,.jpeg,.png"
                            />
                            <label htmlFor={`claim-${index}-attachment`} className="cursor-pointer block">
                              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              {entry.attachment ? (
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">{entry.attachment.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {((entry.attachment.size || 0) / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">Click to upload PDF/JPG/PNG (Max 5MB)</p>
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
                                  <>
                                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                                    Re-run receipt scan
                                  </>
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {formData.staffClaimType === "Employee Benefit" &&
                        entry.benefitType === "Optical" &&
                        (entry.isOpticalReceipt || entry.opticalVerification) && (
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
                                : "Optical receipt needs manual verification"}
                            </p>
                          </div>
                          <p className="mt-1 text-[13px]">
                            {entry.opticalVerification?.note ||
                              (entry.opticalVerification?.verified
                                ? "Detected prescription details for eyewear reimbursement."
                                : "We could not detect prescription details. Upload the prescription page or enter it manually.")}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Summary & Submission</CardTitle>
              <CardDescription>Confirm totals and supporting information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-800 dark:bg-amber-950/20 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Remaining Balance</p>
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
                      className="border-amber-200 text-amber-800 dark:border-amber-800 dark:text-amber-200"
                    >
                      Synced
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-bold text-amber-800 dark:text-amber-100">
                  {hasBalanceData && !balanceError
                    ? formatCurrency(balanceSnapshot.remaining, balanceSnapshot.currency)
                    : "—"}
                </div>
                {balanceError ? (
                  <p className="text-xs text-red-600 dark:text-red-300">{balanceError}</p>
                ) : (
                  <p className="text-xs text-amber-900/80 dark:text-amber-100/70">
                    You are entitled to claim up to{" "}
                    <span className="font-semibold">
                      {formatCurrency(balanceSnapshot.remaining, balanceSnapshot.currency)}
                    </span>{" "}
                    right now. Anything above this amount will not be reimbursed.
                  </p>
                )}
                {claimExceedsBalance && (
                  <>
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                      Your total of {formatCurrency(calculatedTotal, balanceSnapshot.currency)} exceeds the balance by{" "}
                      {formatCurrency(claimOverageAmount, balanceSnapshot.currency)}.
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-white/60 px-3 py-2 text-xs font-medium text-amber-900 dark:border-amber-900 dark:bg-transparent dark:text-amber-100">
                      You can only claim {formatCurrency(balanceSnapshot.remaining, balanceSnapshot.currency)} based on your
                      remaining balance.
                    </div>
                  </>
                )}
                {canShowPredictedBalance && (
                  <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">Projected Balance After Submission</p>
                        <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80">
                          We’ll reflect this amount on your dashboard once the claim is approved.
                        </p>
                      </div>
                      <p className="text-base font-bold">
                        {formatCurrency(predictedRemainingBalance, balanceSnapshot.currency)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="headcount">Headcount (Applicable for team building/lunch)</Label>
                  <Input
                    id="headcount"
                    name="headcount"
                    value={formData.headcount}
                    onChange={handleFormStateChange}
                    placeholder="Enter headcount if applicable"
                  />
                </div>
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
                    {currencyOptions.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount*</Label>
                <Input id="totalAmount" name="totalAmount" value={calculatedTotal.toFixed(2)} readOnly placeholder="0.00" />
                <p className="text-xs text-muted-foreground">
                  Automatically calculated based on all claim entry amounts. Ensure it matches your supporting documents.
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <Button type="submit" disabled={!isFormValid || isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Submit Claim
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
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
