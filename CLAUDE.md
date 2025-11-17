# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (Next.js)
```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Backend (Python)
```bash
# Setup
pip install -r config/requirements.txt
pip install -r config/requirements_ai.txt
pip install -r config/requirements_kb.txt

# Development
python src/api.py                    # Start FastAPI server (localhost:8000)
python cli/cli_ai.py                # Interactive CLI interface
python src/db_setup.py              # Initialize database

# Testing
python tests/test_all_users.py      # User data isolation tests
python tests/test_database.py       # Database functionality tests
python tests/test_thread_memory.py  # Thread memory tests
python tests/benchmark.py           # Performance benchmarks
```

### Deployment Scripts
```bash
./start_server.sh                   # Start Python backend
./setup_ngrok.sh                    # Setup tunneling for Slack integration
```

## Architecture

### Hybrid Full-Stack Application
This is a **dual-architecture project** combining:
- **Next.js 14 frontend** with App Router and TypeScript
- **Python FastAPI backend** with AI/ML capabilities

### API Integration
The Next.js frontend proxies API calls to the Python backend via `next.config.js`:
```javascript
// API calls to /api/* are forwarded to http://localhost:8000/*
```

### Database Architecture
- **SQLite** (`database/claims.db`) - User claims and transactions
- **ChromaDB** (`knowledge_base/chroma_db/`) - Vector embeddings for AI search
- **CSV Data** (`data/`) - Claims and policy reference data

### Email-Scoped Security
All database queries are filtered by user email for privacy. Users can only access their own data.

## Project Structure

### Frontend (Next.js App Router)
```
app/
├── layout.tsx           # Root layout with theme provider
├── page.tsx            # Landing page with email authentication
├── globals.css         # Global styles with Deriv design system
├── dashboard/page.tsx  # Analytics dashboard
├── chat/page.tsx       # AI chat interface
└── submit-claim/page.tsx # Claim submission form

components/
├── navigation.tsx       # Main navigation with user menu
├── theme-provider.tsx   # Dark/light mode provider
├── markdown-message.tsx # AI message formatting
└── ui/                 # Radix UI primitives (button, card, input, etc.)
```

### Backend (Python)
```
src/
├── ai_agent.py          # AI agent with GPT-4o-mini + LangChain
├── api.py              # FastAPI server for Slack integration
├── tools.py            # 9 specialized LangChain tools (6 data + 3 knowledge)
├── db_retriever.py     # Database access layer
├── db_setup.py         # Database initialization
└── logger.py           # Logging system

knowledge_base/
├── pdf_files/          # Source PDFs (3 documents)
├── chroma_db/          # Vector database (32 semantic chunks)
├── vector_store.py     # Vector store manager
└── knowledge_tools.py  # Knowledge base tools
```

## Key Technologies

### Frontend Stack
- **Next.js 14.2.5** with App Router
- **TypeScript 5** for type safety
- **TailwindCSS 3.4.4** with custom Deriv design system
- **Radix UI** for accessible components
- **Recharts 2.12.7** for data visualization
- **Axios** for API communication
- **next-themes** for dark mode support

### Backend Stack
- **FastAPI** with async support
- **LangChain** for AI application framework
- **OpenAI GPT-4o-mini** as the language model
- **ChromaDB** for vector embeddings
- **SQLite** for relational data
- **Slack SDK** for bot integration

### AI/ML Components
- **9 Specialized Tools** - 6 data access tools + 3 knowledge base tools
- **Thread Memory** - Conversation context preservation
- **Vector Search** - Semantic document search with local embeddings
- **Email Scoping** - Privacy-first data access control

## Development Workflow

1. **Frontend Development**: Run `npm run dev` for Next.js development server
2. **Backend Development**: Run `python src/api.py` for FastAPI server
3. **AI Configuration**: Ensure OpenAI API key is set in `config/.env`
4. **Database Setup**: Initialize with `python src/db_setup.py`
5. **Testing**: Run comprehensive test suite for data isolation and security

## Testing Strategy

### Key Test Categories
- **Email Isolation** - Verify users only access their own data
- **AI Agent Functionality** - Test tool routing and responses
- **Database Security** - Validate query constraints
- **Thread Memory** - Conversation context preservation
- **Performance** - Response time benchmarks

### Running Tests
Always run the full test suite before commits:
```bash
python tests/test_all_users.py      # Critical for data privacy
python tests/test_database.py       # Database integrity
python tests/test_thread_memory.py  # AI conversation context
```

## Security Considerations

### Privacy Protection
- **Automatic PII Detection** - Identifies personal financial queries
- **Private DM Responses** - Sensitive data sent to user's DM in Slack
- **Access Control** - Users cannot query other employees' data
- **Email-Scoped Queries** - All database access filtered by user email

### Data Boundaries
- Users can only access their own claims and benefits data
- Knowledge base information (policies, procedures) is shared
- Personal financial information triggers automatic privacy protection

## Configuration Files

### Environment Setup
- `config/.env` - Environment variables (API keys, tokens)
- `config/requirements*.txt` - Python dependencies (core, AI, knowledge base)
- `next.config.js` - Next.js configuration with API proxy
- `tailwind.config.ts` - Extensive Deriv design system configuration

### Database Initialization
Database must be initialized with sample data:
```bash
python src/db_setup.py data database/claims.db
```

## Deployment Modes

### 1. Web Interface (Development)
- Frontend: `npm run dev` (localhost:3000)
- Backend: `python src/api.py` (localhost:8000)

### 2. Slack Bot (Production)
- Start server: `./start_server.sh`
- Setup tunnel: `./setup_ngrok.sh`
- Configure Slack webhook with ngrok URL

### 3. CLI Interface (Testing)
- Interactive: `python cli/cli_ai.py`
- Database CLI: `python cli/cli_db.py`

## Code Conventions

### Frontend (TypeScript/React)
- Use TypeScript for all components
- Follow Next.js App Router patterns
- Implement Radix UI components consistently
- Maintain Deriv design system styling
- Use session-based authentication

### Backend (Python)
- Follow FastAPI async patterns
- Implement email-scoped database queries
- Use LangChain tool patterns for AI functions
- Maintain comprehensive logging
- Ensure Slack integration compatibility

## Important Notes

- This is a **privacy-first application** - always test email scoping
- The AI agent has **9 specialized tools** for different data types
- **Thread memory** preserves conversation context in Slack
- **Vector search** enables semantic document queries
- **Multiple UIs** support different deployment scenarios (web, Slack, CLI)