# SETUP AND DEPLOYMENT GUIDE: SILENT WITNESS

## 1. System Requirements
- **OS:** Windows 10/11, Ubuntu 22.04+, macOS Sonoma+
- **Python:** 3.10 to 3.12 (3.11 recommended)
- **Node.js:** v18.0.0 or higher
- **RAM:** Minimum 4GB (8GB recommended for local neural models)

---

## 2. Step-by-Step Installation

### 2.1 Clone / Access Directory
```bash
cd d:/SILENT-WITNESS
```

### 2.2 Environment Configuration
Copy the template environment file:
```bash
cp .env.example .env
```
Ensure your ports and allowed origins match your configuration.

### 2.3 Backend Setup
Create a virtual environment (optional) and install dependencies:
```bash
pip install -r backend/requirements.txt
```

Verify backend installation:
```bash
python -m pytest backend/tests -v
```

Launch backend service:
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger documentation is available at `http://localhost:8000/docs`.

### 2.4 Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in any modern web browser (Chrome, Edge, Firefox, Brave).

---

## 3. Production Deployment with Docker
A production containerized stack is defined in `docker-compose.yml`:
```bash
docker compose up --build -d
```
This launches the FastAPI service and an NGINX proxy serving the optimized static build of the React client.
