# AgriConnect Ghana – XAMPP Hosting Setup Guide
**CS410 Entrepreneurship in Computing – Phase 3 Demo**

---

## Architecture Overview

```
Browser (http://localhost/agriconnect/)
        │
        ├─► Apache (XAMPP htdocs/agriconnect/) ──► React SPA (static HTML/JS/CSS)
        │                                                │
        │                                               API calls (/api/*)
        │                                                │
        └─► Node.js API (localhost:4000) ──► SQLite DB (agriconnect.sqlite)
```

> **Why this hybrid?** The frontend (React/Vite) builds to static files that Apache can serve perfectly. The backend uses Node.js (Express + SQLite) — a much simpler setup than rewriting in PHP for a prototype demo. The end result looks identical to a full XAMPP-native app from the browser's perspective.

---

## Prerequisites

- [x] **XAMPP** installed (default path: `C:\xampp`)
- [x] **Node.js** (v18+) installed — verify with `node --version`
- [x] **npm** installed — verify with `npm --version`

---

## One-Click Setup (Recommended)

1. Double-click **`start.bat`** in the `agriconnect/` folder
2. Wait ~30 seconds for the build to complete
3. Your browser will open automatically at `http://localhost/agriconnect/`

That's it. Both the backend and frontend will start automatically.

---

## Manual Setup (Step by Step)

### 1. Start XAMPP Apache
Open **XAMPP Control Panel** → Click **Start** next to **Apache**

### 2. Install backend dependencies (first time only)
```cmd
cd agriconnect\backend
npm install
```

### 3. Install frontend dependencies (first time only)
```cmd
cd agriconnect\frontend
npm install
```

### 4. Start the Node.js API backend
Open a terminal and run:
```cmd
cd agriconnect\backend
node server.js
```
You should see: `AgriConnect Ghana API running on http://localhost:4000`  
Leave this terminal **open** throughout the demo.

### 5. Build and deploy the frontend to XAMPP
Open a **second** terminal and run:
```cmd
cd agriconnect\frontend
npm run build
xcopy /E /Y dist\* C:\xampp\htdocs\agriconnect\
```
If the `agriconnect` folder doesn't exist in `htdocs`, create it first:
```cmd
mkdir C:\xampp\htdocs\agriconnect
```

### 6. Configure XAMPP to proxy API calls (if needed)
If the browser shows API errors, add this to `C:\xampp\apache\conf\httpd.conf` or create `C:\xampp\htdocs\agriconnect\.htaccess`:

```apache
# .htaccess for agriconnect
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

### 7. Browse the app
Open: **http://localhost/agriconnect/**

---

## Demo Login Credentials

All accounts use password: **`password123`**

| Role | Email | Notes |
|------|-------|-------|
| 🌾 Farmer | `kwame@farm.gh` | Ashanti region, has active listings |
| 🌾 Farmer | `abena@farm.gh` | Eastern region |
| 🛒 Buyer | `kofi@buyer.gh` | Boateng Fresh Foods, Greater Accra |
| 🛒 Buyer | `efua@buyer.gh` | Kejetia Wholesale, Ashanti |
| 🚛 Transport | `nana@transport.gh` | Pickup Truck operator |
| ⚙️ Admin | `admin@agriconnect.gh` | Full platform overview |

---

## Full Order Flow Demo Script

1. **Log in as Buyer** (`kofi@buyer.gh`) → Browse Marketplace → Order Tomatoes
2. **Log in as Farmer** (`kwame@farm.gh`) → Farmer Dashboard → Accept the order
3. **Log back in as Buyer** → Open the order → Click **"💳 Pay now"**
4. Select **MTN Mobile Money** → Enter phone number → Watch the processing animation
5. See the **payment receipt** with `TXN-GH-2026-XXXXXXX` reference
6. **Log in as Farmer** again → Mark order as ready/dispatched
7. **Log back in as Buyer** → Confirm receipt → Payment released
8. **Log in as Admin** (`admin@agriconnect.gh`) → Orders tab → See payment method & reference

---

## Payment Channels Available in the Demo

| Channel | Provider | Phone Format |
|---------|----------|--------------|
| MTN Mobile Money | MTN Ghana | `024 XXXX XXXX` |
| Telecel Cash | Telecel Ghana (formerly Vodafone) | `020 XXXX XXXX` |
| AirtelTigo Money | AirtelTigo Ghana | `027 XXXX XXXX` |
| GhIPSS Instant Pay | Ghana Interbank Payment System | Bank account number |
| Cash on Delivery | In-person | N/A |

> All payments are **simulated locally** — no real money is moved and no internet connection is required.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| API errors on `/api/...` calls | Make sure `node server.js` is running in a terminal |
| Blank page at `http://localhost/agriconnect/` | Run `npm run build` and re-copy `dist\*` to htdocs |
| "Port 4000 in use" error | Kill the existing Node process: `taskkill /F /IM node.exe` |
| XAMPP Apache won't start (port 80 conflict) | Stop Skype or IIS, or change Apache port to 8080 in XAMPP |
| Database errors on first run | Delete `backend\agriconnect.sqlite` and restart — it will re-seed |

---

## What Was Removed vs. Added

| Removed | Replaced With |
|---------|--------------|
| USSD integration (Africa's Talking API) | MTN MoMo, Telecel Cash, AirtelTigo Money, GhIPSS, Cash on Delivery |
| "USSD-first design" copy | Local Mobile Money payment channel copy |
| External telecoms API dependencies | Fully local simulated payment flow |

---

*AgriConnect Ghana — CS410 Entrepreneurship in Computing, Phase 3 Prototype*
