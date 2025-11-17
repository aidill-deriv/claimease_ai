#!/usr/bin/env python3
"""
Database performance benchmark.
Note: CSV retriever is deprecated and moved to deprecated/ folder.
"""
import time
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.db_retriever import DatabaseRetriever

# Database path relative to project root
DB_PATH = str(Path(__file__).parent.parent / "database" / "claims.db")

def benchmark_retrieval(iterations=100):
    """Benchmark database retrieval performance."""
    print("="*70)
    print("BENCHMARK: Database Retrieval Performance")
    print("="*70)
    
    user_email = "aainaa@regentmarkets.com"
    
    # Database retrieval
    print(f"\n[DB] Initializing retriever...")
    db_retriever = DatabaseRetriever(DB_PATH)
    
    print(f"[DB] Running {iterations} retrievals...")
    db_start = time.time()
    for _ in range(iterations):
        results = db_retriever.retrieve(user_email)
    db_time = time.time() - db_start
    db_avg = (db_time / iterations) * 1000  # ms
    
    # Results
    print("\n" + "="*70)
    print("RESULTS: Retrieval")
    print("="*70)
    print(f"Database: {db_avg:.2f} ms per query ({iterations} iterations)")
    print(f"Total time: {db_time:.2f} seconds")
    
    return db_avg

def benchmark_compute(iterations=100):
    """Benchmark database compute performance."""
    print("\n" + "="*70)
    print("BENCHMARK: Database Compute Performance")
    print("="*70)
    
    user_email = "aainaa@regentmarkets.com"
    
    # Database compute
    print(f"\n[DB] Initializing retriever...")
    db_retriever = DatabaseRetriever(DB_PATH)
    
    print(f"[DB] Running {iterations} sum operations...")
    db_start = time.time()
    for _ in range(iterations):
        result = db_retriever.compute(user_email, "sum", "Remaining_Balance")
    db_time = time.time() - db_start
    db_avg = (db_time / iterations) * 1000  # ms
    
    # Results
    print("\n" + "="*70)
    print("RESULTS: Compute (SUM)")
    print("="*70)
    print(f"Database: {db_avg:.2f} ms per query ({iterations} iterations)")
    print(f"Total time: {db_time:.2f} seconds")
    
    return db_avg

def benchmark_initialization():
    """Benchmark database initialization time."""
    print("\n" + "="*70)
    print("BENCHMARK: Database Initialization Time")
    print("="*70)
    
    # Database initialization
    print("\n[DB] Measuring initialization...")
    db_start = time.time()
    db_retriever = DatabaseRetriever(DB_PATH)
    db_time = (time.time() - db_start) * 1000
    
    # Results
    print("\n" + "="*70)
    print("RESULTS: Initialization")
    print("="*70)
    print(f"Database: {db_time:.2f} ms")
    
    return db_time

if __name__ == "__main__":
    print("\n" + "="*70)
    print("PERFORMANCE BENCHMARK: Database System")
    print("="*70)
    print("\nThis benchmark tests:")
    print("  1. Initialization time")
    print("  2. Retrieval performance (100 iterations)")
    print("  3. Compute performance (100 iterations)")
    print("\nNote: CSV retriever is deprecated (see deprecated/ folder)")
    print("="*70)
    
    # Run benchmarks
    init_db = benchmark_initialization()
    
    retrieval_db = benchmark_retrieval(iterations=100)
    
    compute_db = benchmark_compute(iterations=100)
    
    # Summary
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    print(f"\nInitialization:  {init_db:.2f}ms")
    print(f"Retrieval:       {retrieval_db:.2f}ms per query")
    print(f"Compute:         {compute_db:.2f}ms per query")
    
    # Performance assessment
    print("\n" + "="*70)
    print("PERFORMANCE ASSESSMENT")
    print("="*70)
    
    if retrieval_db < 10 and compute_db < 10:
        print("\n✅ Excellent performance (<10ms per query)")
    elif retrieval_db < 50 and compute_db < 50:
        print("\n✅ Good performance (<50ms per query)")
    elif retrieval_db < 100 and compute_db < 100:
        print("\n⚠️  Acceptable performance (<100ms per query)")
    else:
        print("\n❌ Slow performance (>100ms per query)")
        print("   Consider optimizing database queries or adding indexes")
    
    print("\n" + "="*70)
