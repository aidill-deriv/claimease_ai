"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash2, Users, UserPlus, ShieldAlert } from "lucide-react"
import { useSession } from "@/hooks/useSession"
import { getAuthHeaders } from "@/lib/session"

type AllowedUserListItem = {
  id: string
  email: string
  fullName?: string | null
  role: "viewer" | "admin" | "superadmin"
  status: "active" | "suspended"
  lastLoginAt?: string | null
  createdAt?: string | null
}

const roleBadges: Record<AllowedUserListItem["role"], { label: string; variant: "default" | "secondary" | "outline" }> = {
  viewer: { label: "Viewer", variant: "secondary" },
  admin: { label: "Admin", variant: "default" },
  superadmin: { label: "Super Admin", variant: "outline" },
}

export default function AdminConsole() {
  const router = useRouter()
  const { state, user } = useSession({
    minimumRole: "admin",
    redirectIfUnauthorized: () => router.push("/no-access"),
  })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [users, setUsers] = useState<AllowedUserListItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    role: "viewer",
  })

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage("")
      const response = await fetch("/api/admin/allowed-users", {
        headers: getAuthHeaders(),
      })
      const payload = (await response.json().catch(() => null)) as { users?: AllowedUserListItem[]; error?: string } | null

      if (!response.ok || !payload?.users) {
        throw new Error(payload?.error || "Unable to load users.")
      }

      setUsers(payload.users)
    } catch (error) {
      console.error("Failed to load allowed users:", error)
      setErrorMessage(error instanceof Error ? error.message : "Unable to load users.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (state.status === "authenticated") {
      void fetchUsers()
    }
  }, [state.status, fetchUsers])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.email) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const response = await fetch("/api/admin/allowed-users", {
        method: "POST",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role,
        }),
      })

      const payload = (await response.json().catch(() => null)) as { user?: AllowedUserListItem; error?: string } | null

      if (!response.ok || !payload?.user) {
        throw new Error(payload?.error || "Unable to create user.")
      }

    setFormData({ email: "", fullName: "", role: "viewer" })
      await fetchUsers()
    } catch (error) {
      console.error("Failed to create allowed user:", error)
      setErrorMessage(error instanceof Error ? error.message : "Unable to create user.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (member: AllowedUserListItem) => {
    if (!window.confirm("Remove this user from ClaimEase? This action cannot be undone.")) {
      return
    }
    setErrorMessage("")
    try {
      const response = await fetch(
        `/api/admin/allowed-users/${member.id}?email=${encodeURIComponent(member.email)}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      )
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to delete user.")
      }
      setUsers((prev) => prev.filter((user) => user.id !== member.id))
      await fetchUsers()
    } catch (error) {
      console.error("Failed to delete allowed user:", error)
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete user.")
    }
  }

  const totalMembers = users.length
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users
    }
    const query = searchTerm.trim().toLowerCase()
    return users.filter((member) => {
      const name = member.fullName?.toLowerCase() ?? ""
      const email = member.email.toLowerCase()
      return name.includes(query) || email.includes(query)
    })
  }, [searchTerm, users])

  if (state.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-coral-50 dark:from-slate-1100 dark:via-slate-1000 dark:to-slate-900">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-coral shadow-lg">
            <div className="w-10 h-10 border-4 border-white/70 border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">Checking your permissions…</p>
          </div>
        </div>
      </div>
    )
  }

  if (state.status === "unauthorized") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-coral-50 dark:from-slate-1100 dark:via-slate-1000 dark:to-slate-900 lg:pl-72">
      <Navigation />
      <div className="container mx-auto px-4 py-12 max-w-5xl space-y-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-coral-600 uppercase tracking-wide flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Admin Console
          </p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage ClaimEase Access</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Invite new team members, assign roles, and keep your workspace secure.
          </p>
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-coral-100 dark:border-coral-900 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="h-5 w-5 text-coral-600" />
                Add Allowed User
              </CardTitle>
              <CardDescription>Viewer accounts can be created by admins. Only superadmins can create admin roles.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email*</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="teammate@company.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="Optional"
                    value={formData.fullName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role*</Label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="admin" disabled={user?.role !== "superadmin"}>
                      Admin
                    </option>
                    <option value="superadmin" disabled={user?.role !== "superadmin"}>
                      Super Admin
                    </option>
                  </select>
                </div>
                {errorMessage && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Adding…" : "Add User"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-lg lg:col-span-2">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  Current Members
                </CardTitle>
                <Badge variant="outline" className="border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200">
                  Total Members: {totalMembers}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["viewer", "admin", "superadmin"] as const).map((role) => {
                  const count = users.filter((member) => member.role === role).length
                  return (
                    <div
                      key={role}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-1000 px-3 py-2 text-center shadow-sm"
                    >
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{role}</p>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-white">{count}</p>
                    </div>
                  )
                })}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Search or filter members
                </p>
                <div className="w-full sm:max-w-xs">
                  <Label htmlFor="member-search" className="sr-only">
                    Search members
                  </Label>
                  <Input
                    id="member-search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by name or email"
                    className="bg-white dark:bg-slate-1000"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading members…</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {searchTerm ? `No members match "${searchTerm}".` : "No members found."}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-1000 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-2">Member</th>
                        <th className="px-4 py-2">Role</th>
                        <th className="px-4 py-2">Last Active</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-1100">
                      {filteredUsers.map((member) => {
                      const badge = roleBadges[member.role]
                      const canDelete =
                        member.id !== user?.id &&
                        (member.role === "viewer" ||
                          (member.role === "admin" && user?.role === "superadmin") ||
                          (member.role === "superadmin" && user?.role === "superadmin"))
                        return (
                          <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-1000/50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900 dark:text-white">{member.fullName || "No name"}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={badge.variant}>{badge.label}</Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                              {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString() : "Never"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(member)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
