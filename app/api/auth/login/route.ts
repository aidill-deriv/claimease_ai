import { NextResponse } from "next/server"
import {
  createSessionToken,
  findAllowedUserByEmail,
  updateAllowedUser,
  getExpectedPasswordForRole,
} from "@/lib/auth"

type LoginRequest = {
  email?: string
  password?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as LoginRequest | null
    const email = body?.email?.trim().toLowerCase()
    const password = body?.password ?? ""

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }

    const user = await findAllowedUserByEmail(email)

    if (!user || user.status !== "active") {
      return NextResponse.json({ error: "You do not have access to ClaimEase." }, { status: 403 })
    }

    const expectedPassword = getExpectedPasswordForRole(user.role)
    if (!expectedPassword) {
      return NextResponse.json({ error: "Role is not configured with a password." }, { status: 403 })
    }
    if (!password || password.trim() !== expectedPassword) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
    }

    const { token } = createSessionToken({ email: user.email, role: user.role })

    await updateAllowedUser(user.id, { last_login_at: new Date().toISOString() })

    return NextResponse.json({
      sessionToken: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        status: user.status,
      },
    })
  } catch (error) {
    console.error("Auth login failed:", error)
    return NextResponse.json({ error: "Unable to authenticate right now." }, { status: 500 })
  }
}
