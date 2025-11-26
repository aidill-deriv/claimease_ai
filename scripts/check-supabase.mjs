import { readFileSync, existsSync } from "fs"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"

const ENV_FILE = resolve(process.cwd(), ".env.local")

const parseEnvFile = (filePath) => {
  if (!existsSync(filePath)) {
    return {}
  }

  const content = readFileSync(filePath, "utf8")
  return content.split(/\r?\n/).reduce((acc, line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) {
      return acc
    }
    const delimiterIndex = trimmed.indexOf("=")
    if (delimiterIndex === -1) {
      return acc
    }
    const key = trimmed.slice(0, delimiterIndex).trim()
    const value = trimmed.slice(delimiterIndex + 1).trim()
    if (key) {
      acc[key] = value
    }
    return acc
  }, {})
}

const envFileValues = parseEnvFile(ENV_FILE)
const env = (key) => process.env[key] || envFileValues[key]

const SUPABASE_URL = env("NEXT_PUBLIC_SUPABASE_URL")
const SUPABASE_ANON_KEY = env("NEXT_PUBLIC_SUPABASE_ANON_KEY")
const SUPABASE_SERVICE_ROLE_KEY = env("SUPABASE_SERVICE_ROLE_KEY")
const SUMMARY_TABLE = env("NEXT_PUBLIC_SUPABASE_SUMMARY_TABLE") || "claim_summary"
const ANALYSIS_TABLE = env("NEXT_PUBLIC_SUPABASE_ANALYSIS_TABLE") || "claim_analysis"

const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
  )
  process.exit(1)
}

const targetEmail = process.argv[2]
if (!targetEmail) {
  console.warn("No email parameter detected. Usage: node scripts/check-supabase.mjs user@example.com")
  console.warn("The script will continue in aggregate mode (limits 5 rows).")
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
console.log(`Using ${SUPABASE_SERVICE_ROLE_KEY ? "service role" : "anon"} key for verification.`)

const summarizeResult = (label, { data, error }) => {
  if (error) {
    return `${label}: ERROR → ${error.message}`
  }
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return `${label}: no rows`
  }
  if (!Array.isArray(data)) {
    return `${label}: 1 row`
  }
  return `${label}: ${data.length} row(s)`
}

const run = async () => {
  const summaryQuery = supabase
    .from(SUMMARY_TABLE)
    .select("employee_id,email,year,max_amount,total_transaction_amount,remaining_balance")
    .order("year", { ascending: false })
    .limit(5)

  const analysisQuery = supabase
    .from(ANALYSIS_TABLE)
    .select(
      "record_key,employee_id,email,claim_type,claim_description,transaction_amount,transaction_currency,date_submitted,date_paid,state",
    )
    .order("date_paid", { ascending: false, nullsFirst: false })
    .limit(5)

  const filteredSummary = targetEmail ? summaryQuery.eq("email", targetEmail).limit(1) : summaryQuery
  const filteredAnalysis = targetEmail ? analysisQuery.eq("email", targetEmail).limit(5) : analysisQuery

  const [summaryResult, analysisResult] = await Promise.all([filteredSummary, filteredAnalysis])

  console.log("Supabase verification results")
  console.log("=====================================")
  console.log(`Summary table (${SUMMARY_TABLE}) → ${summarizeResult("claim_summary", summaryResult)}`)
  console.log(`Analysis table (${ANALYSIS_TABLE}) → ${summarizeResult("claim_analysis", analysisResult)}`)

  if (summaryResult.data && summaryResult.data.length > 0) {
    console.log("\nSample claim_summary rows:")
    console.table(summaryResult.data)
  }

  if (analysisResult.data && analysisResult.data.length > 0) {
    console.log("\nSample claim_analysis rows:")
    console.table(analysisResult.data)
  }
}

run().catch((error) => {
  console.error("Supabase verification script failed:", error)
  process.exit(1)
})
