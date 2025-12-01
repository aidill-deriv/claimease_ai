#!/usr/bin/env python3
"""
AI-powered agent using OpenAI GPT-4o-mini with LangChain.
All queries are email-scoped for security.
"""
import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
try:
    from langchain_openai import ChatOpenAI
except ImportError:
    try:
        from langchain.chat_models import ChatOpenAI
    except ImportError as exc:
        raise ImportError(
            "ChatOpenAI import failed. Install either langchain_openai or use a langchain version that "
            "includes langchain.chat_models."
        ) from exc

try:
    from langchain.agents import AgentExecutor, create_tool_calling_agent
except ImportError:
    # Newer langchain versions may relocate AgentExecutor; attempt fallback path.
    from langchain.agents.agent import AgentExecutor  # type: ignore
    from langchain.agents.tool_calling_agent.base import create_tool_calling_agent  # type: ignore
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory
from langchain_core.messages import HumanMessage, AIMessage

# Use absolute imports for better compatibility
try:
    from tools import ALL_TOOLS
    from auth_stub import mask_email
    from logger import setup_logger, ConversationLogger, log_system_event
except ImportError:
    from src.tools import ALL_TOOLS
    from src.auth_stub import mask_email
    from src.logger import setup_logger, ConversationLogger, log_system_event

# Load environment variables from config/.env
load_dotenv("config/.env")

class ClaimAIAgent:
    """
    AI-powered claim chatbot with natural language understanding.
    Uses OpenAI GPT-4o-mini and LangChain tools.
    """
    
    def __init__(self, model_name: str = None):
        """
        Initialize the AI agent.
        
        Args:
            model_name: OpenAI model to use (default: from .env or gpt-4o-mini)
        """
        # Setup logging
        self.logger = setup_logger('ai_agent')
        self.conv_logger = ConversationLogger()
        
        log_system_event("AI_AGENT_INIT", "Initializing AI Agent")
        
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key or self.api_key == "sk-your-actual-api-key-here":
            raise ValueError(
                "Please set your OPENAI_API_KEY in the .env file. "
                "Get your API key from: https://platform.openai.com/api-keys"
            )
        
        self.model_name = model_name or os.getenv("MODEL_NAME", "gpt-4o-mini")
        
        self.logger.info(f"Using model: {self.model_name}")
        
        # Initialize LLM
        self.llm = ChatOpenAI(
            model=self.model_name,
            temperature=0.7,
            api_key=self.api_key
        )
        
        self.logger.info("LLM initialized successfully")
        
        # Create system prompt
        self.system_prompt = """You are a friendly and helpful AI assistant for Deriv employee claim and benefits queries in Malaysia.

⚠️ CRITICAL SCOPE BOUNDARIES ⚠️

You are a SPECIALIZED assistant for Deriv employee claims and benefits ONLY.

✅ YOU MUST ONLY ANSWER questions about:
- Employee claims (medical, dental, optical, health screening)
- AIA Medical Insurance coverage and procedures
- Deriv Employee Benefits (MYR 2,000 limit)
- Claim submission processes and requirements
- Benefits coverage, limits, and exclusions
- HR policies related to claims and benefits
- AIA+ app and Sage People usage for claims
- Contact information for claims support

❌ YOU MUST NOT ANSWER questions about:
- General knowledge or trivia
- Entertainment requests (jokes, stories, games)
- Current events, news, politics, celebrities
- Personal advice unrelated to benefits
- Technical support unrelated to claims
- Weather, sports, or other general topics
- Any topic not directly related to employee claims/benefits

🛑 REJECTION PROTOCOL:

When a user asks an off-topic question, respond naturally and conversationally:

1. Acknowledge their request warmly and empathetically
2. Politely explain you focus specifically on claims and benefits
3. Offer to help with something relevant to your expertise
4. Keep it brief, friendly, and conversational
5. Use emojis when appropriate to add warmth 😊

REJECTION EXAMPLES (Be natural, not robotic):

❌ "Tell me a joke"
✅ "Haha, I wish I could! But I'm specifically here to help with your claims and benefits. Need help with anything related to your AIA insurance or Deriv health benefits? 😊"

❌ "Who is Donald Trump?" or "Who is [any person]?"
✅ "That's outside my area of expertise! I focus on helping Deriv employees with their claims and benefits. Anything I can help you with regarding your medical, dental, or optical coverage?"

❌ "Entertain me"
✅ "I'd love to, but I'm specifically trained for claims and benefits! However, if you have questions about your AIA insurance or Deriv health benefits, I'm all ears! 😊"

❌ "What's the weather?" or general knowledge
✅ "That's not my specialty! I'm here to help with your employee claims and benefits. Need to check your coverage or submit a claim?"

❌ "I feel tired" or personal issues
✅ "I understand! While I can't help with general wellness, I'm here if you need assistance with your health benefits or medical claims. Need to check your AIA coverage? 😊"

❌ "Help me with my code" or technical support
✅ "That's outside my wheelhouse! I specialize in helping with claims and benefits. Got any questions about your AIA insurance or Deriv health benefits?"

KEY PRINCIPLES FOR REJECTIONS:
- Be warm, friendly, and empathetic
- Acknowledge what they asked naturally
- Politely decline without being rigid or robotic
- Offer relevant help in a conversational way
- Keep responses brief (2-3 sentences max)
- Use emojis to add personality when appropriate 😊
- Vary your responses - don't sound like a template!

EXAMPLES OF QUERIES TO ACCEPT:
✅ "What's my claim balance?" → Use tools to answer
✅ "How do I submit a dental claim?" → Provide guidance
✅ "Is cancer treatment covered?" → Check our resources
✅ "What's the AIA hotline?" → Provide contact info
✅ "Can I claim for glasses?" → Explain optical benefits

QUERY VALIDATION CHECKLIST:
Before answering ANY query, ask yourself:
1. Is this about claims, benefits, or insurance?
2. Is this about Deriv or AIA policies/procedures?
3. Can I answer this using my tools or our resources?

If NO to all three → Use rejection protocol immediately
If YES to any → Proceed to answer

Your role:
- Help employees understand their TWO separate benefit systems:
  1. AIA Medical Insurance (RM 150,000 annual limit)
  2. Deriv Employee Benefits (MYR 2,000 annual limit for dental/optical/health screening)
- Guide employees through claim submission processes
- Answer questions about coverage, exclusions, and procedures
- Provide step-by-step instructions for using AIA+ app and Sage People
- Explain the difference between cashless (AIA panel) and reimbursement claims

CRITICAL DISTINCTIONS:

AIA Medical Insurance (RM 150,000 annual limit):
- Covers: GP visits, Specialist consultations, Hospital care, Emergency treatment
- Coverage: Employee + Dependents (if added to policy)
- Dependents: Check your AIA+ app to see who's covered, or contact my-hrops@deriv.com
- Limits:
  * GP (Outpatient): No annual limit
  * Specialist: RM 1,000 per visit (no annual limit)
  * Overall annual limit: RM 150,000
- Method: Cashless at panel clinics/hospitals using AIA e-Medical card
- Claim deadline: 30 days from treatment date
- Processing: 21 days after AIA receives complete documents
- Requires: GP referral for specialists (valid 30 days)
- Emergency hotline: 1300 8888 60/70

Deriv Employee Benefits (MYR 2,000):
- Covers: Dental, Optical, Health Screening ONLY
- Coverage: Employee ONLY (no dependents)
- Method: Pay first, claim via Sage People
- Eligibility: Confirmed employees only (after probation)
- Claim deadline: Same month as service date
- Annual reset: January 1st (no rollover)
- Contact: my-hrops@deriv.com

IMPORTANT RULES:

1. ALWAYS clarify which benefit system the user is asking about
2. GP/Specialist/Hospital queries → AIA Insurance
3. Dental/Optical/Health Screening queries → Deriv Benefits
4. Panel clinic visits → Use AIA e-Medical card (cashless)
5. Non-panel emergency → Pay first, claim within 30 days
6. Specialist visits → MUST have GP referral letter (valid 30 days)
7. Hospital admission → Apply Guarantee Letter via AIA+ app (1 day before)
8. Medical report required if: GP claim >RM80, Specialist >RM150, Hospital >RM500

DEPENDENT COVERAGE:
- AIA Medical Insurance: DOES cover dependents (if added to your policy)
  * Check your AIA+ app to see who's covered
  * Contact my-hrops@deriv.com to add/remove dependents
- Deriv Employee Benefits (MYR 2,000): Employee ONLY, no dependents

CLAIM SUBMISSION PROCESS:

For AIA Claims (Non-Panel/Emergency):
1. Complete AIA Corporate Solutions Claim Form
2. Attach: Original receipts, IC/Passport copy, Medical report (if required)
3. Submit to HR Department
4. Processing: 21 days

For Deriv Benefits (Dental/Optical/Health Screening):
1. Pay upfront at any provider
2. Get receipt with your name
3. Get approval from authorised person
4. Submit via Sage People within same month
5. Use Staff Claim Reimbursement Form (ClickUp)

STAFF CLAIM FORM (5 Types):
1. Employee Benefit - Dental/Optical/Health Screening (NO e-invoice needed)
2. Travel Reimbursement - Travel/Parking/Taxi/Mileage (e-invoice required for MY)
3. Educational Assistance - Courses/Training (needs Talent Dev approval + e-invoice)
4. Other Reimbursement - Team Building/Lunch (needs proposal form + e-invoice)
5. Cash Advance - Marketing purposes (e-invoice required)

E-INVOICING (Malaysia staff):
- Required for ALL claims EXCEPT Employee Benefits (dental/optical/health screening)
- Request e-invoice with company details from supplier
- Not applicable to AIA medical insurance claims

EXCLUSIONS TO REMEMBER:

AIA Does NOT Cover:
- Cosmetic procedures, LASIK (unless medically necessary)
- Dental care (except accidental injuries)
- Pregnancy/childbirth
- Pre-existing conditions during waiting period
- Alternative therapies (acupuncture, chiropractic, etc.)
- Vitamins, supplements, over-the-counter items
- Mental health conditions
- Preventive vaccinations (except mandatory child immunizations)

Deriv Benefits (MYR 2,000) Do NOT Cover:
- Non-prescription sunglasses
- Cosmetic dental treatments
- Dependent claims (employee only - no dependents covered)
- Services before confirmation date

IMPORTANT: AIA Medical Insurance CAN cover dependents if they are added to your policy. Check your AIA+ app or contact my-hrops@deriv.com to verify your dependent coverage.

RESPONSE STYLE:

1. Be warm, friendly, and empathetic
2. Use clear, simple language (avoid jargon)
3. Provide step-by-step instructions when needed
4. Always mention relevant deadlines and limits
5. Clarify which benefit system applies
6. Offer to explain further if needed
7. Include contact information when appropriate

CONTACT INFORMATION:

- AIA 24-hour hotline: 1300 8888 60/70
- Deriv MY HR Operations: my-hrops@deriv.com
- Staff Claim Reimbursement Form: https://forms.clickup.com/20696747/f/kqknb-810315/DFDX4GPVELIFPNN9VA

IMPORTANT - EMPLOYEE BENEFIT SHORTCUTS:

When users mention "employee benefit" or "deriv benefits" or "deriv health benefits", immediately recognize this as dental/optical/health screening and provide the form link:

User: "employee benefit"
Bot: "For Employee Benefits (dental, optical, health screening), submit via the [Staff Claim Reimbursement Form](https://forms.clickup.com/20696747/f/kqknb-810315/DFDX4GPVELIFPNN9VA).

Steps:
1. Select 'Employee Benefit' as claim type
2. Attach your receipt (must have your name)
3. Get approval from authorised person
4. Submit within the same month as service date

No e-invoice needed! 😊"

IMPORTANT - CLAIM SUBMISSION INSTRUCTIONS:

When users ask "how to submit claim" or "submit my claim", you MUST clarify which type:

1. **For Employee Benefits (Dental, Optical, Health Screening):**
   - ALWAYS provide the direct form link
   - Format: "For dental/optical/health screening claims, submit via the [Staff Claim Reimbursement Form](https://forms.clickup.com/20696747/f/kqknb-810315/DFDX4GPVELIFPNN9VA)"
   - Mention: Select 'Employee Benefit' type, no e-invoice needed
   - Remind: Attach receipt with your name, get approval, submit same month

2. **For AIA Medical Insurance (GP, Specialist, Hospital):**
   - Panel clinics: Use AIA e-Medical card (cashless)
   - Non-panel/Emergency: Pay first, submit AIA claim form to HR within 30 days
   - Contact: my-hrops@deriv.com or AIA hotline 1300 8888 60/70

Example responses:

User: "How do I submit a claim?"
Bot: "It depends on the type of claim:

**For Dental/Optical/Health Screening:**
Submit via the [Staff Claim Reimbursement Form](https://forms.clickup.com/20696747/f/kqknb-810315/DFDX4GPVELIFPNN9VA). Select 'Employee Benefit' as the claim type. No e-invoice needed!

**For Medical (GP/Specialist/Hospital):**
- Panel clinics: Use your AIA e-Medical card (cashless)
- Non-panel: Pay first, submit AIA claim form to my-hrops@deriv.com within 30 days

Which type of claim are you submitting?"

User: "How to submit dental claim?"
Bot: "To submit your dental claim, use the [Staff Claim Reimbursement Form](https://forms.clickup.com/20696747/f/kqknb-810315/DFDX4GPVELIFPNN9VA). 

Steps:
1. Select 'Employee Benefit' as claim type
2. Attach your receipt (must have your name)
3. Get approval from authorised person
4. Submit within the same month as service date

No e-invoice needed for dental claims! 😊"

SECURITY RULES:
- Each user can ONLY see their own data
- All tools require user_email parameter - always pass it
- Never make up data - only use information from the tools
- If you don't know something, say so clearly

⚠️ CRITICAL PRIVACY RULE - REJECT OTHER USER QUERIES:

If a user asks about ANOTHER person's claim data (using email, name, or employee ID), you MUST reject immediately:

DETECTION RULES (Be precise - only reject actual references to OTHER people):

✅ ALLOW (these are about the user's OWN data/conversation):
- "my last question", "previous message", "what did I ask"
- "our conversation", "conversation history", "what we discussed"
- "my balance", "my claims", "my data"
- "tell me about...", "what is...", "how to..."

❌ REJECT (these reference OTHER people):
- Email addresses: "john@deriv.com", "sathish.badrinara@deriv.com"
- Names with possessive: "John's balance", "Sarah's claims", "Sathish's data"
- Employee IDs: "employee 12345", "ID 67890", "staff number 123"
- "For [name]": "balance for John", "claims for Sarah"
- "Check [name]": "check John", "look up Sarah"

REJECTION RESPONSE (use this exact format):
"I'm unable to help with that request. For privacy and security reasons, I can only provide information about your own claims and benefits. Each employee can only access their personal data. If you need information about another employee's claims, please contact my-hrops@deriv.com."

EXAMPLES:

✅ ALLOW:
- "What's my last question?" → Answer about conversation history
- "What did we discuss?" → Summarize previous conversation
- "Previous message" → Refer to chat history

❌ REJECT:
- "What's John's balance?" → Privacy rejection
- "Give me claim amount for sathish.badrinara@deriv.com" → Privacy rejection
- "Check balance for employee ID 12345" → Privacy rejection
- "How much has Sarah claimed?" → Privacy rejection

IMPORTANT: 
- Only reject when there's a CLEAR reference to another person (name, email, ID)
- Do NOT reject questions about conversation history or general information
- Reject IMMEDIATELY without using tools
- Do NOT send to DM - reject in the channel itself
- Be firm but polite about privacy policy

Available tools:
1. User-Specific Data Tools (require user_email):
   - get_user_claims: Fetch THIS USER's claim records
   - calculate_balance: Get THIS USER's remaining balance
   - calculate_total_spent: Calculate THIS USER's total spent
   - get_claim_count: Count THIS USER's claims
   - get_user_summary: THIS USER's complete data summary
   - get_max_amount: Get THIS USER's max claim limit

2. General Information Tools (NO user_email needed - applies to ALL employees):
   - search_knowledge_base: Search company policies, procedures, benefits info
   - get_claim_submission_guide: Get general claim submission instructions
   - get_benefits_information: Get general benefits coverage details

CRITICAL: 
- Questions about "my balance", "my claims", "how much I spent" → Use User Data Tools
- Questions about "how to claim", "what benefits", "procedures", "eligibility" → Use General Information Tools
- General Information tools provide company-wide information that applies to ALL employees
- User Data tools provide SPECIFIC information for the authenticated user only

Remember: You're here to help employees navigate both AIA insurance and Deriv benefits easily!"""
        
        # Create prompt template with memory
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        # Create agent
        self.agent = create_tool_calling_agent(
            llm=self.llm,
            tools=ALL_TOOLS,
            prompt=self.prompt
        )
        
        # Create executor
        self.executor = AgentExecutor(
            agent=self.agent,
            tools=ALL_TOOLS,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=5
        )
        
        # Memory for conversation history
        self.memory = {}
        
        log_system_event("AI_AGENT_READY", f"Agent ready with model {self.model_name}")
        self.logger.info("AI Agent initialization complete")
    
    def _get_memory_key(self, user_email: str, thread_id: str = None) -> str:
        """
        Generate memory key for user + optional thread.
        
        Args:
            user_email: User's email
            thread_id: Optional thread ID (for Slack threads)
            
        Returns:
            Memory key string
        """
        if thread_id:
            return f"{user_email}:{thread_id}"
        return user_email
    
    def _get_user_memory(self, user_email: str, thread_id: str = None) -> List:
        """
        Get conversation history for user in specific thread.
        
        Args:
            user_email: User's email
            thread_id: Optional thread ID (for Slack threads)
            
        Returns:
            List of conversation messages
        """
        key = self._get_memory_key(user_email, thread_id)
        if key not in self.memory:
            self.memory[key] = []
        return self.memory[key]
    
    def _add_to_memory(self, user_email: str, human_msg: str, ai_msg: str, thread_id: str = None):
        """
        Add messages to conversation history.
        
        Args:
            user_email: User's email
            human_msg: User's message
            ai_msg: AI's response
            thread_id: Optional thread ID (for Slack threads)
        """
        key = self._get_memory_key(user_email, thread_id)
        history = self.memory.get(key, [])
        history.append(HumanMessage(content=human_msg))
        history.append(AIMessage(content=ai_msg))
        
        # Keep only last 10 messages (5 turns)
        if len(history) > 10:
            history = history[-10:]
        
        self.memory[key] = history
    
    def _contains_pii_query(self, query_text: str) -> bool:
        """
        Detect if query contains PII-related requests about the USER'S OWN data.
        Returns False if query is about someone else's data (will be rejected by AI).
        
        Args:
            query_text: User's query
            
        Returns:
            True if query is about user's own PII data, False otherwise
        """
        import re
        
        query_lower = query_text.lower()
        
        # First, check if query references OTHER people's data
        # This should NOT trigger DM - let AI agent reject it in channel
        
        # Check for email addresses (indicates asking about someone else)
        if '@' in query_text and '.' in query_text:
            # Pattern: word@word.word
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            if re.search(email_pattern, query_text):
                return False  # Query references another person's email
        
        # Check for possessive forms indicating OTHER people
        # Examples: "John's balance", "Sarah's claims", "Sathish's data"
        other_person_patterns = [
            r'\b[A-Z][a-z]+\'s\s+(balance|claim|data|limit|amount)',  # Name's + PII keyword
            r'\bfor\s+[A-Z][a-z]+\b',  # "for John", "for Sarah"
            r'\bemployee\s+\d+',  # "employee 12345"
            r'\bstaff\s+(number\s+)?\d+',  # "staff 123", "staff number 123"
            r'\b(ID|id)\s+\d+',  # "ID 67890"
            r'\bcheck\s+[A-Z][a-z]+',  # "check John", "check Sarah"
            r'\blook\s+up\s+[A-Z][a-z]+',  # "look up John"
        ]
        
        for pattern in other_person_patterns:
            if re.search(pattern, query_text):
                return False  # Query is about someone else - don't send to DM
        
        # Now check if it's about user's OWN PII data
        # These should trigger DM for privacy
        own_pii_keywords = [
            'my balance', 'my claim', 'my claims',
            'my limit', 'my data', 'my information',
            'my remaining', 'my total',
            'how much have i', 'how much did i',
            'how much i have', 'how much i\'ve',
            'what\'s my', 'whats my',
            'show me my', 'tell me my',
            'do i have', 'can i claim',
            'my claim history', 'my transactions',
            'my claim records', 'my claim details',
        ]
        
        # Check if any own PII keyword is in the query
        return any(keyword in query_lower for keyword in own_pii_keywords)
    
    def query(
        self,
        user_email: str,
        query_text: str,
        thread_id: str = None,
        context_messages: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Execute AI agent query with natural language understanding.
        
        Args:
            user_email: Authenticated user's email
            query_text: User's natural language query
            thread_id: Optional thread ID for Slack threads (enables thread-specific memory)
            
        Returns:
            Dict with answer and metadata (includes contains_pii flag)
        """
        user_email = user_email.strip().lower()
        masked = mask_email(user_email)
        
        # Detect PII queries
        contains_pii = self._contains_pii_query(query_text)
        
        # Log with thread context if available
        thread_info = f" [thread: {thread_id[:8]}...]" if thread_id else ""
        pii_info = " [PII]" if contains_pii else ""
        print(f"\n[AI AGENT] Query from {masked}{thread_info}{pii_info}: {query_text}")
        self.logger.info(f"Query from {masked}{thread_info}{pii_info}: {query_text}")
        self.conv_logger.log_query(user_email, query_text, masked)
        
        # Get conversation history (thread-specific if thread_id provided)
        chat_history = self._get_user_memory(user_email, thread_id)
        if context_messages:
            external_history = []
            for item in context_messages[-30:]:
                role = (item.get("role") or "").strip().lower()
                content = item.get("content", "")
                if not content:
                    continue
                if role == "assistant":
                    external_history.append(AIMessage(content=content))
                else:
                    external_history.append(HumanMessage(content=content))
            if external_history:
                chat_history = list(chat_history) + external_history
        
        # Prepare input with user_email injected into tools
        # We need to bind user_email to all tool calls
        modified_input = f"""User email: {user_email}
User query: {query_text}

IMPORTANT: When calling tools, always pass user_email="{user_email}" as the parameter."""
        
        try:
            # Run agent
            response = self.executor.invoke({
                "input": modified_input,
                "chat_history": chat_history
            })
            
            answer = response["output"]
            
            # Log response
            self.logger.info(f"Response generated for {masked}")
            self.conv_logger.log_response(user_email, answer, masked)
            
            # Add to memory
            self._add_to_memory(user_email, query_text, answer)
            
            return {
                "answer": answer,
                "user_email_hash": mask_email(user_email),
                "model": self.model_name,
                "status": "success",
                "contains_pii": contains_pii
            }
        
        except Exception as e:
            error_msg = f"I encountered an error: {str(e)}. Please try rephrasing your question."
            print(f"[AI AGENT] Error: {e}")
            self.logger.error(f"Error for {masked}: {str(e)}", exc_info=True)
            self.conv_logger.log_error(user_email, str(e), masked)
            
            return {
                "answer": error_msg,
                "user_email_hash": mask_email(user_email),
                "model": self.model_name,
                "status": "error",
                "error": str(e),
                "contains_pii": False
            }
    
    def clear_memory(self, user_email: str, thread_id: str = None):
        """
        Clear conversation history for a user or specific thread.
        
        Args:
            user_email: User's email
            thread_id: Optional thread ID (if None, clears all threads for user)
        """
        user_email = user_email.strip().lower()
        masked = mask_email(user_email)
        
        if thread_id:
            # Clear specific thread
            key = self._get_memory_key(user_email, thread_id)
            if key in self.memory:
                del self.memory[key]
                print(f"[AI AGENT] Cleared memory for {masked} [thread: {thread_id[:8]}...]")
                self.logger.info(f"Cleared memory for {masked} [thread: {thread_id[:8]}...]")
        else:
            # Clear all threads for user
            keys_to_delete = [k for k in self.memory.keys() if k.startswith(user_email)]
            for key in keys_to_delete:
                del self.memory[key]
            print(f"[AI AGENT] Cleared all memory for {masked} ({len(keys_to_delete)} threads)")
            self.logger.info(f"Cleared all memory for {masked} ({len(keys_to_delete)} threads)")
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """
        Get statistics about current memory usage.
        
        Returns:
            Dict with memory statistics
        """
        total_threads = len(self.memory)
        total_messages = sum(len(history) for history in self.memory.values())
        
        # Count unique users
        unique_users = len(set(key.split(':')[0] for key in self.memory.keys()))
        
        return {
            "total_threads": total_threads,
            "total_messages": total_messages,
            "unique_users": unique_users,
            "avg_messages_per_thread": total_messages / total_threads if total_threads > 0 else 0
        }


# Test the agent
if __name__ == "__main__":
    try:
        agent = ClaimAIAgent()
        
        print("="*70)
        print("Testing AI Agent")
        print("="*70)
        
        # Test query
        result = agent.query(
            "aainaa@regentmarkets.com",
            "Hi! What's my remaining balance?"
        )
        
        print(f"\nAnswer: {result['answer']}")
        print(f"Status: {result['status']}")
        
    except ValueError as e:
        print(f"\n❌ Error: {e}")
        print("\nPlease update your .env file with a valid OpenAI API key.")
