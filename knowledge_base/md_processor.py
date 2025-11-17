#!/usr/bin/env python3
"""
Markdown text extraction and chunking for knowledge base.
Converts MD documents into chunks suitable for vector embeddings.
"""
from pathlib import Path
from typing import List, Dict
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

class MarkdownProcessor:
    """Process Markdown files into chunks for embedding."""
    
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ):
        """
        Initialize Markdown processor.
        
        Args:
            chunk_size: Characters per chunk
            chunk_overlap: Overlap between chunks for context continuity
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
    
    def extract_text_from_md(self, md_path: str) -> Dict:
        """
        Extract text from Markdown file.
        
        Args:
            md_path: Path to MD file
            
        Returns:
            Dict with text and metadata
        """
        path = Path(md_path)
        
        if not path.exists():
            raise FileNotFoundError(f"MD file not found: {md_path}")
        
        print(f"[MD_PROCESSOR] Reading: {path.name}")
        
        # Read markdown file
        with open(path, 'r', encoding='utf-8') as f:
            text = f.read()
        
        # Count sections (lines starting with #)
        sections = [line for line in text.split('\n') if line.strip().startswith('#')]
        
        print(f"[MD_PROCESSOR] Extracted {len(sections)} sections, {len(text)} characters")
        
        return {
            "filename": path.stem,
            "total_sections": len(sections),
            "total_characters": len(text),
            "full_text": text
        }
    
    def chunk_text(
        self,
        text: str,
        metadata: Dict
    ) -> List[Document]:
        """
        Split text into chunks.
        
        Args:
            text: Full text to chunk
            metadata: Metadata to attach to each chunk
            
        Returns:
            List of LangChain Document objects
        """
        print(f"[MD_PROCESSOR] Chunking text: {len(text)} characters")
        
        # Create initial document
        doc = Document(page_content=text, metadata=metadata)
        
        # Split into chunks
        chunks = self.splitter.split_documents([doc])
        
        # Add chunk index to metadata
        for i, chunk in enumerate(chunks):
            chunk.metadata["chunk_index"] = i
            chunk.metadata["total_chunks"] = len(chunks)
        
        print(f"[MD_PROCESSOR] Created {len(chunks)} chunks")
        
        return chunks
    
    def process_md(self, md_path: str, category: str = None) -> List[Document]:
        """
        Process MD: extract text and create chunks.
        
        Args:
            md_path: Path to MD file
            category: Optional category label
            
        Returns:
            List of Document chunks ready for embedding
        """
        # Extract text
        extraction = self.extract_text_from_md(md_path)
        
        # Prepare metadata
        metadata = {
            "source": extraction["filename"],
            "source_file": Path(md_path).name,
            "total_sections": extraction["total_sections"],
            "category": category or "general",
            "file_type": "markdown"
        }
        
        # Create chunks
        chunks = self.chunk_text(extraction["full_text"], metadata)
        
        return chunks
    
    def process_directory(
        self,
        md_dir: str,
        file_categories: Dict[str, str] = None
    ) -> List[Document]:
        """
        Process all MD files in a directory.
        
        Args:
            md_dir: Directory containing MD files
            file_categories: Optional mapping of filename -> category
            
        Returns:
            List of all document chunks
        """
        md_path = Path(md_dir)
        
        if not md_path.exists():
            raise FileNotFoundError(f"Directory not found: {md_dir}")
        
        md_files = list(md_path.glob("*.md"))
        
        if not md_files:
            raise ValueError(f"No MD files found in: {md_dir}")
        
        print(f"\n[MD_PROCESSOR] Found {len(md_files)} MD files")
        print("=" * 70)
        
        all_chunks = []
        
        for md_file in sorted(md_files):
            category = None
            if file_categories:
                category = file_categories.get(md_file.name)
            
            chunks = self.process_md(str(md_file), category)
            all_chunks.extend(chunks)
            print()
        
        print("=" * 70)
        print(f"[MD_PROCESSOR] Total chunks created: {len(all_chunks)}")
        
        return all_chunks


# Test the processor
if __name__ == "__main__":
    processor = MarkdownProcessor()
    
    # Define categories for our MDs
    categories = {
        "AIA_Procedures_Handbook.md": "insurance_procedures",
        "Malaysia_Health_Benefits_Guidebook.md": "benefits_guide",
        "Staff_Claim_Reimbursement_Form.md": "claim_forms"
    }
    
    try:
        # Process all MDs
        chunks = processor.process_directory(
            "md_files",
            file_categories=categories
        )
        
        # Show sample
        print("\nSample chunk:")
        print("-" * 70)
        print(f"Content: {chunks[0].page_content[:200]}...")
        print(f"Metadata: {chunks[0].metadata}")
        
    except Exception as e:
        print(f"\nError: {e}")
        print("\nMake sure MD files exist in 'knowledge_base/md_files/' directory")
