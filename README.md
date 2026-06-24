# University Dashboard Next

React + Express dashboard for university admissions statistics. This repository is the TypeScript/FSD refactor of the original dashboard and is intended to preserve product behavior while improving maintainability.

## Stack

- React 18, Vite, TypeScript
- React Router for application routes
- Zustand for persisted UI/dashboard state
- Recharts and react-datepicker for charts and period controls
- Express 4 backend written in TypeScript
- Axios-based typed API client
- Node test runner, ESLint, Prettier and TypeScript quality gates

## Routes

- `/` - applicants dashboard
- `/specialties` - specialties reference
- `/report-2025-2026` - report page
- `/campus-plan` - interactive campus plan
- `/campus-map` - 3D campus map

## Project Structure

```text
server/
  index.ts
  src/
    app.ts
    server.ts
    clients/
    config/
    controllers/
    middlewares/
    routes/
    services/
    types/
    utils/
    validators/
src/
  app/
  pages/
  widgets/
  features/
  entities/
  shared/
test/
```

Frontend follows Feature-Sliced Design dependency direction:

```text
app -> pages -> widgets -> features -> entities -> shared
```

## Environment

Create `.env` from `.env.example` and adjust local values:

```env
PORT=3001
PREVIOUS_YEAR_DATA_FILE=previous-year-data.txt
APPLICANTS_XLSX_SOURCE=true
# APPLICANTS_XLSX_FILE=DATA/applicants.xlsx
CORS_ORIGIN=*
VITE_YANDEX_MAPS_API_KEY=
```

Notes:

- `.env` and `.env.local` must not be committed.
- `.env.example` contains placeholders only.
- In production, set `CORS_ORIGIN` to the exact allowed origin or comma-separated allowed origins.
- `VITE_YANDEX_MAPS_API_KEY` is only used by the campus map page.

## Development

```bash
npm install
npm run dev
```

The dev command starts:

- backend: `http://localhost:3001`
- frontend: `http://localhost:5173`
- health check: `http://localhost:3001/api/health`

## Quality Gate

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
```

`npm run check` runs lint, typecheck, tests and production build.

## Production

```bash
npm install
npm run build
npm start
```

In production, Express serves the built frontend from `dist` and keeps the API under `/api/*`.

Docker Compose uses:

```bash
docker compose build --pull dashboard
docker compose up -d --remove-orphans dashboard
```

The container listens on port `3001`; `compose.yaml` maps host `80:3001`.

## API

Current endpoints:

- `GET /api/health`
- `GET /api/report-2025-2026`
- `GET /api/applicants-statistics`

Applicants statistics source order:

1. 2025 period requests use `previous-year-data.txt` as the archive/current dataset.
2. If `APPLICANTS_XLSX_SOURCE=true`, the backend reads the configured Excel workbook or the first eligible `.xlsx` in `DATA`.
3. If no Excel source is available, the backend returns deterministic mock data.

## Testing Notes

The test suite covers:

- analytics calculations and previous-year comparison
- campaign year limits and dashboard settings store
- specialties MXL parsing
- HTTP error normalization
- backend health, report, statistics, CORS and API 404 behavior

## CI and Deploy

- `.github/workflows/ci.yml` runs `npm run check` on pull requests and pushes.
- `.github/workflows/deploy.yml` deploys pushes to `main` to the VDS through Docker Compose.

Before merging behavior changes to `main`, run:

```bash
npm run check
```
