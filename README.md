# Community Skill & Time Bank

A peer-to-peer web platform where members exchange services using time instead of money. Built with the MERN stack (MySQL, Express, React, Node.js).

## Features

- **User Authentication**: Register, login, JWT-based auth with role-based access (User/Admin)
- **Service Marketplace**: Post offers/requests, browse by category, search and filter
- **Time Credit Ledger**: Auditable transaction system with credit/debit entries and balance tracking
- **Transaction Workflow**: Schedule, confirm, complete transactions with automatic time exchange
- **Reviews & Ratings**: Two-way review system after completed transactions
- **Dispute Resolution**: Raise and track disputes linked to transactions
- **Admin Dashboard**: Manage users, services, transactions, and disputes

## Tech Stack

- **Backend**: Node.js, Express, MySQL (mysql2), JWT, bcryptjs
- **Frontend**: React 18, Vite, React Router, Axios
- **Database**: MySQL with normalized relational schema

## Project Structure

```
timebank/
├── backend/
│   ├── src/
│   │   ├── config/         # Database config, migrations, seeds
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── routes/         # API routes
│   │   ├── validators/     # Express-validator schemas
│   │   └── index.js        # Express app entry
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/     # Shared components (Layout)
    │   ├── context/        # React context (Auth)
    │   ├── pages/          # Page components
    │   │   └── admin/      # Admin pages
    │   ├── services/       # API service layer
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    └── vite.config.js
```

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your MySQL credentials

# Run migrations (creates tables)
npm run db:migrate

# Seed demo data (optional)
npm run db:seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173` and proxies API calls to `http://localhost:5000`.

### Demo Accounts

After running the seed script:

| Email | Password | Role |
|-------|----------|------|
| admin@timebank.com | admin123 | Admin |
| john@timebank.com | user123 | User |
| jane@timebank.com | user123 | User |
| bob@timebank.com | user123 | User |
| alice@timebank.com | user123 | User |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Services
- `GET /api/services` - List services (with filters)
- `GET /api/services/:id` - Get service details
- `POST /api/services` - Create service (auth required)
- `PUT /api/services/:id` - Update service (owner/admin)
- `DELETE /api/services/:id` - Delete service (owner/admin)
- `GET /api/services/categories` - List categories
- `POST /api/services/categories` - Create category (admin)

### Transactions
- `GET /api/transactions` - List user's transactions
- `GET /api/transactions/:id` - Get transaction details
- `POST /api/transactions` - Create transaction (requester)
- `PUT /api/transactions/:id` - Update status (confirm/complete/cancel)
- `GET /api/transactions/ledger` - Get user's ledger entries

### Reviews
- `GET /api/reviews` - List reviews
- `GET /api/reviews/:id` - Get review details
- `POST /api/reviews` - Create review (after completed transaction)

### Disputes
- `GET /api/disputes` - List disputes
- `GET /api/disputes/:id` - Get dispute details
- `POST /api/disputes` - Create dispute
- `PUT /api/disputes/:id/resolve` - Resolve dispute (admin)

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/services` - List all services
- `PUT /api/admin/services/:id/status` - Update service status
- `GET /api/admin/transactions` - List all transactions

## Database Schema

The schema includes 8 main tables:

1. **users** - Members and admins with time balances
2. **categories** - Service categories with icons/colors
3. **services** - Offers and requests posted by users
4. **service_tags** - Many-to-many tags for services
5. **transactions** - Scheduled/confirmed/completed exchanges
6. **ledger_entries** - Immutable audit trail of time credits/debits
7. **reviews** - Ratings and comments on completed transactions
8. **disputes** - Dispute resolution workflow

All tables use UUID primary keys and proper foreign key constraints.

## CRUD Operations Demo

The following CRUD operations are implemented and can be tested:

| Resource | Create | Read | Update | Delete |
|----------|--------|------|--------|--------|
| Users | ✅ Register | ✅ Profile | ✅ Profile/Password | ✅ Admin only |
| Services | ✅ Post | ✅ List/Detail | ✅ Owner/Admin | ✅ Owner/Admin |
| Transactions | ✅ Request | ✅ List/Detail | ✅ Status changes | ❌ (cancel only) |
| Reviews | ✅ After complete | ✅ List/Detail | ❌ | ❌ |
| Disputes | ✅ Raise | ✅ List/Detail | ✅ Admin resolve | ❌ |
| Categories | ✅ Admin | ✅ List | ❌ | ❌ |

## License

MIT