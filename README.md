# ClaimEase AI Agent - Employee Benefits Chatbot

> AI-powered Slack bot for employee claims and benefits management with privacy protection

[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991.svg)](https://openai.com/)
[![Slack](https://img.shields.io/badge/Slack-Integration-4A154B.svg)](https://slack.com/)
[![Python](https://img.shields.io/badge/Python-3.8+-3776AB.svg)](https://www.python.org/)

---

## 🚀 Quick Start

### Option 1: Slack Bot (Recommended for Production)

```bash
# 1. Start the server
./start_server.sh

# 2. In another terminal, start ngrok
./setup_ngrok.sh

# 3. Configure Slack webhook URL with ngrok URL
# See SLACK_SETUP_GUIDE.md for details
```

**Then in Slack:**
```
@ClaimEase what's my remaining balance?
```

### Option 2: CLI Interface (For Testing)

```bash
python3 cli/cli_ai.py
```

### Option 3: API Server (For Development)

```bash
python3 src/api.py
```

---

## ✨ Features

### 🤖 AI-Powered Chatbot
- **Natural Language Understanding** - GPT-4o-mini with LangChain
- **Multi-turn Conversations** - Thread-aware memory for context
- **9 Specialized Tools** - 6 data tools + 3 knowledge base tools
- **Email-scoped Security** - Each user sees only their own data

### 🔒 Privacy Protection
- **Automatic PII Detection** - Identifies personal financial queries
- **Private DM Responses** - Sensitive data sent to user's DM automatically
- **Channel Acknowledgments** - Public confirmation without exposing data
- **Access Control** - Users cannot query other employees' data

### 💬 Slack Integration
- **Real-time Responses** - Instant answers in Slack
- **Thread Support** - Maintains conversation context in threads
- **Event Deduplication** - Prevents duplicate responses
- **Markdown Formatting** - Proper Slack mrkdwn with clickable links
- **Bot Message Filtering** - Prevents infinite loops

### 📚 Knowledge Base
- **3 PDF Documents** - Procedures, benefits, claim forms
- **32 Document Chunks** - Semantic search capability
- **Vector Database** - ChromaDB with local embeddings
- **Smart Search** - Finds relevant policy information

### 💾 Database System
- **SQLite Database** - Fast, reliable local storage
- **Email-scoped Queries** - Secure data access
- **3 Test Users** - Pre-loaded sample data
- **Claim Tracking** - Complete claim history

---

## 📖 Documentation

### Getting Started
- **[Quick Start Guide](docs/QUICKSTART.md)** - Basic setup and usage
- **[AI Setup Guide](docs/AI_QUICKSTART.md)** - AI agent configuration
- **[Easy Setup](EASY_SETUP.md)** - Simplified setup instructions

### Slack Deployment
- **[Slack Setup Guide](SLACK_SETUP_GUIDE.md)** - Complete Slack integration
- **[Slack Deployment](docs/SLACK_DEPLOYMENT.md)** - Deployment details
- **[Thread Memory](docs/SLACK_THREAD_MEMORY.md)** - Thread-aware conversations

### User Guides
- **[Sample Questions](docs/SAMPLE_QUESTIONS.md)** - 100+ example questions
- **[Quick Reference Card](docs/QUICK_REFERENCE_CARD.md)** - One-page guide
- **[Quick Commands](QUICKSTART_COMMANDS.md)** - Common commands

### Technical Documentation
- **[Architecture](docs/ARCHITECTURE.md)** - System design
- **[Database Migration](docs/DATABASE_MIGRATION_SUMMARY.md)** - Database setup
- **[Logging Guide](docs/LOGGING_GUIDE.md)** - Logging system
- **[AI Boundaries](docs/AI_AGENT_BOUNDARIES.md)** - Scope and limitations

---

## 📁 Project Structure

```
claim-ai-agent/
├── src/                      # Core application code
│   ├── ai_agent.py          # AI agent (GPT-4o-mini + LangChain)
│   ├── api.py               # FastAPI server for Slack
│   ├── tools.py             # 9 LangChain tools
│   ├── db_retriever.py      # Database access layer
│   ├── db_setup.py          # Database initialization
│   ├── logger.py            # Logging system
│   └── auth_stub.py         # Authentication stub
│
├── knowledge_base/           # PDF knowledge system
│   ├── pdf_files/           # Source PDFs (3 documents)
│   ├── md_files/            # Converted markdown files
│   ├── chroma_db/           # Vector database (32 chunks)
│   ├── vector_store.py      # Vector store manager
│   ├── knowledge_tools.py   # Knowledge base tools
│   └── *.py                 # Processing scripts
│
├── cli/                      # Command-line interfaces
│   ├── cli_ai.py            # AI chatbot CLI
│   └── cli_db.py            # Database CLI
│
├── data/                     # CSV data files
│   ├── claims_2025.csv      # Claim records
│   └── policy_reference.csv # Policy data
│
├── database/                 # SQLite database
│   └── claims.db            # Main database
│
├── config/                   # Configuration
│   ├── .env                 # Environment variables
│   ├── .env.example         # Example configuration
│   └── requirements*.txt    # Dependencies
│
├── docs/                     # Documentation
│   ├── SAMPLE_QUESTIONS.md  # 100+ example questions
│   ├── QUICK_REFERENCE_CARD.md  # Quick reference
│   ├── SLACK_DEPLOYMENT.md  # Slack setup
│   └── *.md                 # Other documentation
│
├── tests/                    # Test files
│   ├── test_all_users.py    # User data tests
│   ├── test_database.py     # Database tests
│   ├── test_thread_memory.py # Thread memory tests
│   └── benchmark.py         # Performance tests
│
├── logs/                     # Log files
│   ├── api.log              # API server logs
│   ├── conversations.log    # Chat logs
│   └── system.log           # System logs
│
├── start_server.sh          # Start API server
├── setup_ngrok.sh           # Setup ngrok tunnel
└── deprecated/              # Old files (safe to delete)
```

---

## 🔧 Setup & Configuration

### Prerequisites

- Python 3.8+
- OpenAI API key
- Slack workspace (for Slack integration)
- ngrok account (for Slack webhook)

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd claim-ai-agent

# 2. Install dependencies
pip3 install -r config/requirements.txt
pip3 install -r config/requirements_ai.txt
pip3 install -r config/requirements_kb.txt

# 3. Configure environment
cp config/.env.example config/.env
# Edit config/.env with your API keys and Supabase credentials
```

### Environment Variables

Edit `config/.env`:

```bash
# OpenAI API
OPENAI_API_KEY=sk-your-actual-api-key-here
MODEL_NAME=gpt-4o-mini

# Slack Integration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret

# Server Configuration
PORT=8001

# Default User (for CLI testing)
LOCAL_USER_EMAIL=aainaa@regentmarkets.com

# Supabase (backend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_SUMMARY_TABLE=claim_summary
SUPABASE_ANALYSIS_TABLE=claim_analysis
```

### Supabase Integration (Frontend)

1. Copy `.env.example` to `.env.local`.
2. Provide your Supabase credentials and table names (override only if your schema differs):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_SUMMARY_TABLE=claim_summary          # feeds dashboard top-cards
NEXT_PUBLIC_SUPABASE_ANALYSIS_TABLE=claim_analysis        # feeds charts + recent claims
NEXT_PUBLIC_SUPABASE_CLAIMS_TABLE=claims                  # form submissions (point to claim_analysis if you reuse that table)
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=claim_receipts        # bucket for uploaded receipts
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key           # server-only key for /api/dashboard-data
```

3. Expected schemas (all filtered by `email = authenticated user`):
   - **`claim_summary`** – `employee_id`, `email`, `year`, `max_amount`, `total_transaction_amount`, `remaining_balance`.
   - **`claim_analysis`** – `employee_id`, `email`, `claim_type`, `claim_description`, `transaction_amount`, `transaction_currency`, `date_submitted`, `date_paid`, `state`.
   - **`claims`** (optional) – used by the submit form; include `user_email`, `category`, `amount`, `date`, `description`, `provider`, `status`, `receipt_path`. If you write directly into `claim_analysis`, map the payload fields accordingly.
   - **Storage bucket** – defaults to `claim_receipts` for receipt uploads.

4. Policies:
   - Allow read access on `claim_summary` and `claim_analysis` where `email = auth.email()` (or handle via the provided `/api/dashboard-data` service-role endpoint).
   - Allow insert/write on the submission table for the authenticated user.
   - Grant upload permissions for the receipt bucket.

5. Diagnostics:
   - Run `npm run verify:supabase` (optionally append an email) to confirm Supabase connectivity and sample data: `npm run verify:supabase -- user@example.com`.
   - The script auto-detects the service-role key (if present) to bypass RLS and prints sample rows or reports if no data is present.

### Slack Setup

See **[SLACK_SETUP_GUIDE.md](SLACK_SETUP_GUIDE.md)** for complete instructions.

**Quick steps:**
1. Create Slack app at https://api.slack.com/apps
2. Add bot scopes: `chat:write`, `im:write`, `users:read`, `users:read.email`, `app_mentions:read`, `im:history`
3. Install app to workspace
4. Copy bot token and signing secret to `.env`
5. Start server and ngrok
6. Configure Event Subscriptions with ngrok URL

---

## 🧪 Testing

```bash
# Test all users
python3 tests/test_all_users.py

# Test database
python3 tests/test_database.py

# Test thread memory
python3 tests/test_thread_memory.py

# Benchmark performance
python3 tests/benchmark.py
```

---

## 📊 Current Status

### ✅ Working Features

**Core Functionality:**
- ✅ AI chatbot with GPT-4o-mini
- ✅ 9 specialized tools (6 data + 3 knowledge base)
- ✅ Natural language understanding
- ✅ Multi-turn conversations with memory

**Slack Integration:**
- ✅ Real-time Slack bot
- ✅ Thread-aware conversations
- ✅ Event deduplication
- ✅ Markdown to Slack formatting
- ✅ Bot message filtering

**Privacy & Security:**
- ✅ Automatic PII detection
- ✅ Private DM for sensitive data
- ✅ Email-scoped data access
- ✅ Access control (users can't query others' data)

**Knowledge Base:**
- ✅ 3 PDF documents processed
- ✅ 32 semantic chunks
- ✅ Vector search with ChromaDB
- ✅ Local embeddings (free)

**Database:**
- ✅ SQLite database
- ✅ 3 test users with sample data
- ✅ Secure email-scoped queries
- ✅ Claim history tracking

**Documentation:**
- ✅ Comprehensive guides
- ✅ 100+ sample questions
- ✅ Quick reference card
- ✅ Slack deployment guide

### 🚧 Future Enhancements

- [ ] Web interface
- [ ] Multi-workspace support
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] Claim approval workflow
- [ ] Integration with HR systems

---

## 🎯 Usage Examples

### In Slack

**Personal Queries (sent to DM):**
```
@ClaimEase what's my remaining balance?
@ClaimEase how much have I claimed this year?
@ClaimEase show me my claim history
```

**General Questions (answered in channel):**
```
@ClaimEase how do I submit a dental claim?
@ClaimEase what does AIA cover?
@ClaimEase does AIA cover my dependents?
@ClaimEase what's the AIA hotline?
```

**See [SAMPLE_QUESTIONS.md](docs/SAMPLE_QUESTIONS.md) for 100+ examples!**

### In CLI

```bash
$ python3 cli/cli_ai.py

ClaimBot: Hi! I'm your AI assistant for claims and benefits.
You: what's my balance?
ClaimBot: Based on your claims this year, here's your balance:
- Total Limit: MYR 2,000
- Total Claimed: MYR 450
- Remaining Balance: MYR 1,550
```

---

## 🔒 Privacy Features

### Automatic PII Detection

The bot automatically detects queries containing personal financial information:
- Balance queries
- Claim amounts
- Claim history
- Total spending

### Private DM Responses

When PII is detected:
1. **In Channel:** Bot posts acknowledgment
   ```
   🔒 Your inquiry about "what's my balance" has been sent to your DM for privacy.
   ```

2. **In DM:** Bot sends detailed answer privately
   ```
   Based on your claims this year, here's your balance:
   - Total Limit: MYR 2,000
   - Total Claimed: MYR 450
   - Remaining Balance: MYR 1,550
   ```

### Access Control

Users cannot query other employees' data:
```
User: What's John's balance?
Bot: I'm unable to help with that request. For privacy and security reasons, 
I can only provide information about your own claims and benefits.
```

---

## 📞 Support & Contact

### For Users

- **Sample Questions:** [SAMPLE_QUESTIONS.md](docs/SAMPLE_QUESTIONS.md)
- **Quick Reference:** [QUICK_REFERENCE_CARD.md](docs/QUICK_REFERENCE_CARD.md)
- **AIA Hotline:** 1300 8888 60/70 (24/7)
- **HR Email:** my-hrops@deriv.com

### For Developers

- **Architecture:** [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Slack Deployment:** [SLACK_DEPLOYMENT.md](docs/SLACK_DEPLOYMENT.md)
- **Logging Guide:** [LOGGING_GUIDE.md](docs/LOGGING_GUIDE.md)
- **AI Boundaries:** [AI_AGENT_BOUNDARIES.md](docs/AI_AGENT_BOUNDARIES.md)

### Troubleshooting

**Bot not responding in Slack?**
- Check if server is running: `./start_server.sh`
- Verify ngrok is active: `./setup_ngrok.sh`
- Check logs: `tail -f logs/api.log`

**Can't receive DMs?**
- DM the bot first to open channel
- Check Slack DM settings
- Verify bot has `im:write` scope

**Wrong answers?**
- Check knowledge base: `python3 knowledge_base/inspect_chroma.py`
- Review logs: `logs/conversations.log`
- Test with CLI: `python3 cli/cli_ai.py`

---

## 🗑️ Deprecated Files

Old/unused files are in `deprecated/` folder. Safe to delete after verification:
- `agent.py` - Old agent implementation
- `retriever.py` - Old retriever
- `compute_tool.py` - Old tool
- `csv_loader.py` - Old loader
- `cli.py` - Old CLI
- `api.py` - Old API (replaced by `src/api.py`)

---

## 📝 Changelog

### Version 2.1 (Current)
- ✅ Added Slack integration with privacy DM
- ✅ Implemented thread-aware memory
- ✅ Added event deduplication
- ✅ Converted Markdown to Slack formatting
- ✅ Added bot message filtering
- ✅ Created comprehensive documentation
- ✅ Added 100+ sample questions guide
- ✅ Improved privacy protection

### Version 2.0
- ✅ Reorganized project structure
- ✅ Added knowledge base system
- ✅ Implemented AI agent with LangChain
- ✅ Created 9 specialized tools
- ✅ Added logging system

### Version 1.0
- ✅ Initial CLI implementation
- ✅ Basic database setup
- ✅ CSV data import

---

## 📄 License

This project is proprietary software for Deriv internal use.

---

## 🤝 Contributing

For internal contributors:
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request
5. Update documentation

---

**Last Updated:** November 2, 2025  
**Version:** 2.1 (Slack Integration + Privacy Features)  
**Maintained by:** Deriv IT Team
