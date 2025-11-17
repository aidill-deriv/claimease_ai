#!/usr/bin/env python3
"""
Chat Assistant Page - AI-powered conversational interface
"""
import streamlit as st
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.ai_agent import ClaimAIAgent
from utils.ui_helpers import load_css, check_authentication, render_sidebar, render_page_header

# Page config
st.set_page_config(
    page_title="Chat Assistant - ClaimEase",
    page_icon="💬",
    layout="wide"
)

# Load custom CSS
load_css()

def initialize_agent():
    """Initialize AI agent (cached)"""
    if 'agent' not in st.session_state:
        try:
            st.session_state.agent = ClaimAIAgent()
        except Exception as e:
            st.error(f"❌ Failed to initialize AI agent: {str(e)}")
            st.info("💡 Make sure you have set up your .env file with OPENAI_API_KEY")
            st.stop()

def initialize_chat_history():
    """Initialize chat history"""
    if 'messages' not in st.session_state:
        st.session_state.messages = []
        # Add welcome message
        st.session_state.messages.append({
            "role": "assistant",
            "content": """👋 **Hi! I'm your ClaimEase AI Assistant.**

I'm here to help you with:

✅ Checking your claim balance and spending  
✅ Understanding claim submission processes  
✅ AIA Medical Insurance coverage and procedures  
✅ Deriv Health Benefits (dental, optical, health screening)  
✅ Policy information and FAQs

**What would you like to know?**"""
        })

def main():
    """Main chat page"""
    user_email = check_authentication()
    
    # Render sidebar
    render_sidebar()
    
    # Page header
    render_page_header(
        "Chat Assistant",
        "Ask me anything about your claims and benefits!",
        "💬"
    )
    
    # Initialize
    initialize_agent()
    initialize_chat_history()
    
    # Sidebar with quick actions
    with st.sidebar:
        st.markdown("---")
        st.markdown("### 💡 Quick Questions")
        
        quick_questions = [
            "What's my remaining balance?",
            "How do I submit a dental claim?",
            "What's covered by AIA insurance?",
            "Can I claim for glasses?",
            "What's the AIA hotline number?"
        ]
        
        for question in quick_questions:
            if st.button(question, key=f"quick_{question}", use_container_width=True):
                st.session_state.quick_question = question
        
        st.markdown("---")
        
        if st.button("🗑️ Clear Chat History", use_container_width=True):
            st.session_state.messages = []
            if hasattr(st.session_state, 'agent'):
                st.session_state.agent.clear_memory(user_email)
            st.rerun()
        
        st.markdown("---")
        st.markdown("### 📊 Chat Stats")
        st.metric("Messages", len(st.session_state.messages))
    
    # Chat container with modern styling
    st.markdown("""
        <style>
        /* Chat Container */
        .chat-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 1rem 0;
        }
        
        /* Chat Messages */
        .stChatMessage {
            background: hsl(var(--card)) !important;
            border: 1px solid hsl(var(--border)) !important;
            border-radius: 1rem !important;
            padding: 1.25rem !important;
            margin: 0.75rem 0 !important;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
        }
        
        /* User Messages */
        [data-testid="stChatMessageContent"]:has(+ [data-testid="stChatMessageAvatar"]:contains("user")) {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%) !important;
            border-color: hsl(var(--primary) / 0.3) !important;
        }
        
        /* Assistant Messages */
        .stChatMessage[data-testid="assistant-message"] {
            background: hsl(var(--card)) !important;
        }
        
        /* Chat Input */
        .stChatInput {
            border-radius: 2rem !important;
            border: 2px solid hsl(var(--border)) !important;
            background: hsl(var(--background)) !important;
            padding: 0.75rem 1.5rem !important;
            transition: all 0.2s ease !important;
        }
        
        .stChatInput:focus-within {
            border-color: hsl(var(--primary)) !important;
            box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1) !important;
        }
        
        /* Markdown in messages */
        .stChatMessage p {
            color: hsl(var(--foreground)) !important;
            line-height: 1.6;
        }
        
        .stChatMessage strong {
            color: hsl(var(--primary)) !important;
        }
        
        .stChatMessage ul {
            margin: 0.5rem 0;
        }
        
        .stChatMessage li {
            margin: 0.25rem 0;
        }
        </style>
    """, unsafe_allow_html=True)
    
    # Display chat history using Streamlit's native chat components
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    
    # Handle quick question
    if 'quick_question' in st.session_state:
        user_input = st.session_state.quick_question
        del st.session_state.quick_question
    else:
        user_input = None
    
    # Chat input
    prompt = st.chat_input("Type your question here...", key="chat_input")
    
    if prompt or user_input:
        query = prompt if prompt else user_input
        
        # Add user message
        st.session_state.messages.append({"role": "user", "content": query})
        
        # Display user message immediately
        with st.chat_message("user"):
            st.markdown(query)
        
        # Get AI response
        with st.chat_message("assistant"):
            with st.spinner("🤔 Thinking..."):
                try:
                    result = st.session_state.agent.query(
                        user_email=user_email,
                        query_text=query
                    )
                    
                    response = result.get("answer", "I'm sorry, I couldn't process that request.")
                    
                    # Display response
                    st.markdown(response)
                    
                    # Add assistant message to history
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": response
                    })
                    
                except Exception as e:
                    error_msg = f"❌ I encountered an error: {str(e)}. Please try again."
                    st.error(error_msg)
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": error_msg
                    })
    
    # Footer tips
    st.markdown("<br><br>", unsafe_allow_html=True)
    with st.expander("💡 **Tips for Better Results**"):
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("""
            **Be Specific**  
            Instead of "claims", try "What's my dental claim balance?"
            
            **Ask Follow-ups**  
            I remember our conversation context
            """)
        
        with col2:
            st.markdown("""
            **Use Natural Language**  
            Talk to me like you would to a colleague
            
            **Try Examples**  
            Click the quick questions in the sidebar
            """)

if __name__ == "__main__":
    main()
