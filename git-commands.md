# Git Commands for ClaimEase AI

## 🚀 Initial Setup (Run Once)

```bash
# Run the setup script
./setup-git.sh
```

## 📝 Daily Git Workflow

### 1. Check Status
```bash
git status
```

### 2. Add Files
```bash
# Add all files
git add .

# Or add specific files
git add app/page.tsx
git add docs/presentation/
```

### 3. Commit Changes
```bash
git commit -m "Add presentation materials for stakeholder review

- Created comprehensive presentation slides
- Added speaker notes and talking points  
- Included executive summary for decision makers
- Updated ClaimEase branding and animations

🤖 Generated with Claude Code"
```

### 4. Push to GitHub
```bash
# First push (if setting up)
git push -u origin main

# Regular pushes
git push
```

## 🔧 Common Git Commands

### Check Remote Repository
```bash
git remote -v
```

### View Commit History
```bash
git log --oneline
```

### Check Current Branch
```bash
git branch
```

### Pull Latest Changes
```bash
git pull origin main
```

### Create and Switch Branch
```bash
git checkout -b feature/new-feature
```

### Switch Back to Main
```bash
git checkout main
```

## 🛠️ Troubleshooting

### If you need to set up the main branch:
```bash
git branch -M main
git push -u origin main
```

### If remote origin exists but is wrong:
```bash
git remote set-url origin https://github.com/aidill-deriv/claimease_ai.git
```

### If you want to see what will be committed:
```bash
git diff --staged
```

### If you want to unstage files:
```bash
git reset HEAD filename.txt
# Or unstage all
git reset HEAD .
```

## 📦 Complete Initial Setup Commands

After running `./setup-git.sh`, complete the setup with:

```bash
# Review what will be committed
git status

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: ClaimEase AI platform

Features:
- Next.js frontend with TypeScript
- Python FastAPI backend with AI integration  
- AI-powered receipt OCR and claim processing
- Real-time dashboard and analytics
- 24/7 AI assistant for benefits guidance
- Enterprise security with email-scoped data access

🤖 Generated with Claude Code"

# Set main branch and push
git branch -M main
git push -u origin main
```

## 🎯 Your Git Configuration

- **Name:** Aidill Fitri
- **Email:** aidill.fitri@regentmarkets.com  
- **Repository:** https://github.com/aidill-deriv/claimease_ai.git

---

*Quick Reference: Save this file for easy access to git commands*