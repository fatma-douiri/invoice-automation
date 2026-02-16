# Invoice Automation Platform

Production-ready invoice processing pipeline built with a DDD-lite architecture.

This project demonstrates how to design a clean, maintainable backend system that integrates file uploads, AI extraction, external automation tools, and secure webhook callbacks.

**[🚀 Live Demo](https://invoice-automation-mu.vercel.app)** | [GitHub](https://github.com/fatma-douiri/invoice-automation)

A public version of the Make scenario is available here:
[Make Scenario](https://eu1.make.com/public/shared-scenario/ijeyDGR6sEZ/integration-webhooks)

---

## Features

- **Drag-drop upload** with automatic file deduplication (SHA-256)
- **Make.com integration** for AI extraction (OpenAI vision)
- **Status tracking** (UPLOADED → PROCESSING → DONE/DUPLICATE/ERROR)
- **Google Drive/Sheets sync** for invoice management
- **Real-time table** with TanStack Table and React Query

---

## Tech Stack

**Frontend**: Next.js 16, React 19, TypeScript, Tailwind, TanStack Table/Query  
**Backend**: Next.js API Routes  
**Database**: Neon PostgreSQL + Drizzle ORM  
**Validation**: Zod  
**Deployment**: Vercel + GitHub Actions CI/CD

---

## Quick Start

### Test Live Demo (No Setup)

1. Visit https://invoice-automation-mu.vercel.app
2. **Download test PDFs** from `samples/invoices/`:
   - [INV-001.pdf](samples/invoices/INV-001.pdf)
   - [INV-002.pdf](samples/invoices/INV-002.pdf)
3. Upload a PDF (drag-drop)
4. Watch status: **UPLOADED → PROCESSING → DONE/DUPLICATE/ERROR** (takes ~5-10s)
5. Try uploading same file twice (file deduplication test)

✅ **What happens behind the scenes**:

- PDF → Make webhook → Google Drive upload → OpenAI extraction → Google Sheets → callback → status updated

⚠️ **Note**: Live demo uses the creator's Make scenario. Feel free to test with the provided PDFs (no setup needed).

### Local Development

```bash
git clone https://github.com/fatma-douiri/invoice-automation.git
cd invoice-automation
pnpm install

cp .env.local.example .env.local
# Edit .env.local: DATABASE_URL, MAKE_WEBHOOK_URL, MAKE_CALLBACK_SECRET

pnpm db:push    # Apply migrations
pnpm dev        # Start dev server on http://localhost:3000
```

**Generate more test PDFs**:

```bash
node scripts/generate-invoices.ts
```

---

## Architecture

**DDD-lite** structure:

- `src/domain/` — Business logic (invoice status enum, errors)
- `src/application/` — Use cases (upload workflow, webhook callback)
- `src/infrastructure/` — Database (Drizzle schema, migrations)
- `src/hooks/` — React Query (useInvoices, useUploadInvoice)
- `src/components/` — UI (UploadZone, Table)
- `src/app/` — Next.js routes + API endpoints

**Key patterns**:

- Type inference from DB schema (single source of truth)
- Race condition handling on concurrent uploads
- Structured error responses
- File-level + business-level deduplication

---

## API Reference

### POST /api/invoices — Upload Invoice

```bash
curl -X POST http://localhost:3000/api/invoices \
  -F "file=@invoice.pdf"
```

Response: `{ data: { id, fileName, fileHash, status, createdAt } }`

### GET /api/invoices — List Invoices

```bash
curl http://localhost:3000/api/invoices
```

Response: `{ data: [ { id, fileName, status, supplierName, invoiceNumber, amountTTC, ... } ] }`

### POST /api/invoices/make-callback — Webhook Callback

Called by Make.com after extraction. Returns `{ ok: true }`.

---

## Development

```bash
pnpm dev       # Start dev server
pnpm db:studio # Visual database explorer
pnpm db:push   # Apply migrations
pnpm build     # Build for production
pnpm lint      # ESLint + TypeScript check
```

---

## Make.com Integration

The invoice processing workflow is orchestrated in Make.com with error handling at each step:

### Workflow Steps

1. **Webhooks** (Custom Webhook)
   - Receives multipart/form-data from `/api/invoices`
   - Validates file and extracts PDF
   - ❌ Error: Missing file → sets `status: ERROR` → backend returns 400

2. **Google Drive** (Upload a File)
   - Stores PDF in Drive folder
   - ❌ Error: Upload fails → sets `status: ERROR, errorMessage` → backend stores error

3. **Google Cloud Vision** (Text Detection)
   - Extracts raw text from PDF via OCR
   - ❌ Error: OCR fails → sets `status: ERROR, errorMessage` → backend records error

4. **OpenAI** (ChatGPT Extraction)
   - Parses supplier, invoice#, date, amounts from OCR text
   - ❌ Error: Parsing fails → sets `status: ERROR, errorMessage` → backend logs failure

5. **JSON Parser** (Parse JSON)
   - Validates extracted data structure
   - ❌ Error: Invalid JSON → sets `status: ERROR` → webhook fails

6. **Google Sheets** (Add a Row)
   - Appends invoice data to tracking sheet (non-blocking)
   - ⚠️ Error: Sheet append fails → logs warning but continues

7. **HTTP Callback** (Make a Request)
   - POSTs `{ status: "DONE" | "ERROR", extracted, errorMessage, ... }` to `/api/invoices/make-callback`
   - Backend validates with Zod schema
   - Backend computes business-key deduplication
   - Backend updates invoice status + extracted fields in DB

### Status Flow

```
POST /api/invoices (user upload)
         ↓
Make webhook triggered
         ↓
        ╭─────────────────────────╮
        │ Error at any step 1-5?  │
        ├─────────────────────────┤
        │ → POST callback with    │
        │   status: ERROR         │
        │ → Backend sets status=  │
        │   ERROR + errorMessage  │
        ↓ No error ↓
    All steps OK
         ↓
    POST callback with
    status: DONE +
    extracted fields
         ↓
    Backend checks
    business-key dedup
         ├─ Duplicate? → status: DUPLICATE
         └─ Unique? → status: DONE
```

### Configuration

Make webhook integration requires:

- `.env.local` → `MAKE_WEBHOOK_URL` (from Make scenario)
- `.env.local` → `MAKE_CALLBACK_SECRET` (secret header validation)
- **Make scenario must be ACTIVE** (toggle ON in Make dashboard)

**Testable anytime**: Webhook remains active even when you close Make (cloud-based service). Just ensure:

1. Make scenario is toggled **ON**
2. `.env.local` has valid `MAKE_WEBHOOK_URL`
3. All credentials (Google Drive, OpenAI) are configured in Make

No additional setup—just upload and watch it work!

---

## Roadmap (v2)

- Pagination / Sorting / Filtering
- Webhook retry logic (exponential backoff)
- Structured logging (Pino)
- Unit & E2E tests (Vitest, Playwright)
- Database indexes for performance

---

## License

MIT
