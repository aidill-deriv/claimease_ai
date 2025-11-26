# Migration Guide: Moving React App to Separate Repository

This guide will help you move the React frontend to its own repository.

## 🎯 Overview

You're moving from:
```
claim-ai-agent/
├── react_app/          ← This folder
├── src/                (backend)
├── streamlit_app/      (alternative UI)
└── ...
```

To a standalone repository:
```
claimease-frontend/     ← New repo
├── app/
├── components/
├── lib/
└── ...
```

---

## 📋 Step-by-Step Migration

### Step 1: Create New Repository

1. **On GitHub/GitLab:**
   - Create new repository: `claimease-frontend`
   - Don't initialize with README (we'll copy ours)
   - Make it public or private as needed

2. **Clone the new repository:**
   ```bash
   cd ~/Documents/Work
   git clone https://github.com/your-username/claimease-frontend.git
   cd claimease-frontend
   ```

---

### Step 2: Copy Files

Copy the entire `react_app` folder contents to the new repository:

```bash
# From your current location
cd ~/Documents/Work/AI\ Agent/ClaimEase/project/codebase/claim-ai-agent

# Copy all files from react_app to the new repo
cp -r react_app/* ~/Documents/Work/claimease-frontend/

# Also copy hidden files
cp react_app/.gitignore ~/Documents/Work/claimease-frontend/
cp react_app/.env.example ~/Documents/Work/claimease-frontend/
```

---

### Step 3: Verify Files

Check that all essential files are present:

```bash
cd ~/Documents/Work/claimease-frontend

# Should see these directories
ls -la
```

**Expected structure:**
```
claimease-frontend/
├── .gitignore              ✅
├── .env.example            ✅
├── package.json            ✅
├── tsconfig.json           ✅
├── next.config.js          ✅
├── tailwind.config.ts      ✅
├── postcss.config.js       ✅
├── README.md               ✅
├── QUICKSTART.md           ✅
├── SETUP_GUIDE.md          ✅
├── DEPLOYMENT.md           ✅
├── MIGRATION_GUIDE.md      ✅ (this file)
├── app/                    ✅
├── components/             ✅
├── lib/                    ✅
└── public/                 ✅ (if exists)
```

---

### Step 4: Update Configuration

#### 4.1 Create `.env.local`

```bash
cd ~/Documents/Work/claimease-frontend
cp .env.example .env.local
```

Edit `.env.local`:
```bash
# For local development
NEXT_PUBLIC_API_URL=http://localhost:8001

# For production (update when deploying)
# NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

#### 4.2 Update `package.json` (Optional)

You may want to update the repository URL:

```json
{
  "name": "claimease-frontend",
  "version": "1.0.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/claimease-frontend.git"
  }
}
```

---

### Step 5: Test Locally

Before committing, make sure everything works:

```bash
cd ~/Documents/Work/claimease-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Verify:**
- ✅ App runs on http://localhost:3000
- ✅ No build errors
- ✅ Can connect to backend (make sure backend is running on port 8001)
- ✅ Chat functionality works
- ✅ All pages load correctly

---

### Step 6: Initialize Git and Push

```bash
cd ~/Documents/Work/claimease-frontend

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: ClaimEase frontend application

- Next.js 14 with App Router
- TypeScript and Tailwind CSS
- shadcn/ui components
- Chat, Dashboard, and Submit Claim pages
- API integration with FastAPI backend
- Complete documentation"

# Add remote (if not already added)
git remote add origin https://github.com/your-username/claimease-frontend.git

# Push to main branch
git branch -M main
git push -u origin main
```

---

### Step 7: Update Backend CORS

When you deploy the frontend to a different domain, update the backend's CORS settings:

**In `claim-ai-agent/src/api.py`:**

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",                    # Local development
        "https://your-frontend-domain.vercel.app",  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🚀 Deployment

Now that your frontend is in a separate repository, you can deploy it:

### Option 1: Vercel (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your `claimease-frontend` repository
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your backend URL
5. Click "Deploy"

### Option 2: Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Select your repository
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Add environment variables
6. Click "Deploy"

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

---

## 📝 Post-Migration Checklist

### In New Repository (`claimease-frontend`)

- [ ] All files copied successfully
- [ ] `.env.local` created and configured
- [ ] `npm install` runs without errors
- [ ] `npm run dev` starts successfully
- [ ] App connects to backend API
- [ ] All pages work correctly
- [ ] Git repository initialized
- [ ] Code pushed to GitHub/GitLab
- [ ] README updated with correct info
- [ ] Deployment configured (optional)

### In Original Repository (`claim-ai-agent`)

- [ ] Backend CORS updated with new frontend URL
- [ ] Backend still works independently
- [ ] Documentation updated to reference new frontend repo
- [ ] Optional: Add note in `react_app/README.md` pointing to new repo

---

## 🔄 Keeping Both Repos in Sync

If you want to keep the `react_app` folder in the original repo for reference:

### Option 1: Add a Note

Create `claim-ai-agent/react_app/MOVED.md`:

```markdown
# Frontend Moved

The React frontend has been moved to a separate repository:

**New Repository:** https://github.com/your-username/claimease-frontend

This folder is kept for reference only and may not be up to date.
```

### Option 2: Remove from Original Repo

If you want to completely remove it:

```bash
cd ~/Documents/Work/AI\ Agent/ClaimEase/project/codebase/claim-ai-agent
git rm -r react_app
git commit -m "Remove react_app (moved to separate repository)"
git push
```

---

## 🆘 Troubleshooting

### Issue: npm install fails

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Can't connect to backend

**Check:**
1. Backend is running on port 8001
2. `.env.local` has correct `NEXT_PUBLIC_API_URL`
3. CORS is configured on backend
4. No firewall blocking the connection

### Issue: Build fails

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

### Issue: Git push fails

**Solution:**
```bash
# Check remote
git remote -v

# If wrong, update it
git remote set-url origin https://github.com/your-username/claimease-frontend.git

# Try again
git push -u origin main
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Deployment Guide](./DEPLOYMENT.md)
- [Setup Guide](./SETUP_GUIDE.md)
- [Quick Start](./QUICKSTART.md)

---

## ✅ Success!

Once you've completed all steps:

1. ✅ Frontend is in its own repository
2. ✅ Backend and frontend are decoupled
3. ✅ Both can be developed independently
4. ✅ Both can be deployed separately
5. ✅ Easier to manage and scale

**Congratulations!** Your frontend is now a standalone project! 🎉

---

**Questions?** Check the documentation or create an issue in the repository.

**Last Updated:** November 2025
