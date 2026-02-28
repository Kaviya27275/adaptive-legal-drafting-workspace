# Backend + Frontend Structure

## Folders
- `apps/`, `config/`, `core/`, `users/`: Django backend
- `Frontend/frontend/`: React frontend (Vite)

## Backend Setup
1. Install Python dependencies:
   - `pip install -r requirements.txt`
2. Run Django:
   - `python manage.py migrate`
   - `python manage.py runserver 127.0.0.1:8000`

## Frontend Setup
1. Go to frontend:
   - `cd Frontend/frontend`
2. Install dependencies:
   - `npm install`
3. Copy env:
   - `cp .env.example .env` (or create equivalent on Windows)
4. Run:
   - `npm run dev`

## Integration Notes
- Frontend uses `VITE_API_BASE_URL` to target Django API.
- Default frontend API base URL is `http://127.0.0.1:8000`.
- JWT login/logout/register endpoints are available under:
  - `/api/users/register/`
  - `/api/users/login/`
  - `/api/users/logout/`
