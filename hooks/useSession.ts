import { useCallback, useEffect, useRef, useState } from "react"
import type { SessionUser } from "@/lib/session"
import { clearStoredSession, getStoredSession, storeSession } from "@/lib/session"

type SessionState =
  | { status: "loading"; user?: undefined }
  | { status: "unauthorized"; user?: undefined; error?: string }
  | { status: "authenticated"; user: SessionUser }

type UseSessionOptions = {
  redirectIfUnauthorized?: () => void
  minimumRole?: "viewer" | "admin" | "superadmin"
}

const ROLE_RANK = {
  viewer: 1,
  admin: 2,
  superadmin: 3,
}

const hasRequiredRole = (userRole: SessionUser["role"], required?: UseSessionOptions["minimumRole"]) => {
  if (!required) {
    return true
  }
  return ROLE_RANK[userRole] >= ROLE_RANK[required]
}

export const useSession = (options: UseSessionOptions = {}) => {
  const redirectRef = useRef<UseSessionOptions["redirectIfUnauthorized"]>()
  useEffect(() => {
    redirectRef.current = options.redirectIfUnauthorized
  }, [options.redirectIfUnauthorized])

  const minimumRole = options.minimumRole

  const [state, setState] = useState<SessionState>({ status: "loading" })

  const refreshSession = useCallback(async () => {
    const stored = getStoredSession()
    if (!stored) {
      setState({ status: "unauthorized" })
      redirectRef.current?.()
      return
    }

    try {
      const response = await fetch("/api/auth/session", {
        headers: {
          Authorization: `Bearer ${stored.token}`,
        },
      })

      if (!response.ok) {
        clearStoredSession()
        setState({ status: "unauthorized" })
        redirectRef.current?.()
        return
      }

      const payload = (await response.json()) as {
        sessionToken: string
        user: SessionUser
      }

      storeSession({ token: payload.sessionToken, user: payload.user })

      if (!hasRequiredRole(payload.user.role, minimumRole)) {
        clearStoredSession()
        setState({ status: "unauthorized", error: "Insufficient permission." })
        redirectRef.current?.()
        return
      }

      setState({ status: "authenticated", user: payload.user })
    } catch (error) {
      console.error("Session refresh failed:", error)
      clearStoredSession()
      setState({ status: "unauthorized" })
      redirectRef.current?.()
    }
  }, [minimumRole])

  const logout = useCallback(() => {
    clearStoredSession()
    setState({ status: "unauthorized" })
  }, [])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  return {
    state,
    user: state.status === "authenticated" ? state.user : undefined,
    refreshSession,
    logout,
  }
}
