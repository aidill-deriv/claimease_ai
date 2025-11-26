import type { AllowedUserRole, AllowedUserStatus } from "@/types/auth"

const STORAGE_KEY = "claimease.session"

export type SessionUser = {
  id: string
  email: string
  fullName?: string | null
  role: AllowedUserRole
  status: AllowedUserStatus
}

export type StoredSession = {
  token: string
  user: SessionUser
}

const isBrowser = typeof window !== "undefined"

export const getStoredSession = (): StoredSession | null => {
  if (!isBrowser) {
    return null
  }
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as StoredSession
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export const storeSession = (session: StoredSession) => {
  if (!isBrowser) {
    return
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export const clearStoredSession = () => {
  if (!isBrowser) {
    return
  }
  sessionStorage.removeItem(STORAGE_KEY)
}

export const getAuthHeaders = (headers: HeadersInit = {}): HeadersInit => {
  const session = getStoredSession()
  if (!session?.token) {
    return headers
  }
  return {
    ...headers,
    Authorization: `Bearer ${session.token}`,
  }
}
