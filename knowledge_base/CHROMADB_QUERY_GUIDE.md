# ChromaDB Query Guide

Quick reference for querying and inspecting your ChromaDB vector database.

---

## 🚀 Quick Start

### Run the Inspection Tool
```bash
cd knowledge_base
python3 inspect_chroma.py
```

This will show:
- Database statistics
- All documents grouped by source
- Test searches
- Interactive search mode

---

## 📊 Common Queries

### 1. Get Database Statistics

```python
from vector_store import VectorStoreManager

store = VectorStoreManager()
stats = store.get_stats()

print(f"Total documents: {stats['total_documents']}")
print(f"Categories: {stats['categories']}")
print(f"Location: {stats['persist_directory']}")
```

**Output:**
```
Total documents: 38
Categories: {'insurance_procedures': 21, 'benefits_guide': 6, 'claim_forms': 11}
Location: chroma_db
```

---

### 2. Search for Documents

```python
from vector_store import VectorStoreManager

store = VectorStoreManager()

# Basic search
results = store.search("dental claim", k=3)

for doc in results:
    print(f"Source: {doc.metadata['source_file']}")
    print(f"Category: {doc.metadata['category']}")
    print(f"Content: {doc.page_content[:200]}\n")
```

---

### 3. Search with Category Filter

```python
# Only search in benefits guide
results = store.search(
    "dental coverage",
    k=3,
    filter_dict={"category": "benefits_guide"}
)

print(f"Found {len(results)} results in benefits_guide")
```

---

### 4. Get All Documents

```python
from vector_store import VectorStoreManager

store = VectorStoreManager()
collection = store.vectorstore._collection

# Get all documents with metadata
all_docs = collection.get(
    include=['documents', 'metadatas']
)

print(f"Total documents: {len(all_docs['documents'])}")

# Show first document
print(f"\nFirst document:")
print(f"Content: {all_docs['documents'][0][:200]}")
print(f"Metadata: {all_docs['metadatas'][0]}")
```

---

### 5. List All Source Files

```python
from vector_store import VectorStoreManager

store = VectorStoreManager()
collection = store.vectorstore._collection

all_docs = collection.get(include=['metadatas'])
sources = set(m['source_file'] for m in all_docs['metadatas'])

print("Source files:")
for source in sources:
    print(f"  - {source}")
```

**Output:**
```
Source files:
  - AIA_Procedures_Handbook.md
  - Malaysia_Health_Benefits_Guidebook.md
  - Staff_Claim_Reimbursement_Form.md
```

---

### 6. Count Documents by Category

```python
from collections import Counter
from vector_store import VectorStoreManager

store = VectorStoreManager()
collection = store.vectorstore._collection

all_docs = collection.get(include=['metadatas'])
categories = [m['category'] for m in all_docs['metadatas']]

print("Documents by category:")
for category, count in Counter(categories).items():
    print(f"  {category}: {count}")
```

**Output:**
```
Documents by category:
  insurance_procedures: 21
  benefits_guide: 6
  claim_forms: 11
```

---

### 7. Get Documents from Specific Source

```python
from vector_store import VectorStoreManager

store = VectorStoreManager()
collection = store.vectorstore._collection

all_docs = collection.get(include=['documents', 'metadatas'])

# Filter by source file
source_file = "Malaysia_Health_Benefits_Guidebook.md"
docs_from_source = [
    (doc, meta) 
    for doc, meta in zip(all_docs['documents'], all_docs['metadatas'])
    if meta['source_file'] == source_file
]

print(f"Found {len(docs_from_source)} chunks from {source_file}")
```

---

### 8. Search Multiple Queries

```python
from vector_store import VectorStoreManager

store = VectorStoreManager()

queries = [
    "How to submit AIA claim",
    "Dental benefits coverage",
    "Health screening eligibility"
]

for query in queries:
    print(f"\nQuery: {query}")
    results = store.search(query, k=2)
    
    if results:
        print(f"✅ Found {len(results)} results")
        print(f"Top result from: {results[0].metadata['source_file']}")
    else:
        print("❌ No results")
```

---

### 9. Get Document Metadata Fields

```python
from vector_store import VectorStoreManager

store = VectorStoreManager()
collection = store.vectorstore._collection

all_docs = collection.get(include=['metadatas'])
sample_meta = all_docs['metadatas'][0]

print("Available metadata fields:")
for key, value in sample_meta.items():
    print(f"  {key}: {value}")
```

**Output:**
```
Available metadata fields:
  source_file: AIA_Procedures_Handbook.md
  category: insurance_procedures
  chunk_index: 0
  total_chunks: 21
  total_sections: 15
```

---

### 10. Interactive Search (One-Liner)

```bash
# Quick search from command line
cd knowledge_base
python3 -c "
from vector_store import VectorStoreManager
store = VectorStoreManager()
results = store.search('dental claim', k=3)
for r in results:
    print(f'{r.metadata[\"source_file\"]}: {r.page_content[:100]}...\n')
"
```

---

## 🔧 Advanced Queries

### Search with Similarity Scores

```python
from vector_store import VectorStoreManager

store = VectorStoreManager()

# Get similarity scores
results = store.vectorstore.similarity_search_with_score(
    "dental claim procedure",
    k=3
)

for doc, score in results:
    print(f"Score: {score:.4f}")
    print(f"Source: {doc.metadata['source_file']}")
    print(f"Content: {doc.page_content[:150]}...\n")
```

---

### Get Specific Chunks from a Document

```python
from vector_store import VectorStoreManager

store = VectorStoreManager()
collection = store.vectorstore._collection

all_docs = collection.get(include=['documents', 'metadatas'])

# Get all chunks from a specific document
source = "AIA_Procedures_Handbook.md"
chunks = [
    (meta['chunk_index'], doc)
    for doc, meta in zip(all_docs['documents'], all_docs['metadatas'])
    if meta['source_file'] == source
]

# Sort by chunk index
chunks.sort(key=lambda x: x[0])

print(f"Chunks from {source}:")
for idx, content in chunks[:3]:  # Show first 3
    print(f"\nChunk {idx}:")
    print(content[:200] + "...")
```

---

### Compare Search Results Across Categories

```python
from vector_store import VectorStoreManager

store = VectorStoreManager()

query = "claim submission"
categories = ["insurance_procedures", "benefits_guide", "claim_forms"]

for category in categories:
    results = store.search(
        query,
        k=2,
        filter_dict={"category": category}
    )
    print(f"\n{category}: {len(results)} results")
    if results:
        print(f"  Top: {results[0].page_content[:100]}...")
```

---

## 🛠️ Utility Scripts

### Quick Stats Script

Create `knowledge_base/quick_stats.py`:

```python
#!/usr/bin/env python3
from vector_store import VectorStoreManager
from collections import Counter

store = VectorStoreManager()
collection = store.vectorstore._collection
all_docs = collection.get(include=['metadatas'])

print("="*50)
print("CHROMADB QUICK STATS")
print("="*50)

# Total
print(f"\nTotal documents: {len(all_docs['metadatas'])}")

# By source
sources = [m['source_file'] for m in all_docs['metadatas']]
print("\nBy source file:")
for source, count in Counter(sources).items():
    print(f"  {source}: {count} chunks")

# By category
categories = [m['category'] for m in all_docs['metadatas']]
print("\nBy category:")
for cat, count in Counter(categories).items():
    print(f"  {cat}: {count} chunks")
```

Run with:
```bash
cd knowledge_base
python3 quick_stats.py
```

---

## 📝 SQLite Direct Queries

ChromaDB uses SQLite internally. You can query it directly:

```bash
cd knowledge_base/chroma_db
sqlite3 chroma.sqlite3
```

**Useful SQLite commands:**
```sql
-- Show all tables
.tables

-- Count documents
SELECT COUNT(*) FROM embeddings;

-- Show collections
SELECT * FROM collections;

-- Show table structure
.schema embeddings

-- Exit
.quit
```

---

## 🎯 Common Use Cases

### Use Case 1: Verify New Document Added
```python
from vector_store import VectorStoreManager

store = VectorStoreManager()
collection = store.vectorstore._collection
all_docs = collection.get(include=['metadatas'])

sources = set(m['source_file'] for m in all_docs['metadatas'])
print("Current documents:")
for source in sources:
    print(f"  ✅ {source}")
```

### Use Case 2: Test Search Quality
```python
from vector_store import VectorStoreManager

store = VectorStoreManager()

test_cases = [
    ("dental claim", "Malaysia_Health_Benefits_Guidebook.md"),
    ("AIA panel clinic", "AIA_Procedures_Handbook.md"),
    ("claim form", "Staff_Claim_Reimbursement_Form.md")
]

for query, expected_source in test_cases:
    results = store.search(query, k=1)
    actual_source = results[0].metadata['source_file'] if results else "None"
    status = "✅" if actual_source == expected_source else "❌"
    print(f"{status} '{query}' → {actual_source}")
```

### Use Case 3: Find Empty or Short Chunks
```python
from vector_store import VectorStoreManager

store = VectorStoreManager()
collection = store.vectorstore._collection
all_docs = collection.get(include=['documents', 'metadatas'])

short_chunks = [
    (meta['source_file'], len(doc))
    for doc, meta in zip(all_docs['documents'], all_docs['metadatas'])
    if len(doc) < 100
]

if short_chunks:
    print("Short chunks found:")
    for source, length in short_chunks:
        print(f"  {source}: {length} chars")
else:
    print("✅ No short chunks found")
```

---

## 🆘 Troubleshooting

### "Collection not found"
```python
# Check if database exists
import os
db_path = "knowledge_base/chroma_db"
if os.path.exists(db_path):
    print("✅ Database exists")
else:
    print("❌ Database not found - run process_mds.py")
```

### "No results found"
```python
# Check if documents exist
from vector_store import VectorStoreManager
store = VectorStoreManager()
stats = store.get_stats()
if stats['total_documents'] == 0:
    print("❌ Database is empty - run process_mds.py")
else:
    print(f"✅ Database has {stats['total_documents']} documents")
```

---

## 📚 Additional Resources

- **Main inspection tool:** `knowledge_base/inspect_chroma.py`
- **Processing script:** `knowledge_base/process_mds.py`
- **Vector store code:** `knowledge_base/vector_store.py`
- **ChromaDB docs:** https://docs.trychroma.com/

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Inspect database | `python3 inspect_chroma.py` |
| Get stats | `store.get_stats()` |
| Search | `store.search(query, k=3)` |
| Filter by category | `store.search(query, filter_dict={"category": "X"})` |
| Get all docs | `collection.get(include=['documents', 'metadatas'])` |
| Rebuild database | `python3 process_mds.py` |

---

**Last Updated:** 2025-11-02
