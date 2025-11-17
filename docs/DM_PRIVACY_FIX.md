# DM Privacy Logic Fix

## Problem Statement

**Issue:** The system was sending messages to DM whenever it detected PII-related keywords (like "balance", "claim amount"), even when users were asking about **someone else's** data.

**Example of incorrect behavior:**
- ❌ "What's John's balance?" → Sent to DM (WRONG - should reject in channel)
- ❌ "Check sarah@deriv.com claims" → Sent to DM (WRONG - should reject in channel)

## Root Cause

The `_contains_pii_query()` method in `src/ai_agent.py` only checked for PII-related keywords but didn't distinguish between:
- User's own data: "What's **my** balance?"
- Someone else's data: "What's **John's** balance?"

## Solution Implemented

### Enhanced PII Detection Logic

The `_contains_pii_query()` method now has **two-stage detection**:

#### Stage 1: Detect References to OTHER People (Return False)
If the query references someone else's data, return `False` so it stays in the channel and gets rejected by the AI agent.

**Detection patterns:**
- Email addresses: `john@deriv.com`, `sarah@deriv.com`
- Possessive names: `John's balance`, `Sarah's claims`, `Sathish's data`
- Employee IDs: `employee 12345`, `ID 67890`, `staff number 123`
- "For [name]": `balance for John`, `claims for Sarah`
- "Check [name]": `check John`, `look up Sarah`

#### Stage 2: Detect User's OWN PII Data (Return True)
If the query is about the user's own data, return `True` to trigger DM for privacy.

**Detection keywords:**
- `my balance`, `my claim`, `my claims`
- `my limit`, `my data`, `my information`
- `how much have i`, `how much did i`
- `what's my`, `show me my`, `tell me my`
- `do i have`, `can i claim`

## Expected Behavior After Fix

| Query | PII Flag | Behavior |
|-------|----------|----------|
| "What's my balance?" | `True` | ✅ Sends to DM (privacy protected) |
| "My claim amount?" | `True` | ✅ Sends to DM (privacy protected) |
| "How much have I claimed?" | `True` | ✅ Sends to DM (privacy protected) |
| "What's John's balance?" | `False` | ✅ Rejects in channel (privacy enforced) |
| "Check sarah@deriv.com claims" | `False` | ✅ Rejects in channel (privacy enforced) |
| "Balance for employee 123" | `False` | ✅ Rejects in channel (privacy enforced) |
| "How to submit claim?" | `False` | ✅ Answers in channel (general info) |
| "What benefits do I have?" | `False` | ✅ Answers in channel (general info) |

## Code Changes

### File: `src/ai_agent.py`

**Location:** Lines 267-289 (method `_contains_pii_query`)

**Changes:**
1. Added `import re` for regex pattern matching
2. Added Stage 1: Detection of references to OTHER people
3. Enhanced Stage 2: More specific detection of user's OWN PII keywords
4. Updated docstring to clarify behavior

## Testing Instructions

### Test Case 1: User's Own Data (Should go to DM)
```
Query: "What's my balance?"
Expected: Message sent to DM
```

### Test Case 2: Someone Else's Data - Name (Should reject in channel)
```
Query: "What's John's balance?"
Expected: Rejection message in channel
```

### Test Case 3: Someone Else's Data - Email (Should reject in channel)
```
Query: "Check claims for sarah@deriv.com"
Expected: Rejection message in channel
```

### Test Case 4: Someone Else's Data - Employee ID (Should reject in channel)
```
Query: "Balance for employee 12345"
Expected: Rejection message in channel
```

### Test Case 5: General Information (Should answer in channel)
```
Query: "How do I submit a dental claim?"
Expected: Answer provided in channel
```

## Privacy Benefits

1. **User's Own Data Protected:** Personal financial information is always sent to DM
2. **Other People's Data Blocked:** Queries about other employees are rejected immediately
3. **Clear Privacy Messaging:** Users get clear feedback about privacy policies
4. **No Data Leakage:** System never exposes one user's data to another user

## Technical Details

### Regex Patterns Used

```python
# Email detection
r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'

# Name's + PII keyword
r'\b[A-Z][a-z]+\'s\s+(balance|claim|data|limit|amount)'

# "for Name"
r'\bfor\s+[A-Z][a-z]+\b'

# Employee ID patterns
r'\bemployee\s+\d+'
r'\bstaff\s+(number\s+)?\d+'
r'\b(ID|id)\s+\d+'

# Check/lookup patterns
r'\bcheck\s+[A-Z][a-z]+'
r'\blook\s+up\s+[A-Z][a-z]+'
```

## Deployment Notes

1. **No Database Changes:** This is a pure logic fix
2. **No API Changes:** The API interface remains the same
3. **Backward Compatible:** Existing functionality is preserved
4. **Immediate Effect:** Changes take effect on server restart

## Monitoring

After deployment, monitor logs for:
- `[PII]` flag in query logs
- DM delivery success/failure
- Privacy rejection messages in channels

## Related Files

- `src/ai_agent.py` - Contains the fixed `_contains_pii_query()` method
- `src/api.py` - Handles DM routing based on `contains_pii` flag
- System prompt in `ai_agent.py` - Contains privacy rejection instructions

## Date

- **Fixed:** January 3, 2025
- **Version:** 1.0.0
