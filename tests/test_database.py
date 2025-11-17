#!/usr/bin/env python3
"""
Test suite for database-backed retrieval and email scoping.
Run: pytest test_database.py -v
"""
import sys
from pathlib import Path
import pytest
import sqlite3

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.db_retriever import DatabaseRetriever

# Database path relative to project root
DB_PATH = str(Path(__file__).parent.parent / "database" / "claims.db")

class TestDatabaseEmailIsolation:
    """Verify users can only see their own data in database."""
    
    def test_database_email_isolation(self):
        """Database retriever should return no cross-user rows."""
        retriever = DatabaseRetriever(DB_PATH)
        
        # User 1 should see rows from both tables
        results_1 = retriever.retrieve("aainaa@regentmarkets.com")
        assert len(results_1) > 0, "User 1 should have rows"
        assert all(doc["email"] == "aainaa@regentmarkets.com" for doc in results_1), \
            "All results should have matching email"
        
        # User 2 should see their rows
        results_2 = retriever.retrieve("aaron.lim@regentmarkets.com")
        assert len(results_2) > 0, "User 2 should have rows"
        assert all(doc["email"] == "aaron.lim@regentmarkets.com" for doc in results_2), \
            "All results should have matching email"
        
        # Results should not overlap
        emails_1 = set(doc["email"] for doc in results_1)
        emails_2 = set(doc["email"] for doc in results_2)
        assert len(emails_1 & emails_2) == 0, "User data should not overlap"
    
    def test_nonexistent_user(self):
        """Nonexistent user should return empty results."""
        retriever = DatabaseRetriever(DB_PATH)
        results = retriever.retrieve("nonexistent@example.com")
        assert len(results) == 0, "Nonexistent user should have no data"
    
    def test_database_compute(self):
        """Database compute should work with email filter."""
        retriever = DatabaseRetriever(DB_PATH)
        
        result = retriever.compute(
            "aainaa@regentmarkets.com",
            "sum",
            column="Remaining_Balance",
            table="claims_2025"
        )
        assert "error" not in result, f"Compute failed: {result}"
        assert result["result"] == 1271, f"Expected 1271, got {result['result']}"
    
    def test_compute_count(self):
        """Count operation should work."""
        retriever = DatabaseRetriever(DB_PATH)
        
        result = retriever.compute(
            "aainaa@regentmarkets.com",
            "count",
            table="claims_2025"
        )
        assert "error" not in result, f"Count failed: {result}"
        assert result["result"] == 1, f"Expected 1 row, got {result['result']}"
    
    def test_sql_injection_prevention(self):
        """Parameterized queries should prevent SQL injection."""
        retriever = DatabaseRetriever(DB_PATH)
        
        # Attempt SQL injection via email
        malicious_email = "test@test.com' OR '1'='1"
        results = retriever.retrieve(malicious_email)
        
        # Should return empty (no such user), not all rows
        assert len(results) == 0, "SQL injection should be prevented"


class TestDatabaseGuardrails:
    """Verify database compute guardrails work."""
    
    def test_invalid_column(self):
        """Invalid column should return error."""
        retriever = DatabaseRetriever(DB_PATH)
        
        result = retriever.compute(
            "aainaa@regentmarkets.com",
            "sum",
            column="NonExistentColumn",
            table="claims_2025"
        )
        assert "error" in result, "Should return error for invalid column"
        assert "not found" in result["error"].lower()
    
    def test_invalid_operation(self):
        """Invalid operation should return error."""
        retriever = DatabaseRetriever(DB_PATH)
        
        result = retriever.compute(
            "aainaa@regentmarkets.com",
            "delete",  # Not in whitelist
            column="Remaining_Balance",
            table="claims_2025"
        )
        assert "error" in result, "Should reject invalid operation"
        assert "not allowed" in result["error"].lower()
    
    def test_compute_without_column(self):
        """Operations requiring column should fail without it."""
        retriever = DatabaseRetriever(DB_PATH)
        
        result = retriever.compute(
            "aainaa@regentmarkets.com",
            "sum",
            column=None,  # Missing required column
            table="claims_2025"
        )
        assert "error" in result, "Should require column for sum operation"


class TestDatabaseMetadata:
    """Verify database metadata operations."""
    
    def test_user_summary(self):
        """User summary should include all relevant data."""
        retriever = DatabaseRetriever(DB_PATH)
        summary = retriever.get_user_data_summary("aainaa@regentmarkets.com")
        
        assert summary["total_rows"] > 0, "Should have rows"
        assert "claims_2025" in summary["tables"] or "policy_reference" in summary["tables"]
        assert summary["sample_row"]["email"] == "aainaa@regentmarkets.com"
    
    def test_database_initialization(self):
        """Database should initialize with correct tables."""
        retriever = DatabaseRetriever(DB_PATH)
        
        assert "claims_2025" in retriever.tables
        assert "policy_reference" in retriever.tables
    
    def test_table_specific_retrieval(self):
        """Should be able to retrieve from specific table."""
        retriever = DatabaseRetriever(DB_PATH)
        
        # Get only from claims_2025
        results = retriever.retrieve(
            "aainaa@regentmarkets.com",
            table="claims_2025"
        )
        
        assert len(results) > 0
        assert all(doc["source_table"] == "claims_2025" for doc in results)


class TestDatabaseVsCSVComparison:
    """Compare database results with CSV results."""
    
    def test_same_results_as_csv(self):
        """Database should return expected data structure."""
        # Note: Old CSV retriever deprecated, just verify database works
        
        # Database retriever
        db_retriever = DatabaseRetriever(DB_PATH)
        db_results = db_retriever.retrieve("aainaa@regentmarkets.com")
        
        # Should have expected rows (1 from claims_2025 + 3 from policy_reference)
        assert len(db_results) == 4, \
            f"Expected 4 rows (1 claim + 3 policies), got {len(db_results)}"
        
        # Check all emails match
        assert all(doc["email"] == "aainaa@regentmarkets.com" for doc in db_results), \
            "All results should have matching email"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
