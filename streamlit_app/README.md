# 💼 ClaimEase Web Portal

AI-powered employee claims and benefits management system built with Streamlit.

![ClaimEase](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.9+-green)
![Streamlit](https://img.shields.io/badge/streamlit-1.28+-red)

## 🌟 Features

- **💬 AI Chat Assistant**: Ask questions about claims, benefits, and policies
- **📊 Personal Dashboard**: View claim balance, spending trends, and history
- **📋 Claim Submission**: Submit dental, optical, and health screening claims
- **🔐 User Authentication**: Simple email-based login system
- **📚 Knowledge Base**: Integrated with policy documents and FAQs
- **📈 Analytics**: Visual charts and spending insights

## 🚀 Quick Start

### Prerequisites

- Python 3.9 or higher
- OpenAI API key
- pip (Python package manager)

### Installation

1. **Navigate to the streamlit_app directory:**
   ```bash
   cd streamlit_app/
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

5. **Run the application:**
   ```bash
   streamlit run app.py
   ```

6. **Open your browser:**
   - The app will automatically open at `http://localhost:8501`
   - If not, navigate to the URL shown in the terminal

## 📁 Project Structure

```
streamlit_app/
├── app.py                      # Main application entry point
├── requirements.txt            # Python dependencies
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── README.md                  # This file
│
├── pages/                     # Streamlit pages
│   ├── 1_💬_Chat.py          # AI chat interface
│   ├── 2_📊_Dashboard.py     # Personal dashboard
│   └── 3_📋_Submit_Claim.py  # Claim submission form
│
├── core/                      # Core AI components
│   ├── __init__.py
│   ├── ai_agent.py           # AI agent logic
│   ├── tools.py              # AI tools and functions
│   ├── db_retriever.py       # Database operations
│   ├── auth.py               # Authentication utilities
│   └── logger.py             # Logging configuration
│
├── knowledge_base/            # Knowledge base & vector store
│   ├── vector_store.py
│   ├── md_files/             # Markdown documents
│   └── chroma_db/            # Vector database
│
├── data/                      # Application data
│   └── claims.db             # SQLite database
│
├── components/                # Reusable UI components
│   └── __init__.py
│
├── utils/                     # Utility functions
│   └── __init__.py
│
├── config/                    # Configuration files
│   └── __init__.py
│
├── assets/                    # Static assets
│   └── (images, css, etc.)
│
└── docs/                      # Documentation
    └── (additional docs)
```

## 🎯 Usage Guide

### 1. Login
- Enter any valid email address (e.g., `your.email@deriv.com`)
- Click "Login" to access the portal

### 2. Chat with AI Assistant
- Navigate to **💬 Chat Assistant**
- Ask questions like:
  - "What's my remaining balance?"
  - "How do I submit a dental claim?"
  - "What's covered by AIA insurance?"
- Use quick question buttons for common queries

### 3. View Dashboard
- Navigate to **📊 My Dashboard**
- See your:
  - Remaining balance
  - Total spending
  - Spending by category
  - Monthly trends
  - Recent claims history
- Download claims history as CSV

### 4. Submit Claims
- Navigate to **📋 Submit Claim**
- Fill in the form:
  - Select category (Dental/Optical/Health Screening)
  - Enter amount and date
  - Upload receipt
  - Get approval
- Submit and track status

## 🔧 Configuration

### Environment Variables

Edit `.env` file to configure:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-key-here
MODEL_NAME=gpt-4o-mini

# Database
DATABASE_PATH=data/claims.db

# Application
APP_NAME=ClaimEase
DEBUG=False

# Logging
LOG_LEVEL=INFO
```

### Customization

- **Styling**: Edit CSS in `app.py` or create `assets/styles.css`
- **Branding**: Update logo and colors in page configs
- **Features**: Add new pages in `pages/` directory

## 📊 Database Schema

The application uses SQLite with the following structure:

```sql
-- Claims table
CREATE TABLE claims (
    id INTEGER PRIMARY KEY,
    user_email TEXT,
    category TEXT,
    amount REAL,
    date TEXT,
    provider TEXT,
    description TEXT,
    status TEXT,
    created_at TIMESTAMP
);

-- Users table
CREATE TABLE users (
    email TEXT PRIMARY KEY,
    name TEXT,
    department TEXT,
    annual_limit REAL
);
```

## 🤖 AI Features

### Chat Assistant
- Powered by OpenAI GPT-4
- Context-aware conversations
- Memory of chat history
- Access to knowledge base

### Knowledge Base
- Vector database using ChromaDB
- Indexed policy documents
- Semantic search capabilities
- Real-time document retrieval

## 🔒 Security Notes

- **Demo Mode**: Current authentication is simplified for demo purposes
- **Production**: Implement proper authentication (OAuth, SAML, etc.)
- **API Keys**: Never commit `.env` file to version control
- **Data**: Ensure database is properly secured in production

## 🚀 Deployment

### Local Development
```bash
streamlit run app.py
```

### Streamlit Cloud
1. Push code to GitHub
2. Connect to Streamlit Cloud
3. Add secrets in dashboard
4. Deploy

### Docker (Optional)
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8501
CMD ["streamlit", "run", "app.py"]
```

## 📝 Development

### Adding New Pages

1. Create file in `pages/` directory:
   ```python
   # pages/4_🆕_New_Page.py
   import streamlit as st
   
   st.set_page_config(page_title="New Page", page_icon="🆕")
   st.title("🆕 New Page")
   ```

2. Page will automatically appear in navigation

### Adding New Features

1. Create component in `components/`
2. Import in page file
3. Use in page layout

## 🐛 Troubleshooting

### Common Issues

**Issue**: "ModuleNotFoundError: No module named 'streamlit'"
- **Solution**: Run `pip install -r requirements.txt`

**Issue**: "OpenAI API key not found"
- **Solution**: Check `.env` file has correct API key

**Issue**: "Database not found"
- **Solution**: Database will be created automatically on first run

**Issue**: "ChromaDB error"
- **Solution**: Delete `knowledge_base/chroma_db/` and restart

### Getting Help

- Check logs in `logs/` directory
- Enable debug mode: `DEBUG=True` in `.env`
- Contact: my-hrops@deriv.com

## 📚 Additional Resources

- [Streamlit Documentation](https://docs.streamlit.io)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [LangChain Documentation](https://python.langchain.com)

## 🤝 Contributing

This is an internal tool. For improvements:
1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit for review

## 📄 License

Internal use only - Deriv

## 👥 Support

For questions or issues:
- **Email**: my-hrops@deriv.com
- **Chat**: Use the AI assistant in the app

## 🎉 Version History

### v1.0.0 (Current)
- Initial release
- AI chat assistant
- Personal dashboard
- Claim submission form
- Knowledge base integration

---

**Built with ❤️ for Deriv employees**
