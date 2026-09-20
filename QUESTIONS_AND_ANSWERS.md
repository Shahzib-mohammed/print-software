# PrintQueue — Decisions, Questions & Answers Log

> **Protocol**: Per project instructions, **every decision must be presented to and approved by the user before execution**. When you provide answers in this file or in chat, they are logged here and updated in `PROJECT_BRAIN.md`.

---

## Active Questions & Decisions (Phase 0 Setup)

Please review the following decisions and reply with your preferred choices:

### Decision 1: Tech Stack & Architecture Selection
- **Context**: The TRD suggests Next.js/React for frontend, Node.js (Express or NestJS) for backend, PostgreSQL for database, and a lightweight Node/Electron service for the Windows Printer Agent.
- **Options**:
  - **Option A (Recommended)**: **TypeScript Monorepo (Node.js + Express + Socket.IO + Next.js / React + Tailwind CSS + Prisma ORM + Electron/Node Windows Agent)**. This provides unified types across frontend, backend, and printer agent, fast development, and strong ecosystem support.
  - **Option B**: **Next.js Full-Stack App** (App Router with Server Actions / Route Handlers) + separate standalone WebSocket & Printer Agent service.
  - **Option C**: **Python (FastAPI) Backend** + **Next.js Frontend** + **Python/PyQt Windows Agent**.
- **Your Choice**: **Option A — TypeScript (Node.js + Express + Socket.IO + Next.js / React + Tailwind CSS + Prisma ORM + Node/Electron Windows Agent)**.

---

### Decision 2: Project Folder Structure
- **Context**: How the codebase is organized so you can easily understand, navigate, and edit.
- **Options**:
  - **Option A**: Monorepo workspace (`apps/`, `packages/`).
  - **Option B (Selected by User)**: **Modular Single Repository** (`backend/`, `frontend/`, `printer-agent/`). Clear separation of concerns so you can understand and change each part independently.
- **Your Choice**: **Option B — Modular Structure (`backend/`, `frontend/`, `printer-agent/`)**.

---

### Decision 3: Customer Flow & Authentication (PRD §8)
- **Context**: Customer checkout experience upon scanning QR.
- **Options**:
  - **Option A**: Anonymous by default.
  - **Option B**: Mandatory Mobile Number.
  - **Option C**: Mandatory OTP Login.
- **Your Choice**: **Zero friction: Just scan QR, redirect to the shop site, upload document, pick options, pay/finish. No mandatory login or barriers.**

---

### Decision 4: Multi-Printer Scope for V1 (PRD §8)
- **Context**: Printer routing capability on the shop PC.
- **Options**:
  - **Option A**: Smart Default + Optional B&W / Color routing.
  - **Option B**: Single default printer only.
- **Your Choice**: **Option A — Smart Default + Optional B&W vs. Color Routing.**

---

### Decision 5: Platform Monetization Model (PRD §8)
- **Context**: Platform pricing model to shops.
- **Your Choice**: **Deferred / "We will see this afterwards"** (focus on core functionality and ease of use first).

---

### Decision 7: Local Database for Testing & Development
- **Context**: `docker` and `psql` (PostgreSQL) are not currently installed on your local machine.
- **Options**:
  - **Option A (Recommended for effortless testing)**: **SQLite for instant local development with Prisma ORM**, while keeping 100% compatibility with PostgreSQL for production. You can run and test everything immediately without installing any database software.
  - **Option B**: **Require PostgreSQL installed locally or via cloud DB** (e.g. free Neon / Supabase / Render PostgreSQL URL in `.env`).
- **Your Choice**: **Option A — SQLite with Prisma for instant local testing (zero setup needed, 100% compatible with PostgreSQL for production).**

---

## Resolved Decisions Log

| Decision ID | Topic | Resolution | Notes |
|---|---|---|---|
| **DEC-01** | Tech Stack | TypeScript (Node + Express + Socket.IO + Next.js + Tailwind + Prisma) | Unified typed ecosystem |
| **DEC-02** | Folder Structure | Modular (`backend/`, `frontend/`, `printer-agent/`) | Highly readable, self-contained, easy for user to understand & change |
| **DEC-03** | Customer Flow | Zero-friction direct QR scan → Upload → Print options → Pay | No sign-up friction |
| **DEC-04** | Printer Routing | Smart Default with optional B&W vs. Color routing | Fits standard shop setups (1 B&W + 1 Color) |
| **DEC-05** | Monetization | Deferred | Revisit once MVP core workflow is working |
| **DEC-06** | Payment Gateway | Cashfree (with pluggable gateway architecture for testing) | Clean abstraction so any shop's gateway can be plugged in later |
| **DEC-07** | Local Database | SQLite via Prisma for instant local testing | Zero installation required; seamless toggle to PostgreSQL in `.env` |


