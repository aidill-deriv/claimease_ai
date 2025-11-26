# ClaimBot Agent - Quick Start (5 Minutes)

## What You Have

A **fully functional, email-scoped LangChain chatbot** for claim queries:
- ✅ Local CSV loading with email filtering
- ✅ Two-stage email validation (retriever + compute)
- ✅ Pandas compute tool with guardrails
- ✅ FastAPI endpoint (ready for Slack)
- ✅ Interactive CLI for testing
- ✅ Full test suite (9/9 passing)

## Setup (2 min)

```bash
cd claim-chatbot

# 1. Virtual env
python3 -m venv venv
source venv/bin/activate  # macOS/Linux

# 2. Install deps
pip install pandas pytest pydantic langchain-core

# 3. Verify data exists
ls data/claims_2025.csv data/policy_reference.csv
```

## Test It (3 min)

### Option A: Run Tests (proves security works)
```bash
# All tests should pass ✓
pytest tests/test_email_filter.py -v

# Output: 9 passed
```

### Option B: Test Agent Directly
```bash
cd src
python agent.py

# Output: 3 tests showing retrieval, compute, and cross-user isolation
```

### Option C: Interactive CLI (most fun)
```bash
cd ..
python src/cli.py

# Prompts you for queries:
# [***@***.com] > Show my claims
# [***@***.com] > What's my balance?
# [***@***.com] > switch-user
```

## How It Works (30 seconds)

```
Your Query
    ↓
[Email Filter 1: Retriever]  ← Fetches only YOUR rows
    ↓
[Tool: Retrieve or Compute]  ← Picks best action
    ↓
[Email Filter 2: Compute]    ← Revalidates YOUR data
    ↓
Response (with metadata)
```

**Key:** Your email is checked **twice** before any data reaches you.

## API Endpoint (for Slack later)

```bash
# Start server
cd src
python -m api

# In another terminal:
curl -X POST http://localhost:8001/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show my claims",
    "user_email": "aainaa@regentmarkets.com"
  }'

# Response: { "answer": "Found 4 rows...", "tool_used": "retrieve_claim_data", ... }
```

## Data Files

- **claims_2025.csv**: Employee claim transaction data (Year, Email, Amount, Balance, etc.)
- **policy_reference.csv**: Benefit policy info (Benefit_Type, Covered_Services, Annual_Limit, etc.)

Both have `email` column for user isolation.

## Next: Slack Integration

When ready to deploy to Slack:

1. Create Slack app in your workspace (get bot token)
2. Subscribe to `app_mention` events
3. Point webhook to `http://your-domain/slack/events`
4. Uncomment Slack auth in `src/auth_stub.py`
5. Implement thread reply logic in `src/api.py`

(Skeleton code already in place!)

## File Structure

```
claim-chatbot/
├── src/
│   ├── cli.py          ← Interactive local chat
│   ├── agent.py        ← Core agent logic
│   ├── retriever.py    ← Email-filtered CSV retrieval
│   ├── compute_tool.py ← Pandas compute with guardrails
│   ├── api.py          ← FastAPI endpoint
│   └── auth_stub.py    ← Auth (local + Slack placeholder)
├── data/
│   ├── claims_2025.csv
│   └── policy_reference.csv
├── tests/
│   └── test_email_filter.py  ← 9 passing tests
├── requirements.txt
└── README.md
```

## Common Queries

**As an end user:**
```
"Show my claims"
"What's my remaining balance?"
"List my benefits"
"How much have I spent?"
"What's the annual limit?"
```

**What the agent does:**
- Retrieves YOUR data (email-scoped)
- Computes math on YOUR data (sums, averages, etc.)
- Returns metadata: filter used, files, row count
- Never speculates; only uses CSV data

## Security Recap

✓ Emails normalized (lowercase)  
✓ Email filter at retrieval stage  
✓ Email revalidated at compute stage  
✓ No cross-user data possible  
✓ Invalid operations rejected  
✓ Emails masked in logs  
✓ All 9 tests passing  

## Support

If something doesn't work:

1. Check email is in CSV (lowercase): `cat data/claims_2025.csv | grep your@email.com`
2. Run tests: `pytest tests/test_email_filter.py -v`
3. Check logs: Look for `[AGENT]`, `[RETRIEVER]`, `[COMPUTE]` prefixes
4. Verify path: Run CLI from `claim-chatbot/` root directory

---

**You're ready to test locally and iterate. Ask questions anytime!**
