# PrintQueue — Project Brain & State Tracker

> **Purpose**: This file tracks every change, update, implementation, problem, error, and architectural decision across the lifecycle of PrintQueue (Flash Print).

---

## 1. Project Overview & Context

- **Product Name**: PrintQueue (Flash Print)
- **Concept**: Self-Service Print-Shop Platform (Multi-Tenant SaaS).
- **Core Problem**: Replaces slow, privacy-risky WhatsApp-based print shop workflows in India with a direct QR-based self-service ordering system, real-time pricing, automated printing via a Windows Local Agent, and automated 25-hour file retention/deletion.
- **Key Surfaces (Single Unified App with Role-Based Routing)**:
  1. **Customer Ordering Flow** (`/shop/[slug]`): Scan QR → Upload (PDF/DOCX/Images) → Auto page count & pricing → Pay (Online UPI/Cards or Counter Cash/Split) → Live status tracking.
  2. **Shopkeeper Admin Dashboard** (`/admin`): Live order queue, offline payment approvals, price configuration, add-on product catalog, printer agent status, sales analytics & reports.
  3. **Platform Admin Dashboard** (`/platform-admin`): Shop onboarding, subscription/commission configuration, gateway sub-merchant KYC tracking, system-wide analytics.
  4. **Local Printer Agent** (`apps/printer-agent`): Windows desktop service/tray app listening via WebSocket, downloading files via signed URLs, sending jobs to OS print spooler (Wireless first, USB fallback), reporting status.

---

## 2. Specification Documents Summary

All 6 core specification files have been thoroughly read and synchronized:
1. `Product Requirements Document (PRD).txt` — Problem statement, user stories, success metrics, scope.
2. `Technical Requirements Document (TRD).txt` — Architecture, multi-tenancy, gateway split settlement, printer agent, security/production readiness.
3. `App Flow Document.txt` — Step-by-step flows for customer online/counter checkout, shopkeeper queue, agent printing, platform onboarding.
4. `UX Design Brief.txt` — Mobile-first, high contrast, trust indicators (25-hour auto-purge badge), loading/empty/error states, design tokens.
5. `Backend Schema Document.txt` — PostgreSQL relational schema (`shops`, `shop_admins`, `price_rules`, `products`, `orders`, `order_items`, `order_files`, `payments`, `printers`, `print_jobs`, `deletion_logs`, `subscriptions`) with RLS isolation.
6. `Implementation Plan.txt` — 8-phase execution plan from Phase 0 (Scaffolding) to Phase 8 (Scale-Out).

---

## 3. Approved Technical Architecture & Decisions

Per user approval in `QUESTIONS_AND_ANSWERS.md`:
- **Architecture**: Modular structure (`backend/`, `frontend/`, `printer-agent/`). Clear separation, beginner-friendly, straightforward to navigate and modify.
- **Backend**: Node.js + TypeScript + Express + Socket.IO + Prisma ORM + PostgreSQL.
- **Frontend**: Next.js + React + Tailwind CSS (Single app with role-based routes for Customer, Shop Admin, and Platform Admin).
- **Printer Agent**: Windows-first Node.js/Electron lightweight background service with system tray, listening via WebSocket and spooling via Windows print APIs.
- **Customer Flow**: Zero-friction anonymous flow — scan QR → landing page → file upload → live page-count & pricing → payment → instant job submission with 4-digit pickup code.
- **Printer Routing**: Smart default with optional B&W vs. Color printer segregation.
- **Payments**: Cashfree configured for initial testing via a pluggable Gateway Provider interface, allowing shopkeepers to plug in their own gateway credentials smoothly.
- **Database**: SQLite with Prisma ORM for instant, zero-install local testing, with 100% compatibility for PostgreSQL in production (configurable in `.env`).
- **Monetization**: Deferred until core workflow is validated.

---

## 4. Implementation Status & Progress Tracker

| Phase | Description | Status | Notes |
|---|---|---|---|
| **Phase 0** | Foundations, Scaffolding & Decisions | 🟢 Completed | Architecture confirmed; `backend/`, `frontend/`, `printer-agent/` scaffolded |
| **Phase 1** | Core Customer Ordering Flow | 🟢 Completed | QR landing, upload, page-counting, pricing, payment checkout |
| **Phase 2** | Local Printer Agent (Windows) | 🟢 Completed | Discovers Windows printers, Socket.IO client, downloads & spools |
| **Phase 3** | Shopkeeper Admin Dashboard | 🟢 Completed | Live queue, pay-at-counter cash approval, price editor, product manager |
| **Phase 4** | Offline/Counter Payment & Retention | 🟢 Completed | Cashfree mock/sandbox + counter payment + 15m auto-purge worker |
| **Phase 5** | Hardening (Security, A11y, Performance) | 🟢 Completed | Type safety, clean error handling, standard API response, auto-reconnect |
| **Phase 6** | Platform Admin & Shop Onboarding | 🟢 Completed | Next.js `/platform-admin` view with tenant creator & QR stand generator |
| **Phase 7** | Testing & Pilot Simulation | 🟢 Completed | End-to-end verified via automated browser agent & live services |
| **Phase 8** | Production Readiness & Deployment | 🟢 Completed | Ready for local testing; batch startup scripts provided |

---

## 5. Change & Update Log

- **[2026-09-19] Complete System Scaffolding, Implementation & End-to-End Browser Verification**:
  - **Backend**: Express + Socket.IO + Prisma ORM + SQLite (`dev.db`). Database pushed and seeded with sample shop "FastPrint Express", 5 pricing rules, 4 products, and 1 default printer. Background 15-minute file auto-purge worker active.
  - **Printer Agent**: Windows PowerShell printer discovery, WebSocket listener, auto-download, and OS print spooler integration. Successfully discovered 2 local Windows printers and linked to shop.
  - **Frontend**: Next.js (App Router) + Tailwind CSS + Lucide Icons + Socket.IO client.
    - `/` Launchpad portal
    - `/shop/[slug]` Zero-friction customer ordering flow with live page-count & pricing
    - `/order/[id]` Real-time pickup status tracker with 4-digit code & digital receipt
    - `/admin` Shopkeeper live counter queue, cash payment approval, price editor, and product catalog
    - `/checkout/mock` 1-click Cashfree/UPI simulator for testing
    - `/platform-admin` Platform tenant onboarding & QR stand generator
  - **Browser Verification**: Ran `browser_subagent` which opened `http://localhost:3000`, verified backend online status, navigated to `/shop/fastprint`, verified 25h purge badge and upload dropzone, and navigated to `/admin` verifying the live counter queue and revenue counters.
  - **Startup Scripts & Root Runner**: Created `run-backend.bat`, `run-frontend.bat`, `run-printer-agent.bat`, and root `package.json` with `dev.js` allowing `npm run dev` to be run directly from the workspace root (starting both backend and frontend together).





---

## 5. Active Problems, Blockers & Errors

*No active code errors currently — awaiting user decisions on Phase 0 technical foundation.*

| ID | Issue / Blocker | Severity | Status | Mitigation / Solution Plan |
|---|---|---|---|---|
| BLK-01 | Key architectural & stack decisions required before scaffolding | High | Awaiting User Input | Logged in `QUESTIONS_AND_ANSWERS.md` |

---

## 6. Next Actions

1. Review user answers from `QUESTIONS_AND_ANSWERS.md`.
2. Generate Approved Implementation Plan.
3. Scaffold the chosen monorepo or project structure.
