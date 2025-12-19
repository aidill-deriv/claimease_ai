"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DollarSign, MapPinned, Plane, Train, Clock } from "lucide-react"
import { useSession } from "@/hooks/useSession"
import { fetchTravelDashboardData, type TravelDashboardData } from "@/lib/travel-dashboard"

export default function TravelDashboardPage() {
  const router = useRouter()
  const { state, user } = useSession({
    redirectIfUnauthorized: () => router.push("/"),
  })
  const [isLoading, setIsLoading] = useState(true)
  const currentYear = useMemo(() => new Date().getFullYear(), [])
  const [isSyncing, setIsSyncing] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number | "all">(currentYear)
  const [error, setError] = useState<string | null>(null)
  const [travelData, setTravelData] = useState<TravelDashboardData | null>(null)
  const isFetchingInitial = isSyncing && !travelData

  const userEmail = user?.email ?? ""

  useEffect(() => {
    if (state.status !== "loading") {
      setIsLoading(false)
    }
  }, [state.status])

  useEffect(() => {
    if (!userEmail || state.status !== "authenticated") {
      return
    }

    let isMounted = true
    const loadTravelData = async () => {
      setIsSyncing(true)
      setError(null)
      try {
        const data = await fetchTravelDashboardData(userEmail)
        if (!isMounted) return
        setTravelData(data)
        const availableYears = data.years
        if (availableYears.length > 0) {
          const hasCurrent = availableYears.includes(currentYear)
          setSelectedYear(hasCurrent ? currentYear : availableYears[0])
        } else {
          setSelectedYear("all")
        }
      } catch (err) {
        console.error("Failed to load travel dashboard data:", err)
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Failed to load travel dashboard data.")
      } finally {
        if (isMounted) {
          setIsSyncing(false)
        }
      }
    }

    void loadTravelData()
    return () => {
      isMounted = false
    }
  }, [state.status, userEmail, currentYear])

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

  const summary = useMemo(() => {
    if (!travelData) {
      return { total: 0, currency: "USD", categories: [], count: 0, claims: [] as TravelDashboardData["claims"] }
    }
    const targetYear = selectedYear === "all" ? null : selectedYear
    const filteredClaims =
      targetYear === null
        ? travelData.claims
        : travelData.claims.filter((claim) => {
            const year = claim.submittedYear
            if (year) return year === targetYear
            const parsed = new Date(claim.date)
            return !Number.isNaN(parsed.getTime()) && parsed.getFullYear() === targetYear
          })

    const categoriesMap = new Map<string, number>()
    filteredClaims.forEach((claim) => {
      const current = categoriesMap.get(claim.displayCategory) ?? 0
      categoriesMap.set(claim.displayCategory, current + claim.amount)
    })

    return {
      total: filteredClaims.reduce((sum, claim) => sum + claim.amount, 0),
      currency: travelData.currency,
      categories: Array.from(categoriesMap.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount),
      count: filteredClaims.length,
      claims: filteredClaims,
    }
  }, [selectedYear, travelData])

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

  if (state.status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-coral-50 dark:from-slate-1100 dark:via-slate-1000 dark:to-slate-900">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-coral shadow-lg">
            <div className="w-10 h-10 border-4 border-white/70 border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">Loading your travel view…</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Fetching your latest travel claims.</p>
          </div>
        </div>
      </div>
    )
  }

  if (state.status === "unauthorized") {
    return null
  }

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
          className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-48 rounded bg-slate-100 dark:bg-slate-900" />
              <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-900" />
            </div>
          </div>
          <div className="flex items-center gap-4 md:text-right">
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-900" />
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

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-coral-500 to-coral-700 flex items-center justify-center text-white shadow-md">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Travel Claims</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Outstanding travel reimbursements mapped to their categories.
              </p>
            </div>
          </div>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          {!error && isSyncing && (
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Syncing latest travel data…
            </p>
          )}
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap border-coral-300 bg-gradient-to-r from-white via-coral-50 to-white text-coral-800 shadow-sm hover:from-coral-50 hover:to-coral-100 dark:border-coral-800 dark:from-slate-1000 dark:via-slate-1000 dark:to-slate-1000 dark:text-coral-200"
                >
                  {selectedYear === "all" ? "Year: All" : `Year: ${selectedYear}`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 border-coral-100 dark:border-coral-900 bg-white dark:bg-slate-1000 shadow-xl"
              >
                <DropdownMenuLabel className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Filter by year
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setSelectedYear("all")}
                  className="cursor-pointer text-slate-800 dark:text-white"
                >
                  All years
                </DropdownMenuItem>
                {travelData?.years.map((year) => (
                  <DropdownMenuItem
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className="cursor-pointer text-slate-800 dark:text-white"
                  >
                    {year}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isFetchingInitial ? (
          <div className="grid gap-6 md:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="card-glow border-coral-100 dark:border-coral-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Outstanding</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-gradient-coral flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(summary.total, summary.currency)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Across selected travel claims</p>
              </CardContent>
            </Card>

            <Card className="card-glow border-emerald-100 dark:border-emerald-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Categories</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-gradient-emerald flex items-center justify-center">
                  <MapPinned className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {summary.categories.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No travel categories yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {summary.categories.map((cat) => (
                      <Badge
                        key={cat.name}
                        variant="outline"
                        className="border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:bg-emerald-950"
                      >
                        {cat.name}: {formatCurrency(cat.amount, summary.currency)}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="card-glow border-slate-200 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Open Claims</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white dark:bg-slate-800 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{summary.count}</div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Awaiting completion</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="card-glow border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-slate-900 dark:text-white">Travel Claims Detail</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {selectedYear === "all"
                  ? "Showing all available travel claims"
                  : `Showing travel claims for ${selectedYear}`}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isFetchingInitial ? (
              <SkeletonList />
            ) : summary.claims.length > 0 ? (
              <div className="space-y-3">
                {summary.claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-coral-200 dark:hover:border-coral-800 hover:shadow-md transition-all duration-300"
                  >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral-50 to-coral-100 dark:from-coral-950 dark:to-coral-900 flex items-center justify-center">
                          {claim.displayCategory.includes("Travel") ? (
                            <Plane className="h-6 w-6 text-coral-700 dark:text-white" />
                          ) : (
                            <Train className="h-6 w-6 text-coral-700 dark:text-white" />
                          )}
                        </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{claim.displayCategory}</p>
                        {claim.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400">{claim.description}</p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-500">{claim.id}</p>
                      </div>
                    </div>
                      <div className="flex items-center gap-4 md:text-right">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(claim.amount, claim.currency)}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-500">{claim.date || "—"}</p>
                        </div>
                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(claim.state || "Pending")}`}
                        >
                          {claim.state || "Pending"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
              <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">
                {selectedYear === "all"
                  ? "No travel claims available yet."
                  : `No travel claims found for ${selectedYear}.`}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
