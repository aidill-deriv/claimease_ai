import crypto from "crypto"
import { getSupabaseServiceClient } from "./supabase-service-client"
import type { AllowedUserRole, AllowedUserStatus } from "@/types/auth"

const SESSION_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours
const SESSION_SECRET = process.env.CLAIMEASE_SESSION_SECRET || ""
const allowedUsersTable = process.env.SUPABASE_ALLOWED_USERS_TABLE || "claim_allowed_users"

export type AllowedUserRecord = {
  id: string
  email: string
  full_name: string | null
  role: AllowedUserRole
  status: AllowedUserStatus
  password_hash?: string | null
  last_login_at?: string | null
  created_at?: string
  updated_at?: string
}

export type SessionPayload = {
  email: string
  role: AllowedUserRole
  exp: number
}

const ROLE_RANK: Record<AllowedUserRole, number> = {
  viewer: 1,
  admin: 2,
  superadmin: 3,
}

const ROLE_PASSWORDS: Record<AllowedUserRole, string> = {
  superadmin: "superclaim1234",
  admin: "claim1234",
  viewer: "finance1234",
}

const assertSessionSecret = () => {
  if (!SESSION_SECRET) {
    throw new Error("CLAIMEASE_SESSION_SECRET is not set. Please configure it in your environment.")
  }
}

export const getExpectedPasswordForRole = (role: AllowedUserRole) => ROLE_PASSWORDS[role] || null

export const createSessionToken = (payload: Omit<SessionPayload, "exp"> & { ttlMs?: number }) => {
  assertSessionSecret()
  const ttl = payload.ttlMs ?? SESSION_TTL_MS
  const sessionPayload: SessionPayload = {
    email: payload.email,
    role: payload.role,
    exp: Date.now() + ttl,
  }
  const json = JSON.stringify(sessionPayload)
  const encoded = Buffer.from(json).toString("base64url")
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(encoded).digest()
  const token = `${encoded}.${Buffer.from(signature).toString("base64url")}`
  return { token, payload: sessionPayload }
}

export const verifySessionToken = (token: string): SessionPayload | null => {
  assertSessionSecret()
  const [encoded, signature] = token.split(".")
  if (!encoded || !signature) {
    return null
  }
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(encoded).digest()
  const provided = Buffer.from(signature, "base64url")
  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
    return null
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as SessionPayload
    if (!payload?.email || !payload?.role || typeof payload.exp !== "number") {
      return null
    }
    if (Date.now() > payload.exp) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

export const findAllowedUserByEmail = async (email: string) => {
  const supabase = getSupabaseServiceClient()
  const { data, error } = await supabase
    .from<AllowedUserRecord>(allowedUsersTable)
    .select("*")
    .ilike("email", email.toLowerCase())
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to query allowed users: ${error.message}`)
  }

  return data
}

export const findAllowedUserById = async (id: string) => {
  const supabase = getSupabaseServiceClient()
  const { data, error } = await supabase
    .from<AllowedUserRecord>(allowedUsersTable)
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to query allowed users: ${error.message}`)
  }

  return data
}

export const updateAllowedUser = async (id: string, updates: Partial<AllowedUserRecord>) => {
  const supabase = getSupabaseServiceClient()
  const { error } = await supabase.from(allowedUsersTable).update(updates).eq("id", id)
  if (error) {
    throw new Error(`Failed to update user: ${error.message}`)
  }
}

export const insertAllowedUser = async (payload: {
  email: string
  full_name?: string | null
  role: AllowedUserRole
  status?: AllowedUserStatus
  password_hash?: string | null
  created_by?: string | null
}) => {
  const supabase = getSupabaseServiceClient()
  const { data, error } = await supabase
    .from(allowedUsersTable)
    .insert({
      email: payload.email.toLowerCase(),
      full_name: payload.full_name ?? null,
      role: payload.role,
      status: payload.status ?? "active",
      password_hash: payload.password_hash ?? null,
      created_by: payload.created_by ?? null,
    })
    .select("*")
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to insert user: ${error.message}`)
  }

  return data as AllowedUserRecord
}

export const deleteAllowedUser = async (id: string) => {
  const supabase = getSupabaseServiceClient()
  const { error } = await supabase.from(allowedUsersTable).delete().eq("id", id)
  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`)
  }
}

export const deleteAllowedUserByEmail = async (email: string) => {
  const supabase = getSupabaseServiceClient()
  const { error } = await supabase.from(allowedUsersTable).delete().ilike("email", email.toLowerCase())
  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`)
  }
}

export const listAllowedUsers = async () => {
  const supabase = getSupabaseServiceClient()
  const { data, error } = await supabase
    .from<AllowedUserRecord>(allowedUsersTable)
    .select("id,email,full_name,role,status,last_login_at,created_at")
    .order("email", { ascending: true })

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`)
  }

  return data ?? []
}

export const isRoleAtLeast = (role: AllowedUserRole, required: AllowedUserRole) => {
  return ROLE_RANK[role] >= ROLE_RANK[required]
}

type RequireSessionSuccess = {
  user: AllowedUserRecord
  token: string
  payload: SessionPayload
  error?: undefined
}

type RequireSessionFailure = {
  error: string
  user?: undefined
  token?: undefined
  payload?: undefined
}

export const requireSessionFromRequest = async (
  request: Request,
  options: { minimumRole?: AllowedUserRole } = {},
): Promise<RequireSessionSuccess | RequireSessionFailure> => {
  const authHeader = request.headers.get("authorization") || ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null

  if (!token) {
    return { error: "Missing or invalid authorization header." }
  }

  const payload = verifySessionToken(token)
  if (!payload) {
    return { error: "Invalid or expired session token." }
  }

  const user = await findAllowedUserByEmail(payload.email)
  if (!user) {
    return { error: "User no longer exists." }
  }

  if (user.status !== "active") {
    return { error: "Account is suspended." }
  }

  if (options.minimumRole && !isRoleAtLeast(user.role, options.minimumRole)) {
    return { error: "Insufficient permissions." }
  }

  return { user, token, payload }
}
