#!/usr/bin/env python3
"""
Create SQLite database from CSV files.
Migrates claims_2025.csv and policy_reference.csv to a single database.
"""
import sqlite3
import pandas as pd
from pathlib import Path
import sys

def create_database(db_path="claims.db", data_dir="data"):
    """
    Create SQLite database from CSV files.
    
    Args:
        db_path: Path to SQLite database file
        data_dir: Directory containing CSV files
    """
    print(f"[DB SETUP] Creating database: {db_path}")
    
    # Create connection
    conn = sqlite3.connect(db_path)
    
    # Process each CSV file
    data_path = Path(data_dir)
    tables_created = []
    
    for csv_file in sorted(data_path.glob("*.csv")):
        table_name = csv_file.stem  # e.g., "claims_2025" or "policy_reference"
        print(f"[DB SETUP] Loading {csv_file.name} -> table '{table_name}'")
        
        # Load CSV
        df = pd.read_csv(csv_file)
        
        # Normalize email column (CRITICAL for security)
        if 'email' in df.columns:
            df['email'] = df['email'].str.strip().str.lower()
        else:
            print(f"  WARNING: {csv_file.name} has no 'email' column!")
        
        # Create table
        df.to_sql(table_name, conn, if_exists='replace', index=False)
        
        # Create index on email (performance)
        try:
            conn.execute(f'CREATE INDEX IF NOT EXISTS idx_{table_name}_email ON {table_name}(email)')
            print(f"  ✓ Created index on email column")
        except Exception as e:
            print(f"  WARNING: Could not create index: {e}")
        
        # Verify
        cursor = conn.execute(f'SELECT COUNT(*) FROM {table_name}')
        count = cursor.fetchone()[0]
        print(f"  ✓ Loaded {count} rows into '{table_name}'")
        
        tables_created.append((table_name, count))
    
    # Print summary
    print(f"\n[DB SETUP] Database created successfully: {db_path}")
    print(f"[DB SETUP] Tables:")
    for table, count in tables_created:
        print(f"  - {table}: {count} rows")
    
    # Test query: Count users
    cursor = conn.execute("""
        SELECT COUNT(DISTINCT email) 
        FROM claims_2025
    """)
    unique_users = cursor.fetchone()[0]
    print(f"\n[DB SETUP] Found {unique_users} unique users in claims_2025")
    
    conn.close()
    print(f"[DB SETUP] ✅ Database setup complete!")
    return db_path

def verify_database(db_path="claims.db"):
    """Verify database was created correctly."""
    print(f"\n[VERIFY] Checking database: {db_path}")
    
    conn = sqlite3.connect(db_path)
    
    # Check tables
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"[VERIFY] Tables: {tables}")
    
    # Check email isolation
    cursor = conn.execute("""
        SELECT email, COUNT(*) 
        FROM claims_2025 
        GROUP BY email
    """)
    print(f"\n[VERIFY] Email distribution in claims_2025:")
    for email, count in cursor.fetchall():
        print(f"  {email}: {count} rows")
    
    conn.close()
    print(f"[VERIFY] ✅ Verification complete!")

if __name__ == "__main__":
    data_dir = sys.argv[1] if len(sys.argv) > 1 else "data"
    db_path = sys.argv[2] if len(sys.argv) > 2 else "claims.db"
    
    create_database(db_path, data_dir)
    verify_database(db_path)
