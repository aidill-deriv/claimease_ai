# ChromaDB Maintenance Guide

Complete guide for maintaining and querying your ChromaDB vector database.

**Last Updated:** 2025-11-02

---

## 📚 Quick Reference

### Essential Commands

```bash
# Inspect database
cd knowledge_base && python3 inspect_chroma.py

# Rebuild database (after MD file changes)
cd knowledge_base && python3 process_mds.py

# Quick stats
cd knowledge_base && python3 -c "from vector_store import VectorStoreManager; print(VectorStoreManager().get_stats())"
```

---

## 🔄 Common Maintenance Tasks

### 1. Adding New MD Files

**Steps:**
1. Add your MD file to `knowledge_base/md_files/`
2. Register it in `knowledge_base/process_mds.py`:
   ```python
   md_categories = {
       "AIA_Procedures_Handbook.md": "insurance_procedures",
       "Malaysia_Health_Benefits_Guidebook.md": "benefits_guide",
       "Staff_Claim_Reimbursement_Form.md": "claim_forms",
       "YOUR_NEW_FILE.md": "your_category"  # Add this
   }
   ```
3. Rebuild the database:
   ```bash
   cd knowledge_base
   python3 process_mds.py
   ```
4. Verify:
   ```bash
   python3 inspect_chroma.py
   ```

**Time:** ~2 minutes

---

### 2. Updating Existing MD Files

**Steps:**
1. Edit the MD file in `knowledge_base/md_files/`
2. Rebuild the database:
   ```bash
   cd knowledge_base
   python3 process_mds.py
   ```
3. Test the changes:
   ```bash
   cd ..
   python3 cli/cli_ai.py
   ```

**Note:** No need to edit `process_mds.py` for existing files!

**Time:** ~2 minutes

---

### 3. Updating AI Instructions

**Steps:**
1. Edit `src/ai_agent.py` (find `self.system_prompt = """...`)
2. Restart the chatbot:
   ```bash
   python3 cli/cli_ai.py
   ```

**Note:** No database rebuild needed!

**Time:** Instant

---

### 4. Verifying Database Contents

**Quick Check:**
```bash
cd knowledge_base
python3 -c "
from vector_store import VectorStoreManager
store = VectorStoreManager()
stats = store.get_stats()
print(f'Documents: {stats[\"total_documents\"]}')
print(f'Categories: {stats[\"categories\"]}')
"
```

**Full Inspection:**
```bash
cd knowledge_base
python3 inspect_chroma.py
```

**Expected Output:**
- Total documents: 38 (or your count)
- Categories: insurance_procedures, benefits_guide, claim_forms
- All source files listed

---

### 5. Testing Search Quality

**Method 1: Using Inspection Tool**
```bash
cd knowledge_base
python3 inspect_chroma.py
# Then type queries in interactive mode
```

**Method 2: Python Script**
```python
from vector_store import VectorStoreManager

store = VectorStoreManager()

# Test queries
queries = [
    "dental claim procedure",
    "AIA panel clinic",
    "health screening eligibility"
]

for query in queries:
    results = store.search(query, k=2)
    print(f"\nQuery: {query}")
    if results:
        print(f"✅ Top result: {results[0].metadata['source_file']}")
    else:
        print("❌ No results")
```

---

## 🛠️ Tools Available

### 1. inspect_chroma.py
**Purpose:** Comprehensive database inspection
**Location:** `knowledge_base/inspect_chroma.py`
**Features:**
- Database statistics
- All documents listing
- Test searches
- Interactive search mode

**Usage:**
```bash
cd knowledge_base
python3 inspect_chroma.py
```

### 2. process_mds.py
**Purpose:** Rebuild vector database from MD files
**Location:** `knowledge_base/process_mds.py`
**When to use:**
- After adding new MD files
- After updating existing MD files
- When database seems corrupted

**Usage:**
```bash
cd knowledge_base
python3 process_mds.py
```

### 3. vector_store.py
**Purpose:** Core vector store functionality
**Location:** `knowledge_base/vector_store.py`
**Features:**
- Search functionality
- Document management
- Statistics

**Usage:**
```python
from vector_store import VectorStoreManager
store = VectorStoreManager()
results = store.search("your query", k=3)
```

---

## 📊 Database Structure

### Current Setup
```
knowledge_base/
├── md_files/                    # Source documents
│   ├── AIA_Procedures_Handbook.md
│   ├── Malaysia_Health_Benefits_Guidebook.md
│   └── Staff_Claim_Reimbursement_Form.md
│
├── chroma_db/                   # Vector database (auto-generated)
│   ├── chroma.sqlite3          # SQLite database
│   └── [embedding files]       # Vector embeddings
│
├── inspect_chroma.py           # Inspection tool
├── process_mds.py              # Rebuild script
├── vector_store.py             # Core functionality
└── CHROMADB_QUERY_GUIDE.md    # Query examples
```

### Document Categories
- `insurance_procedures` - AIA insurance policies (21 chunks)
- `benefits_guide` - Deriv health benefits (6 chunks)
- `claim_forms` - Claim submission procedures (11 chunks)

### Chunk Settings
- **Chunk size:** 1000 characters
- **Overlap:** 200 characters
- **Total chunks:** 38 (from 3 MD files)

---

## 🔍 Common Queries

### Get Statistics
```python
from vector_store import VectorStoreManager
store = VectorStoreManager()
print(store.get_stats())
```

### Search Documents
```python
results = store.search("dental claim", k=3)
for doc in results:
    print(f"Source: {doc.metadata['source_file']}")
    print(f"Content: {doc.page_content[:200]}\n")
```

### Filter by Category
```python
results = store.search(
    "benefits coverage",
    k=3,
    filter_dict={"category": "benefits_guide"}
)
```

### List All Sources
```python
collection = store.vectorstore._collection
all_docs = collection.get(include=['metadatas'])
sources = set(m['source_file'] for m in all_docs['metadatas'])
print(sources)
```

---

## 🆘 Troubleshooting

### Issue: "No results found"

**Check 1: Database exists?**
```bash
ls knowledge_base/chroma_db/
# Should see: chroma.sqlite3 and other files
```

**Check 2: Database has documents?**
```python
from vector_store import VectorStoreManager
store = VectorStoreManager()
stats = store.get_stats()
print(f"Documents: {stats['total_documents']}")
# Should be > 0
```

**Fix:** Rebuild database
```bash
cd knowledge_base
python3 process_mds.py
```

---

### Issue: "Collection not found"

**Cause:** Database not initialized

**Fix:**
```bash
cd knowledge_base
python3 process_mds.py
```

---

### Issue: Search returns wrong results

**Check 1: Test search quality**
```bash
cd knowledge_base
python3 inspect_chroma.py
# Try various queries in interactive mode
```

**Check 2: Verify document content**
```python
from vector_store import VectorStoreManager
store = VectorStoreManager()
collection = store.vectorstore._collection
all_docs = collection.get(include=['documents', 'metadatas'])

# Check first document
print(all_docs['documents'][0][:500])
print(all_docs['metadatas'][0])
```

**Fix:** If content looks wrong, rebuild:
```bash
cd knowledge_base
python3 process_mds.py
```

---

### Issue: AI not using updated information

**Scenario 1: Updated MD file**
- ❌ Just editing MD file won't work
- ✅ Must rebuild database: `python3 process_mds.py`

**Scenario 2: Updated AI instructions**
- ❌ Database rebuild not needed
- ✅ Just restart chatbot: `python3 cli/cli_ai.py`

---

## 📈 Performance Tips

### 1. Optimize Search
```python
# Use category filters for faster searches
results = store.search(
    query="dental",
    k=3,
    filter_dict={"category": "benefits_guide"}
)
```

### 2. Adjust Chunk Size
Edit `knowledge_base/md_processor.py`:
```python
# Current settings
chunk_size=1000      # Increase for more context
chunk_overlap=200    # Increase to preserve context
```

### 3. Limit Results
```python
# Get fewer results for faster response
results = store.search(query, k=2)  # Instead of k=5
```

---

## 🔐 Best Practices

### ✅ DO:
- Keep MD files well-formatted with clear headers
- Rebuild database after MD changes
- Test searches after updates
- Use category filters when possible
- Keep backups of working MD files

### ❌ DON'T:
- Edit files in `chroma_db/` directory (auto-generated)
- Forget to rebuild after MD changes
- Make too many changes at once
- Skip testing after updates

---

## 📝 Maintenance Checklist

### Weekly
- [ ] Test search quality with common queries
- [ ] Check database statistics
- [ ] Verify all source files present

### After MD Updates
- [ ] Edit MD file in `md_files/`
- [ ] Register new file in `process_mds.py` (if new)
- [ ] Run `python3 process_mds.py`
- [ ] Test with `inspect_chroma.py`
- [ ] Test with AI chatbot

### After AI Instruction Updates
- [ ] Edit `src/ai_agent.py`
- [ ] Restart chatbot
- [ ] Test responses
- [ ] No database rebuild needed!

---

## 🎯 Quick Troubleshooting Decision Tree

```
Problem: AI giving wrong answers
    ↓
Is it about general policies/procedures?
    ↓
YES → Check knowledge base
    ↓
    Run: python3 inspect_chroma.py
    Search for relevant content
    ↓
    Content missing/wrong?
        ↓
        YES → Update MD file → Rebuild database
        NO → Update AI instructions in ai_agent.py
    ↓
NO → Check if it's user-specific data
    ↓
    Check database/claims.db
    Verify user data tools working
```

---

## 📚 Additional Resources

- **Query Guide:** `knowledge_base/CHROMADB_QUERY_GUIDE.md`
- **Architecture:** `docs/ARCHITECTURE_SCALABILITY_ANALYSIS.md`
- **AI Instructions:** `docs/AI_INSTRUCTIONS_UPDATE.md`
- **ChromaDB Docs:** https://docs.trychroma.com/

---

## 🎓 Learning Resources

### Understanding RAG
Your system uses RAG (Retrieval-Augmented Generation):
1. **Retrieve:** Search ChromaDB for relevant documents
2. **Augment:** Add retrieved docs to AI context
3. **Generate:** AI creates response using both

### Understanding Vector Search
- Documents converted to embeddings (vectors)
- Search finds similar vectors (semantic search)
- Not keyword matching - understands meaning
- "dental claim" finds "tooth treatment reimbursement"

### Understanding Chunks
- Large documents split into ~1000 char chunks
- Each chunk searchable independently
- Overlap ensures context not lost
- AI gets most relevant chunks, not whole document

---

## 📞 Support

### Common Questions

**Q: How often should I rebuild the database?**
A: Only after adding/updating MD files. Not needed for AI instruction changes.

**Q: Can I query the database directly?**
A: Yes! Use `inspect_chroma.py` or Python console with `VectorStoreManager`.

**Q: How do I know if search is working well?**
A: Run `inspect_chroma.py` and test queries. Results should be relevant.

**Q: What if I want to add a new category?**
A: Just add it in `process_mds.py` when registering your file.

**Q: Can I use PDF files instead of MD?**
A: Yes, but MD is recommended. See `pdf_processor.py` for PDF support.

---

**Last Updated:** 2025-11-02
**Version:** 1.0
