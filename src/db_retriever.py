#!/usr/bin/env python3
"""
SQLite-based retriever with email scoping.
Replacement for CSV-based retriever with database backend.
"""
import sqlite3
from typing import List, Dict, Any, Optional

# Use absolute imports for better compatibility
try:
    from auth_stub import mask_email
except ImportError:
    from src.auth_stub import mask_email

class DatabaseRetriever:
    """
    Database-backed retriever that ensures all results match user's email.
    Provides same interface as EmailScopedRetriever but uses SQLite.
    """
    
    def __init__(self, db_path: str = "claims.db"):
        """
        Initialize database retriever.
        
        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = db_path
        
        # Verify database exists and has required tables
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            conn.close()
            
            if not tables:
                raise ValueError(f"Database {db_path} has no tables!")
            
            print(f"[DB_RETRIEVER] Connected to {db_path} with tables: {tables}")
            self.tables = tables
        except sqlite3.Error as e:
            raise ValueError(f"Cannot open database {db_path}: {e}")
    
    def retrieve(
        self, 
        user_email: str, 
        query: Optional[str] = None, 
        limit: int = 100,
        table: str = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve documents for user from database.
        
        Args:
            user_email: Authenticated user email
            query: Optional query text (not used for now, could add full-text search later)
            limit: Max results to return
            table: Specific table to query (default: all tables with email column)
        
        Returns:
            List of matching rows as dictionaries
        """
        user_email = user_email.strip().lower()
        
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Return dicts
        
        all_results = []
        
        # Determine which tables to query
        tables_to_query = [table] if table else self.tables
        
        for tbl in tables_to_query:
            try:
                # Email-filtered query (SECURITY: parameterized query prevents SQL injection)
                cursor = conn.execute(
                    f'SELECT * FROM {tbl} WHERE email = ? LIMIT ?',
                    (user_email, limit)
                )
                
                rows = cursor.fetchall()
                
                # Convert Row objects to dicts and add metadata
                for row in rows:
                    doc = dict(row)
                    doc['source_table'] = tbl  # Add source metadata
                    all_results.append(doc)
                
                if rows:
                    print(f"[DB_RETRIEVER] Found {len(rows)} rows in '{tbl}' for {mask_email(user_email)}")
            
            except sqlite3.OperationalError:
                # Table might not have email column, skip it
                continue
        
        conn.close()
        
        if not all_results:
            print(f"[DB_RETRIEVER] No data found for {mask_email(user_email)}")
        else:
            print(f"[DB_RETRIEVER] Total: {len(all_results)} rows for {mask_email(user_email)}")
        
        return all_results[:limit]
    
    def compute(
        self, 
        user_email: str, 
        operation: str, 
        column: str = None,
        table: str = "claims_2025"
    ) -> Dict[str, Any]:
        """
        Compute aggregation with email filter.
        
        Args:
            user_email: Authenticated user email
            operation: "sum", "avg", "count", "max", "min"
            column: Target column for operation
            table: Table to query (default: claims_2025)
        
        Returns:
            Result dict with operation, value, filter applied
        """
        user_email = user_email.strip().lower()
        
        # Allowed operations (whitelist for security)
        allowed_ops = {"sum", "avg", "count", "max", "min"}
        if operation not in allowed_ops:
            return {
                "error": f"Operation '{operation}' not allowed. Allowed: {allowed_ops}",
                "operation": operation
            }
        
        conn = sqlite3.connect(self.db_path)
        
        try:
            # Build safe query (parameterized)
            if operation == "count":
                query = f'SELECT COUNT(*) FROM {table} WHERE email = ?'
                params = (user_email,)
            else:
                if not column:
                    return {"error": "Column required for this operation", "operation": operation}
                
                # Validate column exists (prevents SQL injection)
                cursor = conn.execute(f'PRAGMA table_info({table})')
                columns = [row[1] for row in cursor.fetchall()]
                
                if column not in columns:
                    return {
                        "error": f"Column '{column}' not found in {table}. Available: {columns}",
                        "operation": operation,
                        "column": column
                    }
                
                query = f'SELECT {operation.upper()}({column}) FROM {table} WHERE email = ?'
                params = (user_email,)
            
            cursor = conn.execute(query, params)
            result = cursor.fetchone()[0]
            
            # Get row count for metadata
            cursor = conn.execute(f'SELECT COUNT(*) FROM {table} WHERE email = ?', (user_email,))
            rows_used = cursor.fetchone()[0]
            
            conn.close()
            
            print(f"[DB_RETRIEVER] {operation.upper()}({column}) for {mask_email(user_email)}: {result}")
            
            return {
                "operation": operation,
                "column": column if column else "all",
                "result": result,
                "rows_used": rows_used,
                "filter_applied": f"email = {mask_email(user_email)}",
                "table": table
            }
        
        except sqlite3.Error as e:
            conn.close()
            return {
                "error": f"Database error: {str(e)}",
                "operation": operation
            }
    
    def get_user_data_summary(self, user_email: str) -> Dict[str, Any]:
        """Return summary of user's data across all tables."""
        user_email = user_email.strip().lower()
        
        conn = sqlite3.connect(self.db_path)
        
        total_rows = 0
        tables_with_data = []
        
        for table in self.tables:
            try:
                cursor = conn.execute(
                    f'SELECT COUNT(*) FROM {table} WHERE email = ?',
                    (user_email,)
                )
                count = cursor.fetchone()[0]
                
                if count > 0:
                    total_rows += count
                    tables_with_data.append(table)
            except sqlite3.OperationalError:
                # Table doesn't have email column
                continue
        
        # Get a sample row
        sample_row = None
        if tables_with_data:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                f'SELECT * FROM {tables_with_data[0]} WHERE email = ? LIMIT 1',
                (user_email,)
            )
            row = cursor.fetchone()
            if row:
                sample_row = dict(row)
        
        conn.close()
        
        if total_rows == 0:
            return {"message": "No data found"}
        
        return {
            "total_rows": total_rows,
            "tables": tables_with_data,
            "sample_row": sample_row,
        }


# Test
if __name__ == "__main__":
    retriever = DatabaseRetriever("claims.db")
    
    # Test 1: Retrieve user data
    print("\n" + "="*60)
    print("TEST 1: Retrieve aainaa's data")
    print("="*60)
    docs = retriever.retrieve("aainaa@regentmarkets.com")
    print(f"Retrieved {len(docs)} documents")
    if docs:
        print(f"Sample doc: {docs[0]}")
    
    # Test 2: Compute sum
    print("\n" + "="*60)
    print("TEST 2: Sum Remaining_Balance for aainaa")
    print("="*60)
    result = retriever.compute("aainaa@regentmarkets.com", "sum", "Remaining_Balance")
    print(f"Result: {result}")
    
    # Test 3: Cross-user isolation
    print("\n" + "="*60)
    print("TEST 3: Different user (aaron)")
    print("="*60)
    docs = retriever.retrieve("aaron.lim@regentmarkets.com")
    print(f"Retrieved {len(docs)} documents for aaron")
    
    # Test 4: User summary
    print("\n" + "="*60)
    print("TEST 4: User summary")
    print("="*60)
    summary = retriever.get_user_data_summary("aainaa@regentmarkets.com")
    print(f"Summary: {summary}")
