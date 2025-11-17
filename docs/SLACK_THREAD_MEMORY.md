# Slack Thread-Aware Memory Guide

Complete guide for understanding and using thread-aware conversation memory in Slack deployment.

**Last Updated:** 2025-11-02  
**Status:** ✅ Production Ready

---

## 📊 Overview

The AI agent now supports **thread-aware memory**, enabling separate conversation contexts for each Slack thread. This ensures that conversations in different threads don't interfere with each other, providing a better user experience.

---

## 🎯 The Problem (Before)

### Without Thread-Aware Memory:

**Scenario:** Same user, two different Slack threads

**Thread 1 (#claims channel):**
```
User: What's my balance?
Bot: Your balance is MYR 630
User: Can I claim for dental?
Bot: Yes! You have MYR 630 remaining for dental...
```

**Thread 2 (#general channel, same user):**
```
User: How do I submit a claim?
Bot: To submit a claim...
User: What about optical?
Bot: You have MYR 630 remaining... ← WRONG! Remembers Thread 1's context
```

**Problem:** Both threads shared the same memory (keyed by user email only), causing context to bleed between unrelated conversations.

---

## ✅ The Solution (After)

### With Thread-Aware Memory:

**Memory Structure:**
```python
# Before (email-based)
memory = {
    "user@example.com": [msg1, msg2, msg3, ...]
}

# After (email + thread_id)
memory = {
    "user@example.com:thread_123": [msg1, msg2, msg3],  # Thread 1
    "user@example.com:thread_456": [msg1, msg2],        # Thread 2
}
```

**Result:** Each thread maintains its own isolated conversation context!

---

## 🔧 How It Works

### 1. Memory Key Generation

```python
def _get_memory_key(self, user_email: str, thread_id: str = None) -> str:
    """Generate memory key for user + optional thread."""
    if thread_id:
        return f"{user_email}:{thread_id}"
    return user_email  # Fallback for CLI
```

**Examples:**
- CLI mode: `"user@example.com"`
- Slack Thread 1: `"user@example.com:1234567890.123456"`
- Slack Thread 2: `"user@example.com:9876543210.654321"`

---

### 2. Query with Thread Context

```python
# In Slack handler (api.py)
thread_ts = event.get("thread_ts", event.get("ts"))

result = agent.query(
    user_email=user_email,
    query_text=query_text,
    thread_id=thread_ts  # ← Enables thread-specific memory
)
```

**What happens:**
1. Agent receives query with `thread_id`
2. Generates memory key: `email:thread_id`
3. Retrieves conversation history for that specific thread
4. Passes history to LLM for context
5. Stores new messages in thread-specific memory

---

### 3. Memory Isolation

```python
# Thread 1 memory
agent._get_user_memory("user@example.com", "thread_123")
# Returns: [Q1, A1, Q2, A2] from Thread 1 only

# Thread 2 memory
agent._get_user_memory("user@example.com", "thread_456")
# Returns: [Q1, A1] from Thread 2 only

# No cross-contamination!
```

---

## 📋 API Reference

### Query Method

```python
def query(
    self,
    user_email: str,
    query_text: str,
    thread_id: str = None  # ← New parameter
) -> Dict[str, Any]:
    """
    Execute AI agent query with optional thread context.
    
    Args:
        user_email: User's email
        query_text: User's query
        thread_id: Optional Slack thread ID for thread-specific memory
        
    Returns:
        Dict with answer and metadata
    """
```

**Usage:**

```python
# CLI mode (no thread)
result = agent.query("user@example.com", "What's my balance?")

# Slack mode (with thread)
result = agent.query(
    user_email="user@example.com",
    query_text="What's my balance?",
    thread_id="1234567890.123456"
)
```

---

### Clear Memory Method

```python
def clear_memory(
    self,
    user_email: str,
    thread_id: str = None  # ← New parameter
):
    """
    Clear conversation history for user or specific thread.
    
    Args:
        user_email: User's email
        thread_id: Optional thread ID (if None, clears all threads)
    """
```

**Usage:**

```python
# Clear specific thread
agent.clear_memory("user@example.com", "thread_123")

# Clear all threads for user
agent.clear_memory("user@example.com")
```

---

### Memory Statistics

```python
def get_memory_stats(self) -> Dict[str, Any]:
    """Get statistics about current memory usage."""
    return {
        "total_threads": 5,
        "total_messages": 50,
        "unique_users": 3,
        "avg_messages_per_thread": 10.0
    }
```

---

## 🧪 Testing

### Run Thread Isolation Tests

```bash
python3 tests/test_thread_memory.py
```

**What it tests:**
1. ✅ Thread isolation (threads don't share memory)
2. ✅ Context preservation (each thread remembers its own history)
3. ✅ Memory cleanup (can clear specific threads)
4. ✅ Backward compatibility (CLI mode still works)

**Expected output:**
```
======================================================================
TESTING THREAD-AWARE MEMORY ISOLATION
======================================================================

📍 THREAD 1 - First message
User: What's my claim balance?
Bot: Your remaining balance is MYR 630...

📍 THREAD 1 - Follow-up message
User: Can I use it for dental?
Bot: Yes! You have MYR 630 remaining...

📍 THREAD 2 - First message (different topic)
User: How do I submit a claim?
Bot: To submit your claim, please...

📍 THREAD 2 - Follow-up message
User: What documents do I need?
Bot: You'll need receipts, approval...

✅ THREAD ISOLATION TEST PASSED!
```

---

## 🎯 Use Cases

### Use Case 1: Multiple Topics, Same User

**Scenario:** User asks about different topics in different channels

**Thread 1 (#claims):**
```
User: What's my balance?
Bot: MYR 630
User: Can I claim for dental?
Bot: Yes, you have MYR 630 remaining
```

**Thread 2 (#hr):**
```
User: How do I submit a claim?
Bot: Use the Staff Claim Form...
User: What's the deadline?
Bot: Same month as service date
```

**Result:** ✅ Each thread maintains its own context

---

### Use Case 2: Long-Running Conversations

**Scenario:** User has extended conversation in one thread

**Thread 1:**
```
User: What's my balance?
Bot: MYR 630

User: Can I claim for dental?
Bot: Yes, you have MYR 630 remaining

User: What about optical?
Bot: Yes, optical is also covered under your MYR 630 balance

User: How do I submit?
Bot: Use the Staff Claim Form (remembers we're talking about dental/optical)
```

**Result:** ✅ Bot remembers entire conversation context

---

### Use Case 3: Team Collaboration

**Scenario:** Multiple users in same thread

**Thread 1 (#team-claims):**
```
User A: @ClaimBot What's my balance?
Bot: @User A Your balance is MYR 630

User B: @ClaimBot What's my balance?
Bot: @User B Your balance is MYR 1,200

User A: @ClaimBot Can I claim for dental?
Bot: @User A Yes, you have MYR 630 remaining (remembers User A's context)
```

**Result:** ✅ Each user has their own memory within the thread

---

## 🔄 Logging vs Memory

### Key Differences:

| Aspect | Logging | Memory |
|--------|---------|--------|
| **Purpose** | Audit/debugging | Provide context to AI |
| **Storage** | Files (`logs/*.log`) | RAM (Python dict) |
| **Persistence** | Permanent | Temporary (lost on restart) |
| **Accessed by** | Humans | AI agent |
| **Scope** | All conversations | Last 5 turns per thread |
| **Thread info** | Optional (can log thread_id) | Required for isolation |

### Logging with Thread Context:

```python
# Logs include thread info
[AI AGENT] Query from u***@example.com [thread: 12345678...]: What's my balance?
```

**Benefits:**
- ✅ Can filter logs by thread
- ✅ Debug thread-specific issues
- ✅ Audit trail per thread

---

## 💾 Memory Management

### Memory Retention

**Current behavior:**
- Keeps last **10 messages** (5 conversation turns) per thread
- Stored in **RAM** (lost on server restart)
- No automatic cleanup of old threads

### Memory Limits

```python
# In _add_to_memory()
if len(history) > 10:
    history = history[-10:]  # Keep only last 10 messages
```

**Why 10 messages?**
- Balances context vs memory usage
- 5 turns is usually enough for most conversations
- Prevents memory bloat

---

### Future Enhancements (Optional)

**1. Persistent Memory:**
```python
# Store memory in database
def _save_memory_to_db(self, key: str, history: List):
    """Save memory to database for persistence."""
    # Implementation here
```

**2. Auto-Cleanup:**
```python
# Clean up old threads (e.g., > 24 hours)
def _cleanup_old_threads(self, max_age_hours: int = 24):
    """Remove threads older than max_age_hours."""
    # Implementation here
```

**3. Memory Size Limits:**
```python
# Limit total memory usage
MAX_THREADS = 1000
MAX_MESSAGES_PER_THREAD = 20
```

---

## 🚀 Deployment Checklist

### For Slack Deployment:

- [x] Agent supports `thread_id` parameter
- [x] Slack handler extracts `thread_ts`
- [x] Slack handler passes `thread_id` to agent
- [x] Memory isolation tested
- [x] Backward compatibility maintained (CLI works)
- [ ] Deploy to production
- [ ] Monitor memory usage
- [ ] Test with real users

---

## 📊 Monitoring

### Check Memory Stats

```python
# In your monitoring script
stats = agent.get_memory_stats()
print(f"Active threads: {stats['total_threads']}")
print(f"Total messages: {stats['total_messages']}")
print(f"Unique users: {stats['unique_users']}")
```

### Alert Thresholds

```python
# Example monitoring
if stats['total_threads'] > 1000:
    alert("High memory usage: too many active threads")

if stats['avg_messages_per_thread'] > 20:
    alert("Threads have too many messages")
```

---

## 🆘 Troubleshooting

### Issue: Threads sharing context

**Symptom:** Bot references previous thread's conversation

**Cause:** `thread_id` not being passed

**Fix:**
```python
# Ensure thread_id is passed
result = agent.query(
    user_email=email,
    query_text=query,
    thread_id=thread_ts  # ← Don't forget this!
)
```

---

### Issue: Memory growing too large

**Symptom:** Server running out of RAM

**Cause:** Too many active threads

**Fix:**
```python
# Implement cleanup
def cleanup_old_threads():
    # Remove threads older than 24 hours
    pass
```

---

### Issue: Context lost after server restart

**Symptom:** Bot doesn't remember previous conversation

**Cause:** Memory is in RAM (not persistent)

**Fix:** This is expected behavior. For persistent memory, implement database storage.

---

## 📚 Related Documentation

- **AI Agent Guide:** `docs/AI_QUICKSTART.md`
- **Slack Deployment:** `docs/SLACK_DEPLOYMENT.md`
- **Logging Guide:** `docs/LOGGING_GUIDE.md`
- **Architecture:** `docs/ARCHITECTURE.md`

---

## ✅ Summary

**What Changed:**
- ✅ Agent now accepts optional `thread_id` parameter
- ✅ Memory keyed by `email:thread_id` instead of just `email`
- ✅ Each Slack thread has isolated conversation context
- ✅ Backward compatible (CLI mode still works)

**Benefits:**
- 😊 Better user experience (no context bleeding)
- 🎯 More accurate responses (correct context)
- 🧵 Natural threaded conversations in Slack
- 📊 Can track memory per thread

**Next Steps:**
1. Deploy to Slack
2. Test with real users
3. Monitor memory usage
4. Consider persistent storage if needed

---

**Last Updated:** November 2, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅
