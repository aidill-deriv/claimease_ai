import { NextResponse } from "next/server"
import { requireSessionFromRequest } from "@/lib/auth"

type FxRatesResponse = {
  base: string
  rates: Record<string, number>
  fetchedAt: string
  provider: string
  source: "live" | "cache" | "fallback"
}

const fallbackRates: Record<string, Record<string, number>> = {
  USD: { MYR: 4.7, SGD: 1.35, AED: 3.67, EUR: 0.92, GBP: 0.79 },
  MYR: { USD: 0.21, SGD: 0.29, AED: 0.78, EUR: 0.20, GBP: 0.17 },
  SGD: { USD: 0.74, MYR: 3.47, AED: 2.73, EUR: 0.68, GBP: 0.58 },
  AED: { USD: 0.27, MYR: 1.28, SGD: 0.37, EUR: 0.25, GBP: 0.21 },
  EUR: { USD: 1.09, MYR: 5.10, SGD: 1.47, AED: 4.02, GBP: 0.86 },
  GBP: { USD: 1.27, MYR: 5.90, SGD: 1.70, AED: 4.70, EUR: 1.16 },
}

type CacheEntry = {
  response: FxRatesResponse
  fetchedAtMs: number
}

const cache = new Map<string, CacheEntry>()
const TTL_MS = 1000 * 60 * 60 * 12 // 12 hours

const buildFallback = (base: string): FxRatesResponse | null => {
  const rates = fallbackRates[base.toUpperCase()]
  if (!rates) return null
  return {
    base: base.toUpperCase(),
    rates,
    fetchedAt: new Date().toISOString(),
    provider: "static-fallback",
    source: "fallback",
  }
}

const fetchLiveRates = async (base: string): Promise<FxRatesResponse | null> => {
  const baseCurrency = base.toUpperCase()
  const provider = process.env.FX_RATES_PROVIDER || "open-er-api"
  const endpoint =
    process.env.FX_RATES_URL || `https://open.er-api.com/v6/latest/${encodeURIComponent(baseCurrency)}`

  try {
    const response = await fetch(endpoint, { cache: "no-store" })
    if (!response.ok) {
      throw new Error(`FX fetch failed: ${response.status}`)
    }

    const payload = (await response.json()) as { rates?: Record<string, number>; base_code?: string; time_last_update_utc?: string }
    if (!payload?.rates) {
      throw new Error("FX response missing rates")
    }

    return {
      base: payload.base_code || baseCurrency,
      rates: payload.rates,
      fetchedAt: payload.time_last_update_utc || new Date().toISOString(),
      provider,
      source: "live",
    }
  } catch (error) {
    console.error("FX rate fetch failed", error)
    return null
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request)
    if (session.error || !session.user) {
      return NextResponse.json({ error: session.error || "Unauthorized." }, { status: 401 })
    }

    const body = (await request.json().catch(() => null)) as { base?: string; force?: boolean } | null
    const base = body?.base?.trim().toUpperCase()
    const force = Boolean(body?.force)

    if (!base) {
      return NextResponse.json({ error: "Base currency is required." }, { status: 400 })
    }

    const now = Date.now()
    const cached = cache.get(base)
    if (cached && !force && now - cached.fetchedAtMs < TTL_MS) {
      return NextResponse.json(cached.response)
    }

    const live = await fetchLiveRates(base)
    const responsePayload: FxRatesResponse | null = live || buildFallback(base)

    if (!responsePayload) {
      return NextResponse.json({ error: "Unable to retrieve FX rates." }, { status: 502 })
    }

    cache.set(base, {
      response: responsePayload,
      fetchedAtMs: Date.now(),
    })

    return NextResponse.json(responsePayload)
  } catch (error) {
    console.error("FX rates API error", error)
    return NextResponse.json({ error: "Failed to retrieve FX rates." }, { status: 500 })
  }
}
