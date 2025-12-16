#!/bin/bash

# ClaimEase AI - Git Repository Setup Script
# This script initializes the repository and sets up git configuration

set -e  # Exit on any error

echo "🚀 Setting up ClaimEase AI Git Repository..."
echo "================================================"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Error: Git is not installed. Please install Git first."
    exit 1
fi

# Set git user configuration for this repository
echo "📧 Configuring Git user settings..."
git config user.name "Aidill Fitri"
git config user.email "aidill.fitri@regentmarkets.com"
echo "✅ Git user configured: Aidill Fitri <aidill.fitri@regentmarkets.com>"

# Check if already a git repository
if [ -d ".git" ]; then
    echo "📁 Git repository already exists."
else
    echo "📁 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
fi

# Add remote origin if it doesn't exist
REMOTE_URL="https://github.com/aidill-deriv/claimease_ai.git"
if git remote get-url origin &> /dev/null; then
    CURRENT_REMOTE=$(git remote get-url origin)
    if [ "$CURRENT_REMOTE" != "$REMOTE_URL" ]; then
        echo "🔄 Updating remote origin URL..."
        git remote set-url origin $REMOTE_URL
    else
        echo "✅ Remote origin already configured correctly"
    fi
else
    echo "🔗 Adding remote origin..."
    git remote add origin $REMOTE_URL
    echo "✅ Remote origin added: $REMOTE_URL"
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore file..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
package-lock.json
yarn.lock

# Next.js
.next/
out/
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
config/.env*
!config/.env.example

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt

# Database
*.db
*.sqlite
*.sqlite3
database/*.db
!database/.gitkeep

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
*.tmp
*.temp
temp/
tmp/

# AI/ML
models/
*.model
*.pkl
*.joblib

# ChromaDB
knowledge_base/chroma_db/
*.chroma

# Sensitive data
*.key
*.pem
*.p12
secrets/
credentials/

# Testing
.pytest_cache/
.coverage
htmlcov/
.tox/
test-results/

# Production builds
*.tgz
*.tar.gz

# Cache
.cache/
.parcel-cache/
.eslintcache

# Misc
*.bak
*.orig
*.rej
EOF
    echo "✅ .gitignore file created"
else
    echo "✅ .gitignore file already exists"
fi

# Check current status
echo ""
echo "📊 Current repository status:"
git status

echo ""
echo "🎯 Next Steps:"
echo "1. Review the files to be committed:"
echo "   git status"
echo ""
echo "2. Add files to staging:"
echo "   git add ."
echo ""
echo "3. Create initial commit:"
echo "   git commit -m \"Initial commit: ClaimEase AI platform"$'\n\n'"Features:"$'\n'"- Next.js frontend with TypeScript"$'\n'"- Python FastAPI backend with AI integration"$'\n'"- AI-powered receipt OCR and claim processing"$'\n'"- Real-time dashboard and analytics"$'\n'"- 24/7 AI assistant for benefits guidance"$'\n'"- Enterprise security with email-scoped data access"$'\n\n'"🤖 Generated with Claude Code\""
echo ""
echo "4. Push to GitHub:"
echo "   git push -u origin main"
echo ""
echo "5. If you need to create the main branch first:"
echo "   git branch -M main"
echo "   git push -u origin main"

echo ""
echo "✨ Git repository setup complete!"
echo "Repository: $REMOTE_URL"
echo "User: Aidill Fitri <aidill.fitri@regentmarkets.com>"