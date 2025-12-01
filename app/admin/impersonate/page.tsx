"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, ArrowRight, ShieldCheck, UserSearch } from "lucide-react"
import { useSession } from "@/hooks/useSession"
import { getAuthHeaders, storeSession } from "@/lib/session"

type ImpersonateResponse =
  | {
      sessionToken: string
      user: {
        id: string
        email: string
        fullName?: string | null
        role: "viewer" | "admin" | "superadmin"
        status: "active" | "suspended"
      }
    }
  | { error: string }

export default function ImpersonateAdminPage() {
  const router = useRouter()
  const { state, user } = useSession()
  const [email, setEmail] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSwitchingSession, setIsSwitchingSession] = useState(false)

  useEffect(() => {
    if (state.status === "unauthorized") {
      router.push("/")
    }
  }, [state.status, router])

  useEffect(() => {
    if (state.status === "authenticated" && user?.role !== "superadmin" && !isSwitchingSession) {
      router.push("/no-access")
    }
  }, [state.status, user?.role, router, isSwitchingSession])

  if (state.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-coral-50 dark:from-slate-1100 dark:via-slate-1000 dark:to-slate-900">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-coral shadow-lg">
            <div className="w-10 h-10 border-4 border-white/70 border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">Loading tools…</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Verifying your access level.</p>
          </div>
        </div>
      </div>
    )
  }

  if (state.status !== "authenticated" || user?.role !== "superadmin") {
    return null
  }

  const handleImpersonate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email) {
      return
    }
    setIsSubmitting(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const response = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ email }),
      })

      const payload = (await response.json().catch(() => null)) as ImpersonateResponse | null

      if (!response.ok || !payload || !("sessionToken" in payload)) {
        const message = (payload as { error?: string } | null)?.error || "Unable to impersonate that user."
        throw new Error(message)
      }

      storeSession({
        token: payload.sessionToken,
        user: {
          id: payload.user.id,
          email: payload.user.email,
          fullName: payload.user.fullName ?? null,
          role: payload.user.role,
          status: payload.user.status,
        },
      })

      setIsSwitchingSession(true)
      setSuccessMessage(`Now impersonating ${payload.user.email}. Redirecting to dashboard…`)
      router.replace("/dashboard")
    } catch (error) {
      console.error("Failed to impersonate user:", error)
      setErrorMessage(error instanceof Error ? error.message : "Unable to impersonate that user.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-coral-50 dark:from-slate-1100 dark:via-slate-1000 dark:to-slate-900 lg:pl-72">
      <Navigation />
      <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-coral-600 uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Super Admin Tooling
          </p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Impersonate an Account</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Switch into any active ClaimEase account without a password to debug or assist team members. This action is
            fully audited.
          </p>
        </div>

        <Card className="border-coral-100 dark:border-coral-900 shadow-lg">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-coral flex items-center justify-center text-white">
                <UserSearch className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">Enter the email to impersonate</CardTitle>
                <CardDescription>Only active accounts can be impersonated.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleImpersonate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="impersonate-email">Email address</Label>
                <Input
                  id="impersonate-email"
                  type="email"
                  required
                  placeholder="name@regentmarkets.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We will immediately switch your session to this user without requiring a password.
                </p>
              </div>
              {errorMessage && (
                <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  <AlertCircle className="h-4 w-4" />
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  {successMessage}
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-coral hover:bg-gradient-coral-dark text-white"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Switching session…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Impersonate user
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => router.push("/admin")}
                >
                  Back to admin console
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Usage guidelines</CardTitle>
            <CardDescription>Keep impersonation limited to support and debugging tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <p>• Your original session is replaced entirely. To return to your own account you must log in again.</p>
            <p>• This tool bypasses all passwords—treat it like production access.</p>
            <p>• The backend enforces super admin access, so regular admins can&apos;t reach this endpoint.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
