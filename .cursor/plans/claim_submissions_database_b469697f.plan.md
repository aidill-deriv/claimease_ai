---
name: Claim Submissions Database
overview: Design a scalable Supabase database schema for storing claim submissions with proper status workflow, CRUD operations, and relationships to support the claim management team's workflow from draft to paid.
todos:
  - id: schema-design
    content: Create SQL migration for claim_submissions, claim_entries, claim_attachments tables
    status: in_progress
  - id: status-history
    content: Create claim_status_history table and audit trigger
    status: pending
  - id: rls-policies
    content: Set up Row Level Security policies for employee vs reviewer access
    status: pending
  - id: update-submission
    content: Update lib/supabase-claims.ts to use new normalized schema
    status: pending
    dependencies:
      - schema-design
  - id: management-api
    content: Create API endpoints for claim management CRUD operations
    status: pending
    dependencies:
      - schema-design
  - id: management-ui
    content: Build claim management page for reviewers
    status: pending
    dependencies:
      - management-api
---

# Claim Submissions Database Design

## Current State Analysis

The existing database has **read-only data tables** imported from Sage People:

- `claim_summary` - Annual employee claim limits/balances
- `claim_analysis` - Historical claim transactions (already processed)
- `claim_purchasing` - Purchasing-related claims
- `employee_email` - Employee lookup table
- `allowed_users` - Authentication/roles

The current submission flow in [`lib/supabase-claims.ts`](lib/supabase-claims.ts) saves to a basic `claims` table with limited structure. This needs to be replaced with a proper normalized schema.---

## Proposed Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    employee_email ||--o{ claim_submissions : submits
    claim_submissions ||--|{ claim_entries : contains
    claim_submissions ||--o{ claim_attachments : has
    claim_entries ||--o{ claim_attachments : has
    claim_submissions ||--|{ claim_status_history : tracks
    allowed_users ||--o{ claim_submissions : reviews
    
    claim_submissions {
        uuid id PK
        string submission_ref UK
        string employee_id FK
        string submitter_email
        string claim_type
        string status
        decimal total_amount
        string local_currency
        jsonb personal_info
        jsonb work_details
        jsonb fx_snapshot
        string clinic_name
        string headcount
        uuid assigned_reviewer FK
        text rejection_reason
        timestamp submitted_at
        timestamp reviewed_at
        timestamp paid_at
        timestamp created_at
        timestamp updated_at
        string created_by
        string updated_by
    }
    
    claim_entries {
        uuid id PK
        uuid submission_id FK
        int entry_number
        string description
        string currency
        decimal amount
        decimal converted_amount
        string local_currency
        decimal fx_rate
        date service_date
        string claimant_name
        string merchant_name
        string benefit_type
        boolean is_optical
        jsonb optical_verification
        timestamp created_at
    }
    
    claim_attachments {
        uuid id PK
        uuid submission_id FK
        uuid entry_id FK
        string attachment_type
        string storage_path
        string original_filename
        string content_type
        int file_size
        timestamp uploaded_at
    }
    
    claim_status_history {
        uuid id PK
        uuid submission_id FK
        string old_status
        string new_status
        string changed_by_email
        text notes
        timestamp changed_at
    }
```

---

## Status Workflow

```mermaid
stateDiagram-v2
    [*] --> draft: User saves
    draft --> submitted: User submits
    draft --> cancelled: User cancels
    submitted --> under_review: Reviewer picks up
    under_review --> approved: Reviewer approves
    under_review --> rejected: Reviewer rejects
    under_review --> needs_info: More info needed
    needs_info --> submitted: User resubmits
    approved --> processing: Finance processes
    processing --> paid: Payment complete
    rejected --> [*]
    cancelled --> [*]
    paid --> [*]
```

**Status Values:**| Status | Description ||--------|-------------|| `draft` | Saved but not submitted || `submitted` | Submitted for review || `under_review` | Assigned to reviewer || `needs_info` | Returned for additional info || `approved` | Approved by reviewer || `rejected` | Rejected by reviewer || `processing` | Being processed for payment || `paid` | Payment completed || `cancelled` | Cancelled by user |---

## CRUD Operations Design

### Create

- Employee submits claim via web form
- System generates unique `submission_ref` (e.g., `CLM-2025-000001`)
- Uploads attachments to Supabase Storage
- Creates `claim_entries` for each line item
- Initial status: `draft` or `submitted`

### Read

- **Employee**: View own submissions with entries and attachments
- **Reviewer**: View all submissions in queue, filter by status
- **Dashboard**: Aggregate stats by status, reviewer, period

### Update

- **Employee**: Edit draft claims, resubmit needs_info claims
- **Reviewer**: Change status, add notes, assign/reassign
- **System**: Auto-update timestamps, track history

### Delete

- Soft delete only (set `status = 'cancelled'`)
- Preserve audit trail

---

## Scalability Considerations

1. **Indexing Strategy**

- Index on `status` for queue filtering
- Index on `submitter_email` for employee lookups
- Index on `assigned_reviewer` for workload distribution
- Composite index on `(status, submitted_at)` for sorted queues

2. **Partitioning** (future)

- Consider partitioning by `year` or `status` if table grows large

3. **Row Level Security (RLS)**

- Employees see only their own submissions
- Reviewers (admin/superadmin) see all submissions
- Audit logs are append-only

4. **Storage Optimization**

- Attachments in Supabase Storage, not in DB
- JSONB for flexible metadata (personal_info, work_details)

---

## Implementation Tasks

### Phase 1: Database Schema

1. Create `claim_submissions` table with all fields
2. Create `claim_entries` table for line items
3. Create `claim_attachments` table for files
4. Create `claim_status_history` table for audit
5. Add indexes and constraints
6. Set up RLS policies

### Phase 2: Backend Integration

1. Update [`lib/supabase-claims.ts`](lib/supabase-claims.ts) to use new schema
2. Create API endpoints for reviewer CRUD operations
3. Add status transition validation logic

### Phase 3: Claim Management UI

1. Build reviewer queue page (filter by status)
2. Build claim detail view with status actions