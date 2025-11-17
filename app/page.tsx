"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Shield, Zap, TrendingUp, ArrowRight } from "lucide-react"

export default function Home() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    // Store email in sessionStorage (only in browser)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("userEmail", email)
    }
    
    // Simulate login delay
    setTimeout(() => {
      router.push("/dashboard")
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral-50 via-white to-slate-75 dark:from-slate-1100 dark:via-slate-1000 dark:to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Sparkles className="h-14 w-14 text-coral-700 animate-coral-pulse" />
              <div className="absolute inset-0 h-14 w-14 bg-coral-700 opacity-20 blur-xl rounded-full"></div>
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
                    placeholder="your.email@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-12 border-slate-200 dark:border-slate-800 focus:border-coral-700 focus:ring-coral-700"
                  />
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
              <div className="mt-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Secure authentication • GDPR compliant
                </p>
              </div>
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

        {/* Stats Section */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white">
              Trusted by Employees Worldwide
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Experience the future of claims management
            </p>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-coral mb-4 group-hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-bold text-white">99%</div>
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">AI Accuracy</div>
              <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Industry leading</div>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-emerald mb-4 group-hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-bold text-white">&lt;2s</div>
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Response Time</div>
              <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Lightning fast</div>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 mb-4 group-hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-bold text-white">24/7</div>
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Available</div>
              <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Always online</div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="py-8">
              <div className="flex flex-wrap items-center justify-center gap-8 text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-coral-700" />
                  <span className="text-sm font-medium">Bank-level Security</span>
                </div>
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-700" />
                  <span className="text-sm font-medium">Instant Processing</span>
                </div>
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-700" />
                  <span className="text-sm font-medium">AI-Powered</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © 2025 ClaimEase. Powered by Deriv AI Technology.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Secure • Fast • Reliable • GDPR Compliant
          </p>
        </div>
      </div>
    </div>
  )
}
