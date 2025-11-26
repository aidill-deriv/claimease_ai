import { NextResponse } from "next/server"
import {
  deleteAllowedUser,
  deleteAllowedUserByEmail,
  findAllowedUserByEmail,
  findAllowedUserById,
  requireSessionFromRequest,
} from "@/lib/auth"

type RouteParams = {
  params: {
    id: string
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSessionFromRequest(request, { minimumRole: "admin" })

    if (session.error || !session.user) {
      return NextResponse.json({ error: session.error || "Unauthorized" }, { status: 403 })
    }

    const url = new URL(request.url)
    const emailParam = url.searchParams.get("email") || undefined
    const rawIdentifier = params.id
    const isEmailIdentifier = false

    if (!rawIdentifier && !emailParam) {
      return NextResponse.json({ error: "User id is required." }, { status: 400 })
    }

    if (rawIdentifier && session.user.id === rawIdentifier) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 })
    }

    let targetUser = rawIdentifier ? await findAllowedUserById(rawIdentifier) : null
    if (!targetUser && emailParam) {
      targetUser = await findAllowedUserByEmail(emailParam)
    }

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 })
    }

    if (targetUser.role === "superadmin" && session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Only superadmins can remove another superadmin." }, { status: 403 })
    }
    if (targetUser.role === "admin" && session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Only superadmins can delete admin accounts." }, { status: 403 })
    }

    await deleteAllowedUser(targetUser.id)
    if (emailParam) {
      await deleteAllowedUserByEmail(emailParam)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete allowed user:", error)
    return NextResponse.json({ error: "Unable to delete user." }, { status: 500 })
  }
}
