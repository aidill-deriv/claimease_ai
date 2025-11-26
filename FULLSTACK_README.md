# ClaimEase - Full Stack Application

A complete AI-powered claims management system with React frontend and Python FastAPI backend.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Python](https://img.shields.io/badge/Python-3.9+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🌟 Overview

This is a **full-stack application** containing:
- **Frontend:** Modern React/Next.js web application
- **Backend:** Python FastAPI with AI agent
- **Database:** SQLite with ChromaDB for vector storage
- **AI:** LangChain-powered intelligent assistant

---

## 📁 Project Structure

```
claim_web_app_project/
├── react_app/              # Frontend (Next.js + React)
│   ├── app/               # Next.js pages
│   ├── components/        # React components
│   └── lib/               # Utilities & API client
│
├── src/                   # Backend (Python + FastAPI)
│   ├── api.py            # Main API server
│   ├── ai_agent.py       # AI agent logic
│   ├── db_retriever.py   # Database queries
│   └── tools.py          # AI tools
│
├── config/               # Configuration files
│   ├── .env.example      # Environment template
│   └── requirements*.txt # Python dependencies
│
├── data/                 # CSV data files
├── knowledge_base/       # AI knowledge base
├── database/            # SQLite database
├── docs/                # Documentation
└── tests/               # Test files
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.9+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** ([Installation Guide](./react_app/INSTALL_NODEJS.md))
- **Git** (for version control)

### 1. Setup Backend

```bash
# Navigate to project
cd "/Users/aidillfitri/Documents/Work/Github projects/claim_web_app_project"

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate     # On Windows

# Install Python dependencies
pip install -r config/requirements.txt

# Configure environment variables
cp config/.env.example config/.env
# Edit config/.env with your API keys

# Run backend server
python src/api.py
# Backend runs on http://localhost:8001
```

### 2. Setup Frontend

```bash
# Open new terminal
cd "/Users/aidillfitri/Documents/Work/Github projects/claim_web_app_project/react_app"

# Install Node.js dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8001

# Run frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### 3. Access Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001
- **API Docs:** http://localhost:8001/docs

---

## 🔧 Configuration

### Backend Environment Variables

Edit `config/.env`:

```bash
# OpenAI API Key (Required)
OPENAI_API_KEY=your-openai-api-key

# Database
DATABASE_PATH=database/claims.db

# ChromaDB
CHROMA_DB_PATH=knowledge_base/chroma_db

# Optional: Slack Integration
SLACK_BOT_TOKEN=your-slack-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
```

### Frontend Environment Variables

Edit `react_app/.env.local`:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8001

# App Info
NEXT_PUBLIC_APP_NAME=ClaimEase
NEXT_PUBLIC_APP_VERSION=1.0.0
```

---

## 📚 Features

### Frontend Features
- 💬 **AI Chat Interface** - Interactive chatbot for claims
- 📊 **Dashboard** - Overview of claims and balances
- 📋 **Submit Claims** - Easy claim submission form
- 🌓 **Dark Mode** - Full theme support
- 📱 **Responsive** - Works on all devices

### Backend Features
- 🤖 **AI Agent** - LangChain-powered assistant
- 📊 **Database** - SQLite for structured data
- 🔍 **Vector Search** - ChromaDB for semantic search
- 🔐 **Authentication** - User management
- 📝 **Logging** - Comprehensive logging system

---

## 🛠️ Development

### Running Both Services

You need **TWO terminal windows**:

**Terminal 1 - Backend:**
```bash
cd "/Users/aidillfitri/Documents/Work/Github projects/claim_web_app_project"
source venv/bin/activate
python src/api.py
```

**Terminal 2 - Frontend:**
```bash
cd "/Users/aidillfitri/Documents/Work/Github projects/claim_web_app_project/react_app"
npm run dev
```

### Available Scripts

**Backend:**
```bash
python src/api.py              # Start API server
python src/db_setup.py         # Initialize database
python tests/test_database.py  # Run tests
```

**Frontend:**
```bash
npm run dev        # Development server
npm run build      # Production build
npm start          # Production server
npm run lint       # Lint code
```

---

## 📖 Documentation

- **[Quick Reference](./QUICK_REFERENCE.md)** - Common commands
- **[Quickstart Commands](./QUICKSTART_COMMANDS.md)** - Getting started
- **[Frontend Setup](./react_app/SETUP_GUIDE.md)** - Detailed frontend guide
- **[Deployment Guide](./react_app/DEPLOYMENT.md)** - Deploy to production
- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture
- **[API Documentation](http://localhost:8001/docs)** - Interactive API docs

---

## 🚀 Deployment

### Option 1: Deploy Separately (Recommended)

**Frontend → Vercel/Netlify:**
```bash
cd react_app
# Deploy to Vercel
vercel

# Or deploy to Netlify
netlify deploy
```

**Backend → Your Server:**
```bash
# Use Docker, AWS, or any Python hosting
python src/api.py
```

### Option 2: Deploy Together

Use Docker Compose to deploy both services together. See [DEPLOYMENT.md](./react_app/DEPLOYMENT.md) for details.

---

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
python -m pytest tests/

# Run specific test
python tests/test_database.py
```

### Frontend Tests
```bash
cd react_app
npm test
```

---

## 📊 Project Status

- ✅ Backend API fully functional
- ✅ Frontend UI complete
- ✅ AI agent integrated
- ✅ Database setup complete
- ✅ Authentication working
- ✅ Documentation complete
- 🚧 Additional features in development

---

## 🔍 Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.9+

# Reinstall dependencies
pip install -r config/requirements.txt

# Check environment variables
cat config/.env
```

### Frontend won't start
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check environment variables
cat react_app/.env.local
```

### Can't connect frontend to backend
1. Ensure backend is running on port 8001
2. Check `NEXT_PUBLIC_API_URL` in `react_app/.env.local`
3. Verify CORS settings in `src/api.py`
4. Check browser console for errors

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📝 License

This project is licensed under the MIT License.

---

## 🆘 Support

- **Documentation:** Check the `docs/` folder
- **Issues:** Create an issue in the repository
- **Questions:** Check existing documentation first

---

## 🎯 Next Steps

1. ✅ Backend and frontend copied to new repo
2. ⬜ Set up Python virtual environment
3. ⬜ Install backend dependencies
4. ⬜ Configure environment variables
5. ⬜ Install frontend dependencies
6. ⬜ Test both services
7. ⬜ Initialize Git repository
8. ⬜ Push to GitHub

---

**Built with ❤️ using Next.js, React, Python, and FastAPI**

**Last Updated:** November 2025
