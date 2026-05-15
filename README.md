# SIP Tracker & Portfolio Valuation System

A production-style fintech backend application built using Node.js, Express.js, PostgreSQL (Supabase), Redis, Docker, and JWT Authentication for managing SIPs (Systematic Investment Plans), portfolio valuation, mutual funds, and investment transaction tracking.

---

# Features

- Investor Management
- JWT Authentication & Authorization
- Mutual Fund Management
- AMC Management
- SIP Registration
- SIP Installment Processing
- Investment Transaction Tracking
- Portfolio Holdings Calculation
- Net Worth Calculation
- NAV History Tracking
- Redis Caching
- PostgreSQL Transaction Handling
- Role-Based Access Control
- Protected APIs
- Docker-based Redis Integration
- API Testing using Jest & Supertest
- API Load Testing using Autocannon
- Redis Cache Invalidation
- Fintech Portfolio Workflow Logic

---

# Tech Stack

- Node.js
- Express.js
- PostgreSQL (Supabase)
- Redis
- Docker
- JWT Authentication
- bcrypt
- Jest
- Supertest
- Autocannon
- REST APIs

---

# System Architecture

```txt
Client
   ↓
Express REST APIs
   ↓
Redis Cache Layer
   ↓
PostgreSQL (Supabase)
```

---

# Database Design

Normalized relational schema (3NF) with:

- investors
- investor_auth
- portfolios
- amcs
- mutual_funds
- nav_history
- sips
- investment_transactions

---

# Authentication Flow

- User Registration
- Password Hashing using bcrypt
- JWT Token Generation
- Protected APIs using Middleware
- Role-Based Authorization

---

# Redis Integration

Implemented Redis caching for improving API performance.

## Cached APIs

- GET /api/funds
- GET /api/investors/:investorId
- GET /api/investors/:investorId/holdings
- GET /api/investors/:investorId/networth

---

## Redis Features Implemented

- Redis Docker Setup
- Redis Service Layer
- API Response Caching
- Cache Expiry (TTL)
- Cache Invalidation on NAV Updates

---

## Cache Flow

```txt
First Request
    ↓
PostgreSQL Query
    ↓
Store Data in Redis

Second Request
    ↓
Fetch Data from Redis Cache
```

---

# API Endpoints

## Auth APIs

| Method | Endpoint |
|---|---|
| POST | /api/auth/register |
| POST | /api/auth/login |

---

## Investor APIs

| Method | Endpoint |
|---|---|
| GET | /api/investors/:investorId |
| GET | /api/investors/:investorId/holdings |
| GET | /api/investors/:investorId/networth |

---

## Fund APIs

| Method | Endpoint |
|---|---|
| POST | /api/funds |
| GET | /api/funds |
| PUT | /api/funds/:fundId/nav |

---

## SIP APIs

| Method | Endpoint |
|---|---|
| POST | /api/sips |
| GET | /api/sips |
| POST | /api/sips/:sipId/process |
| GET | /api/sips/:sipId/transactions |
| PATCH | /api/sips/:sipId/pause |
| PATCH | /api/sips/:sipId/resume |
| PATCH | /api/sips/:sipId/cancel |

---

# Transaction Handling

Implemented database transaction handling using:

```sql
BEGIN
COMMIT
ROLLBACK
```

Used in:

- User Registration
- SIP Processing
- NAV Updates

---

# Automated Testing

Implemented backend API testing using:

- Jest
- Supertest

## Test Coverage

### Auth APIs
- Register API
- Login API

### Investor APIs
- Get Investor Profile
- Get Holdings
- Get Networth

### Fund APIs
- Get Funds
- Create Fund
- Update NAV

### SIP APIs
- Create SIP
- Get All SIPs
- Process SIP
- SIP Transactions
- Pause SIP
- Resume SIP
- Cancel SIP

### Additional Testing
- Protected Route Testing
- Middleware Testing
- Redis Mocking
- PostgreSQL Mocking
- Transaction Workflow Testing
- Authentication Testing

---

# Test Results

```bash
Test Suites: 5 passed, 5 total
Tests:       14 passed, 14 total
Snapshots:   0 total
```

---

# Performance Testing

Implemented API load testing using Autocannon.

## Benchmarked APIs

- GET /api/funds
- GET /api/investors/:investorId
- GET /api/sips

## Performance Features

- Redis-powered low latency APIs
- High throughput API handling
- Concurrent request benchmarking
- Benchmark result export

---

# Setup Instructions

## Clone Repository

```bash
git clone https://github.com/gnaneswar9676/sip-tracker-backend.git
```

---

## Install Dependencies

```bash
npm install
```

---

## Create .env File

```env
PORT=5000

JWT_SECRET=your_secret_key

DB_USER=postgres

DB_HOST=your_supabase_host

DB_NAME=postgres

DB_PASSWORD=your_password

DB_PORT=5432
```

---

# Run Redis using Docker

```bash
docker run -d --name redis -p 6379:6379 redis
```

---

# Start Server

```bash
npm start
```

OR

```bash
nodemon server.js
```

---

# Run Test Cases

```bash
npm test
```

---

# Run API Benchmarks

```bash
node benchmark.js
```

Benchmark results will automatically be saved inside:

```txt
benchmark-results.txt
```

---

# Project Structure

```txt
backend/
│
├── controllers/
├── routes/
├── middleware/
├── services/
│   └── redisService.js
├── utility/
├── database/
├── tests/
│   ├── app.test.js
│   ├── auth.test.js
│   ├── investor.test.js
│   ├── funds.test.js
│   └── sip.test.js
├── screenshots/
├── benchmark.js
├── benchmark-results.txt
├── server.js
├── app.js
├── package.json
└── README.md
```

---

# Postman API Testing

## 1. Register API

![Register API](./screenshots/register-api.png)

---

## 2. Login API

![Login API](./screenshots/login-api.png)

---

## 3. Get Funds API

![Funds API](./screenshots/funds-api.png)

---

## 4. Create Fund API

![Create Fund API](./screenshots/create-fund-api.png)

---

## 5. Update NAV API

![Update NAV API](./screenshots/update-nav-api.png)

---

## 6. Create SIP API

![Create SIP API](./screenshots/create-sip-api.png)

---

## 7. Get SIP API

![Get SIP API](./screenshots/get-sip-api.png)

---

## 8. Process SIP API

![Process SIP API](./screenshots/process-sip-api.png)

---

## 9. SIP Transactions API

![SIP Transactions API](./screenshots/sip-transactions-api.png)

---

## 10. Holdings API

![Holdings API](./screenshots/holdings-api.png)

---

## 11. Networth API

![Networth API](./screenshots/networth-api.png)

---

## 12. Authorization API

![Authorization API](./screenshots/authorization-api.png)

---

## 13. ER Diagram

![ER Diagram](./screenshots/er-diagram.png)

---

# Security Features

- JWT Authentication
- Password Hashing using bcrypt
- Protected Routes
- Investor Ownership Validation
- Role-Based Authorization

---

# Engineering Highlights

- Production-style backend architecture
- Fintech workflow implementation
- Redis caching strategy
- PostgreSQL transaction handling
- API performance benchmarking
- Automated backend testing
- Scalable modular code structure
- Middleware-based authorization system

---



# Author

Gnaneswar Kollimarla

---

Heysriram Perumalla

---