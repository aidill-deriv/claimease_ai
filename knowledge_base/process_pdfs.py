#!/usr/bin/env python3
"""
One-time script to process PDFs and create vector embeddings.
Run this to populate the Chroma DB with your knowledge base.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from pdf_processor import PDFProcessor
from vector_store import VectorStoreManager

def main():
    """Process all PDFs and create vector database."""
    
    print("="*70)
    print("PDF KNOWLEDGE BASE SETUP")
    print("="*70)
    
    # Define PDF files and their categories
    pdf_categories = {
        "AIA_Procedures_Handbook.pdf": "insurance_procedures",
        "Malaysia_Health_Benefits_Guidebook.pdf": "benefits_guide",
        "Staff_Claim_Form_Guide.pdf": "claim_forms"
    }
    
    # Initialize processor
    processor = PDFProcessor(
        chunk_size=1000,
        chunk_overlap=200
    )
    
    # Process all PDFs
    try:
        print("\n" + "="*70)
        print("STEP 1: Processing PDFs")
        print("="*70)
        
        chunks = processor.process_directory(
            pdf_dir="pdf_files",
            file_categories=pdf_categories
        )
        
        print(f"\n✅ Successfully processed {len(chunks)} chunks")
        
        # Show sample
        if chunks:
            print("\n" + "="*70)
            print("Sample Chunk:")
            print("="*70)
            sample = chunks[0]
            print(f"Source: {sample.metadata.get('source', 'unknown')}")
            print(f"Category: {sample.metadata.get('category', 'unknown')}")
            print(f"Pages: {sample.metadata.get('total_pages', 'unknown')}")
            print(f"Chunk: {sample.metadata.get('chunk_index', 0)} of {sample.metadata.get('total_chunks', 0)}")
            print(f"\nContent preview:\n{sample.page_content[:300]}...")
        
        # Initialize vector store
        print("\n" + "="*70)
        print("STEP 2: Creating Vector Database")
        print("="*70)
        
        store = VectorStoreManager(
            persist_directory="chroma_db",
            collection_name="knowledge_base"
        )
        
        # Add documents to vector store
        print("\n" + "="*70)
        print("STEP 3: Adding Documents and Creating Embeddings")
        print("="*70)
        print("This will take 1-2 minutes on first run...")
        print("(Downloading embedding model and processing documents)")
        
        store.add_documents(chunks)
        
        # Show final stats
        print("\n" + "="*70)
        print("STEP 4: Verification")
        print("="*70)
        
        stats = store.get_stats()
        print(f"\n✅ Database created successfully!")
        print(f"\nStatistics:")
        print(f"  Total documents: {stats['total_documents']}")
        print(f"  Categories: {stats['categories']}")
        print(f"  Location: {stats['persist_directory']}")
        
        # Test search
        print("\n" + "="*70)
        print("STEP 5: Testing Search")
        print("="*70)
        
        test_query = "How do I submit a claim?"
        print(f"\nTest query: '{test_query}'")
        
        results = store.search(test_query, k=2)
        
        if results:
            print(f"\n✅ Found {len(results)} relevant results:")
            for i, doc in enumerate(results, 1):
                print(f"\n--- Result {i} ---")
                print(f"Source: {doc.metadata.get('source_file', 'unknown')}")
                print(f"Category: {doc.metadata.get('category', 'unknown')}")
                print(f"Content: {doc.page_content[:200]}...")
        
        print("\n" + "="*70)
        print("✅ SETUP COMPLETE!")
        print("="*70)
        print("\nYour knowledge base is ready to use.")
        print("\nNext steps:")
        print("1. Run 'python3 cli_ai.py' to test with AI chatbot")
        print("2. Ask questions like:")
        print("   - 'How do I submit an AIA claim?'")
        print("   - 'What health benefits am I eligible for?'")
        print("   - 'Show me the claim form requirements'")
        
    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure your PDF files are in:")
        print("  knowledge_base/pdf_files/")
        print("\nExpected files:")
        for filename in pdf_categories.keys():
            print(f"  - {filename}")
    except Exception as e:
        print(f"\n❌ Error during processing: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
