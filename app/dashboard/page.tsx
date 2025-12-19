"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  MessageSquare,
  FileText,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Glasses,
  SmilePlus,
  Stethoscope,
  type LucideIcon,
} from "lucide-react"
import { useSession } from "@/hooks/useSession"
import { fetchDashboardData, type BalanceData, type RecentClaim } from "@/lib/supabase-dashboard"

export default function Dashboard() {
  const router = useRouter()
  const { state, user } = useSession({
    redirectIfUnauthorized: () => router.push("/"),
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isDataSyncing, setIsDataSyncing] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null)
  const [recentClaims, setRecentClaims] = useState<RecentClaim[]>([])
  const [hasLoadedData, setHasLoadedData] = useState(false)
  const [showAllClaims, setShowAllClaims] = useState(false)

  useEffect(() => {
    if (state.status !== "loading") {
      setIsLoading(false)
    }
  }, [state.status])

  const userEmail = user?.email ?? ""

  useEffect(() => {
    if (!userEmail || state.status !== "authenticated") {
      return
    }

    let isActive = true

    const syncDashboard = async () => {
      setIsDataSyncing(true)
      setDataError(null)
      try {
        const data = await fetchDashboardData(userEmail)
        if (!isActive) {
          return
        }
        setBalanceData(data.balance)
        setRecentClaims(data.recentClaims)
        setHasLoadedData(true)
      } catch (error) {
        if (!isActive) {
          return
        }
        console.error("Failed to load dashboard data:", error)
        setDataError(
          error instanceof Error
            ? error.message
            : "We couldn’t sync your latest ClaimEase data.",
        )
        setBalanceData(null)
        setRecentClaims([])
        setHasLoadedData(true)
      } finally {
        if (isActive) {
          setIsDataSyncing(false)
        }
      }
    }

    void syncDashboard()

    return () => {
      isActive = false
    }
  }, [state.status, userEmail])

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "status-approved"
      case "Paid":
        return "status-paid"
      case "Pending":
        return "status-pending"
      case "Rejected":
        return "status-rejected"
      default:
        return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
    }
  }

  const usagePercentage = useMemo(() => {
    const total = balanceData?.total ?? 0
    const used = balanceData?.used ?? 0
    if (total <= 0) {
      return 0
    }
    return Math.min(100, (used / total) * 100)
  }, [balanceData?.total, balanceData?.used])

  const getClaimIcon = (category?: string): LucideIcon => {
    const normalized = category?.toLowerCase() || ""
    if (normalized.includes("dental") || normalized.includes("tooth") || normalized.includes("dentist")) {
      return SmilePlus
    }
    if (normalized.includes("optic") || normalized.includes("vision") || normalized.includes("eye")) {
      return Glasses
    }
    if (
      normalized.includes("health") ||
      normalized.includes("medical") ||
      normalized.includes("clinic") ||
      normalized.includes("wellness")
    ) {
      return Stethoscope
    }
    return FileText
  }

  if (state.status === "loading" || isLoading || (!hasLoadedData && !dataError)) {
    const SkeletonCard = () => (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-8 w-32 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-40 rounded bg-slate-100 dark:bg-slate-900 mt-2" />
      </div>
    )

    const SkeletonList = () => (
      <div className="space-y-3">
        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-48 rounded bg-slate-100 dark:bg-slate-900" />
                <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-900" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="space-y-2 text-right">
                <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800 ml-auto" />
                <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-900 ml-auto" />
              </div>
              <div className="h-6 w-16 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    )

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-coral-50 dark:from-slate-1100 dark:via-slate-1000 dark:to-slate-900 lg:pl-72">
        <Navigation />
        <div className="container mx-auto px-4 py-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-3 w-64 rounded bg-slate-100 dark:bg-slate-900 animate-pulse" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-8 w-28 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <SkeletonList />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-coral-50 dark:from-slate-1100 dark:via-slate-1000 dark:to-slate-900 lg:pl-72">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-gradient-coral rounded-full"></div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Employee Benefits</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 ml-7">
            Welcome back! Here’s an overview of your claims and benefits.
          </p>
          {dataError && (
            <div className="mt-4 ml-7 rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {dataError}
            </div>
          )}
          {!dataError && isDataSyncing && (
            <p className="mt-3 ml-7 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Syncing latest Supabase data…
            </p>
          )}
        </div>

        {/* Balance Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="card-glow border-coral-100 dark:border-coral-900 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-coral-700 opacity-5 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Balance</CardTitle>
              <div className="w-10 h-10 rounded-xl bg-gradient-coral flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(balanceSnapshot.total, balanceSnapshot.currency)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 bg-coral-700 rounded-full"></span>
                Annual allocation
              </p>
            </CardContent>
          </Card>

          <Card className="card-glow border-yellow-100 dark:border-yellow-900 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-700 opacity-5 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Used Amount</CardTitle>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-500">
                {formatCurrency(balanceSnapshot.used, balanceSnapshot.currency)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-full transition-all duration-500"
                    style={{ width: `${usagePercentage}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {usagePercentage.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow border-emerald-100 dark:border-emerald-900 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-700 opacity-5 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Remaining Balance</CardTitle>
              <div className="w-10 h-10 rounded-xl bg-gradient-emerald flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-500">
                {formatCurrency(balanceSnapshot.remaining, balanceSnapshot.currency)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-700 rounded-full"></span>
                Available to claim
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Claims */}
        <Card className="card-glow mb-8 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-900 dark:text-white">Recent Claims</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  {showAllClaims ? "Showing all available claims" : "Showing current year claims"}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-coral-200 text-coral-700 hover:bg-coral-50 dark:border-coral-800 dark:text-coral-400 dark:hover:bg-coral-950"
                onClick={() => setShowAllClaims((prev) => !prev)}
              >
                {showAllClaims ? "Show Current Year" : "View All"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const currentYear = new Date().getFullYear()
                const currentYearClaims = recentClaims.filter((claim) => {
                  const claimDate = new Date(claim.date)
                  return !Number.isNaN(claimDate.getTime()) && claimDate.getFullYear() === currentYear
                })

                const visibleClaims =
                  showAllClaims || currentYearClaims.length === 0 ? recentClaims : currentYearClaims

                if (visibleClaims.length === 0) {
                  const noDataMessage =
                    !showAllClaims && currentYearClaims.length === 0
                      ? "No Employee Benefit claims found for the current year."
                      : "No Employee Benefit claims available yet."
                  return (
                    <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">
                      {noDataMessage}
                    </div>
                  )
                }

                const claimsByYear = visibleClaims.reduce<Record<string, typeof visibleClaims>>((acc, claim) => {
                  const claimDate = new Date(claim.date)
                  const yearLabel = Number.isNaN(claimDate.getTime()) ? "Unknown" : claimDate.getFullYear().toString()
                  if (!acc[yearLabel]) {
                    acc[yearLabel] = []
                  }
                  acc[yearLabel].push(claim)
                  return acc
                }, {})

                const sortedYears = Object.keys(claimsByYear).sort((a, b) => {
                  if (a === "Unknown") return 1
                  if (b === "Unknown") return -1
                  return Number(b) - Number(a)
                })

                return sortedYears.map((year) => (
                  <div key={year} className="space-y-3">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-2">
                      {year}
                    </div>
                    {claimsByYear[year].map((claim, index) => {
                      const amountValue = typeof claim.amount === "number" ? claim.amount : Number(claim.amount || 0)
                      const claimCurrency = claim.currency || balanceSnapshot.currency
                      const claimTitle = claim.title || claim.category || claim.id || `Claim ${index + 1}`
                      const claimCategoryLabel =
                        claim.category && claim.category !== claimTitle ? claim.category : undefined
                      const claimReference = claim.reference?.trim()
                      const claimDescription = claim.description?.trim()
                      const ClaimIcon = getClaimIcon(claim.category)
                      return (
                        <div
                          key={`${year}-${claim.id || index}`}
                          className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-coral-200 dark:hover:border-coral-800 hover:shadow-md transition-all duration-300 group"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral-50 to-coral-100 dark:from-coral-950 dark:to-coral-900 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <ClaimIcon className="h-6 w-6 text-coral-700 dark:text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{claimTitle}</p>
                              {claimCategoryLabel && (
                                <p className="text-xs text-slate-600 dark:text-slate-400">{claimCategoryLabel}</p>
                              )}
                              {claimReference && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">Ref: {claimReference}</p>
                              )}
                              {claimDescription && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">{claimDescription}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {formatCurrency(amountValue, claimCurrency)}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-500">{claim.date || "Unknown"}</p>
                            </div>
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(claim.status || "Pending")}`}>
                              {claim.status || "Pending"}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card
            className="card-glow cursor-pointer group border-coral-100 dark:border-coral-900 hover:border-coral-300 dark:hover:border-coral-700 transition-all duration-300"
            onClick={() => router.push("/chat")}
          >
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-coral flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="h-7 w-7 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-coral-700 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900 dark:text-white mb-2">Ask AI Assistant</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Get instant answers about your claims, policies, and benefits
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card
            className="card-glow cursor-pointer group border-emerald-100 dark:border-emerald-900 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300"
            onClick={() => router.push("/submit-claim")}
          >
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-emerald flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-emerald-700 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900 dark:text-white mb-2">Submit New Claim</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Quick and easy claim submission with instant validation
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>

      </div>
    </div>
  )
}
