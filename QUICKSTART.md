# 🚀 ClaimEase React App - Quick Start Guide

Get your React app up and running in minutes!

## ⚡ Prerequisites

You need Node.js and npm installed. Check if you have them:

```bash
node --version  # Should be 18 or higher
npm --version
```

If not installed, download from [nodejs.org](https://nodejs.org/)

## 📦 Step 1: Install Dependencies

Navigate to the react_app directory and install packages:

```bash
cd react_app
npm install
```

This will install all required dependencies including:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- And more...

## 🎨 Step 2: Start Development Server

```bash
npm run dev
```

The app will start at: **http://localhost:3000**

You should see:
```
✓ Ready in 2.5s
○ Local:        http://localhost:3000
```

## 🔌 Step 3: Start Backend API

In a **separate terminal**, start the FastAPI backend:

```bash
cd ..  # Go back to project root
python3 src/api.py
```

The API will start at: **http://localhost:8000**

## ✅ Step 4: Test the App

1. Open **http://localhost:3000** in your browser
2. Enter any email (e.g., `john.doe@company.com`)
3. Click "Sign In"
4. You'll be redirected to the dashboard!

## 📱 Available Pages

Once logged in, you can access:

- **Dashboard** (`/dashboard`) - View balance, charts, and claim history
- **Chat** (`/chat`) - AI assistant for questions
- **Submit Claim** (`/submit-claim`) - Submit new claims

## 🎯 Quick Test Emails

Use these test emails to see different data:

```
john.doe@company.com
jane.smith@company.com
alice.wong@company.com
bob.chen@company.com
```

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 🌓 Dark Mode

Click the theme toggle button in the navigation bar to switch between light and dark modes!

## 🔧 Troubleshooting

### Port 3000 already in use?

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

### Backend not connecting?

Make sure:
1. FastAPI is running on port 8000
2. Check `next.config.js` has correct API proxy settings
3. No CORS errors in browser console

### Dependencies not installing?

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Project Structure

```
react_app/
├── app/                    # Next.js pages
│   ├── page.tsx           # Home/Login page
│   ├── dashboard/         # Dashboard page
│   ├── chat/              # Chat page
│   └── submit-claim/      # Submit claim page
├── components/
│   ├── ui/                # shadcn/ui components
│   └── ...                # Custom components
├── lib/
│   ├── api.ts             # API client
│   └── utils.ts           # Utilities
└── public/                # Static files
```

## 🎨 Customization

### Change Colors

Edit `app/globals.css`:

```css
:root {
  --primary: 221.2 83.2% 53.3%;  /* Change this */
}
```

### Add New Pages

Create a new folder in `app/`:

```bash
mkdir app/my-page
touch app/my-page/page.tsx
```

## 🚀 Production Build

```bash
# Build the app
npm run build

# Test production build locally
npm start
```

## 📝 Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🎉 You're All Set!

Your ClaimEase React app is now running! 

### Next Steps:

1. ✅ Explore the dashboard
2. ✅ Try the AI chat assistant
3. ✅ Submit a test claim
4. ✅ Toggle dark mode
5. ✅ Check responsive design on mobile

## 🆘 Need Help?

- Check the main [README.md](./README.md)
- Review the [API documentation](../docs/)
- Check browser console for errors
- Ensure both frontend and backend are running

---

**Happy coding! 🎨✨**
