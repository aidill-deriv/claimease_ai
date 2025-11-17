# ClaimEase Frontend - Deployment Guide

This guide covers deploying the ClaimEase React frontend to various platforms.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Deployment Options](#deployment-options)
  - [Vercel (Recommended)](#vercel-recommended)
  - [Netlify](#netlify)
  - [Docker](#docker)
  - [Traditional Server](#traditional-server)
- [Post-Deployment](#post-deployment)

---

## Prerequisites

Before deploying, ensure you have:

1. ✅ A working backend API (deployed separately)
2. ✅ Node.js 18+ installed locally for testing
3. ✅ Git repository for the frontend code
4. ✅ Account on your chosen deployment platform

---

## Environment Variables

### Required Variables

Create a `.env.local` file (or configure in your deployment platform):

```bash
# API Backend URL (REQUIRED)
NEXT_PUBLIC_API_URL=https://your-backend-api.com

# Application Info
NEXT_PUBLIC_APP_NAME=ClaimEase
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Important Notes

- ⚠️ All variables starting with `NEXT_PUBLIC_` are exposed to the browser
- 🔒 Never put sensitive secrets in `NEXT_PUBLIC_` variables
- 🌐 Update `NEXT_PUBLIC_API_URL` to point to your production backend

---

## Deployment Options

### Vercel (Recommended)

Vercel is the easiest option for Next.js apps and offers excellent performance.

#### Steps:

1. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

2. **Deploy via GitHub** (Recommended):
   - Push your code to GitHub
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables:
     - `NEXT_PUBLIC_API_URL` = your backend URL
   - Click "Deploy"

3. **Deploy via CLI**:
   ```bash
   cd react_app
   vercel
   ```

4. **Configure Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add `NEXT_PUBLIC_API_URL`
   - Redeploy

#### Custom Domain:
- Go to Project Settings → Domains
- Add your custom domain
- Update DNS records as instructed

---

### Netlify

Another excellent option with similar features to Vercel.

#### Steps:

1. **Deploy via GitHub**:
   - Push code to GitHub
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Select your repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`
   - Add environment variables
   - Click "Deploy"

2. **Deploy via CLI**:
   ```bash
   npm install -g netlify-cli
   cd react_app
   netlify deploy --prod
   ```

3. **Configure Environment Variables**:
   - Go to Site Settings → Environment Variables
   - Add `NEXT_PUBLIC_API_URL`

---

### Docker

For containerized deployments.

#### Create `Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Enable standalone output
}

module.exports = nextConfig
```

#### Build and Run:

```bash
# Build image
docker build -t claimease-frontend .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://your-api.com \
  claimease-frontend
```

---

### Traditional Server (VPS/EC2)

For deployment on your own server.

#### Steps:

1. **Install Node.js 18+**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone and Build**:
   ```bash
   git clone https://github.com/your-username/claimease-frontend.git
   cd claimease-frontend
   npm install
   npm run build
   ```

3. **Create `.env.local`**:
   ```bash
   echo "NEXT_PUBLIC_API_URL=https://your-api.com" > .env.local
   ```

4. **Run with PM2** (Process Manager):
   ```bash
   npm install -g pm2
   pm2 start npm --name "claimease-frontend" -- start
   pm2 save
   pm2 startup
   ```

5. **Setup Nginx Reverse Proxy**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Enable HTTPS with Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## Post-Deployment

### 1. Verify Deployment

- ✅ Visit your deployed URL
- ✅ Test login functionality
- ✅ Test chat feature
- ✅ Check browser console for errors
- ✅ Verify API connection

### 2. Configure CORS on Backend

Update your backend's CORS settings to allow your frontend domain:

```python
# In src/api.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-frontend-domain.com",  # Add this
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Monitor Performance

- Set up error tracking (Sentry)
- Monitor API response times
- Check Core Web Vitals
- Set up uptime monitoring

### 4. Security Checklist

- ✅ HTTPS enabled
- ✅ Environment variables secured
- ✅ CORS properly configured
- ✅ API authentication working
- ✅ No sensitive data in client code

---

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### API Connection Issues

1. Check `NEXT_PUBLIC_API_URL` is correct
2. Verify CORS settings on backend
3. Check browser console for errors
4. Test API endpoint directly

### Environment Variables Not Working

- Ensure variables start with `NEXT_PUBLIC_`
- Rebuild after changing environment variables
- Check deployment platform's environment variable settings

---

## Performance Optimization

### 1. Enable Image Optimization

Already configured in `next.config.js`

### 2. Add CDN (Optional)

- Vercel/Netlify include CDN by default
- For custom deployments, consider Cloudflare

### 3. Enable Caching

```javascript
// next.config.js
const nextConfig = {
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
}
```

---

## Support

For deployment issues:
1. Check the [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
2. Review platform-specific guides (Vercel, Netlify, etc.)
3. Check backend API logs
4. Review browser console errors

---

**Last Updated:** November 2025
