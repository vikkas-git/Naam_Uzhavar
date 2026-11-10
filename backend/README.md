# 🚜 Naam Uzhavar Backend API (நாம் உழவர்)

> **Unified RESTful API Backend for the Naam Uzhavar Agricultural Marketplace (Commercial Buyer & Farmer Portals)**  
> Stack: **Node.js + Express + MongoDB (Mongoose) + JWT + bcryptjs + CORS**

---

## 🚀 1. Setup Instructions

### Prerequisites
* **Node.js** (v18 or higher)
* **MongoDB** (Local instance running at `mongodb://localhost:27017` or a MongoDB Atlas URI)

### Quick Start
```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create your environment file from template
cp .env.example .env

# 4. Seed initial produce, demo buyer, demo farmer, and EV delivery orders
npm run seed

# 5. Start development server with hot-reload
npm run dev

# 6. Run automated test suite verifying all Farmer APIs & multi-tenant security
npm run test:farmer
```

The server starts on `http://localhost:5000`.

---

## 🔑 2. Demo Credentials

### Commercial Buyer Portal
* **Email:** `demo@naamuzhavar.com`
* **Password:** `demo1234`
* **Role:** Commercial Buyer (Grand Palace Luxury Dining, Madurai)

### Agricultural Farmer Portal
* **Email:** `farmer@naamuzhavar.com`
* **Mobile / Identifier:** `+91 94432 78190`
* **Password:** `farmer1234`
* **Farmer ID:** `FMR-TN-2026-01`
* **Role:** Farmer (Ramesh Kumar - Green Valley Natural Farm, Pollachi)

---

## ⚙️ 3. Environment Variables (`.env`)

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port on which the Express server listens |
| `MONGO_URI` | `mongodb://localhost:27017/naam-uzhavar` | Connection string for MongoDB database |
| `JWT_SECRET` | `naam_uzhavar_secret_jwt_key_2026` | Secret key used to sign and verify JWT authentication tokens |
| `CLIENT_URL` | `http://localhost:5173` | Allowed frontend origin for CORS |

---

## 📡 4. REST API Endpoints Specification

### Public Routes
| Method | Endpoint | Description | Auth Required? |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Health check to verify server status | ❌ No |
| `POST` | `/api/auth/register` | Register a new commercial buyer account | ❌ No |
| `POST` | `/api/auth/login` | Log in as commercial buyer | ❌ No |
| `POST` | `/api/auth/farmer/register` | Register a new agricultural farmer account | ❌ No |
| `POST` | `/api/auth/farmer/login` | Log in as farmer with phone/email and password | ❌ No |
| `GET` | `/api/crops` | List fresh harvest listings (`?search=&category=&grade=`) | ❌ No |

### Buyer Protected Routes (`Authorization: Bearer <buyer_token>`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/auth/me` | Retrieve current buyer session profile |
| `POST` | `/api/orders` | Place a direct order (server calculates total & assigns EV driver) |
| `GET` | `/api/orders` | Get all orders belonging to authenticated buyer |
| `GET` | `/api/orders/:id` | Get single order details by `orderId` or `_id` |
| `PATCH` | `/api/orders/:id/status` | Advances delivery status to next stage |
| `GET` | `/api/invoices` | Retrieve commercial accounting invoices for delivered orders |
| `GET` | `/api/messages` | Read dispatch communication thread |
| `POST` | `/api/messages` | Send a new message to hub dispatcher or driver |
| `GET` | `/api/profile` | Get current buyer business profile (no password) |
| `PUT` | `/api/profile` | Update buyer business details, GSTIN, and avatar |

### Farmer Protected Routes (`Authorization: Bearer <farmer_token>`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/auth/farmer/me` | Retrieve current farmer authenticated session |
| `GET` | `/api/farmer/profile` | Get authenticated farmer's profile, land details, and masked bank info |
| `PUT` | `/api/farmer/profile` | Update farmer land details, residential address, and bank accounts |
| `GET` | `/api/farmer/dashboard` | Computed telemetry metrics (active yield, orders, enquiries) & activity stream |
| `GET` | `/api/farmer/crops` | List farmer's active produce inventory (`?category=&status=&search=&sortBy=`) |
| `POST` | `/api/farmer/crops` | List a new crop harvest lot in the buyer marketplace |
| `PUT` | `/api/farmer/crops/:id` | Update produce pricing, variety, or details (strict ownership check) |
| `PATCH` | `/api/farmer/crops/:id/status` | Pause / resume produce listing status (`active`, `paused`, `sold_out`) |
| `POST` | `/api/farmer/crops/:id/remove` | Soft-remove produce listing (blocks if active order is in progress) |
| `DELETE` | `/api/farmer/crops/:id` | Returns `405 Method Not Allowed` to enforce audit integrity |
| `GET` | `/api/farmer/requests` | List incoming buyer purchase requests & commercial enquiries |
| `POST` | `/api/farmer/requests/:id/accept` | Accept buyer request, converts to confirmed commercial order, updates stock |
| `POST` | `/api/farmer/requests/:id/reject` | Reject buyer request with reason note |
| `GET` | `/api/farmer/orders` | Retrieve farmer's order history ledger with pagination & status filters |
| `GET` | `/api/farmer/orders/:id` | View single order details with EV driver telemetry and buyer details |
| `PATCH` | `/api/farmer/orders/:id/status` | Update consignment milestone (`READY_FOR_PICKUP`, `PICKED_UP`, etc.) |

---

## 🔒 5. Key Architecture & Security Points

1. **Strict Multi-Tenant Farmer Authorization:**
   Every `/api/farmer/*` endpoint extracts `req.farmerId` directly from the validated JWT token signature. Attempts by one farmer to inspect, mutate, accept, or delete another farmer's records are strictly blocked with `403 Forbidden`.
2. **Password Hashing (bcryptjs):**
   Farmer and Buyer passwords are encrypted with bcrypt (10 rounds) before persisting. Plaintext credentials are never saved or returned in API responses.
3. **Data Privacy & Masking:**
   Farmer bank account details are masked (e.g. `••••••••1034`) when transmitting profile data to prevent data leakage.
4. **Unified Single Express Instance & MongoDB Connection:**
   Buyer and Farmer modules share one single Express app (`server.js`) and one connection pool (`config/db.js`), preventing memory leaks and duplicate database connections.
5. **Non-Deletion Agro Audit Safeguard:**
   Harvest produce listings cannot be hard-deleted if active orders or delivery consignments are linked to them. The system provides audited soft-removal.
