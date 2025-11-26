# Database Schema Documentation
## Claims Management System

---

## Table of Contents
1. [Overview](#overview)
2. [Table: employee_email](#table-employee_email)
3. [Table: claim_summary](#table-claim_summary)
4. [Table: claim_analysis](#table-claim_analysis)
5. [Table: claim_purchasing](#table-claim_purchasing)
6. [Relationships](#relationships)

---

## Overview

This database supports a comprehensive claims management system with four main tables:
- **employee_email**: Master lookup table for employee ID and email mapping
- **claim_summary**: Tracks employee annual claim limits and balances
- **claim_analysis**: Details individual claim transactions and expenses
- **claim_purchasing**: Records purchasing-related claims (visa, attestation, shipping, etc.)

---

## Table: employee_email

### Description
Master lookup table that maps employee IDs to their email addresses. This table serves as a reference for joining with other tables to retrieve employee information.

### Schema

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `id` | UUID | Primary key, unique identifier for each record |
| `employee_id` | STRING | Unique employee identifier |
| `email` | STRING | Employee email address |

### Sample Data

```json
{
  "id": "883fff31-0237-424f-87bd-3b0e40a7fa64",
  "employee_id": "100026",
  "email": "bill@regentmarkets.com"
}
```

### Key Points
- Simple mapping table for employee identification
- One record per employee
- Used as a lookup table for joins with other claim tables
- Ensures consistent employee_id to email mapping across the system

---

## Table: claim_summary

### Description
Tracks the annual health benefits claim summary for each employee, including maximum allowance, total spent, and remaining balance.

### Schema

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `id` | UUID | Primary key, unique identifier for each record |
| `year` | INTEGER | Calendar year for the claim period |
| `employee_id` | STRING | Unique employee identifier |
| `email` | STRING | Employee email address |
| `employee_name` | STRING | Full name of the employee |
| `company` | STRING | Company/entity name |
| `currency` | STRING | Currency code (MYR, AED, etc.) |
| `country` | STRING | Country of employment |
| `max_amount` | NUMBER | Maximum annual claim limit |
| `total_transaction_amount` | NUMBER | Total amount claimed to date |
| `remaining_balance` | NUMBER | Remaining claimable amount |

### Sample Data

```json
{
  "id": "996ec7b4-7fa0-455d-83f3-64aa9686869d",
  "year": 2025,
  "employee_id": "100656",
  "email": "alassane@regentmarkets.com",
  "employee_name": "Alassane Kane",
  "company": "4X Software Sdn Bhd",
  "currency": "MYR",
  "country": "Malaysia",
  "max_amount": 2000,
  "total_transaction_amount": 2000,
  "remaining_balance": 0
}
```

### Key Points
- One record per employee per year
- `remaining_balance` = `max_amount` - `total_transaction_amount`
- Supports multiple currencies and countries

---

## Table: claim_analysis

### Description
Stores detailed transaction records for employee expense claims, including travel reimbursements, allowances, and other expenses.

### Schema

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `id` | UUID | Primary key, unique identifier for each line item |
| `record_key` | STRING | Claim record reference number |
| `state` | STRING | Claim status (e.g., "Paid") |
| `date_submitted` | STRING | Date when claim was submitted |
| `employee_id` | STRING | Unique employee identifier |
| `employee_name` | STRING | Full name of the employee |
| `job_title` | STRING | Employee's job title |
| `company_name` | STRING | Company name |
| `email` | STRING | Employee email address |
| `country` | STRING | Country of employment |
| `description` | STRING | Claim description |
| `claim_type` | STRING | Type of claim (e.g., "Travel Reimbursement") |
| `claim_description` | STRING | Detailed claim description |
| `line_description` | STRING/NULL | Line item description |
| `transaction_currency` | STRING | Currency of the transaction |
| `transaction_amount` | NUMBER | Amount in transaction currency |
| `date_paid` | STRING | Date when claim was paid |
| `bank_payment` | STRING | Bank payment method/account |
| `account_no` | STRING | GL account number |
| `gl_account_title` | STRING | General ledger account title |
| `class_id` | STRING | Classification ID |
| `claim_currency` | STRING | Currency used for the claim |
| `base_amount_entered` | NUMBER | Base amount entered |
| `total_paid` | NUMBER | Total amount paid |
| `total_due` | NUMBER | Total amount still due |
| `module` | STRING | System module (e.g., "Time & Expenses") |
| `entity` | STRING | Entity code |
| `expense_report_no` | STRING | Expense report number |
| `sup_doc_id` | STRING | Supporting document ID |
| `record_type` | STRING | Type of record (e.g., "eexpenses") |
| `system_generated` | STRING | Flag for system-generated records |
| `memo` | STRING | Memo/notes field |
| `year_submitted` | INTEGER | Year of submission |
| `month_submitted` | INTEGER | Month of submission (1-12) |
| `created_by` | STRING | User ID who created the record |
| `modified_by` | STRING | User ID who last modified |
| `when_modified` | TIMESTAMP | Timestamp of last modification |
| `entry_date` | DATE | Entry date |
| `department_name` | STRING | Department name |
| `location_name` | STRING | Location/office name |
| `line_amount` | NUMBER | Line item amount |
| `line_no` | STRING | Line number |

### Sample Data

```json
{
  "id": "c6f9a3fe-23ed-4478-850c-122e47291f5d",
  "record_key": "150147",
  "state": "Paid",
  "date_submitted": "2024 Sep 06",
  "employee_id": "100079",
  "employee_name": "Alwin Chui",
  "job_title": "IT Admin Manager",
  "company_name": "Deriv Services Sdn Bhd (Cyberjaya)",
  "email": "alwin@regentmarkets.com",
  "country": "Malaysia",
  "description": "Daily Allowance_Trip to Melaka Office_25 Sept to 26 Sept 2025",
  "claim_type": "Travel Reimbursement",
  "transaction_currency": "MYR",
  "transaction_amount": 120,
  "date_paid": "2024 Sep 12",
  "total_paid": 185.91
}
```

### Key Points
- Multiple line items can share the same `record_key`
- Tracks complete audit trail with created_by, modified_by, when_modified
- Supports different claim types: Travel Reimbursement, etc.

---

## Table: claim_purchasing

### Description
Records purchasing-related claims such as visa processing, attestation fees, courier charges, and other vendor payments associated with employees.

### Schema

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `id` | UUID | Primary key, unique identifier |
| `year_submitted` | INTEGER | Year of submission |
| `month_submitted` | INTEGER | Month of submission (1-12) |
| `record_key` | STRING | Claim record reference number |
| `state` | STRING | Claim status (e.g., "Paid") |
| `invoice_no` | STRING | Invoice/reference number |
| `date_submitted` | DATE | Date when claim was submitted |
| `company_name` | STRING | Company name |
| `country` | STRING | Country |
| `supplier_id` | STRING | Supplier/vendor ID |
| `supplier_name` | STRING | Supplier/vendor name |
| `description` | STRING | Claim description |
| `claim_description` | STRING | Detailed claim description |
| `line_description` | STRING | Line item description |
| `transaction_currency` | STRING | Currency of the transaction |
| `transaction_amount` | NUMBER | Amount in transaction currency |
| `date_paid` | DATE | Date when claim was paid |
| `bank_payment` | STRING | Bank payment method/account |
| `account_no` | STRING | GL account number |
| `gl_account_title` | STRING | General ledger account title |
| `class_id` | STRING | Classification ID |
| `claim_currency` | STRING | Currency used for the claim |
| `base_amount_entered` | NUMBER | Base amount entered |
| `module` | STRING | System module (e.g., "Purchasing") |
| `sup_doc_id` | STRING | Supporting document ID |
| `record_type` | STRING | Type of record (e.g., "Payment") |
| `memo` | STRING | Memo/notes field |
| `created_by` | STRING | User ID who created the record |
| `modified_by` | STRING | User ID who last modified |
| `entry_date` | DATE | Entry date |
| `department_name` | STRING | Department name |
| `location_name` | STRING | Location/office name |
| `employee_id` | STRING | Employee ID (beneficiary) |
| `employee_dim_key` | STRING | Employee dimension key |
| `name` | STRING | Employee name |
| `email` | STRING | Employee email address |

### Sample Data

```json
{
  "id": "455febe7-9557-410b-990b-0cb2efb1d93e",
  "year_submitted": 2025,
  "month_submitted": 1,
  "record_key": "186342",
  "state": "Paid",
  "invoice_no": "V244664516",
  "date_submitted": "2025-01-01",
  "company_name": "4X Software Sdn. Bhd.",
  "country": "Malaysia",
  "supplier_id": "J_V0000002MY",
  "supplier_name": "Jabatan Imigresen Malaysia (Government of Malaysia ) - Malaysia",
  "description": "Abu Hasan Al Mobarak DP_Visa Processing Fee",
  "transaction_currency": "MYR",
  "transaction_amount": 126,
  "date_paid": "2025-01-16",
  "employee_id": "101288",
  "name": "Abu Hasan Al Mobarak",
  "email": "abuhasan@regentmarkets.com"
}
```

### Key Points
- Links purchasing transactions to specific employees
- Includes supplier/vendor information
- Common claim types: Visa Processing, Attestation Fees, Courier/Shipping, SSM fees
- Module is always "Purchasing"

---

## Relationships

### Cross-Table Relationships

```
employee_email (One) ─────< (Many) claim_summary
   │                           │
   │                           └─── employee_id
   │
   ├─────< (Many) claim_analysis
   │          │
   │          └─── employee_id
   │
   └─────< (Many) claim_purchasing
              │
              └─── employee_id

claim_summary (One) ─────< (Many) claim_analysis
   │                           │
   │                           │
   └─── employee_id ───────────┘
   
claim_summary (One) ─────< (Many) claim_purchasing
   │                           │
   │                           │
   └─── employee_id ───────────┘
```

### Key Linkages

1. **employee_id**: Primary linking field across all tables
2. **email**: Secondary identifier for employees (mapped in employee_email)
3. **year/year_submitted**: Temporal grouping
4. **currency/transaction_currency**: Financial consistency

### Query Examples

**Get employee details with email lookup:**
```sql
SELECT 
  ee.employee_id,
  ee.email,
  cs.employee_name,
  cs.max_amount,
  cs.remaining_balance
FROM employee_email ee
LEFT JOIN claim_summary cs ON ee.employee_id = cs.employee_id
WHERE ee.email = 'bill@regentmarkets.com';
```

**Get employee's total claims across all types:**
```sql
SELECT 
  ee.email,
  cs.employee_name,
  cs.max_amount,
  cs.total_transaction_amount,
  cs.remaining_balance,
  COUNT(DISTINCT ca.record_key) as analysis_claims,
  COUNT(DISTINCT cp.record_key) as purchasing_claims
FROM employee_email ee
JOIN claim_summary cs ON ee.employee_id = cs.employee_id
LEFT JOIN claim_analysis ca ON cs.employee_id = ca.employee_id 
  AND cs.year = ca.year_submitted
LEFT JOIN claim_purchasing cp ON cs.employee_id = cp.employee_id 
  AND cs.year = cp.year_submitted
WHERE ee.employee_id = '100656'
GROUP BY ee.email, cs.employee_name, cs.max_amount, cs.total_transaction_amount, cs.remaining_balance;
```

**Get all claims for a specific year:**
```sql
SELECT * FROM claim_summary WHERE year = 2025;
SELECT * FROM claim_analysis WHERE year_submitted = 2025;
SELECT * FROM claim_purchasing WHERE year_submitted = 2025;
```

---

## Notes

### Data Integrity
- All tables use UUID for primary keys
- employee_id is consistent across tables for joins
- Date formats vary: some use STRING, others use DATE/TIMESTAMP
- Currency handling requires attention to both transaction_currency and claim_currency

### Common Claim Types
**claim_analysis:**
- Travel Reimbursement
- Daily Allowance
- Mileage and Toll Claim

**claim_purchasing:**
- Visa Processing Fee
- Attestation Fees
- Document Shipment/Courier
- SSM & Company Costs

### Status Values
- **state**: "Paid" (most common in samples)
- Other possible values may include: Pending, Approved, Rejected, etc.

---

*Document generated: November 18, 2025*