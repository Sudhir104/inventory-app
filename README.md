# Inventory & Order Management System

A full-stack application to manage products, customers, and orders with inventory tracking.

**Stack:** Python (FastAPI) · React (vanilla CDN) · PostgreSQL · Docker

---

## Run with Docker (recommended)

```bash
# 1. Clone and enter the folder
git clone <your-repo> inventory-app
cd inventory-app

# 2. Copy env file
cp .env.example .env

# 3. Start everything
docker compose up --build

# App is at http://localhost:3000
# API docs at http://localhost:8000/docs
```

---

## Run locally (VS Code)

### Prerequisites
- Python 3.11+
- PostgreSQL running locally
- VS Code

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

Option 1 — VS Code Live Server extension:
1. Install the "Live Server" extension in VS Code
2. Right-click `frontend/index.html` → "Open with Live Server"

Option 2 — Python simple server:
```bash
cd frontend
python -m http.server 3000
```
Open http://localhost:3000

> Make sure the backend is running on port 8000.  
> The `API` variable in `frontend/src/app.js` is set to `""` which means it calls the same origin.  
> When running locally, change line 3 of app.js to:  
> `const API = "http://localhost:8000";`

---

## Features

- **Auth** — Sign up / login with hashed passwords and token auth
- **Products** — Add, edit, delete; unique SKU enforcement; stock tracking
- **Customers** — Add, edit, delete; unique email enforcement
- **Orders** — Create orders with multiple items; stock is deducted automatically; insufficient stock is rejected
- **Order Status** — pending → confirmed → shipped → delivered (or cancelled)
- **Dashboard** — Revenue, totals, orders by status, low-stock alerts

---

## Project Structure

```
inventory-app/
├── backend/
│   ├── main.py          # FastAPI app entry point
│   ├── database.py      # SQLAlchemy setup
│   ├── models.py        # DB models
│   ├── auth_utils.py    # Password hashing, token helpers
│   ├── routers/
│   │   ├── auth.py
│   │   ├── products.py
│   │   ├── customers.py
│   │   └── orders.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── index.html
│   ├── src/
│   │   ├── app.js       # All React UI
│   │   └── styles.css
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```
