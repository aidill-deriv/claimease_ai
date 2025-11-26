import { NextResponse } from "next/server"
import { getSupabaseServiceClient } from "@/lib/supabase-service-client"
import { getDashboardDataFromSupabase } from "@/lib/supabase-dashboard"
import { requireSessionFromRequest } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request)
    if (session.error || !session.user) {
      return NextResponse.json({ error: session.error || "Unauthorized." }, { status: 401 })
    }

    const body = (await request.json().catch(() => null)) as { email?: string } | null

    if (!body || typeof body.email !== "string" || body.email.trim().length === 0) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 })
    }

    if (body.email.trim().toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json({ error: "You can only load your own dashboard." }, { status: 403 })
    }

    const supabaseClient = getSupabaseServiceClient()
    const data = await getDashboardDataFromSupabase(supabaseClient, body.email.trim())

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Dashboard data API failed:", error)
    const message = error instanceof Error ? error.message : "Failed to load dashboard data."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
