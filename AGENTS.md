# Agent Notes

## Deployment

- Production is deployed to the VDS at `31.77.161.253`.
- Public site URL: `http://31.77.161.253/`.
- The app lives on the server in `/opt/dashboard`.
- The production container is managed by Docker Compose from `compose.yaml`.
- Container name: `university-dashboard`.
- The app listens on container port `3001`; the host maps `80:3001`.

## Autodeploy

- Autodeploy is configured in `.github/workflows/deploy.yml`.
- Every push to `main` triggers GitHub Actions workflow `Deploy to VDS`.
- The workflow connects to the VDS over SSH as user `deploy` using repository Actions secrets:
  - `VDS_HOST`
  - `VDS_PORT`
  - `VDS_USER`
  - `VDS_SSH_KEY`
- On the server, the workflow runs:
  - `git fetch origin main`
  - `git reset --hard origin/main`
  - `git clean -fd -e .env -e '.env.*'`
  - `docker compose build --pull dashboard`
  - `docker compose up -d --remove-orphans dashboard`
- It then waits for `university-dashboard` to become healthy/running.

## GitHub Access From Server

- The server repository remote is SSH:
  - `git@github.com:RaivF/dashbord_melgu.git`
- The server uses a GitHub deploy key stored for user `deploy`.
- This allows the repository to be private while the server can still pull `main`.

## Safety Notes

- The user explicitly permits Codex to read, validate, and use local API keys and secrets when needed for project setup, diagnostics, deployment, or configuration.
- Even with this permission, never print full secret values in chat or logs, never commit them, and never transmit them to third-party services except when the user explicitly asks for that exact integration or request.
- Do not commit `.env` or secret values.
- Keep `/opt/dashboard/.env` on the server; deploy cleanup intentionally preserves `.env` and `.env.*`.
- Do not replace the Actions SSH key and the GitHub deploy key with the same key; they serve different directions:
  - GitHub Actions -> VDS SSH access.
  - VDS -> GitHub repository read access.
- Before pushing behavior changes to `main`, run `npm run check`.
