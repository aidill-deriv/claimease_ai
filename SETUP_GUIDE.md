# 🚀 ClaimEase React App - Complete Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running the Application](#running-the-application)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **npm** 9.0 or higher (comes with Node.js)
- **Git** (optional, for version control)

### Check Your Installation
```bash
node --version  # Should show v18.0.0 or higher
npm --version   # Should show 9.0.0 or higher
```

---

## Installation

### Step 1: Navigate to Project Directory
```bash
cd react_app
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Recharts (for charts)
- Axios (for API calls)
- And all other dependencies

**Installation time:** ~2-3 minutes depending on your internet speed

---

## Configuration

### Environment Variables

Create a `.env.local` file in the `react_app` directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: Analytics, etc.
# NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

### API Proxy Configuration

The app is already configured to proxy API requests to your FastAPI backend. Check `next.config.js`:

```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/:path*',
    },
  ]
}
```

---

## Running the Application

### Development Mode

1. **Start the Backend API** (in a separate terminal):
```bash
cd ..  # Go to project root
python src/api.py
```

The API should start on `http://localhost:8000`

2. **Start the React App**:
```bash
cd react_app
npm run dev
```

The app will start on `http://localhost:3000`

3. **Open in Browser**:
```
http://localhost:3000
```

### Production Mode

1. **Build the application**:
```bash
npm run build
```

2. **Start the production server**:
```bash
npm start
```

---

## Testing

### Manual Testing Checklist

#### 1. Login Page
- [ ] Can enter email
- [ ] Redirects to dashboard after login
- [ ] Shows error for invalid input

#### 2. Dashboard
- [ ] Shows balance cards
- [ ] Displays charts correctly
- [ ] Recent claims list appears
- [ ] Quick action cards work
- [ ] Navigation works

#### 3. Chat Page
- [ ] Can send messages
- [ ] Receives AI responses
- [ ] Quick questions work
- [ ] Auto-scrolls to new messages
- [ ] Shows loading state

#### 4. Submit Claim Page
- [ ] Form validation works
- [ ] Can select category
- [ ] Can upload file
- [ ] Shows success message
- [ ] Form resets after submission

#### 5. General
- [ ] Dark mode toggle works
- [ ] Navigation between pages works
- [ ] Logout works
- [ ] Responsive on mobile
- [ ] No console errors

### Test Users

Use these emails for testing:
```
john.doe@company.com
jane.smith@company.com
alice.wong@company.com
bob.chen@company.com
```

---

## Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Deploy**:
```bash
vercel
```

3. **Follow the prompts** to configure your deployment

4. **Set environment variables** in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` = your production API URL

### Option 2: Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t claimease-react .
docker run -p 3000:3000 claimease-react
```

### Option 3: Traditional Hosting

1. Build the app:
```bash
npm run build
```

2. The output will be in `.next` folder

3. Upload to your hosting provider

4. Ensure Node.js is available on the server

5. Run:
```bash
npm start
```

---

## Troubleshooting

### Common Issues

#### 1. Port 3000 Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

#### 2. Module Not Found Errors

**Error:** `Cannot find module 'xyz'`

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### 3. API Connection Failed

**Error:** `Failed to fetch` or CORS errors

**Solution:**
- Ensure FastAPI backend is running on port 8000
- Check `next.config.js` proxy settings
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

#### 4. Build Errors

**Error:** Build fails with TypeScript errors

**Solution:**
```bash
# Check TypeScript errors
npm run build

# Fix any type errors shown
# Then rebuild
```

#### 5. Styling Issues

**Error:** Styles not loading or looking wrong

**Solution:**
```bash
# Rebuild Tailwind
npm run dev

# Clear browser cache
# Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
```

### Performance Issues

If the app is slow:

1. **Check Network Tab** in browser DevTools
2. **Optimize images** if using any
3. **Enable production mode**:
```bash
npm run build
npm start
```

### Getting Help

1. Check the [README.md](./README.md)
2. Review [QUICKSTART.md](./QUICKSTART.md)
3. Check browser console for errors
4. Verify both frontend and backend are running

---

## Development Tips

### Hot Reload

The app supports hot reload. Changes to files will automatically refresh the browser.

### Code Organization

```
app/              # Pages (Next.js App Router)
components/       # Reusable components
  ui/            # shadcn/ui components
lib/             # Utilities and API client
public/          # Static assets
```

### Adding New Pages

1. Create a new folder in `app/`:
```bash
mkdir app/my-page
```

2. Create `page.tsx`:
```typescript
export default function MyPage() {
  return <div>My Page</div>
}
```

3. Access at `/my-page`

### Adding New Components

1. Create in `components/`:
```bash
touch components/my-component.tsx
```

2. Use in pages:
```typescript
import { MyComponent } from "@/components/my-component"
```

---

## Production Checklist

Before deploying to production:

- [ ] Test all features thoroughly
- [ ] Check mobile responsiveness
- [ ] Verify API endpoints are correct
- [ ] Set up environment variables
- [ ] Enable error tracking (e.g., Sentry)
- [ ] Set up analytics (e.g., Google Analytics)
- [ ] Configure CORS on backend
- [ ] Set up SSL/HTTPS
- [ ] Test with real data
- [ ] Create backup plan

---

## Next Steps

1. ✅ Complete setup
2. ✅ Test all features
3. ✅ Customize branding/colors
4. ✅ Connect to real API
5. ✅ Deploy to production

---

**Need help?** Check the documentation or contact the development team.

**Happy coding! 🎉**
