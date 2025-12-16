# Repository Guidelines

## Project Structure & Module Organization
- `app/` Next.js routes for dashboard, chat, admin, claim submission, and API proxies.
- `components/`, `hooks/`, `lib/` shared UI, hooks, and utilities; assets in `public/`.
- `src/` FastAPI backend with `api.py` entrypoint, `ai_agent.py` LangChain agent, and Supabase/db helpers; configs in `config/`.
- `tests/` Python smoke scripts for data retrieval and boundary checks; `supabase_schema/` docs for tables.

## Build, Test, and Development Commands
- `npm run dev` start Next.js frontend (localhost:3000) and proxy to backend URL configured in env.
- `npm run backend` serve FastAPI with uvicorn on port 8001 (Python 3.9+).
- `npm run build` / `npm run start` production build and serve.
- `npm run lint` Next.js ESLint rules; fix issues before PRs.
- `npm run verify:supabase` quick check that Supabase URL/keys are present.
- Python dependencies: `pip install -r config/requirements.txt` (plus `requirements_ai.txt` or `requirements_kb.txt` as needed).

## Coding Style & Naming Conventions
- TypeScript/React: follow ESLint defaults; prefer TypeScript for new code, functional components, and hooks prefixed with `use`.
- Components/pages use `PascalCase` filenames; helpers/utilities `camelCase`. Keep API routes aligned with `app/api`.
- Styling via Tailwind and `globals.css`; co-locate component styles, avoid inline magic numbers.
- Python backend: PEP8 spacing, type hints where possible, log via `src/logger.py`; keep tool definitions in `src/tools.py`.

## Testing Guidelines
- Run `npm run lint` for frontend hygiene.
- Data/agent checks: run individual scripts, e.g. `python3 tests/test_all_users.py` or `python3 tests/test_database.py`. Ensure Supabase/SQLite paths are valid before running.
- For new features, add minimal reproducible test scripts under `tests/` (use clear docstrings and sample inputs).

## Commit & Pull Request Guidelines
- Write imperative, concise commits (e.g., `Add claim summary card`); group related changes per commit.
- Before opening a PR: run lint, backend script relevant to your change, and note any failing tests.
- PR description: what changed, why, how to validate (commands/URLs), and risks. Include screenshots for UI updates and link related issues or tickets.

## Security & Configuration Tips
- Do not commit secrets. Keep Supabase keys, backend URLs, and API tokens in `.env.local` (frontend) and `.env` or shell exports (backend).
- Clear sensitive logs before sharing; check `logs/` and `chroma_db/` artifacts into `.gitignore` unless explicitly needed.
