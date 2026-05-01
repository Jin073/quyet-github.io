# Finova Personal Finance

React frontend tách component từ `index.html`, có Python backend scaffold theo Clean Architecture.

## Cấu trúc chính

```text
.
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── lib/
│   └── styles/
└── backend/
    ├── domain/
    ├── application/
    ├── interface_adapters/
    ├── infrastructure/
    └── main.py
```

## Chạy frontend

```bash
npm install
npm run dev
```

Nếu backend chạy khác host, cấu hình URL cho FE:

```bash
VITE_API_URL=http://localhost:8000 npm run dev
```

## Chạy backend FastAPI

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

Google OAuth cần env:

```bash
export GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
export GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
export FRONTEND_URL=http://localhost:5173
```

## Build và deploy GitHub Pages

```bash
npm run build
npm run deploy
```

GitHub Pages chỉ host static frontend. Backend Python trong `backend/` là clean architecture scaffold để deploy riêng khi cần API thật.
