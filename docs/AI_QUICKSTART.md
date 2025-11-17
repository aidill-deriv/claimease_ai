# AI Chatbot Quick Start Guide

## Overview

Your ClaimBot now has AI-powered natural language understanding with OpenAI GPT-4o-mini!

**What's new:**
- 🤖 Natural language conversations
- 💬 Multi-turn dialogue with memory
- 🔒 Email-scoped security (users see only their data)
- ⚡ Fast responses (~1-2 seconds)
- 💰 Cost-effective (GPT-4o-mini: ~$0.002 per query)

---

## Setup (5 minutes)

### 1. Get OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy your key (starts with `sk-...`)

### 2. Configure Environment

Open the `.env` file and add your API key:

```bash
# Replace this line:
OPENAI_API_KEY=sk-your-actual-api-key-here

# With your actual key:
OPENAI_API_KEY=sk-proj-abc123...your-real-key
```

### 3. Start Chatting!

```bash
python3 cli_ai.py
```

That's it! 🎉

---

## Usage Examples

### Basic Queries

```
[You] ➤ What's my balance?
[AI] 🤖 You have MYR 1,271 remaining in your benefits balance.

[You] ➤ How much have I spent?
[AI] 🤖 You've spent MYR 729 so far this year.

[You] ➤ Show me my claims
[AI] 🤖 I found 1 claim record for you...
```

### Natural Language

```
[You] ➤ Hey, can you tell me how much I have left?
[AI] 🤖 Hi! You currently have MYR 1,271 remaining...

[You] ➤ Is that enough for a $500 claim?
[AI] 🤖 Yes! You have MYR 1,271 available, so you can...
```

### Multi-turn Conversations

```
[You] ➤ What's my balance?
[AI] 🤖 You have MYR 1,271 remaining.

[You] ➤ And how much did I start with?
[AI] 🤖 Your annual limit is MYR 2,000.

[You] ➤ So what percentage have I used?
[AI] 🤖 You've used about 36% of your annual limit.
```

### Complex Queries

```
[You] ➤ Compare my spending to my limit and tell me if I can afford a MYR 800 claim
[AI] 🤖 Let me check that for you...
     You have MYR 1,271 remaining from your MYR 2,000 limit.
     Yes, you can afford an MYR 800 claim, which would leave you with MYR 471.
```

---

## Commands

| Command | Description |
|---------|-------------|
| `quit` | Exit the chatbot |
| `clear` | Clear conversation history |
| `switch-user` | Change to different user |
| Any text | Ask a question naturally |

---

## Available Users

Test with these users in the database:

1. **aainaa@regentmarkets.com** (default)
   - Balance: MYR 1,271
   - Spent: MYR 729

2. **aaron.lim@regentmarkets.com**
   - Balance: MYR 450
   - Spent: MYR 1,550

3. **abbas.rafeiee@regentmarkets.com**
   - Balance: MYR 1,600
   - Spent: MYR 400

---

## How It Works

```
User Query (natural language)
    ↓
GPT-4o-mini understands intent
    ↓
Selects appropriate tools:
  • get_user_claims
  • calculate_balance
  • calculate_total_spent
  • get_claim_count
  • get_user_summary
  • get_max_amount
    ↓
Database Retriever (email-filtered) ✅
    ↓
GPT-4o-mini formats friendly response
    ↓
User gets natural language answer
```

---

## Security Features

✅ **Email Scoping**: Every query is filtered by user email  
✅ **No Cross-User Access**: Users can ONLY see their own data  
✅ **Parameterized Queries**: SQL injection prevention  
✅ **Tool Validation**: All tools validate email parameter  
✅ **Conversation Memory**: Isolated per user  

---

## Cost Estimation

**GPT-4o-mini pricing:**
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

**Typical query costs:**
- Simple query (1 tool): ~$0.001-0.002
- Complex query (3 tools): ~$0.003-0.005
- 1000 queries/month: ~$2-5

**Very affordable for production use!**

---

## Troubleshooting

### "OpenAI API key not configured"

**Problem:** Missing or invalid API key

**Solution:**
1. Check `.env` file exists
2. Verify API key starts with `sk-`
3. Ensure no extra spaces in the key
4. Try regenerating key at https://platform.openai.com/api-keys

### "Rate limit exceeded"

**Problem:** Too many requests (free tier limit)

**Solution:**
1. Wait a few minutes
2. Upgrade to paid plan ($5 minimum)
3. Keys have rate limits: 3 requests/min (free) or 3500/min (paid)

### "Tool call failed"

**Problem:** Database connection issue

**Solution:**
1. Verify `claims.db` exists
2. Run: `python3 db_setup.py` to recreate database
3. Check file permissions

---

## Python API Usage

Use the AI agent in your own code:

```python
from ai_agent import ClaimAIAgent

# Initialize
agent = ClaimAIAgent()

# Query
result = agent.query(
    "aainaa@regentmarkets.com",
    "What's my balance?"
)

print(result["answer"])
# Output: "You have MYR 1,271 remaining in your benefits balance."

# Multi-turn conversation
result2 = agent.query(
    "aainaa@regentmarkets.com",
    "And how much have I spent?"
)
# Agent remembers context from previous query!

# Clear memory
agent.clear_memory("aainaa@regentmarkets.com")
```

---

## Files Created

1. **`.env`** - Environment variables (add your API key here)
2. **`tools.py`** - LangChain tools for database access
3. **`ai_agent.py`** - Main AI agent with GPT-4o-mini
4. **`cli_ai.py`** - Interactive chat interface
5. **`requirements_ai.txt`** - Python dependencies

---

## Next Steps

### Immediate
- [x] Add your OpenAI API key to `.env`
- [ ] Run `python3 cli_ai.py`
- [ ] Test with different questions
- [ ] Try multi-turn conversations

### Optional Enhancements
- [ ] Deploy to Slack (update `api.py` to use AI agent)
- [ ] Add more tools (e.g., claim submission)
- [ ] Integrate with Zapier/Make for automation
- [ ] Add voice interface (Whisper API)
- [ ] Export conversation history

---

## Comparison: Before vs After

### Before (Keyword-based)
```
User: "my balance"
Bot: Result: 1271, Rows used: 1
```

### After (AI-powered)
```
[You] ➤ Hey, how much money do I have left in my benefits?

[AI] 🤖 Hi! Based on your claims data, you have MYR 1,271 
     remaining in your benefits balance for 2025. You 
     started with MYR 2,000 and have used MYR 729 so far.
```

**Much better user experience!** 🎉

---

## Support

**Questions or issues?**
1. Check this guide first
2. Review error messages carefully
3. Check `.env` configuration
4. Verify database exists (`claims.db`)

**OpenAI Resources:**
- API Keys: https://platform.openai.com/api-keys
- Usage Dashboard: https://platform.openai.com/usage
- Pricing: https://openai.com/api/pricing

---

## Model Options

Current: **GPT-4o-mini** (recommended)
- Fast, affordable, excellent quality
- $0.15/$0.60 per 1M tokens

Alternative: **GPT-4o**
- Most powerful
- $2.50/$10.00 per 1M tokens (15x more expensive)
- Change in `.env`: `MODEL_NAME=gpt-4o`

For 99% of use cases, **GPT-4o-mini is perfect!**

---

**Ready to start?**

```bash
python3 cli_ai.py
```

Enjoy your AI-powered chatbot! 🚀
