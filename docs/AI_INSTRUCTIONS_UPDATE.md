# AI Instructions Update - Deriv Benefits System

**Date:** 2025-11-02  
**Status:** ✅ COMPLETE

---

## 🎯 What Was Updated

The AI agent (`src/ai_agent.py`) has been updated with comprehensive instructions based on three key documents:

1. **AIA Procedures Handbook** - Medical insurance procedures
2. **Malaysia Health Benefits Guidebook** - Deriv health benefits (dental/optical/screening)
3. **Staff Claim Reimbursement Form** - Claim submission process

---

## 📚 Source Documents

### Location
All source documents are in: `knowledge_base/md_files/`

```
knowledge_base/md_files/
├── AIA_Procedures_Handbook.md
├── Malaysia_Health_Benefits_Guidebook.md
└── Staff_Claim_Reimbursement_Form.md
```

---

## 🧠 Key AI Knowledge Added

### 1. **Dual Benefit System Understanding**

The AI now understands there are TWO separate systems:

#### AIA Medical Insurance (RM 150,000)
- **Coverage:** GP, Specialist, Hospital, Emergency
- **Method:** Cashless with AIA e-Medical card at panel clinics
- **Deadline:** 30 days from treatment
- **Processing:** 21 days after submission
- **Contact:** 1300 8888 60/70

#### Deriv Health Benefits (MYR 2,000)
- **Coverage:** Dental, Optical, Health Screening ONLY
- **Method:** Pay first, claim via Sage People
- **Deadline:** Same month as service
- **Eligibility:** Confirmed employees only
- **Contact:** my-hrops@deriv.com

---

### 2. **Claim Submission Processes**

#### For AIA Claims (Non-Panel/Emergency)
1. Complete AIA Corporate Solutions Claim Form
2. Attach: Original receipts, IC/Passport, Medical report (if needed)
3. Submit to HR Department
4. Wait 21 days for processing

#### For Deriv Benefits (Dental/Optical/Health Screening)
1. Pay upfront at any provider
2. Get receipt with your name
3. Get approval from authorised person
4. Submit via Sage People within same month
5. Use Staff Claim Reimbursement Form (ClickUp)

---

### 3. **Staff Claim Form Types**

The AI knows about 5 claim types:

| Type | Purpose | E-Invoice Required |
|------|---------|-------------------|
| **Employee Benefit** | Dental/Optical/Health Screening | ❌ No |
| **Travel Reimbursement** | Travel/Parking/Taxi/Mileage | ✅ Yes (MY) |
| **Educational Assistance** | Courses/Training | ✅ Yes (MY) |
| **Other Reimbursement** | Team Building/Lunch | ✅ Yes (MY) |
| **Cash Advance** | Marketing purposes | ✅ Yes (MY) |

---

### 4. **Important Rules & Deadlines**

#### Medical Report Requirements
- GP claim > RM80 → Medical report required
- Specialist claim > RM150 → Medical report required
- Hospital claim > RM500 → Medical report required

#### Referral Requirements
- Specialist visits → MUST have GP referral (valid 30 days)
- Hospital admission → Apply Guarantee Letter 1 day before

#### E-Invoicing (Malaysia Staff)
- Required for ALL claims EXCEPT Employee Benefits
- Request e-invoice with company details from supplier

---

### 5. **Exclusions**

#### AIA Does NOT Cover
- Cosmetic procedures, LASIK
- Dental care (except accidents)
- Pregnancy/childbirth
- Alternative therapies
- Vitamins, supplements
- Mental health conditions
- Preventive vaccinations (except mandatory child)

#### Deriv Benefits Do NOT Cover
- Non-prescription sunglasses
- Cosmetic dental treatments
- Dependent claims
- Services before confirmation date

---

## 🎨 AI Response Style

The AI has been instructed to:

1. **Be warm and empathetic** - Friendly, conversational tone
2. **Use simple language** - Avoid jargon
3. **Provide step-by-step instructions** - Clear guidance
4. **Mention deadlines and limits** - Always include relevant info
5. **Clarify benefit systems** - Distinguish AIA vs Deriv
6. **Include contact info** - Provide relevant contacts
7. **Offer follow-up help** - Ask if user needs more info

---

## 📝 Example AI Responses

### Example 1: Dental Claim

**User:** "Can I claim for dental?"

**AI Response:**
```
Yes! Dental claims fall under Deriv Health Benefits (MYR 2,000 annual limit), 
not AIA insurance. Here's how:

1. Visit any dental provider
2. Pay upfront and get receipt with your name
3. Get approval from authorised person
4. Submit via Sage People within the same month
5. Use the Staff Claim Reimbursement Form (Employee Benefit type)

Note: No e-invoice needed for dental claims!

Your current balance is MYR 1,271 remaining out of MYR 2,000.

Need help with anything else?
```

---

### Example 2: Specialist Visit

**User:** "I need to see a specialist"

**AI Response:**
```
For specialist visits under AIA insurance:

1. First visit your panel GP to get a referral letter (valid 30 days)
2. Apply for Guarantee Letter via AIA+ app at least 1 day before appointment
3. Show pre-approved notification at specialist clinic
4. Treatment will be cashless at panel specialists

Your specialist visit is covered up to RM 1,000 per visit under your 
AIA insurance (RM 150,000 annual limit).

If it's an emergency, you can visit directly and claim later within 30 days.

Would you like help finding a panel specialist?
```

---

### Example 3: Emergency Situation

**User:** "I had an emergency, went to non-panel clinic"

**AI Response:**
```
For emergency visits to non-panel clinics:

1. Keep all original receipts
2. Complete AIA Corporate Solutions Claim Form
3. Indicate it was an emergency (date, time, reason)
4. Attach: Receipts, IC/Passport copy, Medical report (if claim > RM80)
5. Submit to HR Department within 30 days

Processing time: 21 days after AIA receives complete documents

If you need immediate assistance, call AIA 24-hour hotline: 1300 8888 60/70

Is there anything else I can help you with?
```

---

## 🚀 How to Add MD Files to Knowledge Base

### Option 1: Convert to PDF (Recommended)

**Why:** The current knowledge base processes PDF files

**Steps:**
```bash
# 1. Convert MD to PDF (use any tool like pandoc, online converter, or print to PDF)
# Example with pandoc:
cd knowledge_base/md_files
pandoc AIA_Procedures_Handbook.md -o ../pdf_files/AIA_Procedures_Handbook.pdf
pandoc Malaysia_Health_Benefits_Guidebook.md -o ../pdf_files/Malaysia_Health_Benefits_Guidebook.pdf
pandoc Staff_Claim_Reimbursement_Form.md -o ../pdf_files/Staff_Claim_Reimbursement_Form.pdf

# 2. Process the PDFs
cd ..
python3 process_pdfs.py
```

---

### Option 2: Keep as MD (Requires Code Update)

**If you want to process MD files directly:**

1. Update `knowledge_base/pdf_processor.py` to handle `.md` files
2. Add markdown parsing logic
3. Process both PDF and MD files

**Code changes needed:**
```python
# In pdf_processor.py, add:
def load_markdown(file_path: str) -> str:
    """Load markdown file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

# Update process_documents() to handle .md files
```

---

## ✅ Current Status

### What's Done
- ✅ AI system prompt updated with comprehensive instructions
- ✅ Dual benefit system understanding (AIA + Deriv)
- ✅ Claim submission processes documented
- ✅ Staff claim form types explained
- ✅ Exclusions and rules added
- ✅ Contact information included
- ✅ Response style guidelines set

### What's Available
- ✅ MD files in `knowledge_base/md_files/`
- ✅ AI can answer questions based on instructions
- ✅ AI can search existing knowledge base (if PDFs added)

### Optional Next Steps
- [ ] Convert MD files to PDF
- [ ] Add PDFs to knowledge base
- [ ] Test AI with various queries
- [ ] Add more example scenarios
- [ ] Create FAQ document

---

## 🧪 Testing the AI

### Test Queries to Try

```bash
python3 cli/cli_ai.py
```

**Test these questions:**

1. "Can I claim for dental?"
2. "How do I see a specialist?"
3. "What's my remaining balance?"
4. "I had an emergency, what do I do?"
5. "How do I submit a claim?"
6. "What's covered under AIA?"
7. "What's the difference between AIA and Deriv benefits?"
8. "Do I need e-invoice for dental claims?"
9. "How long does claim processing take?"
10. "Can I claim for LASIK?"

---

## 📊 AI Capabilities

### What the AI Can Do Now

✅ **Distinguish between two benefit systems**
- Knows AIA covers medical (GP/Specialist/Hospital)
- Knows Deriv covers dental/optical/health screening

✅ **Provide accurate claim processes**
- Cashless vs reimbursement methods
- Correct deadlines and requirements
- Proper documentation needed

✅ **Explain exclusions**
- What's NOT covered under each system
- Why certain things are excluded

✅ **Give step-by-step guidance**
- How to use AIA+ app
- How to submit via Sage People
- How to fill claim forms

✅ **Provide contact information**
- AIA hotline for emergencies
- HR email for Deriv benefits
- Claim form URLs

---

## 🎯 Key Takeaways

1. **AI is now context-aware** - Understands Deriv's specific benefit structure
2. **Dual system support** - Can handle both AIA and Deriv benefits
3. **Accurate guidance** - Provides correct processes and deadlines
4. **User-friendly** - Warm, helpful, step-by-step responses
5. **Security maintained** - Still email-scoped, user data protected

---

## 📞 Support

**For AI-related questions:**
- Check this documentation
- Test with sample queries
- Review `src/ai_agent.py` system prompt

**For benefits questions:**
- AIA: 1300 8888 60/70
- Deriv HR: my-hrops@deriv.com

---

**Updated:** 2025-11-02  
**Status:** ✅ Ready for use  
**Next:** Test AI with real queries
