"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, TrendingUp, TrendingDown, Clock, MessageSquare, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

export default function Dashboard() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Only access sessionStorage in the browser
    if (typeof window !== 'undefined') {
      const email = sessionStorage.getItem("userEmail")
      if (!email) {
        router.push("/")
        return
      }
      setUserEmail(email)
    }
    setIsLoading(false)
  }, [router])

  // Mock data - replace with API calls
  const balanceData = {
    total: 2000,
    used: 1426,
    remaining: 574,
  }

  const monthlySpending = [
    { month: "Jan", amount: 450 },
    { month: "Feb", amount: 380 },
    { month: "Mar", amount: 520 },
    { month: "Apr", amount: 410 },
    { month: "May", amount: 590 },
  ]

  // Deriv brand colors for categories
  const categorySpending = [
    { name: "Medical", value: 1200, color: "#FF9C13" },      // Deriv Warning Yellow
    { name: "Dental", value: 450, color: "#2C9AFF" },        // Deriv Info Blue
    { name: "Optical", value: 350, color: "#00C390" },       // Deriv Emerald
    { name: "Wellness", value: 350, color: "#FF444F" },      // Deriv Coral
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
        return "status-approved"
      case "Pending":
        return "status-pending"
      case "Rejected":
        return "status-rejected"
      default:
        return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
    }
  }

  const usagePercentage = (balanceData.used / balanceData.total) * 100

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-coral-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-coral-50 dark:from-slate-1100 dark:via-slate-1000 dark:to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-gradient-coral rounded-full"></div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Employee Benefits</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 ml-7">
            Welcome back! Here's an overview of your claims and benefits.
          </p>
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
              <div className="text-3xl font-bold text-slate-900 dark:text-white">${balanceData.total.toLocaleString()}</div>
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
              <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-500">${balanceData.used.toLocaleString()}</div>
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
              <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-500">${balanceData.remaining.toLocaleString()}</div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-700 rounded-full"></span>
                Available to claim
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Monthly Spending Chart */}
          <Card className="card-glow border-slate-200 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900 dark:text-white">Monthly Spending Trend</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">Your claim spending over the last 5 months</CardDescription>
                </div>
                <div className="w-10 h-10 rounded-xl bg-coral-50 dark:bg-coral-950 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-coral-700" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlySpending} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="coralGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF444F" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FF444F" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(255, 68, 79, 0.1), 0 4px 6px -2px rgba(255, 68, 79, 0.05)',
                      padding: '12px 16px'
                    }}
                    labelStyle={{ color: '#111827', fontWeight: 600, marginBottom: '4px', fontSize: '14px' }}
                    itemStyle={{ color: '#FF444F', fontWeight: 500 }}
                    formatter={(value: any) => [`$${value}`, 'Spending']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#FF444F" 
                    strokeWidth={3}
                    dot={{ fill: '#FF444F', strokeWidth: 0, r: 5 }}
                    activeDot={{ r: 7, fill: '#FF444F', stroke: '#fff', strokeWidth: 3 }}
                    fill="url(#coralGradient)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="card-glow border-slate-200 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900 dark:text-white">Spending by Category</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">Breakdown of your claims by type</CardDescription>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-700" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categorySpending}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={3}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{
                      stroke: '#9ca3af',
                      strokeWidth: 1
                    }}
                  >
                    {categorySpending.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke="#fff"
                        strokeWidth={3}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      padding: '12px 16px'
                    }}
                    formatter={(value: any, name: string) => [`$${value}`, name]}
                    labelStyle={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}
                    itemStyle={{ color: '#6b7280', fontWeight: 500 }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                    formatter={(value) => <span style={{ color: '#374151' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Claims */}
        <Card className="card-glow mb-8 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-900 dark:text-white">Recent Claims</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">Your latest claim submissions</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="border-coral-200 text-coral-700 hover:bg-coral-50 dark:border-coral-800 dark:text-coral-400 dark:hover:bg-coral-950">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-coral-200 dark:hover:border-coral-800 hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral-50 to-coral-100 dark:from-coral-950 dark:to-coral-900 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FileText className="h-6 w-6 text-coral-700 dark:text-coral-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{claim.id}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{claim.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">${claim.amount}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">{claim.date}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(claim.status)}`}>
                      {claim.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="card-glow cursor-pointer group border-coral-100 dark:border-coral-900 hover:border-coral-300 dark:hover:border-coral-700 transition-all duration-300" onClick={() => router.push("/chat")}>
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

          <Card className="card-glow cursor-pointer group border-emerald-100 dark:border-emerald-900 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300" onClick={() => router.push("/submit-claim")}>
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
