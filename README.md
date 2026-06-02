# Inventory & Order Management System

A full-stack application to manage products, customers, and orders with real-time inventory tracking.

**Stack:** Python (FastAPI) · React (vanilla CDN) · PostgreSQL · Docker · Docker Compose

---

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | https://inventory-app-seven-nu.vercel.app |
| Backend API | https://inventory-app-eac7.onrender.com |
| API Docs | https://inventory-app-eac7.onrender.com/docs |
| Docker Hub | https://hub.docker.com/r/sudhir108/inventory-backend |
| GitHub | https://github.com/Sudhir104/inventory-app |

---

## Run with Docker (recommended)

```bash
# 1. Clone the repository
git clone https://github.com/Sudhir104/inventory-app.git
cd inventory-app

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Run Locally (VS Code)

### Prerequisites
- Python 3.11+
- PostgreSQL running locally
- VS Code with Live Server extension

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (Windows PowerShell)
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inventory"
$env:SECRET_KEY="dev-secret"

# Set environment variables (Mac/Linux)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inventory"
export SECRET_KEY="dev-secret"

# Run the server
uvicorn main:app --reload --port 8000
```

Backend runs at http://localhost:8000
API docs at http://localhost:8000/docs

### Frontend

The frontend is plain HTML/CSS/JS — no build step needed.

**Option 1 — VS Code Live Server:**
1. Install the "Live Server" extension in VS Code
2. Open `frontend/src/app.js` → change line 3 to: `const API = "http://localhost:8000";`
3. Right-click `frontend/index.html` → "Open with Live Server"

**Option 2 — Python server:**
```bash
cd frontend
python -m http.server 3000
```
Open http://localhost:3000

---

## Features

- **Auth** — Sign up / login with hashed passwords and token-based authentication
- **Products** — Add, edit, delete products with unique SKU enforcement and stock tracking
- **Customers** — Add, edit, delete customers with unique email enforcement
- **Orders** — Create orders with multiple items; stock deducted automatically; insufficient stock is rejected
- **Order Status** — pending → confirmed → shipped → delivered (or cancelled)
- **Dashboard** — Revenue totals, order counts, orders by status, low-stock alerts

---

## Business Rules Implemented

| Rule | Implementation |
|------|----------------|
| Unique product SKUs | 409 error returned if SKU already exists |
| Unique customer emails | 409 error returned if email already registered |
| Inventory validation | Order rejected if stock < requested quantity |
| Auto stock reduction | Stock reduced automatically when order is placed |
| Stock restoration | Stock restored when order is deleted |

---

## Project Structure

```
inventory-app/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # SQLAlchemy setup
│   ├── models.py            # Database models
│   ├── auth_utils.py        # Password hashing, token helpers
│   ├── routers/
│   │   ├── auth.py          # /api/auth/*
│   │   ├── products.py      # /api/products/*
│   │   ├── customers.py     # /api/customers/*
│   │   └── orders.py        # /api/orders/*
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── index.html
│   ├── src/
│   │   ├── app.js           # All React UI
│   │   └── styles.css
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@db:5432/inventory` |
| `SECRET_KEY` | JWT secret key | `change-me-in-production` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `postgres` |
| `POSTGRES_DB` | Database name | `inventory` |

Copy `.env.example` to `.env` and update values before running.

---

## Docker Hub

Pull the backend image directly:

```bash
docker pull sudhir108/inventory-backend:latest
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/products | List all products |
| POST | /api/products | Create product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |
| GET | /api/customers | List all customers |
| POST | /api/customers | Create customer |
| PUT | /api/customers/:id | Update customer |
| DELETE | /api/customers/:id | Delete customer |
| GET | /api/orders | List all orders |
| POST | /api/orders | Create order |
| PATCH | /api/orders/:id/status | Update order status |
| DELETE | /api/orders/:id | Delete order |
| GET | /api/orders/dashboard | Dashboard stats |
