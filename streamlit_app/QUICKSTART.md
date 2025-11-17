# 🚀 ClaimEase Web Portal - Quick Start Guide

Get up and running in 5 minutes!

## ⚡ Super Quick Start

### For Mac/Linux:
```bash
cd streamlit_app/
./start.sh
```

### For Windows:
```cmd
cd streamlit_app
start.bat
```

That's it! The script will:
- ✅ Create virtual environment
- ✅ Install all dependencies
- ✅ Set up configuration
- ✅ Launch the app

## 📋 Manual Setup (If you prefer)

### Step 1: Navigate to Directory
```bash
cd streamlit_app/
```

### Step 2: Create Virtual Environment
```bash
# Mac/Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment
```bash
# Copy example config
cp .env.example .env

# Edit .env and add your OpenAI API key
# Replace: OPENAI_API_KEY=sk-your-actual-api-key-here
# With: OPENAI_API_KEY=sk-proj-your-real-key-here
```

### Step 5: Run the App
```bash
streamlit run app.py
```

## 🎯 First Time Usage

1. **Open Browser**: App opens at `http://localhost:8501`

2. **Login**: Enter any valid email
   ```
   Example: john.doe@deriv.com
   ```

3. **Explore Features**:
   - 💬 **Chat**: Ask "What's my remaining balance?"
   - 📊 **Dashboard**: View your claims overview
   - 📋 **Submit**: Fill out a claim form

## 🔑 Getting Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign in or create account
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. Paste into `.env` file

## 💡 Common Questions

### Q: Where do I get the OpenAI API key?
**A:** Visit https://platform.openai.com/api-keys

### Q: Can I use a different AI model?
**A:** Yes! Edit `MODEL_NAME` in `.env` file:
```
MODEL_NAME=gpt-4o-mini  # Cheaper, faster
MODEL_NAME=gpt-4o       # More powerful
```

### Q: How do I stop the server?
**A:** Press `Ctrl+C` in the terminal

### Q: The app won't start, what do I do?
**A:** Check:
1. Python 3.9+ installed: `python --version`
2. Virtual environment activated (see `(venv)` in terminal)
3. All dependencies installed: `pip list`
4. `.env` file exists with valid API key

### Q: I see "OpenAI API key not found" error
**A:** 
1. Check `.env` file exists in `streamlit_app/` directory
2. Verify `OPENAI_API_KEY=sk-...` is set correctly
3. No spaces around the `=` sign
4. Key starts with `sk-`

### Q: Database errors on first run?
**A:** Normal! Database is created automatically. Just refresh the page.

## 🎨 Customization

### Change Port
```bash
streamlit run app.py --server.port 8502
```

### Enable Debug Mode
Edit `.env`:
```
DEBUG=True
```

### Change Theme
Create `.streamlit/config.toml`:
```toml
[theme]
primaryColor = "#1f77b4"
backgroundColor = "#ffffff"
secondaryBackgroundColor = "#f0f2f6"
textColor = "#262730"
```

## 📱 Access from Other Devices

### On Same Network:
```bash
streamlit run app.py --server.address 0.0.0.0
```
Then access via: `http://YOUR_IP:8501`

## 🐛 Troubleshooting

### Issue: "Command not found: streamlit"
**Solution:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Reinstall streamlit
pip install streamlit
```

### Issue: "ModuleNotFoundError"
**Solution:**
```bash
pip install -r requirements.txt
```

### Issue: Port already in use
**Solution:**
```bash
# Use different port
streamlit run app.py --server.port 8502
```

### Issue: ChromaDB errors
**Solution:**
```bash
# Delete and recreate vector database
rm -rf knowledge_base/chroma_db/
# Restart app - it will rebuild automatically
```

## 📚 Next Steps

1. ✅ **Explore Chat**: Try asking different questions
2. ✅ **Check Dashboard**: View your claims data
3. ✅ **Submit Claim**: Test the form submission
4. ✅ **Read Docs**: Check `README.md` for detailed info

## 🆘 Need Help?

- 📖 **Full Documentation**: See `README.md`
- 💬 **Chat Assistant**: Use the in-app chat for questions
- 📧 **Email Support**: my-hrops@deriv.com

## 🎉 You're All Set!

Enjoy using ClaimEase! 🚀

---

**Pro Tip**: Bookmark `http://localhost:8501` for quick access!
