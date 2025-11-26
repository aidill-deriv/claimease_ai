"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"

export default function NoAccessPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-coral-50 dark:from-slate-1100 dark:via-slate-1000 dark:to-slate-900 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-coral-500 shadow-lg">
          <ShieldAlert className="h-10 w-10 text-white" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Access Required</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Your email is not authorized to use ClaimEase yet. Please contact the ClaimEase administrator to request
            access.
          </p>
        </div>
        <Button onClick={() => router.push("/")}>Return to sign-in</Button>
      </div>
    </div>
  )
}
