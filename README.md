# AgriConnect Ghana — CS410 MVP Prototype

A working full-stack prototype of the AgriConnect Ghana marketplace, built to demonstrate the core loop from the Phase 2/3 proposal: farmers list produce, buyers order directly with escrow-style protection, transport is coordinated, and market prices are tracked over time.

## 🚀 CS410 Presentation Highlights

This prototype has been specifically adapted to meet the **CS410 Entrepreneurship in Computing** course requirements:

1. **Local Ghanaian Payments**: We replaced the proposed USSD/Africa's Talking integration (which requires live cloud APIs) with a **fully local simulated payment flow**. Buyers can pay via **MTN Mobile Money, Telecel Cash, AirtelTigo Money, GhIPSS Instant Pay, or Cash on Delivery** directly in the app.
2. **XAMPP Hosting Support**: The frontend is built to be served directly from XAMPP's Apache `htdocs` directory, ensuring it runs locally without needing a cloud hosting environment.
3. **Hybrid Architecture**: While the proposal mentioned PHP/Laravel, this MVP uses a modern Node.js/Express backend paired with a React frontend. The backend runs as an API on `localhost:4000`, while XAMPP serves the frontend on port 80. A one-click `start.bat` script makes demoing seamless.

## 🏗️ Tech Stack

- **Backend:** Node.js + Express + SQLite (better-sqlite3), JWT auth
- **Frontend:** React 18 + Vite + Tailwind CSS + Recharts
- **Key Features:** Registration/login by role, produce listings (CRUD), marketplace search & ordering, a 6-state escrow-style order workflow, transport booking, per-order chat, notifications, market price history with charts, and an admin dashboard with live analytics.

## 📁 Project Structure

```text
agriconnect/
├── backend/          Express API + SQLite database
│   ├── db.js          Schema + seed data (runs automatically on first start)
│   ├── server.js      Entry point
│   ├── routes/        auth, listings, orders, transport, market-prices, messages, etc.
│   └── middleware/    auth.js
├── frontend/         React + Vite app
│   └── src/
│       ├── pages/       Landing, Login, Register, Dashboards, Marketplace, Order Detail
│       └── components/  Shared UI components
├── XAMPP_SETUP.md    Detailed guide for hosting on XAMPP for the presentation
└── start.bat         One-click launcher for the demo
```

## 🏃 Running the Demo

For detailed instructions on running this project via XAMPP for your presentation, please refer to the **[XAMPP_SETUP.md](./XAMPP_SETUP.md)** file.

### Quick Start (One-Click)

If you have Node.js and XAMPP installed (at `C:\xampp`), you can simply double-click the **`start.bat`** file in the root folder. It will:
1. Start the Node.js backend API.
2. Build the React frontend.
3. Deploy the frontend to `C:\xampp\htdocs\agriconnect`.
4. Open your browser to the local site.

### Demo Accounts (Password: `password123`)

| Role    | Email                  | Notes |
|---------|-------------------------|-------|
| Farmer  | `kwame@farm.gh`          | Ashanti region, has active listings |
| Farmer  | `abena@farm.gh`          | Eastern region |
| Buyer   | `kofi@buyer.gh`          | Boateng Fresh Foods |
| Buyer   | `efua@buyer.gh`          | Kejetia Wholesale |
| Transp. | `nana@transport.gh`      | Pickup Truck operator |
| Admin   | `admin@agriconnect.gh`   | Dashboard overview |

*The login page also has quick-fill buttons for these accounts.*

### Resetting Data
To reset the database, stop the backend server and delete all `agriconnect.sqlite*` files in the `backend/` folder. The database will re-seed itself with fresh data on the next startup.

## 🔄 Core Demo Flow

1. Log in as **Kwame (Farmer)** → See produce listings → Add a new listing.
2. Log in as **Efua (Buyer)** → Browse the **Marketplace** → Search/filter → Place an order.
3. Log in as **Kwame** again → Go to **Orders** → Accept the new order.
4. Log in as **Efua** → Open the order → Click **💳 Pay now** → Select a payment method (e.g., MTN MoMo) and complete the simulated transaction.
5. Log in as **Kwame** → Mark the order as fulfilled/dispatched.
6. Log in as **Efua** → Confirm receipt of produce → Escrow payment is "released".
7. Log in as **Admin** → View the dashboard to see platform analytics and order payment methods.
