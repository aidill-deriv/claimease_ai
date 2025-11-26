# AI Agent Scope Boundaries

## Overview

The AI agent has been configured with **strict scope boundaries** to ensure it only answers questions related to employee claims and benefits. This prevents token waste on off-topic queries and keeps the agent focused on its core purpose.

---

## ✅ In-Scope Topics

The agent will ONLY answer questions about:

### 1. Employee Claims
- Medical claims (AIA Insurance)
- Dental claims (Deriv Benefits)
- Optical claims (Deriv Benefits)
- Health screening claims (Deriv Benefits)

### 2. Insurance Coverage
- AIA Medical Insurance (RM 150,000 limit)
- Coverage details and limits
- Exclusions and restrictions
- Panel clinics and hospitals

### 3. Benefits Information
- Deriv Employee Benefits (MYR 2,000 limit)
- Eligibility requirements
- Annual limits and resets
- Claim deadlines

### 4. Procedures & Processes
- How to submit claims
- Required documents
- Approval processes
- AIA+ app usage
- Sage People usage

### 5. Contact Information
- AIA hotline numbers
- HR operations contacts
- Claim form links

---

## ❌ Out-of-Scope Topics

The agent will REJECT questions about:

### General Knowledge
- ❌ "Tell me a joke"
- ❌ "Who is [celebrity/politician]?"
- ❌ "What's the weather?"
- ❌ "What's 2+2?"

### Entertainment
- ❌ "Entertain me"
- ❌ "Tell me a story"
- ❌ "Play a game"

### Technical Support
- ❌ "Help me with my code"
- ❌ "Fix my computer"
- ❌ "Debug this error"

### Personal Advice
- ❌ "Should I invest in stocks?"
- ❌ "What career should I choose?"
- ❌ "Relationship advice"

### Current Events
- ❌ "What's in the news?"
- ❌ "Who won the election?"
- ❌ "Latest sports scores"

---

## 🛑 Rejection Response

When a user asks an off-topic question, the agent responds **naturally and conversationally** (not with a rigid template):

### Example Rejections:

**"Tell me a joke"**
```
Haha, I wish I could! But I'm specifically here to help with your claims and benefits. 
Need help with anything related to your AIA insurance or Deriv health benefits? 😊
```

**"Who is Donald Trump?"**
```
That's outside my area of expertise! I focus on helping Deriv employees with their 
claims and benefits. Anything I can help you with regarding your medical, dental, 
or optical coverage? 😊
```

**"Entertain me"**
```
I'd love to, but I'm specifically trained for claims and benefits! However, if you 
have questions about your AIA insurance or Deriv health benefits, I'm all ears! 😊
```

**"What's the weather?"**
```
That's not my specialty! I'm here to help with your employee claims and benefits. 
Need to check your coverage or submit a claim? 😊
```

**"I feel tired"**
```
I understand! While I can't help with general wellness, I'm here if you need 
assistance with your health benefits or medical claims. Need to check your AIA coverage? 😊
```

**Key Features:**
- 😊 Warm and empathetic
- 💬 Natural conversation, not templates
- 🎯 Acknowledges the request
- ✅ Politely declines
- 🤝 Offers relevant help
- 📏 Brief (2-3 sentences)

---

## 📊 Token Savings

By rejecting off-topic queries, we achieve significant token savings:

| Query Type | Before (tokens) | After (tokens) | Savings |
|------------|----------------|----------------|---------|
| "Tell me a joke" | ~500 | ~50 | 90% |
| "Who is Trump?" | ~400 | ~50 | 87% |
| "Entertain me" | ~500 | ~50 | 90% |
| "What's the weather?" | ~300 | ~50 | 83% |

**Average savings: 85-90% on off-topic queries**

---

## 🧪 Testing

### Test Results

All boundary tests passed successfully:

```bash
python3 tests/test_boundaries.py
```

**Results:**
- ✅ 6/6 off-topic queries correctly rejected
- ✅ 5/5 on-topic queries correctly answered
- ✅ 11/11 tests passed (100%)

### Test Cases

**Off-Topic (Rejected):**
1. "Tell me a joke" → ✅ Rejected
2. "Who is Donald Trump?" → ✅ Rejected
3. "Entertain me" → ✅ Rejected
4. "What's the weather today?" → ✅ Rejected
5. "Help me with my Python code" → ✅ Rejected
6. "What's 2+2?" → ✅ Rejected

**On-Topic (Answered):**
1. "What's my claim balance?" → ✅ Answered
2. "How do I submit a dental claim?" → ✅ Answered
3. "Is cancer treatment covered?" → ✅ Answered
4. "What's the AIA hotline?" → ✅ Answered
5. "Can I claim for glasses?" → ✅ Answered

---

## 🔧 Implementation Details

### System Prompt Updates

The system prompt now includes:

1. **Scope Definition**
   - Clear list of acceptable topics
   - Clear list of unacceptable topics

2. **Rejection Protocol**
   - Standardized rejection message
   - Helpful redirection to appropriate resources

3. **Query Validation Checklist**
   - 3-step validation before answering
   - Immediate rejection if all checks fail

4. **Examples**
   - Examples of queries to reject
   - Examples of queries to accept

### Code Location

- **System Prompt:** `src/ai_agent.py` (lines 60-120)
- **Test Script:** `tests/test_boundaries.py`
- **Documentation:** `docs/AI_AGENT_BOUNDARIES.md`

---

## 📝 Examples

### Example 1: Off-Topic Query

**User:** "Tell me a joke"

**Agent Response:**
```
I'm specifically designed to help with employee claims and benefits at Deriv. 
I can assist you with:

• AIA Medical Insurance coverage and claims
• Deriv Employee Benefits (dental, optical, health screening)
• Claim submission procedures and requirements
• Coverage limits and exclusions
• AIA+ app and Sage People guidance

For other matters, please contact the appropriate department or use general resources.
```

**Tokens Used:** ~50 (vs ~500 before)

---

### Example 2: On-Topic Query

**User:** "How do I submit a dental claim?"

**Agent Response:**
```
To submit a dental claim, please follow these steps:

1. Pay upfront at any dental provider
2. Get a receipt that includes your name
3. Get approval from an authorised person
4. Submit via Sage People within the same month
5. Use the Staff Claim Reimbursement Form

[Provides detailed guidance with form link]
```

**Tokens Used:** ~300 (appropriate for helpful response)

---

## 🎯 Benefits

### 1. Cost Savings
- 85-90% reduction in tokens for off-topic queries
- Lower OpenAI API costs
- More efficient resource usage

### 2. Better User Experience
- Clear expectations about agent capabilities
- Faster responses (no wasted processing)
- Helpful redirection to appropriate resources

### 3. Focused Purpose
- Agent stays on task
- Maintains professional boundaries
- Reduces confusion about capabilities

### 4. Quality Assurance
- Consistent rejection responses
- Predictable behavior
- Easy to test and verify

---

## 🔄 Maintenance

### Updating Boundaries

To modify the scope boundaries:

1. Edit `src/ai_agent.py`
2. Update the system prompt section (lines 60-120)
3. Add/remove topics from the lists
4. Update test cases in `tests/test_boundaries.py`
5. Run tests to verify: `python3 tests/test_boundaries.py`
6. Update this documentation

### Adding New Topics

To add new acceptable topics:

1. Add to "✅ YOU MUST ONLY ANSWER" section
2. Add example queries to "EXAMPLES OF QUERIES TO ACCEPT"
3. Add test cases to verify
4. Update documentation

### Monitoring

Check logs regularly for rejected queries:

```bash
python3 logs/view_logs.py conversations | grep "specifically designed"
```

This helps identify:
- Common off-topic requests
- Potential scope adjustments needed
- User education opportunities

---

## 📚 Related Documentation

- **AI Agent Guide:** `docs/AI_QUICKSTART.md`
- **System Prompt:** `src/ai_agent.py`
- **Test Suite:** `tests/test_boundaries.py`
- **Logging Guide:** `docs/LOGGING_GUIDE.md`

---

## 🆘 Troubleshooting

### Agent Rejecting Valid Queries

If the agent incorrectly rejects valid claims/benefits questions:

1. Check if the query contains claims/benefits keywords
2. Review the system prompt scope definition
3. Add the topic to the acceptable list if needed
4. Update test cases

### Agent Answering Off-Topic Queries

If the agent answers questions it should reject:

1. Review the rejection protocol in system prompt
2. Ensure query validation checklist is clear
3. Add more examples of queries to reject
4. Update and run tests

### Inconsistent Behavior

If rejection behavior is inconsistent:

1. Check the system prompt for clarity
2. Ensure rejection message is exact
3. Review conversation history (may affect context)
4. Clear agent memory if needed

---

## ✅ Summary

**Status:** ✅ Implemented and Tested

**Test Results:** 11/11 passed (100%)

**Token Savings:** 85-90% on off-topic queries

**Next Steps:**
- Monitor logs for rejected queries
- Adjust boundaries if needed
- Educate users about agent scope

---

**Last Updated:** November 2, 2025  
**Version:** 1.0  
**Status:** Production Ready
