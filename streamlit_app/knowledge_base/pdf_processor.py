#!/usr/bin/env python3
"""
PDF text extraction and chunking for knowledge base.
Converts PDF documents into chunks suitable for vector embeddings.
"""
from pathlib import Path
from typing import List, Dict
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

class PDFProcessor:
    """Process PDF files into chunks for embedding."""
    
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ):
        """
        Initialize PDF processor.
        
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
    
    def extract_text_from_pdf(self, pdf_path: str) -> Dict:
        """
        Extract text from PDF file.
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Dict with text and metadata
        """
        path = Path(pdf_path)
        
        if not path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")
        
        print(f"[PDF_PROCESSOR] Extracting text from: {path.name}")
        
        reader = PdfReader(str(path))
        
        text_by_page = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text.strip():
                text_by_page.append({
                    "page": i + 1,
                    "text": text
                })
        
        total_text = "\n\n".join([p["text"] for p in text_by_page])
        
        print(f"[PDF_PROCESSOR] Extracted {len(text_by_page)} pages, {len(total_text)} characters")
        
        return {
            "filename": path.stem,
            "total_pages": len(reader.pages),
            "text_pages": len(text_by_page),
            "total_characters": len(total_text),
            "full_text": total_text,
            "pages": text_by_page
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
        print(f"[PDF_PROCESSOR] Chunking text: {len(text)} characters")
        
        # Create initial document
        doc = Document(page_content=text, metadata=metadata)
        
        # Split into chunks
        chunks = self.splitter.split_documents([doc])
        
        # Add chunk index to metadata
        for i, chunk in enumerate(chunks):
            chunk.metadata["chunk_index"] = i
            chunk.metadata["total_chunks"] = len(chunks)
        
        print(f"[PDF_PROCESSOR] Created {len(chunks)} chunks")
        
        return chunks
    
    def process_pdf(self, pdf_path: str, category: str = None) -> List[Document]:
        """
        Process PDF: extract text and create chunks.
        
        Args:
            pdf_path: Path to PDF file
            category: Optional category label
            
        Returns:
            List of Document chunks ready for embedding
        """
        # Extract text
        extraction = self.extract_text_from_pdf(pdf_path)
        
        # Prepare metadata
        metadata = {
            "source": extraction["filename"],
            "source_file": Path(pdf_path).name,
            "total_pages": extraction["total_pages"],
            "category": category or "general"
        }
        
        # Create chunks
        chunks = self.chunk_text(extraction["full_text"], metadata)
        
        return chunks
    
    def process_directory(
        self,
        pdf_dir: str,
        file_categories: Dict[str, str] = None
    ) -> List[Document]:
        """
        Process all PDFs in a directory.
        
        Args:
            pdf_dir: Directory containing PDF files
            file_categories: Optional mapping of filename -> category
            
        Returns:
            List of all document chunks
        """
        pdf_path = Path(pdf_dir)
        
        if not pdf_path.exists():
            raise FileNotFoundError(f"Directory not found: {pdf_dir}")
        
        pdf_files = list(pdf_path.glob("*.pdf"))
        
        if not pdf_files:
            raise ValueError(f"No PDF files found in: {pdf_dir}")
        
        print(f"\n[PDF_PROCESSOR] Found {len(pdf_files)} PDF files")
        print("=" * 70)
        
        all_chunks = []
        
        for pdf_file in sorted(pdf_files):
            category = None
            if file_categories:
                category = file_categories.get(pdf_file.name)
            
            chunks = self.process_pdf(str(pdf_file), category)
            all_chunks.extend(chunks)
            print()
        
        print("=" * 70)
        print(f"[PDF_PROCESSOR] Total chunks created: {len(all_chunks)}")
        
        return all_chunks


# Test the processor
if __name__ == "__main__":
    processor = PDFProcessor()
    
    # Define categories for our PDFs
    categories = {
        "AIA_Procedures_Handbook.pdf": "insurance_procedures",
        "Malaysia_Health_Benefits_Guidebook.pdf": "benefits_guide",
        "Staff_Claim_Form_Guide.pdf": "claim_forms"
    }
    
    try:
        # Process all PDFs
        chunks = processor.process_directory(
            "pdf_files",
            file_categories=categories
        )
        
        # Show sample
        print("\nSample chunk:")
        print("-" * 70)
        print(f"Content: {chunks[0].page_content[:200]}...")
        print(f"Metadata: {chunks[0].metadata}")
        
    except Exception as e:
        print(f"\nError: {e}")
        print("\nMake sure PDF files exist in 'knowledge_base/pdf_files/' directory")
