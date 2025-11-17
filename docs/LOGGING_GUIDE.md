# Logging System Guide

Complete guide for the AI Agent logging system - how logs are stored, viewed, and analyzed.

**Last Updated:** 2025-11-02

---

## 📊 Overview

Your AI Agent now has a comprehensive logging system that tracks:
- ✅ All user conversations (queries & responses)
- ✅ Tool usage and results
- ✅ System events (startup, shutdown, errors)
- ✅ Detailed error traces
- ✅ Agent operations

---

## 📂 Log File Structure

```
logs/
├── ai_agent.log          # AI agent operations
├── conversations.log     # User conversations (structured)
├── system.log           # System events
├── ai_agent.log.1       # Rotated backup (when > 10MB)
├── ai_agent.log.2       # Older backup
└── view_logs.py         # Log viewer utility
```

### Log Rotation
- **Max size:** 10MB per file
- **Backups:** 5 files kept
- **Automatic:** Rotates when size limit reached

---

## 🎯 What Gets Logged

### 1. Conversations (conversations.log)
```
2025-11-02 02:15:30 - conversations - INFO - QUERY | u***@example.com | What's my balance?
2025-11-02 02:15:32 - conversations - INFO - RESPONSE | u***@example.com | Your remaining balance is MYR 1,500...
2025-11-02 02:15:32 - conversations - INFO - TOOL | u***@example.com | calculate_balance | Success
```

**Includes:**
- User queries (with masked emails)
- AI responses (truncated to 200 chars)
- Tool usage
- Errors

---

### 2. AI Agent Operations (ai_agent.log)
```
2025-11-02 02:15:25 - ai_agent - INFO - __init__:45 - Using model: gpt-4o-mini
2025-11-02 02:15:26 - ai_agent - INFO - __init__:53 - LLM initialized successfully
2025-11-02 02:15:30 - ai_agent - INFO - query:125 - Query from u***@example.com: What's my balance?
2025-11-02 02:15:32 - ai_agent - INFO - query:145 - Response generated for u***@example.com
```

**Includes:**
- Initialization events
- Query processing
- Response generation
- Memory operations
- Detailed error traces

---

### 3. System Events (system.log)
```
2025-11-02 02:15:25 - system - INFO - log_system_event:145 - AI_AGENT_INIT | Initializing AI Agent
2025-11-02 02:15:26 - system - INFO - log_system_event:145 - AI_AGENT_READY | Agent ready with model gpt-4o-mini
```

**Includes:**
- System startup/shutdown
- Configuration changes
- Critical system events

---

## 🔍 Viewing Logs

### Method 1: Log Viewer Script (Recommended)

**Location:** `logs/view_logs.py`

#### View Recent Conversations
```bash
cd logs
python3 view_logs.py conversations

# Or specify number of lines
python3 view_logs.py conversations 100
```

**Output:**
```
💬 Recent Conversations:
======================================================================

🔵 2025-11-02 02:15:30 | u***@example.com
   Q: What's my balance?
   A: Your remaining balance is MYR 1,500...
   🔧 Tool: calculate_balance | Success

🔵 2025-11-02 02:16:45 | a***@example.com
   Q: How do I submit a dental claim?
   A: To submit your dental claim, please use the Staff Claim...
```

---

#### View Errors
```bash
python3 view_logs.py errors
```

**Output:**
```
❌ Recent Errors:
======================================================================

[ai_agent.log]
2025-11-02 02:20:15 - ai_agent - ERROR - query:165 - Error for u***@example.com: Invalid API key

[conversations.log]
2025-11-02 02:20:15 - conversations - ERROR - log_error:125 - ERROR | u***@example.com | Invalid API key
```

---

#### View System Events
```bash
python3 view_logs.py system
```

---

#### View AI Agent Logs
```bash
python3 view_logs.py agent
```

---

#### Search Logs
```bash
# Search all logs
python3 view_logs.py search "balance"

# Search specific log
python3 view_logs.py search "error" ai_agent
```

---

#### View Statistics
```bash
python3 view_logs.py stats
```

**Output:**
```
📊 Log Statistics:
======================================================================

💬 Conversations:
   Total queries: 45
   Total responses: 45
   Tool uses: 38
   Errors: 2

⚙️  System:
   Initializations: 3

📁 File Sizes:
   ai_agent.log                   125.3 KB
   conversations.log               89.7 KB
   system.log                      12.4 KB
```

---

#### List All Log Files
```bash
python3 view_logs.py list
```

---

### Method 2: Direct File Access

#### View Latest Logs
```bash
# Last 50 lines of conversations
tail -50 logs/conversations.log

# Follow logs in real-time
tail -f logs/conversations.log

# View all AI agent logs
cat logs/ai_agent.log
```

---

#### Search Logs
```bash
# Find all errors
grep "ERROR" logs/*.log

# Find specific user's queries
grep "u***@example.com" logs/conversations.log

# Find tool usage
grep "TOOL" logs/conversations.log
```

---

#### View Logs by Date
```bash
# Today's logs
grep "2025-11-02" logs/conversations.log

# Specific time range
grep "2025-11-02 14:" logs/conversations.log
```

---

## 📋 Log Formats

### Conversation Log Format
```
TIMESTAMP - LOGGER - LEVEL - TYPE | USER | CONTENT
```

**Example:**
```
2025-11-02 02:15:30 - conversations - INFO - QUERY | u***@example.com | What's my balance?
```

**Fields:**
- `TIMESTAMP`: When the event occurred
- `LOGGER`: Which logger (conversations, ai_agent, system)
- `LEVEL`: INFO, WARNING, ERROR, CRITICAL
- `TYPE`: QUERY, RESPONSE, TOOL, ERROR
- `USER`: Masked email for privacy
- `CONTENT`: The actual content

---

### Agent Log Format
```
TIMESTAMP - LOGGER - LEVEL - FUNCTION:LINE - MESSAGE
```

**Example:**
```
2025-11-02 02:15:30 - ai_agent - INFO - query:125 - Query from u***@example.com: What's my balance?
```

---

## 🔐 Privacy & Security

### Email Masking
All emails are automatically masked in logs:
```
user@example.com     → u***@example.com
john.doe@company.com → j******e@company.com
a@test.com           → a*@test.com
```

**Implementation:**
```python
# From src/logger.py
def _mask_email(email: str) -> str:
    """Mask email for privacy"""
    local, domain = email.split('@')
    if len(local) <= 2:
        masked_local = local[0] + '*'
    else:
        masked_local = local[0] + '*' * (len(local) - 2) + local[-1]
    return f"{masked_local}@{domain}"
```

---

### Response Truncation
Long responses are truncated in logs to save space:
```python
# Responses > 200 chars are truncated
response_preview = response[:200] + "..." if len(response) > 200 else response
```

---

## 🛠️ Using Logs for Debugging

### Scenario 1: User Reports Error

**Steps:**
```bash
# 1. Find user's recent activity
cd logs
python3 view_logs.py search "u***@example.com"

# 2. Check for errors
python3 view_logs.py errors

# 3. View full context
grep -A 5 -B 5 "u***@example.com" conversations.log
```

---

### Scenario 2: System Performance Issues

**Steps:**
```bash
# 1. Check system events
python3 view_logs.py system

# 2. View statistics
python3 view_logs.py stats

# 3. Check for repeated errors
grep "ERROR" logs/*.log | sort | uniq -c
```

---

### Scenario 3: Tool Not Working

**Steps:**
```bash
# 1. Search for tool usage
python3 view_logs.py search "calculate_balance"

# 2. Check tool errors
grep "TOOL" logs/conversations.log | grep "ERROR"

# 3. View detailed agent logs
python3 view_logs.py agent 100
```

---

## 📊 Log Analysis Examples

### Count Queries Per User
```bash
grep "QUERY" logs/conversations.log | cut -d'|' -f2 | sort | uniq -c
```

**Output:**
```
  15 u***@example.com
  12 a***@example.com
   8 j***@example.com
```

---

### Most Common Queries
```bash
grep "QUERY" logs/conversations.log | cut -d'|' -f3 | sort | uniq -c | sort -rn | head -10
```

---

### Error Rate
```bash
total=$(grep "QUERY" logs/conversations.log | wc -l)
errors=$(grep "ERROR" logs/conversations.log | wc -l)
echo "Error rate: $errors / $total"
```

---

### Tool Usage Statistics
```bash
grep "TOOL" logs/conversations.log | cut -d'|' -f3 | cut -d' ' -f1 | sort | uniq -c
```

**Output:**
```
  25 calculate_balance
  18 get_user_claims
  12 search_knowledge_base
   8 get_user_summary
```

---

## 🔧 Advanced Configuration

### Change Log Level

**Edit:** `src/logger.py`

```python
# Current: INFO level
logger = setup_logger('ai_agent', level=logging.INFO)

# Change to DEBUG for more detail
logger = setup_logger('ai_agent', level=logging.DEBUG)

# Change to WARNING for less detail
logger = setup_logger('ai_agent', level=logging.WARNING)
```

**Levels:**
- `DEBUG`: Very detailed, for development
- `INFO`: Normal operations (current)
- `WARNING`: Only warnings and errors
- `ERROR`: Only errors
- `CRITICAL`: Only critical errors

---

### Change Log Rotation Settings

**Edit:** `src/logger.py`

```python
# Current settings
setup_logger(
    name='ai_agent',
    max_bytes=10 * 1024 * 1024,  # 10MB
    backup_count=5                # 5 backups
)

# Increase to 50MB with 10 backups
setup_logger(
    name='ai_agent',
    max_bytes=50 * 1024 * 1024,  # 50MB
    backup_count=10               # 10 backups
)
```

---

### Add Custom Logging

**In your code:**
```python
from logger import setup_logger

# Create custom logger
logger = setup_logger('my_module')

# Use it
logger.info("This is an info message")
logger.warning("This is a warning")
logger.error("This is an error")
logger.debug("This is debug info")
```

---

## 📝 Log Maintenance

### Cleaning Old Logs

**Manual cleanup:**
```bash
# Remove logs older than 30 days
find logs/ -name "*.log*" -mtime +30 -delete

# Remove all logs (careful!)
rm logs/*.log*
```

**Automated cleanup script:**
```bash
# Create: logs/cleanup.sh
#!/bin/bash
find logs/ -name "*.log*" -mtime +30 -delete
echo "Cleaned logs older than 30 days"
```

---

### Archiving Logs

```bash
# Archive logs by month
tar -czf logs_archive_$(date +%Y%m).tar.gz logs/*.log
mv logs_archive_*.tar.gz archives/

# Then clean current logs
rm logs/*.log*
```

---

### Monitoring Log Size

```bash
# Check total log size
du -sh logs/

# Check individual file sizes
ls -lh logs/*.log

# Alert if logs > 100MB
size=$(du -sm logs/ | cut -f1)
if [ $size -gt 100 ]; then
    echo "Warning: Logs exceed 100MB"
fi
```

---

## 🎯 Best Practices

### ✅ DO:
- Check logs regularly for errors
- Use log viewer for analysis
- Archive old logs monthly
- Monitor log file sizes
- Use search to find specific issues
- Keep logs for at least 30 days

### ❌ DON'T:
- Commit logs to git (already in .gitignore)
- Store sensitive data in logs (emails are masked)
- Let logs grow indefinitely
- Delete logs immediately after errors
- Ignore warning messages

---

## 🆘 Troubleshooting

### No Logs Being Created

**Check:**
```bash
# 1. Does logs directory exist?
ls -la logs/

# 2. Are permissions correct?
ls -la logs/

# 3. Test logger
cd src
python3 logger.py
```

**Fix:**
```bash
# Create logs directory
mkdir -p logs

# Fix permissions
chmod 755 logs/
```

---

### Logs Not Rotating

**Check:**
```bash
# Check file size
ls -lh logs/*.log

# Should rotate at 10MB
```

**Fix:**
```python
# In src/logger.py, verify:
max_bytes=10 * 1024 * 1024  # 10MB
```

---

### Can't View Logs

**Check:**
```bash
# 1. Is view_logs.py executable?
chmod +x logs/view_logs.py

# 2. Run from correct directory
cd logs
python3 view_logs.py list
```

---

## 📚 Quick Reference

### View Commands
```bash
cd logs

# Conversations
python3 view_logs.py conversations

# Errors
python3 view_logs.py errors

# System events
python3 view_logs.py system

# AI agent logs
python3 view_logs.py agent

# Statistics
python3 view_logs.py stats

# Search
python3 view_logs.py search "pattern"
```

### Direct Access
```bash
# View latest
tail -50 logs/conversations.log

# Follow live
tail -f logs/conversations.log

# Search
grep "ERROR" logs/*.log

# Count queries
grep "QUERY" logs/conversations.log | wc -l
```

---

## 🎓 Understanding Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| **DEBUG** | Development, detailed tracing | Variable values, function calls |
| **INFO** | Normal operations | User queries, responses, tool usage |
| **WARNING** | Potential issues | Deprecated features, slow responses |
| **ERROR** | Errors that don't stop execution | Failed tool calls, API errors |
| **CRITICAL** | Severe errors | System crashes, data corruption |

---

## 📞 Support

### Common Questions

**Q: Where are logs stored?**
A: In the `logs/` directory at project root.

**Q: How long are logs kept?**
A: Indefinitely until manually cleaned. Recommend 30-day retention.

**Q: Are logs backed up?**
A: No automatic backup. Use archiving script for backups
