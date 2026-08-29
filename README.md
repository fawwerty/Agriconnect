# AgriConnect Ghana — CS410 MVP Prototype

A working full-stack prototype of the AgriConnect Ghana marketplace, built to demonstrate the core loop from the Phase 2/3 proposal: farmers list produce, buyers order directly with escrow-style protection, transport is coordinated, and market prices are tracked over time.

## 🚀 CS410 Presentation Highlights

This prototype has been specifically adapted to meet the **CS410 Entrepreneurship in Computing** course requirements:

1. **Local Ghanaian Payments**: We replaced the proposed USSD/Africa's Talking integration (which requires live cloud APIs) with a **fully local simulated payment flow**. Buyers can pay via **MTN Mobile Money, Telecel Cash, AirtelTigo Money, GhIPSS Instant Pay, or Cash on Delivery** directly in the app.
2. **XAMPP Hosting Support (All Files in XAMPP)**: The entire system (both frontend and backend) can be placed directly inside XAMPP's `htdocs` directory to ensure all components are housed together locally, rather than being scattered.
3. **Hybrid Architecture**: This MVP uses a modern Node.js/Express backend paired with a React frontend. The backend runs as an API on `localhost:4000`, while XAMPP serves the frontend on port 80. A one-click `start.bat` script makes launching the entire system from XAMPP seamless.

---

## 🏃 How to Launch the System from XAMPP

To confirm and ensure **all files** (not just a few built components) are inside XAMPP, please follow these exact steps to launch the system:

### Step 1: Move the entire project to XAMPP
Copy or move this entire **`agriconnect`** folder (containing `frontend`, `backend`, `README.md`, etc.) into your XAMPP `htdocs` directory.
Your path should look exactly like this:
👉 `C:\xampp\htdocs\agriconnect`

### Step 2: Start Apache in XAMPP
1. Open your **XAMPP Control Panel**.
2. Click the **Start** button next to **Apache**.
*(Make sure the text highlights green, meaning Apache is running on Port 80).*

### Step 3: Launch the System
1. Open the folder where you just moved the files: `C:\xampp\htdocs\agriconnect`
2. Double-click the **`start.bat`** file.

**What `start.bat` does automatically:**
- It starts the Node.js API backend (opening a command prompt window).
- It builds the React frontend.
- It copies the built frontend files (`index.html`, etc.) into the root of `htdocs\agriconnect` so Apache can serve them.
- It opens your web browser automatically to `http://localhost/agriconnect/`.

*Note: Leave the black command prompt window open while you demo, as that is the backend server running.*

---

## 🏗️ Tech Stack

- **Backend:** Node.js + Express + SQLite (better-sqlite3), JWT auth
- **Frontend:** React 18 + Vite + Tailwind CSS + Recharts
- **Key Features:** Registration/login by role, produce listings (CRUD), marketplace search & ordering, a 6-state escrow-style order workflow, transport booking, per-order chat, notifications, market price history with charts, and an admin dashboard with live analytics.

## 📁 Project Structure (Inside XAMPP)

```text
C:\xampp\htdocs\agriconnect\
├── backend/          Express API + SQLite database
│   ├── db.js          Schema + seed data
│   ├── server.js      Entry point
│   ├── routes/        API Routes
│   └── middleware/    auth.js
├── frontend/         React + Vite app
│   └── src/           React Source Code
├── start.bat         One-click launcher for the demo
└── index.html        (Generated automatically by start.bat for XAMPP to serve)
```

---

## 🔑 Demo Accounts (Password: `password123`)

| Role    | Email                  | Notes |
|---------|-------------------------|-------|
| Farmer  | `kwame@farm.gh`          | Ashanti region, has active listings |
| Farmer  | `abena@farm.gh`          | Eastern region |
| Buyer   | `kofi@buyer.gh`          | Boateng Fresh Foods |
| Buyer   | `efua@buyer.gh`          | Kejetia Wholesale |
| Transp. | `nana@transport.gh`      | Pickup Truck operator |
| Admin   | `admin@agriconnect.gh`   | Dashboard overview |

*The login page also has quick-fill buttons for these accounts so you don't have to type them manually during the demo.*

### Resetting Data
To reset the database, stop the backend server (close the command prompt) and delete all `agriconnect.sqlite*` files in the `backend/` folder. The database will re-seed itself with fresh data on the next startup.

---

## 🔄 Core Demo Flow

1. Log in as **Kwame (Farmer)** → See produce listings → Add a new listing.
2. Log in as **Efua (Buyer)** → Browse the **Marketplace** → Search/filter → Place an order.
3. Log in as **Kwame** again → Go to **Orders** → Accept the new order.
4. Log in as **Efua** → Open the order → Click **💳 Pay now** → Select a payment method (e.g., MTN MoMo) and complete the simulated transaction.
5. Log in as **Kwame** → Mark the order as fulfilled/dispatched.
6. Log in as **Efua** → Confirm receipt of produce → Escrow payment is "released".
7. Log in as **Admin** → View the dashboard to see platform analytics and order payment methods.

