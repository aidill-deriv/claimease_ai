"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowRight, Shield, Sparkles, TrendingUp, Zap } from "lucide-react"
import { getStoredSession, storeSession } from "@/lib/session"

export default function Home() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const session = getStoredSession()
    if (session) {
      setHasSession(true)
      router.replace("/dashboard")
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      return
    }
    setIsLoading(true)
    setErrorMessage("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | { sessionToken: string; user: { id: string; email: string; fullName?: string | null; role: string; status: string } }
        | null

      if (!response.ok || !payload || !("sessionToken" in payload)) {
        const message = (payload as { error?: string } | null)?.error || "Unable to sign you in."
        setErrorMessage(message)
        setIsLoading(false)
        return
      }

      storeSession({
        token: payload.sessionToken,
        user: {
          id: payload.user.id,
          email: payload.user.email,
          fullName: payload.user.fullName ?? null,
          role: payload.user.role as "viewer" | "admin" | "superadmin",
          status: payload.user.status as "active" | "suspended",
        },
      })

      setHasSession(true)
      router.replace("/dashboard")
      return
    } catch (error) {
      console.error("Failed to sign in:", error)
      setErrorMessage("Unable to sign you in. Please try again.")
      setIsLoading(false)
      return
    }

    setIsLoading(false)
  }

  if (isLoading || hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-coral-50 via-white to-slate-75 dark:from-slate-1100 dark:via-slate-1000 dark:to-slate-900">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-coral shadow-lg">
            <div className="w-10 h-10 border-4 border-white/70 border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">Signing you in…</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading your ClaimEase dashboard.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral-50 via-white to-slate-75 dark:from-slate-1100 dark:via-slate-1000 dark:to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Sparkles className="h-14 w-14 text-coral-700 animate-coral-pulse-icon" />
            </div>
          </div>
          <h1 className="text-6xl font-bold mb-4">
            <span className="gradient-text">ClaimEase</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            AI-Powered Employee Claims & Benefits Management
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral-50 dark:bg-coral-950 border border-coral-200 dark:border-coral-800">
            <div className="w-2 h-2 bg-coral-700 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-coral-800 dark:text-coral-300">Powered by Deriv AI Technology</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="max-w-md mx-auto mb-20">
          <Card className="card-glow border-coral-100 dark:border-coral-900 shadow-xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center text-slate-600 dark:text-slate-400">
                Enter your email to access your claims portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="name@regentmarkets.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-12 border-slate-200 dark:border-slate-800 focus:border-coral-700 focus:ring-coral-700"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 border-slate-200 dark:border-slate-800 focus:border-coral-700 focus:ring-coral-700"
                  />
                  {errorMessage && (
                    <p className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      {errorMessage}
                    </p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-coral hover:bg-gradient-coral-dark text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-20">
          <Card className="card-glow group hover:border-coral-200 dark:hover:border-coral-800 transition-all duration-300">
            <CardHeader className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-coral flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl">AI Assistant</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Get instant answers about your claims, policies, and benefits using natural language conversations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-glow group hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300">
            <CardHeader className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-emerald flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl">Real-time Dashboard</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Track your claim balance, spending patterns, and submission history with beautiful visualizations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-glow group hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300">
            <CardHeader className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl">Quick Submissions</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Submit claims in seconds with our streamlined form and instant validation powered by AI
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

      </div>
    </div>
  )
}
