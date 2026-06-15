# Linear Algebra Studio

[![PyPI - Python Version](https://img.shields.io/pypi/pyversions/ma1522-linear-algebra)](https://pypi.org/project/ma1522-linear-algebra/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An interactive React web application for symbolic linear algebra computations, built on the [ma1522-linear-algebra](https://github.com/YeeShin504/linear-algebra) library.

## Features

- **25 operations** - REF, RREF, LU, QR, SVD, diagonalization, eigenvalues/vectors, orthogonal complement, projection, and more
- **Symbolic engine** - exact answers using SymPy; decimal inputs are automatically converted to exact fractions
- **Chain multiplication** - multiply up to 3 matrices with optional transpose and/or inverse on each
- **Step-by-step working** - detailed breakdowns for applicable operations
- **Calculation history** - last 50 computations stored in a sidebar drawer
- **Copy results** - copy any result in parseable `[v v; v v]` format to reuse in subsequent operations
- **KaTeX rendering** - LaTeX-typeset output in the browser

## Requirements

- Python 3.10 or later
- [uv](https://docs.astral.sh/uv/getting-started/installation/) for Python dependencies
- Node.js ^20.19.0 or >=22.12.0 and [pnpm](https://pnpm.io/) for the React frontend

Install `uv` if you do not have it:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/Tuxedolphin/linear-algebra.git
cd linear-algebra
```

### 2. Install backend dependencies

`uv sync` creates a virtual environment, installs the `ma1522` local package in editable mode, and installs all runtime and development dependencies declared in `pyproject.toml`:

```bash
uv sync
```

This installs:

- `numpy`, `sympy`, `sympy-latex-parser` - computation
- `fastapi`, `uvicorn`, `python-multipart` - web server
- `pytest`, `pytest-cov`, `httpx`, `ruff` - development tools

Install frontend dependencies separately:

```bash
cd frontend
pnpm install
cd ..
```

### 3. Verify the install

```bash
uv run python -c "import ma1522; print('ma1522 ok')"
```

Expected output: `ma1522 ok`

Run the backend test suite:

```bash
uv run pytest
```

Run the frontend checks:

```bash
cd frontend
pnpm lint
pnpm test
pnpm build
```

## Running The Application

Start the backend API from the project root:

```bash
uv run uvicorn app.main:app --app-dir backend --port 8000 --reload
```

In a second terminal, start the React frontend:

```bash
cd frontend
pnpm dev
```

Open the Vite URL shown in the terminal, usually [http://localhost:5173](http://localhost:5173). The frontend dev server proxies `/api` requests to the backend on port 8000.

The FastAPI backend exposes only `/api/v2/*` routes. Static frontend assets are served by Vite in development and by the frontend host in production.

## Deployment

The production app is split into a static Vite frontend and a Python API backend.

The Cloudflare deployment path publishes the frontend to Cloudflare Workers using Workers Builds and Static Assets. The symbolic FastAPI backend still needs a Python runtime; it can be deployed later and connected through `VITE_API_BASE_URL` or an edge proxy.

### Frontend: Cloudflare Workers

Create a Worker from the Cloudflare dashboard using **Workers & Pages -> Create application -> Import a repository**. Connect the GitHub repository and configure the Worker build:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Path | `frontend` |
| Build command | `pnpm build` |
| Deploy command | `npx wrangler deploy` |
| Node.js version | `22` |

The frontend Worker config lives at `frontend/wrangler.jsonc`. It uploads `frontend/dist` as Workers Static Assets and uses `single-page-application` fallback routing for client-side routes.

Configure these Cloudflare build environment variables:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Optional API origin. Leave empty until the backend is deployed |

If `VITE_API_BASE_URL` is unset, the frontend calls `/api/v2/*` on the current origin. Once the API is deployed on a separate origin, set `VITE_API_BASE_URL` to that origin in the Worker build settings.

### API: FastAPI Host

Deploy the backend on a Python host that can run:

```bash
uv run uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT
```

When the browser calls the backend directly from another origin, set `ALLOWED_ORIGINS` to a comma-separated list of exact frontend origins:

```bash
ALLOWED_ORIGINS=https://linear-algebra.example.com
```

When all browser traffic reaches the API through a same-origin edge proxy, `ALLOWED_ORIGINS` can stay unset.

For a VPS deployment, use the templates in `deploy/vps/` as a starting point:

- `linear-algebra-api.service.example` runs uvicorn on `127.0.0.1:8000` under systemd.
- `nginx.conf.example` proxies public `/api/*` traffic to the local uvicorn process.

Replace the example domains and certificate paths after issuing TLS certificates, for example with Certbot.

After the service and reverse proxy are running, verify the API:

```bash
curl https://linear-algebra-api.example.com/api/v2/health
```

### Optional API Edge Proxy: Cloudflare Worker

`deploy/cloudflare-api-proxy/` contains a small Worker that proxies `/api/*` to the FastAPI host.

Configure these Worker environment variables in Cloudflare:

| Variable | Purpose |
| --- | --- |
| `BACKEND_ORIGIN` | HTTPS origin for the FastAPI host, for example `https://linear-algebra-api.example.com` |
| `ALLOWED_ORIGIN` | Exact browser origin allowed for CORS preflight responses |

Deploy it with Wrangler:

```bash
npx wrangler deploy --config deploy/cloudflare-api-proxy/wrangler.jsonc
```

Route `/api/*` traffic for the frontend domain to this Worker, or set `VITE_API_BASE_URL` to the Worker origin.

## Usage

### Entering A Matrix

Matrices are entered as space-separated values with rows separated by semicolons:

```text
1 2 3; 4 5 6; 7 8 9
```

Decimal inputs are accepted and converted to exact fractions automatically:

```text
0.5 1.5; 2.5 3.5
```

Symbolic variables are supported in both grid and text mode. Implicit multiplication is handled automatically:

| Input | Interpreted as |
| --- | --- |
| `x`, `a`, `t` | Symbolic variable |
| `2x` | `2 * x` |
| `(5/2)x` | `(5/2) * x` |
| `3x + 2y` | Linear combination |
| `x^2` or `x**2` | `x**2` |
| `2a - 1` | Affine expression |

Text mode accepts several formats:

| Format | Example |
| --- | --- |
| Space-separated | `[1 2; 3 4]` |
| With variables | `[2x 3y; x -y]` |
| Comma-separated, for cells containing spaces | `[2x - 1, 3y + 2; 0, 1]` |
| Python list | `[[1, sqrt(5)], [3, 4]]` |
| LaTeX | `\begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}` |

### Selecting An Operation

Choose an operation such as REF, Eigenvalues, or Diagonalize, then compute. Results appear with optional step-by-step working where available.

### Chain Multiplication

Select Chain Multiply to multiply 2-3 matrices. For each matrix slot, apply no modifier, transpose, inverse, or transpose-inverse. Add a third matrix when needed, then compute.

### Copying Results

After a computation, result cards expose copy actions that copy parseable `[v v; v v]` output for reuse in subsequent operations.

### Calculation History

Open the history drawer to view the last 50 computations stored in the browser. Select any entry to restore its inputs and result.

## Development

Run all backend tests:

```bash
uv run pytest
```

Run only the v2 API tests:

```bash
uv run pytest tests/integration/test_api_v2.py -v
```

Run frontend checks:

```bash
cd frontend
pnpm lint
pnpm test
pnpm build
```

## Project Structure

```text
linear-algebra/
|-- backend/app/         # FastAPI backend and structured v2 API
|-- frontend/            # React + Vite calculator workspace
|-- packages/ma1522/     # Core symbolic linear algebra library
|-- tests/               # Pytest test suite
|-- pyproject.toml       # Backend/package config and dependencies
`-- uv.lock              # Pinned Python dependency versions
```

## Credits

Original `ma1522` library and core algorithms by [YeeShin504](https://github.com/YeeShin504) and contributors.
