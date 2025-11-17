#!/usr/bin/env python3
"""
Chroma DB vector store manager for knowledge base.
Handles embedding creation and storage.
"""
from pathlib import Path
from typing import List, Optional
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document

class VectorStoreManager:
    """Manage Chroma DB vector store for document embeddings."""
    
    def __init__(
        self,
        persist_directory: str = "chroma_db",
        collection_name: str = "knowledge_base",
        embedding_model: str = "all-MiniLM-L6-v2"
    ):
        """
        Initialize vector store manager.
        
        Args:
            persist_directory: Directory to store Chroma DB
            collection_name: Name of the collection
            embedding_model: HuggingFace model for embeddings (free, local)
        """
        self.persist_directory = persist_directory
        self.collection_name = collection_name
        
        print(f"[VECTOR_STORE] Initializing with model: {embedding_model}")
        print(f"[VECTOR_STORE] This will download ~80MB model on first run...")
        
        # Initialize embeddings (free, runs locally)
        self.embeddings = HuggingFaceEmbeddings(
            model_name=embedding_model,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        
        print(f"[VECTOR_STORE] ✅ Embedding model loaded")
        
        # Initialize or load vector store
        self.vectorstore = None
        self._load_or_create()
    
    def _load_or_create(self):
        """Load existing vector store or create new one."""
        persist_path = Path(self.persist_directory)
        
        if persist_path.exists() and any(persist_path.iterdir()):
            print(f"[VECTOR_STORE] Loading existing database from: {self.persist_directory}")
            self.vectorstore = Chroma(
                collection_name=self.collection_name,
                embedding_function=self.embeddings,
                persist_directory=self.persist_directory
            )
            
            # Get collection stats
            try:
                count = len(self.vectorstore.get()['ids'])
                print(f"[VECTOR_STORE] ✅ Loaded {count} existing documents")
            except:
                print(f"[VECTOR_STORE] ✅ Database loaded")
        else:
            print(f"[VECTOR_STORE] Creating new database at: {self.persist_directory}")
            persist_path.mkdir(parents=True, exist_ok=True)
            
            # Create empty vector store
            self.vectorstore = Chroma(
                collection_name=self.collection_name,
                embedding_function=self.embeddings,
                persist_directory=self.persist_directory
            )
            print(f"[VECTOR_STORE] ✅ New database created")
    
    def add_documents(self, documents: List[Document], batch_size: int = 100):
        """
        Add documents to vector store with embeddings.
        
        Args:
            documents: List of Document objects to add
            batch_size: Number of documents to process at once
        """
        if not documents:
            print("[VECTOR_STORE] No documents to add")
            return
        
        print(f"\n[VECTOR_STORE] Adding {len(documents)} documents to database...")
        print(f"[VECTOR_STORE] Creating embeddings (this may take a minute)...")
        
        # Add in batches to avoid memory issues
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]
            self.vectorstore.add_documents(batch)
            print(f"[VECTOR_STORE] Processed {min(i + batch_size, len(documents))}/{len(documents)} documents")
        
        print(f"[VECTOR_STORE] ✅ All documents added and embedded")
        
        # Persist to disk
        self.vectorstore.persist()
        print(f"[VECTOR_STORE] ✅ Database saved to disk")
    
    def search(
        self,
        query: str,
        k: int = 3,
        filter_dict: Optional[dict] = None
    ) -> List[Document]:
        """
        Semantic search for relevant documents.
        
        Args:
            query: Search query
            k: Number of results to return
            filter_dict: Optional metadata filter
            
        Returns:
            List of relevant Document objects
        """
        if filter_dict:
            results = self.vectorstore.similarity_search(
                query,
                k=k,
                filter=filter_dict
            )
        else:
            results = self.vectorstore.similarity_search(query, k=k)
        
        return results
    
    def search_with_scores(
        self,
        query: str,
        k: int = 3,
        filter_dict: Optional[dict] = None
    ) -> List[tuple]:
        """
        Semantic search with relevance scores.
        
        Args:
            query: Search query
            k: Number of results to return
            filter_dict: Optional metadata filter
            
        Returns:
            List of (Document, score) tuples
        """
        if filter_dict:
            results = self.vectorstore.similarity_search_with_score(
                query,
                k=k,
                filter=filter_dict
            )
        else:
            results = self.vectorstore.similarity_search_with_score(query, k=k)
        
        return results
    
    def get_stats(self) -> dict:
        """Get statistics about the vector store."""
        try:
            data = self.vectorstore.get()
            
            # Count by category
            categories = {}
            for metadata in data['metadatas']:
                cat = metadata.get('category', 'unknown')
                categories[cat] = categories.get(cat, 0) + 1
            
            return {
                "total_documents": len(data['ids']),
                "categories": categories,
                "collection_name": self.collection_name,
                "persist_directory": self.persist_directory
            }
        except Exception as e:
            return {
                "error": str(e),
                "collection_name": self.collection_name,
                "persist_directory": self.persist_directory
            }
    
    def delete_collection(self):
        """Delete the entire collection (use with caution!)."""
        print(f"[VECTOR_STORE] ⚠️  Deleting collection: {self.collection_name}")
        self.vectorstore.delete_collection()
        print(f"[VECTOR_STORE] ✅ Collection deleted")
    
    def as_retriever(self, search_kwargs: dict = None):
        """Get LangChain retriever interface."""
        if search_kwargs is None:
            search_kwargs = {"k": 3}
        
        return self.vectorstore.as_retriever(
            search_kwargs=search_kwargs
        )


# Test the vector store
if __name__ == "__main__":
    from pdf_processor import PDFProcessor
    
    print("="*70)
    print("Testing Vector Store")
    print("="*70)
    
    # Initialize
    store = VectorStoreManager(
        persist_directory="chroma_db",
        collection_name="knowledge_base"
    )
    
    # Test search (if database exists)
    try:
        stats = store.get_stats()
        print(f"\nDatabase stats: {stats}")
        
        if stats.get('total_documents', 0) > 0:
            print("\nTesting search...")
            results = store.search("How do I submit a claim?", k=2)
            
            if results:
                print(f"\nFound {len(results)} results:")
                for i, doc in enumerate(results, 1):
                    print(f"\n--- Result {i} ---")
                    print(f"Source: {doc.metadata.get('source', 'unknown')}")
                    print(f"Content: {doc.page_content[:200]}...")
    except Exception as e:
        print(f"\nNote: {e}")
        print("Run 'python3 process_pdfs.py' first to populate the database")
