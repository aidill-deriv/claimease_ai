const BACKEND_API_URL = (
  process.env.CLAIMBOT_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8001"
).replace(/\/$/, "")

const proxiedApiRoutes = [
  { source: "/api/query", destination: `${BACKEND_API_URL}/query` },
  { source: "/api/feedback", destination: `${BACKEND_API_URL}/feedback` },
  { source: "/api/submit-claim", destination: `${BACKEND_API_URL}/submit-claim` },
  { source: "/api/balance/:path*", destination: `${BACKEND_API_URL}/balance/:path*` },
  { source: "/api/dashboard/:path*", destination: `${BACKEND_API_URL}/dashboard/:path*` },
  { source: "/api/claims/:path*", destination: `${BACKEND_API_URL}/claims/:path*` },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return proxiedApiRoutes
  },
}

module.exports = nextConfig
