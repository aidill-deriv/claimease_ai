import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "./supabase-client"

const claimsTable = process.env.NEXT_PUBLIC_SUPABASE_CLAIMS_TABLE || "claims"
const receiptsBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET

type PersonalInformationPayload = {
  fullName: string
  employeeId: string
  regentEmail: string
}

type WorkDetailsPayload = {
  department: string
  location: string
  hiringCompany: string
  bankAccountNumber?: string
  bankName?: string
}

export interface ClaimEntryPayload {
  description: string
  currency: string
  amount: number
  attachment?: File | null
  supportingAttachments?: File[]
  serviceDate?: string | null
  claimantName?: string | null
  merchantName?: string | null
  isOpticalReceipt?: boolean
  benefitType?: string | null
  opticalVerification?: {
    verified: boolean
    hasPrescriptionDetails?: boolean
    note?: string | null
  } | null
}

export interface SupabaseClaimPayload {
  userEmail: string
  staffClaimType: string
  totalAmount: number
  localCurrency: string
  receiptCount: number
  personalInformation: PersonalInformationPayload
  workDetails: WorkDetailsPayload
  clinicName?: string
  headcount?: string
  claimEntries: ClaimEntryPayload[]
}

export interface SupabaseClaimResult {
  success: boolean
  error?: string
}

const uploadReceipt = async (file: File, supabaseClient: SupabaseClient): Promise<string | null> => {
  if (!receiptsBucket) {
    console.warn("Receipt upload skipped: NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET is not set.")
    return null
  }

  const extension = file.name.split(".").pop() || "pdf"
  const baseName = file.name.replace(/\.[^/.]+$/, "")
  const sanitizedBase = baseName.toLowerCase().replace(/\s+/g, "-")
  const filePath = `receipts/${crypto.randomUUID?.() || Date.now()}-${sanitizedBase}.${extension}`

  const { data, error } = await supabaseClient.storage.from(receiptsBucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data?.path ?? null
}

export const submitClaimToSupabase = async (
  payload: SupabaseClaimPayload,
): Promise<SupabaseClaimResult> => {
  const supabaseClient = supabase

  if (!supabaseClient) {
    return {
      success: false,
      error:
        "Supabase is not configured. Please update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.",
    }
  }

  try {
    const attachmentPaths: (string | null)[] = []
    const supportingAttachmentPaths: (string | null)[][] = []
    for (const entry of payload.claimEntries) {
      if (entry.attachment) {
        const path = await uploadReceipt(entry.attachment, supabaseClient)
        attachmentPaths.push(path)
      } else {
        attachmentPaths.push(null)
      }
      const supportFiles = entry.supportingAttachments || []
      const supportPaths: (string | null)[] = []
      for (const file of supportFiles) {
        const supportingPath = await uploadReceipt(file, supabaseClient)
        supportPaths.push(supportingPath)
      }
      supportingAttachmentPaths.push(supportPaths.length ? supportPaths : [null])
    }

    const claimEntrySummary = payload.claimEntries.map((entry, index) => ({
      description: entry.description,
      currency: entry.currency,
      amount: entry.amount,
      service_date: entry.serviceDate || null,
      claimant_name: entry.claimantName || null,
      merchant_name: entry.merchantName || null,
      is_optical_receipt: entry.isOpticalReceipt ?? null,
      benefit_type: entry.benefitType || null,
      optical_verification: entry.opticalVerification || null,
      receipt_path: attachmentPaths[index],
      supporting_receipt_path: supportingAttachmentPaths[index][0] || null,
      supporting_receipt_paths: supportingAttachmentPaths[index],
    }))

    const metadata = {
      personalInformation: payload.personalInformation,
      workDetails: payload.workDetails,
      clinicName: payload.clinicName || null,
      headcount: payload.headcount || null,
      receiptCount: payload.receiptCount,
      localCurrency: payload.localCurrency,
      claimEntries: claimEntrySummary,
      primaryReceiptPaths: attachmentPaths,
      supportingReceiptPaths: supportingAttachmentPaths,
    }

    const { error } = await supabaseClient.from(claimsTable).insert({
      user_email: payload.userEmail,
      category: payload.staffClaimType,
      amount: payload.totalAmount,
      date: new Date().toISOString(),
      description: JSON.stringify(metadata),
      provider: payload.workDetails.department,
      receipt_path: JSON.stringify(attachmentPaths),
      status: "pending",
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Unexpected error while submitting claim." }
  }
}
