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
    from supabase_service import SupabaseService, SupabaseServiceError
except ImportError:
    from src.supabase_service import SupabaseService, SupabaseServiceError

supabase_service = SupabaseService()


@tool
def get_user_claims(user_email: str) -> str:
    """
    Fetch all claim records for the authenticated user.
    
    Args:
        user_email: The authenticated user's email address
        
    Returns:
        JSON string containing user's claim records
    """
    try:
        docs = supabase_service.get_claim_analysis(user_email, limit=100)
    except SupabaseServiceError as exc:
        return json.dumps({"error": str(exc)})

    return json.dumps(
        {
            "total_claims": len(docs),
            "claims": docs,
        },
        default=str,
    )


@tool
def calculate_balance(user_email: str) -> str:
    """
    Calculate the remaining balance for the authenticated user.
    
    Args:
        user_email: The authenticated user's email address
        
    Returns:
        JSON string with balance information
    """
    try:
        summary = supabase_service.get_claim_summary(user_email)
    except SupabaseServiceError as exc:
        return json.dumps({"error": str(exc)})

    if not summary:
        return json.dumps({"message": "No claim summary found for user."})

    return json.dumps(
        {
            "year": summary.get("year"),
            "currency": summary.get("currency"),
            "remaining_balance": summary.get("remaining_balance"),
            "total_transaction_amount": summary.get("total_transaction_amount"),
            "max_amount": summary.get("max_amount"),
            "employee_name": summary.get("employee_name"),
        },
        default=str,
    )


@tool
def calculate_total_spent(user_email: str) -> str:
    """
    Calculate total amount spent by the authenticated user.
    
    Args:
        user_email: The authenticated user's email address
        
    Returns:
        JSON string with spending information
    """
    try:
        summary = supabase_service.get_claim_summary(user_email)
    except SupabaseServiceError as exc:
        return json.dumps({"error": str(exc)})

    if not summary:
        return json.dumps({"message": "No claim summary found for user."})

    return json.dumps(
        {
            "currency": summary.get("currency"),
            "total_transaction_amount": summary.get("total_transaction_amount"),
            "max_amount": summary.get("max_amount"),
        },
        default=str,
    )


@tool
def get_claim_count(user_email: str) -> str:
    """
    Count the total number of claims for the authenticated user.
    
    Args:
        user_email: The authenticated user's email address
        
    Returns:
        JSON string with claim count
    """
    try:
        count = supabase_service.count_claims(user_email)
    except SupabaseServiceError as exc:
        return json.dumps({"error": str(exc)})

    return json.dumps({"claim_count": count})


@tool
def get_user_summary(user_email: str) -> str:
    """
    Get a complete summary of user's data across all tables.
    
    Args:
        user_email: The authenticated user's email address
        
    Returns:
        JSON string with user data summary
    """
    try:
        summary = supabase_service.build_user_summary(user_email)
    except SupabaseServiceError as exc:
        return json.dumps({"error": str(exc)})

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
    try:
        summary = supabase_service.get_claim_summary(user_email)
    except SupabaseServiceError as exc:
        return json.dumps({"error": str(exc)})

    if not summary:
        return json.dumps({"message": "No claim summary found for user."})

    return json.dumps({"max_amount": summary.get("max_amount"), "currency": summary.get("currency")})


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
