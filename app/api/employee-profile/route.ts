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
  company_name?: string | null
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
    const mappingTable = process.env.SUPABASE_CLAIM_MAPPING_TABLE || "claim_mapping_template"

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

    const country = data.country || data.location || data.office_location || null
    let mappedCurrency: string | null = null

    if (country) {
      const { data: mapping, error: mappingError } = await supabase
        .from(mappingTable)
        .select("reimbursement_currency_a, country_a")
        .ilike("country_a", String(country))
        .limit(1)
        .maybeSingle<{ reimbursement_currency_a: string | null }>()

      if (mappingError) {
        console.error("Claim mapping lookup failed:", mappingError)
      } else if (mapping?.reimbursement_currency_a) {
        mappedCurrency = mapping.reimbursement_currency_a
      }
    }

    const normalized = {
      fullName: data.employee_name || data.name || data.full_name || null,
      employeeId: data.employee_id || data.employeeId || null,
      department: data.department || data.department_name || null,
      email: data.email || email,
      location: data.office_location || data.location || data.country || null,
      company: data.company || data.company_name || data.hiring_company || null,
      hiringCompany: data.hiring_company || data.company || data.company_name || null,
      country: country || null,
      localCurrency: mappedCurrency,
    }

    return NextResponse.json({ data: normalized })
  } catch (error) {
    console.error("Employee profile API failed:", error)
    return NextResponse.json({ error: fallbackProfileMessage }, { status: 500 })
  }
}
