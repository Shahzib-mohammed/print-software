# PrintQueue — Windows Local Printer Agent

This is the background desktop agent that runs on the shopkeeper's Windows PC.

---

## 💡 How It Works

1. **Auto-Discovers Printers**: Detects installed Windows printers (Wireless network printers and USB printers) using PowerShell.
2. **Connects to Cloud**: Opens a persistent WebSocket (Socket.IO) connection to your PrintQueue backend.
3. **Receives Paid Orders**: When a customer pays (online or confirmed at counter), the cloud instantly pushes the job details to this agent.
4. **Downloads Document**: Securely fetches the document via authenticated URL into a local temporary folder.
5. **Prints Document**: Sends the document to the Windows print spooler with the customer's chosen options (B&W/Color, copies, single/double sided).
6. **Reports Status**: Sends real-time progress (`printing` → `completed`) so the customer's phone updates live with "Ready for pickup!".

---

## 🚀 How to Run Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure (Optional)**:
   In `.env`:
   - `BACKEND_URL`: URL of the PrintQueue backend (default: `http://localhost:5000`)
   - `SHOP_SLUG`: Your shop identifier (default: `fastprint`)

3. **Start the Agent**:
   ```bash
   npm run dev
   ```

---

## 🛠️ How to Customize

- **Add More Printers**: Open Windows Settings > Bluetooth & devices > Printers & scanners. Any printer added to Windows is automatically recognized by the agent.
- **Offline Mode**: If internet drops, downloaded jobs remain safely queued in `temp_print_jobs/`.
