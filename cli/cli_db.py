#!/usr/bin/env python3
"""
Interactive CLI for testing database-backed agent.
Similar to cli.py but uses DatabaseRetriever instead of CSV.
"""
import os
import sys
from pathlib import Path

# Add parent directory to path to import from src/
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.db_retriever import DatabaseRetriever
from src.auth_stub import mask_email

class DatabaseAgent:
    """Simple agent that uses database retriever."""
    
    def __init__(self, db_path="database/claims.db"):
        self.retriever = DatabaseRetriever(db_path)
        self.user_email = None
    
    def query(self, user_email: str, query_text: str):
        """Execute query using database."""
        self.user_email = user_email.strip().lower()
        
        print(f"\n[AGENT] Query from {mask_email(self.user_email)}: {query_text}")
        
        query_lower = query_text.lower()
        
        # Route based on keywords
        if any(word in query_lower for word in ["sum", "total", "balance"]):
            # Compute query
            result = self.retriever.compute(
                self.user_email,
                "sum",
                "Remaining_Balance",
                table="claims_2025"
            )
            
            if "error" in result:
                answer = f"Error: {result['error']}"
            else:
                answer = f"**SUM** on 'Remaining_Balance' for {mask_email(self.user_email)}:\n"
                answer += f"Result: {result['result']}\n"
                answer += f"Rows used: {result['rows_used']}\n"
                answer += f"Filter: email = {mask_email(self.user_email)}\n"
                answer += f"Table: {result['table']}"
            
            return {
                "answer": answer,
                "tool_used": "database_compute",
                "email_filter": mask_email(self.user_email)
            }
        
        elif any(word in query_lower for word in ["count", "how many"]):
            # Count query
            result = self.retriever.compute(
                self.user_email,
                "count",
                table="claims_2025"
            )
            
            answer = f"You have {result['result']} claim(s) in the database."
            
            return {
                "answer": answer,
                "tool_used": "database_compute",
                "email_filter": mask_email(self.user_email)
            }
        
        else:
            # Retrieval query
            docs = self.retriever.retrieve(self.user_email, limit=10)
            
            if not docs:
                answer = f"No data found for {mask_email(self.user_email)}."
            else:
                answer = f"Found {len(docs)} row(s) for {mask_email(self.user_email)}:\n\n"
                
                tables = set(doc.get("source_table", "unknown") for doc in docs)
                answer += f"Tables: {', '.join(tables)}\n"
                
                # Show first 3 rows
                for i, doc in enumerate(docs[:3], 1):
                    answer += f"\n--- Row {i} (from {doc.get('source_table', 'unknown')}) ---\n"
                    for key, val in list(doc.items())[:6]:
                        if key != "source_table":
                            answer += f"  {key}: {val}\n"
                
                if len(docs) > 3:
                    answer += f"\n... and {len(docs) - 3} more rows available."
            
            return {
                "answer": answer,
                "tool_used": "database_retrieve",
                "email_filter": mask_email(self.user_email)
            }


def main():
    """Run interactive CLI."""
    print("="*70)
    print("DATABASE-BACKED CLAIM AGENT - Interactive CLI")
    print("="*70)
    print("\nUsing database: database/claims.db")
    print("\nCommands:")
    print("  - Type any question about your claims")
    print("  - 'switch-user' to change user")
    print("  - 'quit' to exit")
    print("="*70)
    
    agent = DatabaseAgent("database/claims.db")
    
    # Get initial user
    default_user = os.getenv("LOCAL_USER_EMAIL", "aainaa@regentmarkets.com")
    user_email = input(f"\nEnter user email (default: {default_user}): ").strip()
    if not user_email:
        user_email = default_user
    
    user_email = user_email.lower().strip()
    
    while True:
        try:
            query = input(f"\n[{mask_email(user_email)}] > ").strip()
            
            if not query:
                continue
            
            if query.lower() == "quit":
                print("\nGoodbye!")
                break
            
            if query.lower() == "switch-user":
                new_email = input("Enter new user email: ").strip().lower()
                if new_email:
                    user_email = new_email
                    print(f"Switched to {mask_email(user_email)}")
                continue
            
            # Execute query
            result = agent.query(user_email, query)
            print(f"\n{result['answer']}")
            print(f"\n[Tool: {result['tool_used']}, Filter: {result['email_filter']}]")
        
        except KeyboardInterrupt:
            print("\n\nInterrupted. Use 'quit' to exit.")
        except Exception as e:
            print(f"\nError: {e}")


if __name__ == "__main__":
    main()
