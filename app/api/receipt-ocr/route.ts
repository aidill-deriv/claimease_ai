import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { requireSessionFromRequest } from "@/lib/auth"

type ReceiptExtraction = {
  description?: string | null
  amount?: number | string | null
  currency?: string | null
  merchantName?: string | null
  serviceDate?: string | null
  taxAmount?: number | string | null
  notes?: string | null
  confidence?: number | null
  customerName?: string | null
  isOpticalReceipt?: boolean | null
  hasPrescriptionDetails?: boolean | null
  opticalVerificationNote?: string | null
  benefitType?: string | null
}

const RECEIPT_MAX_MB = 5

const isOcrEnabled = () => {
  const flag = process.env.ENABLE_RECEIPT_OCR || process.env.NEXT_PUBLIC_ENABLE_RECEIPT_OCR
  return typeof flag === "string" && ["1", "true", "yes"].includes(flag.toLowerCase())
}

const sanitizeJsonString = (payload: string) => {
  let cleaned = payload.trim()
  if (!cleaned) {
    return cleaned
  }
  cleaned = cleaned.replace(/```json|```/gi, "").trim()
  const firstBrace = cleaned.indexOf("{")
  const lastBrace = cleaned.lastIndexOf("}")
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1)
  }
  return cleaned
}

const formatAmount = (amount: number | string | null | undefined) => {
  if (amount === null || amount === undefined) {
    return null
  }
  if (typeof amount === "number") {
    return Number.isFinite(amount) ? Number(amount.toFixed(2)) : null
  }
  const parsed = parseFloat(amount)
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    return null
  }
  return Number(parsed.toFixed(2))
}

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  const session = await requireSessionFromRequest(request)
  if (session.error) {
    return NextResponse.json({ error: session.error }, { status: 401 })
  }
  const sessionUser = session.user
  if (!isOcrEnabled()) {
    return NextResponse.json({ error: "Receipt OCR is disabled." }, { status: 503 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Missing GEMINI_API_KEY configuration." }, { status: 500 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Receipt file is required." }, { status: 400 })
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Uploaded file is empty." }, { status: 400 })
    }

    const maxBytes = RECEIPT_MAX_MB * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File too large. Limit is ${RECEIPT_MAX_MB} MB per receipt.` },
        { status: 400 },
      )
    }

    const claimType = formData.get("claimType")?.toString() || ""
    const currencyHint = formData.get("currencyHint")?.toString() || ""
    const localeHint = formData.get("localeHint")?.toString() || ""
    const benefitTypeHint = formData.get("benefitTypeHint")?.toString() || ""
    const userEmail = sessionUser.email

    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString("base64")
    const mimeType = file.type || "application/octet-stream"

    const client = new GoogleGenerativeAI(apiKey)
    const modelName = process.env.GEMINI_RECEIPT_MODEL || "gemini-2.5-flash"
    const model = client.getGenerativeModel({ model: modelName })

    const instruction = `
You are an OCR specialist that extracts structured receipt data for staff claims.
Return **only** valid JSON (no prose, markdown, or explanations) that matches:
{
  "description": string | null,
  "amount": number | string | null,
  "currency": string | null,
  "merchantName": string | null,
  "serviceDate": string | null,      // format: YYYY-MM-DD when possible
  "customerName": string | null,
  "taxAmount": number | string | null,
  "notes": string | null,
  "confidence": number | null,
  "isOpticalReceipt": boolean | null,
  "hasPrescriptionDetails": boolean | null,
  "opticalVerificationNote": string | null
  "benefitType": string | null
}

Rules:
- description should be a concise summary of what was purchased or reimbursed.
- amount should be the TOTAL payable amount (after tax/discounts).
- currency must be an ISO 4217 code (e.g., MYR, USD). Infer from the receipt or use the provided hint.
- merchantName is the clinic, provider, or vendor name.
- customerName is the staff or patient name shown on the receipt (if available).
- notes may include receipt number, reference IDs, or anything noteworthy.
- For optical/eyewear receipts, set isOpticalReceipt=true when frames, lenses, optometry services, or optical clinics are detected.
- hasPrescriptionDetails must be true when the receipt or attachment shows lens specifications (sphere, cylinder, axis, OD/OS) or any prescription table, even if the word "prescription" is missing.
- opticalVerificationNote should briefly describe any prescription evidence (e.g., "Detected OD/OS table" or "Includes RX #12345").
- benefitType must be one of: "Optical", "Dental", "Health Screening". Prefer the provided hint when it matches the receipt.
- If data is missing, set the value to null. Do not invent facts.
- Never include line breaks outside JSON or any additional text.

Extra context:
- Claim type: ${claimType || "unspecified"}
- Currency hint: ${currencyHint || "not provided"}
- Employee location hint: ${localeHint || "not provided"}
- Benefit type hint: ${benefitTypeHint || "not provided"}
- Employee email: ${userEmail}
`

    const geminiResponse = await model.generateContent([
      { text: instruction },
      {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      },
    ])

    const rawText = geminiResponse.response.text().trim()
    if (!rawText) {
      return NextResponse.json({ error: "Gemini returned an empty response." }, { status: 502 })
    }

    const cleaned = sanitizeJsonString(rawText)
    let parsed: ReceiptExtraction
    try {
      parsed = JSON.parse(cleaned) as ReceiptExtraction
    } catch (error) {
      console.error("Failed to parse Gemini response:", rawText, error)
      return NextResponse.json({ error: "Failed to parse OCR response." }, { status: 502 })
    }

    const extraction: ReceiptExtraction = {
      description: parsed.description?.toString().trim() || null,
      amount: formatAmount(parsed.amount),
      currency: parsed.currency?.toString().toUpperCase() || null,
      merchantName: parsed.merchantName?.toString().trim() || null,
      serviceDate: parsed.serviceDate?.toString().trim() || null,
      taxAmount: formatAmount(parsed.taxAmount),
      notes: parsed.notes?.toString().trim() || null,
      confidence:
        typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1
          ? Number(parsed.confidence.toFixed(3))
          : null,
      customerName: parsed.customerName?.toString().trim() || null,
      isOpticalReceipt:
        typeof parsed.isOpticalReceipt === "boolean"
          ? parsed.isOpticalReceipt
          : typeof parsed.isOpticalReceipt === "string"
            ? ["true", "1", "yes"].includes(parsed.isOpticalReceipt.toLowerCase())
            : null,
      hasPrescriptionDetails:
        typeof parsed.hasPrescriptionDetails === "boolean"
          ? parsed.hasPrescriptionDetails
          : typeof parsed.hasPrescriptionDetails === "string"
            ? ["true", "1", "yes"].includes(parsed.hasPrescriptionDetails.toLowerCase())
            : null,
      opticalVerificationNote: parsed.opticalVerificationNote?.toString().trim() || null,
      benefitType: parsed.benefitType?.toString().trim() || null,
    }

    return NextResponse.json({ data: extraction })
  } catch (error) {
    console.error("Receipt OCR failed:", error)
    return NextResponse.json({ error: "Unexpected error while processing receipt." }, { status: 500 })
  }
}
