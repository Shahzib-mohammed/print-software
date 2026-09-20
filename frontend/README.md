# PrintQueue — Frontend Application

This is the Next.js (App Router) + Tailwind CSS web application for **PrintQueue** (Flash Print). It provides a unified experience with role-based routes for Customers, Shopkeepers, and Platform Admins.

---

## 📁 Key Routes & Pages

1. **`src/app/page.tsx` (`/`)**:
   - Platform launchpad with system health status and quick links to all 3 surfaces.
2. **`src/app/shop/[slug]/page.tsx` (`/shop/:slug`)**:
   - Zero-friction customer ordering flow reached via physical QR scan.
   - Drag & drop document upload, live page-counting, price breakdown, and online/counter payment.
3. **`src/app/order/[id]/page.tsx` (`/order/:id`)**:
   - Real-time order progress tracker with big 4-digit pickup code (`FP48`) and live WebSocket status updates.
4. **`src/app/admin/page.tsx` (`/admin`)**:
   - Shopkeeper Admin Dashboard with live counter queue, one-click payment confirmation, price editor, and product catalog.
5. **`src/app/checkout/mock/page.tsx` (`/checkout/mock`)**:
   - 1-click Cashfree/UPI payment simulator for testing online payments in development.
6. **`src/app/platform-admin/page.tsx` (`/platform-admin`)**:
   - Platform administration, onboarding new shops, and generating printable counter QR code stands.

---

## 🚀 How to Run Locally

1. **Start the Frontend Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

2. **Make sure the backend is running** on [http://localhost:5000](http://localhost:5000) so API and WebSocket connections succeed.
