#!/usr/bin/env python3
"""
Test script to verify AI agent boundaries.
Tests that off-topic queries are rejected properly.
"""
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables from config/.env
env_path = Path(__file__).parent.parent / "config" / ".env"
load_dotenv(env_path)

from src.ai_agent import ClaimAIAgent

def test_boundaries():
    """Test that agent rejects off-topic queries."""
    
    print("="*70)
    print("TESTING AI AGENT BOUNDARIES")
    print("="*70)
    
    agent = ClaimAIAgent()
    test_email = "test@regentmarkets.com"
    
    # Test cases: (query, should_reject)
    test_cases = [
        # Off-topic queries that SHOULD be rejected
        ("Tell me a joke", True),
        ("Who is Donald Trump?", True),
        ("Entertain me", True),
        ("What's the weather today?", True),
        ("Help me with my Python code", True),
        ("What's 2+2?", True),
        
        # On-topic queries that SHOULD be answered
        ("What's my claim balance?", False),
        ("How do I submit a dental claim?", False),
        ("Is cancer treatment covered?", False),
        ("What's the AIA hotline?", False),
        ("Can I claim for glasses?", False),
    ]
    
    # Keywords that indicate a rejection (more flexible than exact phrase)
    rejection_keywords = [
        "claims and benefits",
        "specifically",
        "focus on",
        "help with",
        "outside",
        "not my",
        "can't help with"
    ]
    
    passed = 0
    failed = 0
    
    for query, should_reject in test_cases:
        print(f"\n{'='*70}")
        print(f"Query: {query}")
        print(f"Expected: {'REJECT' if should_reject else 'ANSWER'}")
        print("-"*70)
        
        result = agent.query(test_email, query)
        answer = result['answer'].lower()
        
        # Check if answer contains rejection indicators
        # Look for keywords that suggest polite rejection + offer to help with claims
        has_rejection_keywords = any(keyword in answer for keyword in rejection_keywords)
        mentions_claims_benefits = "claim" in answer or "benefit" in answer
        is_rejected = has_rejection_keywords and mentions_claims_benefits
        
        # Verify expectation
        if should_reject and is_rejected:
            print("✅ PASS - Query correctly rejected")
            print(f"Response: {result['answer'][:200]}...")
            passed += 1
        elif not should_reject and not is_rejected:
            print("✅ PASS - Query correctly answered")
            print(f"Response: {result['answer'][:200]}...")
            passed += 1
        else:
            print("❌ FAIL - Unexpected behavior")
            print(f"Response: {result['answer'][:200]}...")
            print(f"Debug: has_rejection_keywords={has_rejection_keywords}, mentions_claims_benefits={mentions_claims_benefits}")
            failed += 1
    
    print(f"\n{'='*70}")
    print(f"RESULTS: {passed} passed, {failed} failed out of {len(test_cases)} tests")
    print("="*70)
    
    return failed == 0

if __name__ == "__main__":
    try:
        success = test_boundaries()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
