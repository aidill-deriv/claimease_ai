import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// API Types
export interface QueryRequest {
  user_email: string
  query_text: string
  thread_id?: string
}

export interface QueryResponse {
  response: string
  thread_id: string
  timestamp: string
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
