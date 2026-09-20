# PrintQueue (Flash Print) — Self-Service Print-Shop Platform

A modern, multi-tenant SaaS platform built to replace slow, privacy-risky WhatsApp-based document printing in Indian print shops with automated, zero-friction self-service.

---

## 🏗️ Architecture Overview

The system is organized into three clean, modular components:

```text
flash print/
├── backend/          # Node.js + Express + Socket.IO + Prisma ORM (SQLite / PostgreSQL)
│   ├── prisma/       # Database models (Shops, Orders, PriceRules, Payments, Printers)
│   └── src/modules/  # Feature modules (shops, pricing, products, orders, payments, printers)
│
├── frontend/         # Next.js (App Router) + React + Tailwind CSS
│   ├── src/app/shop/[slug]/    # Customer QR ordering flow
│   ├── src/app/order/[id]/      # Live pickup code & progress tracker
│   ├── src/app/admin/           # Shopkeeper dashboard & counter queue
│   ├── src/app/checkout/mock/   # Cashfree / UPI test simulator
│   └── src/app/platform-admin/  # Platform onboarding & QR stand generator
│
└── printer-agent/    # Windows Local Printer Agent (PowerShell discovery & spooling)
    └── src/          # Auto-downloads paid jobs and submits to Windows print queue
```

---

## 🚀 Quick Start (Running Everything)

### Quickest Way (Run Backend & Frontend Together)
From the root directory:
```bash
npm run dev
```
*Starts both Backend (:5000) and Frontend (:3000) concurrently.*

---

Or start components individually via `.bat` scripts or terminal:

### 1. Start the Backend Server
```bash
cd backend
npm run dev
```
*Runs on `http://localhost:5000` (API & WebSockets).*

### 2. Start the Frontend Web App
```bash
cd frontend
npm run dev
```
*Runs on `http://localhost:3000`.*

### 3. Start the Windows Local Printer Agent
```bash
cd printer-agent
npm run dev
```
*Connects to backend and listens for paid orders to print.*

---

## 🧪 How to Test the Full Flow End-to-End

1. Open **[http://localhost:3000](http://localhost:3000)** in your browser.
2. Click **"Customer Ordering Flow"** (or go to `http://localhost:3000/shop/fastprint`).
3. Upload any test PDF, Word document, or image.
4. Watch the automatic page count appear instantly.
5. Toggle B&W / Color, Single / Double-sided, and optional binding.
6. Choose:
   - **Pay Online (UPI)**: Redirects to the Cashfree mock simulator; click "Simulate Successful Payment".
   - **Pay at Counter**: Creates the order with a 4-digit code (e.g. `FP48`).
7. Open **[http://localhost:3000/admin](http://localhost:3000/admin)** (Shopkeeper Dashboard):
   - Watch the order appear in the live queue in real time!
   - If paid online, it automatically routes to the printer agent.
   - If paid at counter, click **"Accept Cash & Print"** to release it.
8. Check the terminal running `printer-agent` — it automatically receives the job, downloads the file, and spools it to the printer!
9. Watch the customer status screen automatically transition to **"Ready for Pickup!"** with celebration confetti!

---

## 🛡️ Privacy Auto-Purge (25 Hours)

Customer files are automatically deleted after 25 hours by the background retention worker in `backend/src/common/retentionCleaner.ts`. Every deletion is recorded in the `deletion_logs` database table for audit compliance.

---

## 📝 Tracking Files

- **`PROJECT_BRAIN.md`**: Chronological log of all updates, architecture, status, and resolved errors.
- **`QUESTIONS_AND_ANSWERS.md`**: Communication log where all architectural decisions are asked and recorded before execution.
