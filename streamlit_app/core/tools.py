#!/usr/bin/env python3
"""
LangChain tools for AI agent.
All tools are email-scoped for security.
"""
from typing import Dict, Any
from langchain.tools import tool
import json
import sys
from pathlib import Path

# Use absolute imports for better compatibility
try:
    from core.db_retriever import DatabaseRetriever
except ImportError:
    # Fallback for different import contexts
    from db_retriever import DatabaseRetriever

# Initialize database retriever (shared across tools)
# Path relative to streamlit_app root
db_path = Path(__file__).parent.parent / "data" / "claims.db"
db_retriever = DatabaseRetriever(str(db_path))


@tool
def get_user_claims(user_email: str) -> str:
    """
    Fetch all claim records for the authenticated user.
    
    Args:
        user_email: The authenticated user's email address
        
    Returns:
        JSON string containing user's claim records
    """
    docs = db_retriever.retrieve(user_email, limit=100)
    
    if not docs:
        return json.dumps({"message": f"No claims found for user", "claims": []})
    
    # Format for AI consumption
    result = {
        "total_claims": len(docs),
        "claims": []
    }
    
    for doc in docs:
        # Only include relevant fields
        claim = {
            "source": doc.get("source_table", "unknown"),
            **{k: v for k, v in doc.items() if k not in ["source_table"]}
        }
        result["claims"].append(claim)
    
    return json.dumps(result, default=str)


@tool
def calculate_balance(user_email: str) -> str:
    """
    Calculate the remaining balance for the authenticated user.
    
    Args:
        user_email: The authenticated user's email address
        
    Returns:
        JSON string with balance information
    """
    result = db_retriever.compute(
        user_email,
        "sum",
        "Remaining_Balance",
        table="claims_2025"
    )
    
    if "error" in result:
        return json.dumps({"error": result["error"]})
    
    return json.dumps({
        "remaining_balance": result["result"],
        "rows_used": result["rows_used"],
        "user_email_hash": result["filter_applied"]
    })


@tool
def calculate_total_spent(user_email: str) -> str:
    """
    Calculate total amount spent by the authenticated user.
    
    Args:
        user_email: The authenticated user's email address
        
    Returns:
        JSON string with spending information
    """
    result = db_retriever.compute(
        user_email,
        "sum",
        "Total_Transaction_Amount",
        table="claims_2025"
    )
    
    if "error" in result:
        return json.dumps({"error": result["error"]})
    
    return json.dumps({
        "total_spent": result["result"],
        "rows_used": result["rows_used"]
    })


@tool
def get_claim_count(user_email: str) -> str:
    """
    Count the total number of claims for the authenticated user.
    
    Args:
        user_email: The authenticated user's email address
        
    Returns:
        JSON string with claim count
    """
    result = db_retriever.compute(
        user_email,
        "count",
        table="claims_2025"
    )
    
    if "error" in result:
        return json.dumps({"error": result["error"]})
    
    return json.dumps({
        "claim_count": result["result"]
    })


@tool
def get_user_summary(user_email: str) -> str:
    """
    Get a complete summary of user's data across all tables.
    
    Args:
        user_email: The authenticated user's email address
        
    Returns:
        JSON string with user data summary
    """
    summary = db_retriever.get_user_data_summary(user_email)
    
    return json.dumps(summary, default=str)


@tool  
def get_max_amount(user_email: str) -> str:
    """
    Get the maximum claim amount allocated to the user.
    
    Args:
        user_email: The authenticated user's email address
        
    Returns:
        JSON string with max amount information
    """
    result = db_retriever.compute(
        user_email,
        "max",
        "Max_Amount",
        table="claims_2025"
    )
    
    if "error" in result:
        return json.dumps({"error": result["error"]})
    
    return json.dumps({
        "max_amount": result["result"]
    })


# Import knowledge base tools
kb_path = Path(__file__).parent.parent / "knowledge_base"
sys.path.insert(0, str(kb_path))

try:
    from knowledge_tools import KNOWLEDGE_BASE_TOOLS
    print("[TOOLS] ✅ Knowledge base tools loaded")
except Exception as e:
    print(f"[TOOLS] ⚠️  Knowledge base tools not available: {e}")
    KNOWLEDGE_BASE_TOOLS = []

# Export all tools as a list
ALL_TOOLS = [
    get_user_claims,
    calculate_balance,
    calculate_total_spent,
    get_claim_count,
    get_user_summary,
    get_max_amount,
] + KNOWLEDGE_BASE_TOOLS
