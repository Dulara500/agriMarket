# 🌿 AgriMarket

An agricultural marketplace connecting **Buyers**, **Farmers**, and **Government Admins** for fair, transparent vegetable trading.

## 🚀 Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Zustand
- **Backend**: Node.js + Express.js + Socket.IO
- **Database**: PostgreSQL

---

## 📁 Project Structure

```
Project/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── controllers/   # Business logic
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth, error handling
│   │   ├── services/      # Cron jobs
│   │   └── config/        # DB connection
│   ├── migrations/        # SQL schema
│   ├── scripts/           # Migration runner
│   └── server.js
└── frontend/         # React + Vite app
    └── src/
        ├── pages/
        │   ├── auth/      # Login, Register
        │   ├── buyer/     # Home, Product, Cart, Checkout, Orders, Profile
        │   ├── farmer/    # Dashboard, Products, Orders, Earnings
        │   └── admin/     # Analytics, Prices, Users
        ├── layouts/       # Buyer, Farmer, Admin layouts
        ├── store/         # Zustand state management
        └── services/      # Axios API layer
```

---

## ⚙️ Setup & Running

### 1. PostgreSQL Setup

Create a database named `agrimarket`:
```sql
CREATE DATABASE agrimarket;
```

### 2. Backend Setup

```bash
cd backend

# Configure your database credentials
# Edit .env file:
#   DB_PASSWORD=your_postgres_password
#   JWT_SECRET=your_secret_key

# Run database migration (creates all tables + seed data)
npm run migrate

# Start development server
npm run dev
```

Backend runs on: **http://localhost:5000**

### 3. Frontend Setup

```bash
cd frontend

# Start development server
npm run dev
```

Frontend runs on: **http://localhost:5173**

---

## 🔑 Default Login Accounts

After migration, use these demo accounts:

| Role  | Email                     | Password |
|-------|---------------------------|----------|
| Admin | admin@agrimarket.com      | password |

Register new **Buyer** and **Farmer** accounts via the Register page.

---

## 🧩 Key Features

### Buyer
- Browse vegetables with search & category filters
- View multiple farmers per product (sorted by rating & distance)
- Add to cart with **15-minute stock reservation** (race-condition safe)
- Checkout with COD or digital payment
- Track order status in real-time
- Rate farmers after delivery

### Farmer
- List products from government catalog
- Manage stock quantities inline
- Accept/Reject incoming orders
- Progress orders through delivery stages
- View earnings with charts

### Admin
- Set government-controlled prices (broadcasts notifications to all users)
- Manage users (activate/deactivate, verify farmers)
- Analytics dashboard (revenue charts, order status, top products)

---

## 🗄️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register buyer/farmer |
| POST | `/api/auth/login` | Login |
| GET | `/api/products` | List all vegetables |
| GET | `/api/products/:id/farmers` | Farmers selling this product |
| POST | `/api/cart/items` | Add to cart (atomic reservation) |
| POST | `/api/orders` | Checkout |
| PATCH | `/api/orders/:id/status` | Update order status |
| POST | `/api/admin/products/:id/price` | Set government price |

---

## 🔒 Security Features

- JWT authentication with role-based access
- Atomic stock reservation with `SELECT ... FOR UPDATE`
- Reservation cleanup cron (every 5 min)
- Helmet.js security headers
- Input validation
