<p align="center">
  <img src="./banner.png" alt="TakaTracker Banner" width="100%"/>
</p>

<h1 align="center">৳ TakaTracker — ডিজিটাল হিসাব-নিকাশ</h1>

<p align="center">
  <strong>A modern, offline-first digital bookkeeping app for Bangladeshi small businesses</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.76-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React Native"/>
  <img src="https://img.shields.io/badge/Expo-52-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo"/>
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Django-5.0-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android_|_iOS_|_Web-green?style=flat-square" alt="Platform"/>
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/badge/Language-Bangla_🇧🇩_|_English-orange?style=flat-square" alt="Language"/>
  <img src="https://img.shields.io/badge/Offline-First-red?style=flat-square" alt="Offline First"/>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Modules Breakdown](#-modules-breakdown)
- [Database Design](#-database-design)
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [Installation & Setup](#-installation--setup)
- [API Endpoints](#-api-endpoints)
- [Offline/Online Sync](#-offlineonline-sync)
- [Design Decisions](#-design-decisions)
- [Screenshots](#-screenshots)
- [Future Roadmap](#-future-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**TakaTracker** (টাকাট্র্যাকার) is a comprehensive mobile bookkeeping application designed specifically for **small shopkeepers in Bangladesh**. It replaces the traditional handwritten *khata* (হিসাবের খাতা) with a powerful digital solution that works **with or without internet**.

### 🎯 The Problem
- **~90% of small shops** in Bangladesh still use paper-based bookkeeping
- Calculation errors, lost records, and difficulty tracking debts are common
- Internet connectivity is unreliable in many areas
- Existing apps are in English and not designed for Bangladeshi merchants

### 💡 Our Solution
A **Bangla-first, offline-first** mobile app that:
- Records every taka (৳) of sales, purchases, and expenses
- Tracks inventory and stock levels automatically
- Manages customer/supplier dues (পাওনা/দেনা) easily
- Syncs to cloud when internet is available
- Works 100% without internet — zero downtime

---

## ✨ Key Features

### 🔐 Authentication
| Feature | Description |
|---------|-------------|
| 📱 Phone + Password Login | Bangladeshi phone number-based authentication |
| 📝 Shop Registration | Register with business name, type, and owner details |
| 🔢 OTP Verification | 6-digit one-time password via SMS |
| 🔄 Password Reset | Forgot password → OTP verify → New password flow |
| 🔑 JWT Tokens | Secure stateless authentication with auto-refresh |
| 💾 Persistent Login | Stay logged in across app restarts |

### 📊 Dashboard
| Feature | Description |
|---------|-------------|
| 📈 Today's Summary | Real-time sales, purchases, expenses, net profit |
| 🟥 Sales Heatmap | 7-day color-coded sales visualization |
| 💰 পাওনা/দেনা | Outstanding receivables & payables at a glance |
| ⚡ Quick Actions | One-tap access to frequent operations |
| 📋 Recent Transactions | Last 5 transactions with type indicators |
| 🔄 Sync Status | Live online/offline indicator with pull-to-refresh |

### 💳 Transactions
| Feature | Description |
|---------|-------------|
| 🟢 Sales (বিক্রি) | Record sales with product, quantity, customer |
| 🔴 Purchases (ক্রয়) | Record purchases from suppliers, auto-update inventory |
| 🟡 Expenses (খরচ) | Track rent, electricity, salary, transport expenses |
| 📊 Due Tracking | Automatic calculation of পাওনা (receivable) & দেনা (payable) |
| 🔍 Search & Filter | Filter by type, search by name, date-range picker |
| 📅 Bengali Calendar | Custom date picker with Bangla month names |

### 📦 Inventory Management
| Feature | Description |
|---------|-------------|
| 📦 Product Catalog | Name, SKU, category, stock levels, pricing |
| ⚠️ Low Stock Alerts | Dramatic pop-up notifications when stock is low |
| 📊 Stock Analytics | Top selling products, category breakdown, valuation |
| 🔄 Auto Stock Update | Purchases increase stock, sales decrease stock |
| 💹 Profit Tracking | Per-product profit = (sell price - buy price) × quantity |

### 👥 Contact Management
| Feature | Description |
|---------|-------------|
| 🧑‍💼 Customer Database | Name, phone, address, transaction history |
| 🏢 Supplier Database | Supplier details with outstanding balances |
| 💰 Balance Tracking | Running balance per contact (who owes what) |

### 🌐 Offline/Online
| Feature | Description |
|---------|-------------|
| 📱 Offline-First | 100% functional without internet |
| ☁️ Cloud Sync | Auto-sync every 5 minutes when online |
| 📤 Push Queue | Offline actions queue up, sync when connected |
| 🔄 Bi-directional | Push local → server, Pull server → local |

### 🌍 Internationalization
| Feature | Description |
|---------|-------------|
| 🇧🇩 Bangla (বাংলা) | Full UI in Bangla — default language |
| 🇬🇧 English | Complete English translation available |
| ৳ BDT Currency | Bangladeshi Taka formatting throughout |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE CLIENT                             │
│                    (React Native + Expo)                          │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Screens │  │  Zustand  │  │  Sync    │  │  AsyncStorage    │ │
│  │  (UI)    │◄─│  Stores   │──│  Service │  │  (Offline DB)    │ │
│  │          │  │  (State)  │  │          │  │                  │ │
│  └──────────┘  └──────────┘  └─────┬────┘  └──────────────────┘ │
│                                     │                             │
└─────────────────────────────────────┼─────────────────────────────┘
                                      │ HTTPS/REST
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND SERVER                             │
│                  (Django REST Framework)                          │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Views   │  │Serializers│  │  Models  │  │  Django Admin    │ │
│  │  (API)   │──│  (JSON)   │──│  (ORM)   │  │  (Admin Panel)   │ │
│  └──────────┘  └──────────┘  └─────┬────┘  └──────────────────┘ │
│                                     │                             │
└─────────────────────────────────────┼─────────────────────────────┘
                                      │ SQL
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL DATABASE                         │
│                                                                   │
│    users │ transactions │ products │ contacts │ payments          │
│          │ transaction_ │ stock_   │          │                   │
│          │ items        │ adjust   │          │                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Modules Breakdown

### Module 1: Authentication 🔐

```
Authentication Flow:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                                                      
  📱 Login Screen ──────► 🔐 Validate ──────► ✅ OTP ──────► 🏠 Dashboard
        │                  Phone+Pass          Verify
        │
        ▼
  📝 Register ──────► 👤 Create ──────► 🔑 Auto ──────► 🏠 Dashboard
     Screen            Account          Login
        │
        ▼
  🔄 Forgot Password ──► OTP ──► New Password ──► Login
```

**Files:** `LoginScreen.tsx` · `RegisterScreen.tsx` · `OTPScreen.tsx` · `ForgotPasswordScreen.tsx` · `ResetPasswordScreen.tsx` · `authStore.ts` · `AuthStack.tsx` · `auth.ts`

---

### Module 2: Dashboard 📊

```
Dashboard Components:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌─────────────────────────────────────────┐
  │  📊 Today's Summary                     │
  │  ┌─────────┬──────────┬───────────────┐ │
  │  │ বিক্রি   │  ক্রয়    │    খরচ       │ │
  │  │ ৳12,500 │ ৳8,000  │   ৳1,200     │ │
  │  └─────────┴──────────┴───────────────┘ │
  ├─────────────────────────────────────────┤
  │  🟥 Sales Heatmap (7 days)              │
  │  ░▒▓█▓▒░ ░▒▓█▓▒░ ░▒█░                  │
  ├─────────────────────────────────────────┤
  │  ⚡ Quick Actions                       │
  │  [+ বিক্রি] [+ ক্রয়] [লেনদেন]          │
  ├─────────────────────────────────────────┤
  │  📋 Recent Transactions                 │
  │  🟢 চাল বিক্রি        +৳2,500          │
  │  🔴 তেল ক্রয়         -৳1,800          │
  │  🟡 বিদ্যুৎ বিল       -৳1,200          │
  └─────────────────────────────────────────┘
```

**Files:** `DashboardScreen.tsx` · `MainTabs.tsx` · `syncService.ts` · `syncStore.ts`

---

### Module 3: Transactions 💰

```
Transaction Types:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🟢 SALE (বিক্রি)                    Effect:
  ├── Product: চাল (Rice)             +Revenue: ৳5,000
  ├── Quantity: 10 kg                  -Stock: 10 units
  ├── Amount: ৳5,000                   Receivable: ৳2,000
  ├── Paid: ৳3,000
  └── Due: ৳2,000 (পাওনা)

  🔴 PURCHASE (ক্রয়)                  Effect:
  ├── Product: তেল (Oil)              -Cost: ৳8,000
  ├── Quantity: 20 liters              +Stock: 20 units
  ├── Amount: ৳8,000                   Payable: ৳3,000
  ├── Paid: ৳5,000
  └── Due: ৳3,000 (দেনা)

  🟡 EXPENSE (খরচ)                    Effect:
  ├── Category: বিদ্যুৎ বিল           -Cost: ৳1,200
  ├── Amount: ৳1,200                   No stock change
  └── Paid: ৳1,200                     No due
```

**Files:** `TransactionsScreen.tsx` · `AddTransactionScreen.tsx` · `transactionStore.ts`

---

## 🗄️ Database Design

### Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────────┐
│      USERS       │       │    TRANSACTIONS       │
├──────────────────┤       ├──────────────────────┤
│ id (PK)          │──┐    │ id (PK)              │
│ phone (unique)   │  │    │ user_id (FK) ────────│──┐
│ name             │  │    │ local_id (unique)     │  │
│ business_name    │  └───►│ transaction_type      │  │
│ business_type    │       │ total_amount          │  │
│ password_hash    │       │ paid_amount           │  │
│ role             │       │ discount              │  │
│ is_verified      │       │ payment_mode          │  │
│ created_at       │       │ transaction_date      │  │
└──────────────────┘       │ notes                 │  │
                           │ expense_category      │  │
                           │ created_at            │  │
                           └──────────┬───────────┘  │
                                      │               │
                                      │ 1:N           │
                                      ▼               │
                           ┌──────────────────────┐   │
                           │  TRANSACTION_ITEMS    │   │
                           ├──────────────────────┤   │
                           │ id (PK)              │   │
                           │ transaction_id (FK)   │   │
                           │ product_id (FK) ──────│───│──┐
                           │ quantity              │   │  │
                           │ unit_price            │   │  │
                           │ total                 │   │  │
                           └──────────────────────┘   │  │
                                                       │  │
┌──────────────────┐       ┌──────────────────────┐   │  │
│    CONTACTS      │       │     PRODUCTS          │   │  │
├──────────────────┤       ├──────────────────────┤   │  │
│ id (PK)          │       │ id (PK)              │◄──│──┘
│ user_id (FK) ────│───────│ user_id (FK) ────────│───┘
│ name             │       │ name                 │
│ phone            │       │ sku                  │
│ contact_type     │       │ category             │
│ address          │       │ purchase_price       │
│ balance          │       │ selling_price        │
│ credit_limit     │       │ stock_quantity       │
│ is_active        │       │ unit                 │
│ created_at       │       │ low_stock_threshold  │
└──────────────────┘       └──────────┬───────────┘
                                      │
                                      │ 1:N
                                      ▼
                           ┌──────────────────────┐
                           │  STOCK_ADJUSTMENTS    │
                           ├──────────────────────┤
                           │ id (PK)              │
                           │ product_id (FK)      │
                           │ quantity_change       │
                           │ reason               │
                           │ adjusted_by           │
                           │ created_at           │
                           └──────────────────────┘
```

### Dual-Layer Data Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    📱 DEVICE (Offline Layer)                  │
│                                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌───────────────────────┐  │
│  │ auth-storage │ │ transaction │ │ inventory-storage     │  │
│  │             │ │  -storage   │ │                       │  │
│  │ • user      │ │ • array of  │ │ • products[]          │  │
│  │ • tokens    │ │   all txns  │ │ • salesHistory[]      │  │
│  │ • registered│ │             │ │                       │  │
│  │   Users{}   │ │             │ │                       │  │
│  └──────┬──────┘ └──────┬──────┘ └────────┬──────────────┘  │
│         │               │                  │                  │
│         └───────────────┼──────────────────┘                  │
│                         │ Zustand persist middleware          │
│                  ┌──────▼──────┐                              │
│                  │ AsyncStorage │ ◄── Key-Value Store         │
│                  │  (JSON)     │     on Device Storage        │
│                  └─────────────┘                              │
└─────────────────────────────────────────────────────────────┘
                          │
                    syncService.ts
                    Push ↑ ↓ Pull
                          │
┌─────────────────────────────────────────────────────────────┐
│                   ☁️ SERVER (Online Layer)                    │
│                                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌───────────────────────┐  │
│  │ Django REST  │ │ Serializers │ │ Django ORM Models     │  │
│  │ Views (API)  │→│ (JSON↔Py)   │→│ (Python ↔ SQL)        │  │
│  └─────────────┘ └─────────────┘ └────────┬──────────────┘  │
│                                            │                  │
│                                   ┌────────▼──────────────┐  │
│                                   │   PostgreSQL           │  │
│                                   │   7 tables             │  │
│                                   │   ACID-compliant       │  │
│                                   └────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend (Mobile)
| Technology | Version | Purpose |
|-----------|---------|---------|
| React Native | 0.76 | Cross-platform mobile framework |
| Expo | SDK 52 | Development & build tooling |
| TypeScript | 5.3 | Static type checking |
| Zustand | 5.0 | Lightweight state management |
| React Navigation | 7.x | Screen routing & navigation |
| AsyncStorage | 2.1 | Local persistent storage (offline DB) |
| Expo Vector Icons | Ionicons | Beautiful icon library |
| Safe Area Context | 4.x | Device notch/safe area handling |

### Backend (Server)
| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.12 | Backend programming language |
| Django | 5.0 | Web framework |
| Django REST Framework | 3.15 | REST API builder |
| PostgreSQL | 16 | Relational database |
| Simple JWT | 5.3 | JWT token authentication |
| Celery | 5.4 | Background task processing |
| Redis | — | Celery broker & caching |
| CORS Headers | 4.3 | Cross-origin request handling |

---

## 📁 Folder Structure

```
tallykhata/
│
├── 📱 mobile/                          ← React Native App
│   ├── src/
│   │   ├── 📄 screens/
│   │   │   ├── auth/
│   │   │   │   ├── LoginScreen.tsx          ← Phone + password login
│   │   │   │   ├── RegisterScreen.tsx       ← New merchant registration
│   │   │   │   ├── OTPScreen.tsx            ← SMS verification
│   │   │   │   ├── ForgotPasswordScreen.tsx ← Password recovery
│   │   │   │   └── ResetPasswordScreen.tsx  ← Set new password
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardScreen.tsx      ← Main dashboard with analytics
│   │   │   ├── transactions/
│   │   │   │   ├── TransactionsScreen.tsx    ← Transaction list + filters
│   │   │   │   └── AddTransactionScreen.tsx ← Add sale/purchase/expense
│   │   │   ├── inventory/
│   │   │   │   └── InventoryScreen.tsx      ← Product catalog + stock
│   │   │   ├── contacts/
│   │   │   │   ├── ContactsScreen.tsx       ← Customer/supplier list
│   │   │   │   ├── AddContactScreen.tsx     ← Add new contact
│   │   │   │   └── ContactDetailScreen.tsx  ← Contact details + history
│   │   │   └── MoreScreen.tsx               ← Settings, language, logout
│   │   │
│   │   ├── 🗃️ store/                       ← Zustand State Management
│   │   │   ├── authStore.ts                 ← Auth state + JWT tokens
│   │   │   ├── transactionStore.ts          ← Transactions + computed summaries
│   │   │   ├── inventoryStore.ts            ← Products + stock + sales tracking
│   │   │   ├── contactStore.ts              ← Contacts + balances
│   │   │   └── syncStore.ts                 ← Online/offline + sync queue
│   │   │
│   │   ├── 🔌 services/
│   │   │   ├── syncService.ts               ← Push/Pull sync engine
│   │   │   └── api/
│   │   │       ├── index.ts                 ← Axios client + JWT interceptor
│   │   │       ├── auth.ts                  ← Auth API calls
│   │   │       └── sync.ts                  ← Sync API calls
│   │   │
│   │   ├── 🧭 navigation/
│   │   │   ├── RootNavigator.tsx            ← Auth guard (login vs main)
│   │   │   ├── AuthStack.tsx                ← Login/Register stack
│   │   │   ├── MainTabs.tsx                 ← Bottom tab navigator
│   │   │   └── types.ts                     ← TypeScript route types
│   │   │
│   │   ├── 🎨 constants/
│   │   │   ├── theme.ts                     ← Colors, fonts, spacing, shadows
│   │   │   └── config.ts                    ← API URL, storage keys, app config
│   │   │
│   │   ├── 🌐 i18n/
│   │   │   ├── index.ts                     ← t() function, formatCurrency()
│   │   │   ├── LanguageContext.tsx           ← Language provider
│   │   │   ├── bn.ts                        ← Bangla translations
│   │   │   └── en.ts                        ← English translations
│   │   │
│   │   └── 🧩 components/
│   │       ├── ui/
│   │       │   ├── Button.tsx               ← Reusable styled button
│   │       │   └── Input.tsx                ← Reusable styled input
│   │       └── common/
│   │           └── LowStockAlert.tsx        ← Dramatic low-stock popup
│   │
│   ├── App.tsx                              ← Entry point
│   ├── app.json                             ← Expo configuration
│   └── package.json                         ← Dependencies
│
├── ⚙️ backend/                             ← Django REST API
│   ├── apps/
│   │   ├── users/                           ← User model + auth endpoints
│   │   ├── transactions/                    ← Transaction CRUD
│   │   ├── contacts/                        ← Contact management
│   │   ├── inventory/                       ← Product + stock endpoints
│   │   ├── payments/                        ← Payment tracking
│   │   └── sync/                            ← Push/Pull sync endpoints
│   ├── config/
│   │   ├── settings.py                      ← Django settings
│   │   └── urls.py                          ← URL routing
│   ├── manage.py
│   ├── requirements.txt
│   └── docker-compose.yml
│
└── 📖 demo/                                ← Module Code for Review
    ├── Authentication/                      ← Auth module code
    ├── Dashboard/                           ← Dashboard module code
    ├── Transactions/                        ← Transaction module code
    ├── Database/                            ← Complete database layer
    ├── Shared/                              ← Common dependencies
    ├── README.md
    ├── DESIGN_AND_WORKFLOW.md               ← Architecture & design docs
    └── PROFESSOR_QA.md                      ← Q&A preparation guide
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.12+
- PostgreSQL 16+
- Expo Go app on your phone

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/sudipto-swe/TakaTracker.git
cd TakaTracker
```

### 2️⃣ Setup Backend (Django)
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate    # Linux/Mac
# venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Setup database
sudo systemctl start postgresql
python manage.py migrate
python manage.py createsuperuser

# Start server
python manage.py runserver 0.0.0.0:8000
```

### 3️⃣ Setup Mobile App (Expo)
```bash
cd mobile

# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

### 4️⃣ Connect Phone
1. Install **Expo Go** from Play Store / App Store
2. Scan the QR code from terminal
3. App loads on your phone! 📱

### 5️⃣ Configure API URL (for phone testing)
```bash
# Find your computer's IP
hostname -I
# Example: 192.168.0.110

# Edit mobile/src/constants/config.ts
# Change localhost to your IP:
BASE_URL: 'http://192.168.0.110:8000/api/v1'
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/v1/auth/register/` | Register new merchant |
| `POST` | `/api/v1/auth/login/` | Login with phone + password |
| `POST` | `/api/v1/auth/token/refresh/` | Refresh JWT token |
| `POST` | `/api/v1/auth/otp/send/` | Send OTP to phone |
| `POST` | `/api/v1/auth/otp/verify/` | Verify OTP code |
| `POST` | `/api/v1/auth/password/reset/` | Reset password |

### Transactions
| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/api/v1/transactions/` | List all transactions |
| `POST` | `/api/v1/transactions/` | Create transaction |
| `GET` | `/api/v1/transactions/:id/` | Get transaction detail |
| `PUT` | `/api/v1/transactions/:id/` | Update transaction |
| `DELETE` | `/api/v1/transactions/:id/` | Delete transaction |

### Sync
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/v1/sync/push/` | Push local changes to server |
| `GET` | `/api/v1/sync/pull/` | Pull server changes |

### Other
| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET/POST` | `/api/v1/contacts/` | Customer/Supplier CRUD |
| `GET/POST` | `/api/v1/products/` | Product/Inventory CRUD |
| `GET/POST` | `/api/v1/payments/` | Payment records |
| `GET` | `/admin/` | Django Admin Panel |

---

## 🔄 Offline/Online Sync

### Sync Algorithm

```
Every 5 minutes (or on pull-to-refresh):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: PUSH (Local → Server)
────────────────────────────────
  📱 Find all items where isSynced === false
  📦 Convert: camelCase → snake_case
  📤 POST /api/v1/sync/push/ { transactions, contacts, products }
  ✅ Mark pushed items as isSynced: true

Step 2: PULL (Server → Local)
────────────────────────────────
  📥 GET /api/v1/sync/pull/?last_sync_at=<timestamp>
  🔍 For each server record:
     └─ exists locally? → Skip
     └─ new? → Add to Zustand store
  💾 Zustand auto-persists to AsyncStorage

Step 3: UPDATE TIMESTAMP
────────────────────────────────
  🕐 Save lastSyncAt = now() to AsyncStorage
  📊 Update sync badge on Dashboard
```

### Data Flow Visualization

```
   Sale happens ──► transactionStore.addTransaction()
         │                    │
         │              isSynced: false
         │                    │
         ▼                    ▼
    UI Updates ◄──── AsyncStorage (persisted)
                              │
                        [Online?]
                       /         \
                     Yes          No
                      │            │
                      ▼            ▼
              Push to Django   Queue in
              via REST API     syncStore
                      │            │
                      ▼            │
               PostgreSQL     [Later when
               saves record    online...]
                      │            │
                      └────────────┘
                              │
                     Mark isSynced: true
```

---

## 🎨 Design Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| **Architecture** | Offline-First | Bangladesh internet is unreliable; shopkeepers can't wait |
| **State Management** | Zustand over Redux | 1KB vs 7KB, no boilerplate, works outside React |
| **Database** | AsyncStorage + PostgreSQL | Dual-layer: local speed + cloud backup |
| **Language** | TypeScript | Catches bugs at compile time, better IDE support |
| **UI Framework** | React Native + Expo | Single codebase for Android, iOS, Web |
| **Backend** | Django REST Framework | Rapid development, built-in admin, mature ORM |
| **Auth** | JWT Tokens | Stateless, scalable, works with offline-first |
| **Default Language** | Bangla (বাংলা) | Target users speak Bangla primarily |
| **Navigation** | Stack + Bottom Tabs | Familiar mobile pattern, easy to learn |
| **Sync Strategy** | Push-then-Pull | Local changes have priority (single-user device) |

---

## 🗺️ Future Roadmap

- [ ] 🔐 Biometric login (fingerprint/face)
- [ ] 📊 Monthly PDF profit/loss reports
- [ ] 📱 SMS reminders for due payments
- [ ] 📷 Barcode scanner for products
- [ ] 💬 Multi-device sync (phone + tablet)
- [ ] 🔒 End-to-end data encryption
- [ ] 📈 Business analytics dashboard
- [ ] 🧾 Invoice/receipt generation
- [ ] 🏦 bKash/Nagad payment integration
- [ ] 🤖 AI-powered sales predictions

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with ❤️ for Bangladeshi small businesses 🇧🇩</strong>
</p>

<p align="center">
  <em>টাকাট্র্যাকার — আপনার ডিজিটাল হিসাব-নিকাশ সঙ্গী</em>
</p>
