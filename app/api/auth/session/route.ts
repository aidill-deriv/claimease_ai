import { NextResponse } from "next/server"
import { createSessionToken, requireSessionFromRequest } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const result = await requireSessionFromRequest(request)

    if (result.error || !result.user) {
      return NextResponse.json({ error: result.error || "Unauthorized" }, { status: 401 })
    }

    const { user, payload } = result
    const { token } = createSessionToken({
      email: user.email,
      role: user.role,
      syntheticUser: payload.syntheticUser,
    })

    return NextResponse.json({
      sessionToken: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        status: user.status,
        lastLoginAt: user.last_login_at,
      },
    })
  } catch (error) {
    console.error("Session validation failed:", error)
    return NextResponse.json({ error: "Unable to validate session." }, { status: 500 })
  }
}
