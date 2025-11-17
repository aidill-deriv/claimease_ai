#!/usr/bin/env python3
"""
Script to inspect ChromaDB contents.
Run this to see what's in your vector database.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from vector_store import VectorStoreManager

def main():
    print("="*70)
    print("CHROMADB INSPECTION TOOL")
    print("="*70)
    
    # Initialize vector store
    store = VectorStoreManager(
        persist_directory="chroma_db",
        collection_name="knowledge_base"
    )
    
    # 1. Get basic statistics
    print("\n📊 DATABASE STATISTICS")
    print("-"*70)
    stats = store.get_stats()
    print(f"Total documents: {stats['total_documents']}")
    print(f"Categories: {stats['categories']}")
    print(f"Location: {stats['persist_directory']}")
    
    # 2. Get all documents
    print("\n📚 ALL DOCUMENTS")
    print("-"*70)
    
    # Access the collection directly
    collection = store.vectorstore._collection
    
    # Get all documents
    results = collection.get(
        include=['documents', 'metadatas']
    )
    
    print(f"\nFound {len(results['documents'])} documents\n")
    
    # Group by source file
    by_source = {}
    for i, (doc, meta) in enumerate(zip(results['documents'], results['metadatas'])):
        source = meta.get('source_file', 'unknown')
        if source not in by_source:
            by_source[source] = []
        by_source[source].append({
            'index': i,
            'category': meta.get('category', 'unknown'),
            'chunk': meta.get('chunk_index', 0),
            'total_chunks': meta.get('total_chunks', 0),
            'content_preview': doc[:200] + "..." if len(doc) > 200 else doc
        })
    
    # Display by source
    for source, docs in by_source.items():
        print(f"\n📄 {source}")
        print(f"   Chunks: {len(docs)}")
        print(f"   Category: {docs[0]['category']}")
        print(f"\n   Sample content:")
        print(f"   {docs[0]['content_preview']}")
        print()
    
    # 3. Test searches
    print("\n🔍 TEST SEARCHES")
    print("-"*70)
    
    test_queries = [
        "dental claim",
        "AIA insurance coverage",
        "health screening benefits",
        "claim submission procedure"
    ]
    
    for query in test_queries:
        print(f"\nQuery: '{query}'")
        results = store.search(query, k=2)
        
        if results:
            for i, doc in enumerate(results, 1):
                print(f"\n  Result {i}:")
                print(f"  Source: {doc.metadata.get('source_file', 'unknown')}")
                print(f"  Category: {doc.metadata.get('category', 'unknown')}")
                print(f"  Chunk: {doc.metadata.get('chunk_index', 0)}/{doc.metadata.get('total_chunks', 0)}")
                print(f"  Content: {doc.page_content[:150]}...")
    
    # 4. Interactive search
    print("\n" + "="*70)
    print("INTERACTIVE SEARCH MODE")
    print("="*70)
    print("Type your search queries (or 'quit' to exit)")
    print()
    
    while True:
        try:
            query = input("Search query: ").strip()
            
            if query.lower() in ['quit', 'exit', 'q']:
                break
            
            if not query:
                continue
            
            results = store.search(query, k=3)
            
            if results:
                print(f"\n✅ Found {len(results)} results:\n")
                for i, doc in enumerate(results, 1):
                    print(f"Result {i}:")
                    print(f"  Source: {doc.metadata.get('source_file', 'unknown')}")
                    print(f"  Category: {doc.metadata.get('category', 'unknown')}")
                    print(f"  Content: {doc.page_content[:300]}...")
                    print()
            else:
                print("❌ No results found\n")
        
        except KeyboardInterrupt:
            break
    
    print("\n✅ Inspection complete!")


if __name__ == "__main__":
    main()
