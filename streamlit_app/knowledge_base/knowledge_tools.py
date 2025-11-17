#!/usr/bin/env python3
"""
LangChain tools for querying the knowledge base.
These tools allow the AI agent to search PDF documents.
"""
import sys
from pathlib import Path
from langchain.tools import tool
import json

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from vector_store import VectorStoreManager

# Initialize vector store (shared across all tools)
try:
    kb_store = VectorStoreManager(
        persist_directory="chroma_db",
        collection_name="knowledge_base"
    )
    print("[KNOWLEDGE_TOOLS] ✅ Knowledge base loaded")
except Exception as e:
    print(f"[KNOWLEDGE_TOOLS] ⚠️  Error loading knowledge base: {e}")
    kb_store = None


@tool
def search_knowledge_base(query: str) -> str:
    """
    Search the knowledge base (PDF/MD documents) for GENERAL information about claims, procedures, and benefits.
    This searches company policies and procedures that apply to ALL employees, not user-specific data.
    Use this for questions about: how to submit claims, eligibility requirements, benefits coverage,
    procedures, deadlines, exclusions, or any policy questions.
    
    DO NOT use this for user-specific queries like "my balance" or "my claims" - use user data tools instead.
    
    Args:
        query: The search query (e.g., "how to submit dental claim", "AIA coverage limits")
        
    Returns:
        JSON string with search results from knowledge base documents
    """
    if not kb_store:
        return json.dumps({"error": "Knowledge base not initialized"})
    
    try:
        # Search for relevant documents
        results = kb_store.search(query, k=3)
        
        if not results:
            return json.dumps({
                "message": "I couldn't find specific information about that in our resources. For detailed information, please contact AIA at 1300 8888 60/70 or reach out to my-hrops@deriv.com.",
                "results": []
            })
        
        # Format results
        formatted_results = []
        for doc in results:
            formatted_results.append({
                "source": doc.metadata.get("source_file", "unknown"),
                "category": doc.metadata.get("category", "unknown"),
                "content": doc.page_content[:500]  # Limit content length
            })
        
        return json.dumps({
            "query": query,
            "total_results": len(results),
            "results": formatted_results
        }, indent=2)
        
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def get_claim_submission_guide() -> str:
    """
    Get GENERAL information about how to submit insurance claims (applies to all employees).
    This provides company-wide claim submission procedures, not user-specific data.
    Use this when users ask about claim submission procedures, requirements, or forms.
    
    DO NOT use this for user-specific queries like "my claims" - use user data tools instead.
    
    Returns:
        JSON string with claim submission procedures from knowledge base
    """
    if not kb_store:
        return json.dumps({"error": "Knowledge base not initialized"})
    
    try:
        # Search specifically for claim submission information
        results = kb_store.search(
            "claim submission procedure requirements form",
            k=3,
            filter_dict={"category": "claim_forms"}
        )
        
        if not results:
            # Fallback to general search
            results = kb_store.search("how to submit claim", k=3)
        
        if not results:
            return json.dumps({
                "message": "I couldn't find specific claim submission details in our resources. Please contact my-hrops@deriv.com for assistance with claim submissions.",
                "results": []
            })
        
        # Format results
        formatted_results = []
        for doc in results:
            formatted_results.append({
                "source": doc.metadata.get("source_file", "unknown"),
                "content": doc.page_content
            })
        
        return json.dumps({
            "guide_type": "claim_submission",
            "total_sections": len(results),
            "results": formatted_results
        }, indent=2)
        
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def get_benefits_information(benefit_type: str = "all") -> str:
    """
    Get GENERAL information about health benefits coverage and eligibility (applies to all employees).
    This provides company-wide benefits information, not user-specific data.
    Use this when users ask about: what benefits are available, coverage limits, eligibility requirements,
    or general benefits questions.
    
    DO NOT use this for user-specific queries like "my remaining balance" - use calculate_balance instead.
    
    Args:
        benefit_type: Type of benefit to query (e.g., "health", "dental", "optical") or "all"
        
    Returns:
        JSON string with general benefits information from knowledge base
    """
    if not kb_store:
        return json.dumps({"error": "Knowledge base not initialized"})
    
    try:
        # Search for benefits information
        query = f"{benefit_type} benefits coverage eligibility" if benefit_type != "all" else "health benefits coverage"
        
        results = kb_store.search(
            query,
            k=3,
            filter_dict={"category": "benefits_guide"}
        )
        
        if not results:
            # Fallback to general search
            results = kb_store.search(query, k=3)
        
        if not results:
            return json.dumps({
                "message": f"I couldn't find specific information about {benefit_type} benefits in our resources. For detailed information, please contact AIA at 1300 8888 60/70 or my-hrops@deriv.com.",
                "results": []
            })
        
        # Format results
        formatted_results = []
        for doc in results:
            formatted_results.append({
                "source": doc.metadata.get("source_file", "unknown"),
                "content": doc.page_content
            })
        
        return json.dumps({
            "benefit_type": benefit_type,
            "total_sections": len(results),
            "results": formatted_results
        }, indent=2)
        
    except Exception as e:
        return json.dumps({"error": str(e)})


# Export all tools
KNOWLEDGE_BASE_TOOLS = [
    search_knowledge_base,
    get_claim_submission_guide,
    get_benefits_information
]


# Test the tools
if __name__ == "__main__":
    print("="*70)
    print("Testing Knowledge Base Tools")
    print("="*70)
    
    # Test general search
    print("\n1. Testing search_knowledge_base:")
    result = search_knowledge_base.invoke({
        "user_email": "test@example.com",
        "query": "How do I submit a claim?"
    })
    print(result[:500] + "..." if len(result) > 500 else result)
    
    # Test claim guide
    print("\n2. Testing get_claim_submission_guide:")
    result = get_claim_submission_guide.invoke({
        "user_email": "test@example.com"
    })
    print(result[:500] + "..." if len(result) > 500 else result)
    
    # Test benefits info
    print("\n3. Testing get_benefits_information:")
    result = get_benefits_information.invoke({
        "user_email": "test@example.com",
        "benefit_type": "health"
    })
    print(result[:500] + "..." if len(result) > 500 else result)
