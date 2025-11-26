import { NextResponse } from "next/server"
import {
  AllowedUserRole,
  AllowedUserStatus,
  insertAllowedUser,
  listAllowedUsers,
  requireSessionFromRequest,
  isRoleAtLeast,
} from "@/lib/auth"

type CreateAllowedUserRequest = {
  email?: string
  fullName?: string
  role?: AllowedUserRole
  status?: AllowedUserStatus
}

const sanitizeRole = (role?: AllowedUserRole): AllowedUserRole => {
  if (!role) {
    return "viewer"
  }
  if (role === "admin" || role === "superadmin" || role === "viewer") {
    return role
  }
  return "viewer"
}

const sanitizeStatus = (status?: AllowedUserStatus): AllowedUserStatus => {
  if (status === "suspended") {
    return "suspended"
  }
  return "active"
}

export async function GET(request: Request) {
  try {
    const session = await requireSessionFromRequest(request, { minimumRole: "admin" })

    if (session.error) {
      return NextResponse.json({ error: session.error }, { status: 403 })
    }

    const users = await listAllowedUsers()
    const shaped = users.map((member) => ({
      id: member.id,
      email: member.email,
      fullName: member.full_name,
      role: member.role,
      status: member.status,
      lastLoginAt: member.last_login_at,
      createdAt: member.created_at,
    }))

    return NextResponse.json({ users: shaped })
  } catch (error) {
    console.error("Failed to list allowed users:", error)
    return NextResponse.json({ error: "Unable to load users." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request, { minimumRole: "admin" })

    if (session.error || !session.user) {
      return NextResponse.json({ error: session.error || "Unauthorized" }, { status: 403 })
    }

    const body = (await request.json().catch(() => null)) as CreateAllowedUserRequest | null

    const email = body?.email?.trim().toLowerCase()
    const fullName = body?.fullName?.trim()
    const role = sanitizeRole(body?.role)
    const status = sanitizeStatus(body?.status)

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }

    if (role !== "viewer" && session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Only superadmins can create admin accounts." }, { status: 403 })
    }

    const newUser = await insertAllowedUser({
      email,
      full_name: fullName ?? null,
      role,
      status,
      created_by: session.user.id,
    })

    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
        status: newUser.status,
      },
    })
  } catch (error: any) {
    console.error("Failed to create allowed user:", error)
    const message = error?.message?.includes("duplicate key")
      ? "A user with that email already exists."
      : "Unable to create user."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
