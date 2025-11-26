import axios from "axios"

const resolveApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim()

  if (typeof window !== "undefined") {
    // When the env points to localhost but the app is accessed remotely (e.g., via Cloudflare),
    // use the relative proxy so requests follow the same origin as the shared frontend.
    if (!envUrl || envUrl.startsWith("http://localhost") || envUrl.startsWith("https://localhost")) {
      return "/api"
    }
  }

  return envUrl && envUrl.length > 0 ? envUrl : "/api"
}

export const API_BASE_URL = resolveApiBaseUrl()

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// API Types
export interface QueryHistoryEntry {
  role: "user" | "assistant"
  content: string
}

export interface QueryRequest {
  user_email: string
  query_text: string
  thread_id?: string
  context_messages?: QueryHistoryEntry[]
}

export interface QueryResponse {
  status?: string
  response: string
  thread_id: string
  timestamp: string
  model?: string
  user_email_hash?: string
}

export interface ClaimBalance {
  total_balance: number
  used_amount: number
  remaining_balance: number
}

export interface ClaimHistory {
  claim_id: string
  date: string
  category: string
  amount: number
  status: string
  description: string
}

export interface DashboardData {
  balance: ClaimBalance
  recent_claims: ClaimHistory[]
  monthly_spending: Array<{
    month: string
    amount: number
  }>
}

// API Functions
export const queryAI = async (data: QueryRequest): Promise<QueryResponse> => {
  const response = await api.post('/query', data)
  return response.data
}

export const getClaimBalance = async (email: string): Promise<ClaimBalance> => {
  const response = await api.get(`/balance/${email}`)
  return response.data
}

export const getDashboardData = async (email: string): Promise<DashboardData> => {
  const response = await api.get(`/dashboard/${email}`)
  return response.data
}

export const submitClaim = async (formData: FormData) => {
  const response = await api.post('/submit-claim', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const getClaimHistory = async (email: string): Promise<ClaimHistory[]> => {
  const response = await api.get(`/claims/${email}`)
  return response.data
}

export interface FeedbackRequest {
  user_email: string
  message_id: string
  rating: "up" | "down"
  response_text: string
  thread_id?: string
  comment?: string
  model?: string
  metadata?: Record<string, unknown>
}

export interface FeedbackResponse {
  status: string
  feedback_id: string | null
  data: Record<string, unknown>
}

export const submitFeedback = async (data: FeedbackRequest): Promise<FeedbackResponse> => {
  const response = await api.post("/feedback", data)
  return response.data
}
