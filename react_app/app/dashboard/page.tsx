"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  MessageSquare,
  FileText,
  SmilePlus,
  Glasses,
  Stethoscope,
  type LucideIcon,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

export default function Dashboard() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail")
    if (!email) {
      router.push("/")
      return
    }
    setUserEmail(email)
    setIsLoading(false)
  }, [router])

  // Mock data - replace with API calls
  const balanceData = {
    total: 5000,
    used: 2350,
    remaining: 2650,
  }

  const monthlySpending = [
    { month: "Jan", amount: 450 },
    { month: "Feb", amount: 380 },
    { month: "Mar", amount: 520 },
    { month: "Apr", amount: 410 },
    { month: "May", amount: 590 },
  ]

  const categorySpending = [
    { name: "Medical", value: 1200, color: "#3b82f6" },
    { name: "Dental", value: 450, color: "#8b5cf6" },
    { name: "Optical", value: 350, color: "#ec4899" },
    { name: "Wellness", value: 350, color: "#10b981" },
  ]

  const recentClaims = [
    { id: "CLM-2025-001", date: "2025-05-15", category: "Medical", amount: 250, status: "Approved" },
    { id: "CLM-2025-002", date: "2025-05-10", category: "Dental", amount: 180, status: "Approved" },
    { id: "CLM-2025-003", date: "2025-05-05", category: "Optical", amount: 120, status: "Pending" },
    { id: "CLM-2025-004", date: "2025-04-28", category: "Wellness", amount: 90, status: "Approved" },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400"
      case "Pending":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400"
      case "Rejected":
        return "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400"
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400"
    }
  }

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your claims and benefits.
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${balanceData.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Annual allocation</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Used Amount</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">${balanceData.used.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((balanceData.used / balanceData.total) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${balanceData.remaining.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Available to claim</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {/* Monthly Spending Chart */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Monthly Spending</CardTitle>
              <CardDescription>Your claim spending over the last 5 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlySpending}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Breakdown of your claims by type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categorySpending}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categorySpending.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Claims */}
        <Card className="card-hover mb-8">
          <CardHeader>
            <CardTitle>Recent Claims</CardTitle>
            <CardDescription>Your latest claim submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentClaims.map((claim) => {
                const ClaimIcon = getClaimIcon(claim.category)
                return (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-2 rounded-full bg-primary/10">
                        <ClaimIcon className="h-5 w-5 text-primary dark:text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{claim.id}</p>
                            <p className="text-sm text-muted-foreground">{claim.category}</p>
                          </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">${claim.amount}</p>
                        <p className="text-sm text-muted-foreground">{claim.date}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                        {claim.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="card-hover cursor-pointer" onClick={() => router.push("/chat")}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle>Ask AI Assistant</CardTitle>
              </div>
              <CardDescription>
                Get instant answers about your claims, policies, and benefits
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-hover cursor-pointer" onClick={() => router.push("/submit-claim")}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>Submit New Claim</CardTitle>
              </div>
              <CardDescription>
                Quick and easy claim submission with instant validation
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
