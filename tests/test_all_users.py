#!/usr/bin/env python3
"""
Test script to verify all users can access their data.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.db_retriever import DatabaseRetriever

# Test all 3 users
test_users = [
    "aainaa@regentmarkets.com",
    "aaron.lim@regentmarkets.com",
    "abbas.rafeiee@regentmarkets.com"
]

# Database path relative to project root
db_path = Path(__file__).parent.parent / "database" / "claims.db"
retriever = DatabaseRetriever(str(db_path))

print("="*70)
print("Testing All Users")
print("="*70)

for email in test_users:
    print(f"\n{'='*70}")
    print(f"Testing: {email}")
    print(f"{'='*70}")
    
    # Test retrieval
    docs = retriever.retrieve(email)
    print(f"✅ Retrieved {len(docs)} documents")
    
    # Test balance calculation
    result = retriever.compute(email, "sum", "Remaining_Balance", table="claims_2025")
    if "error" in result:
        print(f"❌ Error: {result['error']}")
    else:
        print(f"✅ Balance: {result['result']}")
    
    # Show sample data
    if docs:
        sample = docs[0]
        print(f"✅ Name: {sample.get('Employee_Name', 'Unknown')}")
        print(f"✅ Company: {sample.get('Company', 'Unknown')}")

print(f"\n{'='*70}")
print("Test Complete")
print(f"{'='*70}")
