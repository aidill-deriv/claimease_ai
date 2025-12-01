import { NextResponse } from "next/server"
import { createSessionToken, findAllowedUserByEmail, requireSessionFromRequest } from "@/lib/auth"
import { getSupabaseServiceClient } from "@/lib/supabase-service-client"

type ImpersonateRequest = {
  email?: string
}

type EmployeeDirectoryRow = {
  id?: string | null
  employee_id?: string | null
  email?: string | null
}

type SummaryRow = {
  employee_name?: string | null
}

const employeeTable =
  process.env.NEXT_PUBLIC_SUPABASE_EMPLOYEE_TABLE ||
  process.env.SUPABASE_EMPLOYEE_PROFILE_TABLE ||
  "employee_email"

const summaryTable =
  process.env.NEXT_PUBLIC_SUPABASE_SUMMARY_TABLE ||
  process.env.NEXT_PUBLIC_SUPABASE_BALANCE_TABLE ||
  "claim_summary"

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request, { minimumRole: "superadmin" })

    if (session.error || !session.user) {
      return NextResponse.json({ error: session.error || "Unauthorized" }, { status: 403 })
    }

    const body = (await request.json().catch(() => null)) as ImpersonateRequest | null
    const email = body?.email?.trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }

    const targetUser = await findAllowedUserByEmail(email)

    if (targetUser) {
      if (targetUser.status !== "active") {
        return NextResponse.json({ error: "User is not active." }, { status: 403 })
      }

      const { token } = createSessionToken({ email: targetUser.email, role: targetUser.role })

      return NextResponse.json({
        sessionToken: token,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          fullName: targetUser.full_name,
          role: targetUser.role,
          status: targetUser.status,
          lastLoginAt: targetUser.last_login_at,
        },
        impersonatedBy: {
          id: session.user.id,
          email: session.user.email,
        },
      })
    }

    const supabase = getSupabaseServiceClient()
    const { data: employeeRow, error: employeeLookupError } = await supabase
      .from(employeeTable)
      .select("id, employee_id, email")
      .ilike("email", email)
      .maybeSingle<EmployeeDirectoryRow>()

    if (employeeLookupError) {
      console.error("Employee directory lookup failed:", employeeLookupError)
      return NextResponse.json({ error: "Unable to query employee directory." }, { status: 500 })
    }

    if (!employeeRow) {
      return NextResponse.json(
        { error: "That email is not listed in the employee directory." },
        { status: 404 },
      )
    }

    let employeeFullName: string | null = null
    const { data: summaryRow, error: summaryError } = await supabase
      .from(summaryTable)
      .select("employee_name")
      .ilike("email", email)
      .limit(1)
      .maybeSingle<SummaryRow>()

    if (summaryError) {
      console.warn("Claim summary lookup failed (non-blocking):", summaryError.message)
    } else if (summaryRow?.employee_name) {
      employeeFullName = summaryRow.employee_name
    }

    const syntheticId =
      employeeRow.employee_id ||
      employeeRow.id ||
      `synthetic-${Buffer.from(email).toString("base64url")}`

    const { token } = createSessionToken({
      email,
      role: "viewer",
      syntheticUser: {
        id: syntheticId,
        fullName: employeeFullName,
        source: "employee_email",
        actorId: session.user.id,
        actorEmail: session.user.email,
      },
    })

    return NextResponse.json({
      sessionToken: token,
      user: {
        id: syntheticId,
        email,
        fullName: employeeFullName,
        role: "viewer",
        status: "active",
      },
      impersonatedBy: {
        id: session.user.id,
        email: session.user.email,
      },
      source: "employee_directory",
    })
  } catch (error) {
    console.error("Failed to impersonate user:", error)
    return NextResponse.json({ error: "Unable to impersonate user." }, { status: 500 })
  }
}
