# 📦 Installing Node.js and npm

## The Problem

You're seeing this error:
```
zsh:1: command not found: npm
```

This means **Node.js and npm are not installed** on your Mac.

---

## Solution: Install Node.js

### Option 1: Using Homebrew (Recommended for Mac)

#### Step 1: Install Homebrew (if not already installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Step 2: Install Node.js
```bash
brew install node
```

#### Step 3: Verify Installation
```bash
node --version   # Should show v20.x.x or similar
npm --version    # Should show 10.x.x or similar
```

---

### Option 2: Download from Official Website

1. **Visit:** https://nodejs.org/
2. **Download:** The LTS (Long Term Support) version
3. **Run:** The installer (.pkg file for Mac)
4. **Follow:** The installation wizard
5. **Restart:** Your terminal

#### Verify Installation
```bash
node --version
npm --version
```

---

### Option 3: Using nvm (Node Version Manager)

This is great if you need multiple Node.js versions:

#### Step 1: Install nvm
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

#### Step 2: Restart Terminal or Run
```bash
source ~/.zshrc
```

#### Step 3: Install Node.js
```bash
nvm install --lts
nvm use --lts
```

#### Step 4: Verify
```bash
node --version
npm --version
```

---

## After Installing Node.js

Once Node.js is installed, you can proceed with the React app:

### 1. Navigate to the React App Directory
```bash
cd /Users/aidillfitri/Documents/Work/AI\ Agent/ClaimEase/project/codebase/claim-ai-agent/react_app
```

### 2. Install Dependencies
```bash
npm install
```

This will take 2-3 minutes and install all required packages.

### 3. Start the Development Server
```bash
npm run dev
```

### 4. Open in Browser
```
http://localhost:3000
```

---

## Troubleshooting

### "npm: command not found" after installation

**Solution:** Restart your terminal or run:
```bash
source ~/.zshrc
```

### Permission errors during installation

**Solution:** Don't use `sudo` with npm. If you see permission errors:
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

### Homebrew not found

**Solution:** Install Homebrew first:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

---

## Quick Check: Do I Have Node.js?

Run this command:
```bash
which node
```

- **If you see a path** (e.g., `/usr/local/bin/node`): Node.js is installed ✅
- **If you see nothing**: Node.js is NOT installed ❌

---

## Recommended: Install via Homebrew

For Mac users, Homebrew is the easiest method:

```bash
# 1. Install Homebrew (if needed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Node.js
brew install node

# 3. Verify
node --version
npm --version

# 4. Now you can use npm!
cd react_app
npm install
npm run dev
```

---

## What Gets Installed?

- **Node.js**: JavaScript runtime (required to run the app)
- **npm**: Node Package Manager (installs dependencies)
- **npx**: Package runner (comes with npm)

---

## Next Steps After Installation

1. ✅ Install Node.js (using one of the methods above)
2. ✅ Verify with `node --version` and `npm --version`
3. ✅ Navigate to `react_app` directory
4. ✅ Run `npm install`
5. ✅ Run `npm run dev`
6. ✅ Open http://localhost:3000

---

## Need Help?

If you're still having issues:

1. **Check Node.js version:** Must be 18.0 or higher
2. **Restart terminal:** After installation
3. **Check PATH:** Run `echo $PATH` to see if Node.js is in your PATH
4. **Try different method:** If Homebrew doesn't work, try the official installer

---

**Once Node.js is installed, the React app will work perfectly! 🚀**
