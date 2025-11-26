import { NextResponse } from "next/server"
import { getSupabaseServiceClient } from "@/lib/supabase-service-client"
import { requireSessionFromRequest } from "@/lib/auth"

type EmployeeProfile = {
  employee_id?: string | null
  employeeId?: string | null
  employee_name?: string | null
  name?: string | null
  full_name?: string | null
  department?: string | null
  department_name?: string | null
  email?: string | null
  office_location?: string | null
  location?: string | null
  country?: string | null
  company?: string | null
  hiring_company?: string | null
}

const fallbackProfileMessage =
  "Unable to auto-fill your employee details right now. Please complete the fields manually."

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request)
    if (session.error || !session.user) {
      return NextResponse.json({ error: session.error || "Unauthorized." }, { status: 401 })
    }

    const body = (await request.json().catch(() => null)) as { email?: string } | null
    const email = body?.email?.trim()

    if (!email) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 })
    }

    if (session.user.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: "You can only load your own profile." }, { status: 403 })
    }

    const supabase = getSupabaseServiceClient()

    const profileTable = process.env.SUPABASE_EMPLOYEE_PROFILE_TABLE || "employee_email"

    const { data, error } = await supabase
      .from(profileTable)
      .select("*")
      .ilike("email", email.toLowerCase())
      .limit(1)
      .maybeSingle<EmployeeProfile>()

    if (error) {
      console.error("Employee profile lookup failed:", error)
      return NextResponse.json({ error: fallbackProfileMessage }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "No employee profile found for that email." }, { status: 404 })
    }

    const normalized = {
      fullName: data.employee_name || data.name || data.full_name || data.fullName || null,
      employeeId: data.employee_id || data.employeeId || null,
      department: data.department || data.department_name || data.departmentName || null,
      email: data.email || email,
      location: data.office_location || data.location || data.country || null,
      company: data.company || data.hiring_company || data.company_name || null,
    }

    return NextResponse.json({ data: normalized })
  } catch (error) {
    console.error("Employee profile API failed:", error)
    return NextResponse.json({ error: fallbackProfileMessage }, { status: 500 })
  }
}
