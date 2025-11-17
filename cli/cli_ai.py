#!/usr/bin/env python3
"""
Interactive CLI for AI-powered claim chatbot.
Natural language conversations with GPT-4o-mini.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path to import from src/
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.ai_agent import ClaimAIAgent
from src.auth_stub import mask_email

# Load .env from config directory
env_path = Path(__file__).parent.parent / "config" / ".env"
load_dotenv(dotenv_path=env_path)

def print_header():
    """Print CLI header."""
    print("="*70)
    print("AI-POWERED CLAIM CHATBOT")
    print("="*70)
    print("\nPowered by OpenAI GPT-4o-mini + LangChain")
    print("\nCommands:")
    print("  - Ask any question in natural language")
    print("  - 'clear' - Clear conversation history")
    print("  - 'switch-user' - Change user")
    print("  - 'quit' - Exit")
    print("="*70)


def main():
    """Run interactive AI CLI."""
    print_header()
    
    # Check API key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "sk-your-actual-api-key-here":
        print("\n❌ ERROR: OpenAI API key not configured!")
        print("\nPlease follow these steps:")
        print("1. Get your API key from: https://platform.openai.com/api-keys")
        print("2. Open the .env file in this directory")
        print("3. Replace 'sk-your-actual-api-key-here' with your actual API key")
        print("4. Save the file and run this script again")
        sys.exit(1)
    
    # Initialize AI agent
    try:
        print("\n🤖 Initializing AI agent...")
        agent = ClaimAIAgent()
        model_name = os.getenv("MODEL_NAME", "gpt-4o-mini")
        print(f"✅ Agent ready! Using model: {model_name}")
    except Exception as e:
        print(f"\n❌ Failed to initialize agent: {e}")
        sys.exit(1)
    
    # Get user email
    default_user = os.getenv("LOCAL_USER_EMAIL", "aainaa@regentmarkets.com")
    print(f"\nEnter user email (or press Enter for default: {default_user})")
    user_email = input("Email: ").strip()
    
    if not user_email:
        user_email = default_user
    
    user_email = user_email.lower().strip()
    print(f"\n✅ Logged in as: {mask_email(user_email)}")
    print("\nStart chatting! (Type 'quit' to exit)\n")
    
    # Chat loop
    while True:
        try:
            # Get user input
            query = input(f"\n[You] ➤ ").strip()
            
            if not query:
                continue
            
            # Handle commands
            if query.lower() == "quit":
                print("\n👋 Goodbye! Have a great day!")
                break
            
            if query.lower() == "clear":
                agent.clear_memory(user_email)
                print(f"✅ Conversation history cleared for {mask_email(user_email)}")
                continue
            
            if query.lower() == "switch-user":
                new_email = input("\nEnter new user email: ").strip().lower()
                if new_email:
                    user_email = new_email
                    print(f"✅ Switched to {mask_email(user_email)}")
                continue
            
            # Query AI agent
            print(f"\n[AI] 🤔 Thinking...")
            result = agent.query(user_email, query)
            
            # Display response
            print(f"\n[AI] 🤖 {result['answer']}")
            
            if result['status'] == 'error':
                print(f"\n⚠️  Error occurred: {result.get('error', 'Unknown error')}")
        
        except KeyboardInterrupt:
            print("\n\n👋 Interrupted. Type 'quit' to exit properly.")
        except Exception as e:
            print(f"\n❌ Unexpected error: {e}")


if __name__ == "__main__":
    main()
