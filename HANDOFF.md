# Handoff — linear-algebra calculator

**Branch:** `feat/react-redesign` → PR #3 (open, ready for review)
**Last commit:** `c28564d` — Copilot review fixes
**Tests:** 832 passed (backend); tsc/eslint/vitest clean (frontend)

---

## What was built

A full-stack symbolic linear algebra calculator replacing the old vanilla-JS GUI.

### Backend (`backend/`)

FastAPI app exposing three v2 endpoints:

| Endpoint | Purpose |
|---|---|
| `POST /api/v2/compute` | Run any of the 28 registered operations; returns typed blocks + worked steps |
| `POST /api/v2/parse` | Validate and parse a matrix string into a cell grid |
| `POST /api/v2/equivalent` | Return the invertibility/rank category and equivalent statements for a matrix |

Key modules:
- `backend/app/schemas.py` — Pydantic v2 request/response contract (`ComputeRequest`, `ComputeResponse`, result block union)
- `backend/app/parse.py` — Matrix string ↔ SymPy ↔ bracket-format ↔ LaTeX serialisation
- `backend/app/steps.py` — `capture()` / `safe_capture()` stdout wrappers; `parse_steps()` parses `\(...\)` descriptions and `\[...\]` matrix snapshots from library output; `_changed_rows_from_description()` derives row highlights from step text (handles swaps via `\leftrightarrow` and arrow targets via `\rightarrow`)
- `backend/app/operations.py` — `OP_REGISTRY` mapping 28 operation IDs to typed handlers; `_rref_steps()` drives the recursive symbolic RREF engine and filters branch-chatter noise
- `backend/app/equivalent.py` — classifies a matrix by rank/shape and returns the correct set of equivalent statements
- `backend/app/api_v2.py` — async router with 30 s timeout per compute; `ValueError` → 400, unexpected errors → 500

**Frozen library:** `packages/ma1522/` is a symbolic math engine. It must only be called, never modified.

### Frontend (`frontend/`)

React 18 + Vite + TypeScript + Tailwind CSS v3 + Radix UI + Zustand + KaTeX.

Components:
- `OperationBrowser` — searchable, keyboard-navigable operation list (sidebar on lg+, full-width row on mobile)
- `InputPane` — matrix text-cell grid (`MatrixGrid`), secondary inputs (RHS / Matrix B / k / modifiers), sample loader
- `MatrixGrid` — editable grid with arrow-key navigation, paste expansion, resize steppers
- `ComputeStrip` — Compute / Undo / Redo buttons; ⌘↵ / Ctrl+↵ global shortcut
- `ResultsPanel` — result blocks (matrix / vector list / scalar), copy-to-clipboard, "→ A" load-into-input, loading skeleton
- `StepsPanel` — numbered worked steps with description and matrix snapshot per step, loading skeleton
- `HistoryDrawer` — Radix Dialog slide-in, restore any prior result, clear history
- `EquivalentDialog` — equivalent statements modal driven by `/api/v2/equivalent`
- `OutputToggle` — exact / decimal toggle wired through the store

Store (`frontend/src/store/calculator.ts`): Zustand with `temporal` (zundo undo/redo) and `persist` (localStorage) middleware. `isComputing` drives skeleton states.

---

## Architecture notes

- The desktop layout is a fixed-height 3-column grid (`220px | 390–440px | flex-1`) that fills `100dvh` and scrolls internally. Below the `lg` breakpoint it stacks and the page scrolls.
- KaTeX is rendered client-side via `MathTex` (`frontend/src/lib/math.tsx`), memoised on the latex string.
- Fonts are self-hosted via `@fontsource` (Outfit + JetBrains Mono), loaded in `frontend/src/fonts.ts`.
- Dev proxy: Vite forwards `/api` to `localhost:8000` so the frontend can be developed independently.

### Multi-account git

The repo (`Tuxedolphin/linear-algebra`) is owned by **Tuxedolphin** but active development is under **WorkingDolphin**. To push:

```bash
gh auth switch -u Tuxedolphin
# remote is SSH, so push via HTTPS with the token:
token=$(gh auth token)
git push "https://Tuxedolphin:$token@github.com/Tuxedolphin/linear-algebra.git" feat/react-redesign
gh auth switch -u WorkingDolphin
```

---

## What's left (next steps)

These are the remaining tasks in rough priority order.

### 1. Deployment (blocker for going live)

**Cloudflare Workers + Pages** is the planned approach (zero-server cost). The backend needs to stay on a VPS or similar because it runs SymPy.

- [ ] **Cloudflare Worker reverse-proxy** — a thin Worker that proxies `/api/*` to the backend VPS and serves the static frontend build. Handles CORS at the edge.
- [ ] **Backend CORS lockdown** — restrict `allow_origins` in `backend/app/main.py` to the Worker's production origin only.
- [ ] **CI/CD pipeline** — GitHub Actions: run `uv run pytest` on push; run `pnpm build` and deploy to Cloudflare Pages on merge to `main`.

### 2. Accessibility audit

- [ ] **AccessLint gate** — run `mcp__plugin_accesslint_accesslint__audit_live` against both light and dark themes; fix any failures before merge. The `accesslint` MCP plugin is already available in this Claude Code session.

### 3. Retire the legacy GUI

`backend/app/main.py` still mounts the old vanilla-JS static files and exposes the legacy `/api/compute`, `/api/parse`, `/api/equivalent` routes. Once the new frontend is live:

- [ ] Remove the old static mount and legacy routes from `main.py`.
- [ ] Delete `backend/app/static/` and `frontend/` legacy assets if any remain.

### 4. Nice-to-have polish

- [ ] **History drawer exit animation** — Radix `Dialog.Content` uses `data-[state=closed]` for exit; needs `forceMount` + a CSS or Framer Motion exit transition. Currently the drawer just disappears.
- [ ] **Worked steps for remaining step-less operations** — `least_squares`, `projection`, `intersect`, `transition`, `nullspace`, `orth_complement`, `col_constraints`, `extend_basis`, `gram_schmidt` return steps from the library but the coverage is shallow. Investigate whether deeper verbosity levels expose more working.
- [ ] **Mobile keyboard handling** — the matrix grid cells are `<input type="text">`; on iOS the virtual keyboard pushes the layout and the fixed-height column layout can break. May need `visualViewport` handling or a layout adjustment.

---

## How to run locally

```bash
# Backend
uv run uvicorn backend.app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && pnpm dev

# Tests
PYTHONPATH=backend uv run pytest tests/
cd frontend && pnpm test
```
