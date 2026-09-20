# PrintQueue — Backend Service

Welcome to the backend of **PrintQueue** (Flash Print). This is an Express + TypeScript + Socket.IO server powered by Prisma ORM.

---

## 📁 Folder Structure Explained

```text
backend/
├── prisma/
│   ├── schema.prisma       # Database tables (Shops, Orders, PriceRules, Payments, Printers, etc.)
│   └── seed.ts             # Demo data (creates "FastPrint Express" shop with sample prices)
├── src/
│   ├── common/             # Shared tools (File upload, PDF page counter, Response format, Auto-purge)
│   ├── config/             # Environment variables & settings loader
│   ├── modules/            # Feature-based business logic:
│   │   ├── auth/           # Login for shopkeepers and admins
│   │   ├── shops/          # Shop onboarding, settings & public slug retrieval
│   │   ├── pricing/        # Dynamic price calculation engine & price rules
│   │   ├── products/       # Shop stationery & binding catalog items
│   │   ├── orders/         # Document upload, order creation, live queue & statistics
│   │   ├── payments/       # Cashfree provider, mock checkout, & offline payment confirmation
│   │   └── printers/       # WebSocket server dispatching print jobs to the Windows agent
│   └── server.ts           # Main Express server entry point
├── .env                    # Local configuration (port, database, secrets)
├── package.json
└── tsconfig.json
```

---

## 🚀 How to Run Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Generate Database & Seed Sample Data**:
   ```bash
   npm run prisma:push
   npm run prisma:seed
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Server will start at `http://localhost:5000`.

---

## 🛠️ How to Make Common Changes

- **Change Default Prices**: Edit `prisma/seed.ts` or use the Shopkeeper Admin Dashboard UI.
- **Switch to PostgreSQL in Production**: Open `backend/.env`, change `DATABASE_URL` to your Postgres URL, and set `provider = "postgresql"` in `prisma/schema.prisma`.
- **Add a New Payment Gateway**: Add a new provider class in `src/modules/payments/` that implements the `PaymentGatewayProvider` interface.
