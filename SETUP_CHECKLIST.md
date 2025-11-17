# Setup Checklist - ClaimEase Full Stack

Use this checklist to set up your new repository step by step.

## ✅ Migration Complete

- [x] All files copied to new repository
- [x] Backend files (src/, config/, data/, etc.)
- [x] Frontend files (react_app/)
- [x] Documentation files
- [x] Configuration files

---

## 📋 Setup Steps

### 1. Backend Setup

#### Step 1.1: Create Virtual Environment
```bash
cd "/Users/aidillfitri/Documents/Work/Github projects/claim_web_app_project"
python -m venv venv
```
- [ ] Virtual environment created

#### Step 1.2: Activate Virtual Environment
```bash
source venv/bin/activate  # macOS/Linux
```
- [ ] Virtual environment activated (you should see `(venv)` in terminal)

#### Step 1.3: Install Python Dependencies
```bash
pip install -r config/requirements.txt
```
- [ ] Dependencies installed successfully

#### Step 1.4: Configure Backend Environment
```bash
cp config/.env.example config/.env
# Edit config/.env with your settings
```
- [ ] `.env` file created
- [ ] OpenAI API key added (if using AI features)
- [ ] Other settings configured

#### Step 1.5: Initialize Database (Optional)
```bash
python src/db_setup.py
```
- [ ] Database initialized

#### Step 1.6: Test Backend
```bash
python src/api.py
```
- [ ] Backend starts without errors
- [ ] Can access http://localhost:8000
- [ ] Can access http://localhost:8000/docs

---

### 2. Frontend Setup

#### Step 2.1: Navigate to Frontend
```bash
# Open NEW terminal window
cd "/Users/aidillfitri/Documents/Work/Github projects/claim_web_app_project/react_app"
```
- [ ] In react_app directory

#### Step 2.2: Install Node Dependencies
```bash
npm install
```
- [ ] Dependencies installed (may take a few minutes)
- [ ] No errors during installation

#### Step 2.3: Configure Frontend Environment
```bash
cp .env.example .env.local
# Edit .env.local
```
- [ ] `.env.local` file created
- [ ] `NEXT_PUBLIC_API_URL=http://localhost:8000` set

#### Step 2.4: Test Frontend
```bash
npm run dev
```
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:3000
- [ ] No console errors in browser

---

### 3. Integration Testing

#### Step 3.1: Both Services Running
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Both terminals open and active

#### Step 3.2: Test Features
Visit http://localhost:3000 and test:
- [ ] Login page loads
- [ ] Can enter email and login
- [ ] Dashboard page loads
- [ ] Chat page loads
- [ ] Can send message in chat
- [ ] Receive response from AI
- [ ] Submit claim page loads

#### Step 3.3: Check Connections
- [ ] Frontend successfully calls backend API
- [ ] No CORS errors in browser console
- [ ] API responses are received
- [ ] Data displays correctly

---

### 4. Git Setup (Optional)

#### Step 4.1: Initialize Git (if not already done)
```bash
cd "/Users/aidillfitri/Documents/Work/Github projects/claim_web_app_project"
git init
```
- [ ] Git initialized

#### Step 4.2: Add Remote
```bash
git remote add origin https://github.com/YOUR-USERNAME/claim_web_app_project.git
```
- [ ] Remote added

#### Step 4.3: Initial Commit
```bash
git add .
git commit -m "Initial commit: Full stack ClaimEase application"
git push -u origin main
```
- [ ] Code committed
- [ ] Code pushed to GitHub

---

## 🔍 Verification Commands

### Check Backend Status
```bash
# In backend terminal
curl http://localhost:8000/health
# Should return: {"status":"healthy"}
```

### Check Frontend Status
```bash
# In browser
# Visit: http://localhost:3000
# Should see login page
```

### Check API Connection
```bash
# In browser console (F12)
# Should see successful API calls
# No CORS errors
```

---

## 🚨 Common Issues & Solutions

### Issue: Backend won't start
**Solution:**
```bash
# Check Python version
python --version  # Should be 3.9+

# Reinstall dependencies
pip install -r config/requirements.txt

# Check for errors in terminal
```

### Issue: Frontend won't start
**Solution:**
```bash
# Check Node version
node --version  # Should be 18+

# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Can't connect to backend
**Solution:**
1. Ensure backend is running: `curl http://localhost:8000/health`
2. Check `.env.local` has correct API URL
3. Check browser console for CORS errors
4. Verify `src/api.py` has correct CORS settings

### Issue: Port already in use
**Solution:**
```bash
# Find process using port 8000
lsof -i :8000
# Kill the process
kill -9 <PID>

# Or use different port in src/api.py
```

---

## 📚 Next Steps After Setup

Once everything is working:

1. **Read Documentation**
   - [ ] Read FULLSTACK_README.md
   - [ ] Review QUICK_REFERENCE.md
   - [ ] Check docs/ folder

2. **Customize Application**
   - [ ] Update branding/colors
   - [ ] Add your company logo
   - [ ] Customize features

3. **Deploy to Production**
   - [ ] Review DEPLOYMENT.md
   - [ ] Choose hosting platform
   - [ ] Deploy backend
   - [ ] Deploy frontend

4. **Set Up Development Workflow**
   - [ ] Create development branch
   - [ ] Set up CI/CD (optional)
   - [ ] Configure testing

---

## ✅ Setup Complete!

When all items are checked:
- ✅ Backend running successfully
- ✅ Frontend running successfully
- ✅ Both services communicating
- ✅ All features working
- ✅ Ready for development/deployment

---

## 🆘 Need Help?

- **Documentation:** Check FULLSTACK_README.md
- **Troubleshooting:** See section above
- **API Docs:** http://localhost:8000/docs
- **Frontend Docs:** react_app/SETUP_GUIDE.md

---

**Last Updated:** November 2025
