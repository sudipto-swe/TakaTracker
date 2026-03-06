# TakaTracker — Database Code

This folder contains the complete database layer of TakaTracker, organized into
**Backend (PostgreSQL)** and **Frontend (Offline/AsyncStorage)**.

## 📁 Folder Structure

```
Database/
│
├── Backend_PostgreSQL/          ← Django + PostgreSQL (Online)
│   ├── Users/
│   │   ├── models.py            → User model (phone, shop name, role)
│   │   ├── serializers.py       → API serialization
│   │   ├── views.py             → Register, Login, OTP endpoints
│   │   └── urls.py              → URL routing
│   │
│   ├── Transactions/
│   │   ├── models.py            → Transaction + TransactionItem models
│   │   ├── serializers.py       → Transaction API serialization
│   │   ├── views.py             → CRUD endpoints
│   │   └── urls.py              → URL routing
│   │
│   ├── Contacts/
│   │   ├── models.py            → Customer & Supplier model
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── Inventory/
│   │   ├── models.py            → Product & StockAdjustment models
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── Payments/
│   │   ├── models.py            → Payment tracking model
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── Sync/
│   │   ├── serializers.py       → Push/Pull data serialization
│   │   ├── views.py             → Sync endpoints (push & pull)
│   │   └── urls.py
│   │
│   └── Config/
│       ├── urls.py              → Main URL configuration
│       └── requirements.txt     → Python dependencies
│
└── Frontend_Offline/            ← Zustand + AsyncStorage (Offline)
    ├── AuthStore/
    │   └── authStore.ts         → User auth state, JWT tokens, login/register
    │
    ├── TransactionStore/
    │   └── transactionStore.ts  → All transactions, today's summary, heatmap data
    │
    ├── InventoryStore/
    │   └── inventoryStore.ts    → Products, stock levels, purchase/sell logic
    │
    ├── ContactStore/
    │   └── contactStore.ts      → Customers & suppliers, balances
    │
    ├── SyncStore/
    │   └── syncStore.ts         → Online/offline status, sync queue
    │
    ├── SyncService/
    │   └── syncService.ts       → Push/Pull sync logic (offline ↔ online)
    │
    └── APIClient/
        ├── index.ts             → Axios HTTP client with JWT interceptor
        ├── sync.ts              → Sync API endpoints
        └── config.ts            → API URL, storage keys, app config
```

## 🔄 How Offline + Online Database Works

```
 Phone (Offline)                          Server (Online)
┌─────────────────┐                  ┌─────────────────────┐
│  Zustand Stores  │                  │   Django REST API    │
│  + AsyncStorage  │ ──── PUSH ────▶ │   + PostgreSQL DB    │
│                  │ ◀─── PULL ───── │                      │
│  authStore       │                  │  users table         │
│  transactionStore│   syncService   │  transactions table  │
│  inventoryStore  │   (every 5min)  │  products table      │
│  contactStore    │                  │  contacts table      │
│  syncStore       │                  │  payments table      │
└─────────────────┘                  └─────────────────────┘
```

## 📊 PostgreSQL Tables

| Table | Description | Key Fields |
|-------|------------|------------|
| `users` | Registered merchants | phone, name, business_name, role |
| `transactions` | Sales, purchases, expenses | type, amount, paid_amount, due_amount |
| `transaction_items` | Line items per transaction | product, quantity, unit_price |
| `products` | Inventory items | name, stock_quantity, purchase_price, selling_price |
| `contacts` | Customers & suppliers | name, phone, balance, contact_type |
| `stock_adjustments` | Stock change history | product, quantity_change, reason |
| `otp_verifications` | OTP records | phone, otp_code, is_verified |
