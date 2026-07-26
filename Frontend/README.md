# ShelfStock — Frontend

A React (Vite) storefront + admin panel wired directly to your Django REST
backend. Nothing here is mocked — every page fetches straight from your API
on load, so anything you change in Django admin, Postman, or through this
app's own admin panel shows up live.

## What's included

- **Public storefront**: home page with live brand/category/featured
  pulls, a catalog page with search + filter by brand/category/featured +
  sort, and a product detail page.
- **Auth**: register, login, JWT stored in `localStorage`, silent access-token
  refresh on 401, protected `/profile` route.
- **Admin panel** (`/admin`, only visible to users with `is_admin: true`):
  live dashboard counts, and full CRUD for products, brands, categories, and
  users — including image upload, active/inactive and featured toggles, and
  the self-delete/self-deactivate guard your API already enforces.
- **Cart** (`/cart`, any signed-in user): "Add to cart" on every product
  card and the product detail page (with a quantity stepper), a live badge
  on the navbar, line-item quantity controls, remove/clear, and an order
  summary — all reading and writing the `cart` app's endpoints
  (`/api/cart/...`). There's a `/checkout` page that shows the order
  summary and is upfront that there's no orders/payment API on the backend
  yet, rather than pretending to place a real order.

## 0. Cart needs the `cart` app on the backend

This frontend expects `/api/cart/`, `/api/cart/add/`,
`/api/cart/items/<id>/update/`, `/api/cart/items/<id>/remove/`, and
`/api/cart/clear/` to exist. If you haven't added the `cart` Django app yet,
see the separate `cart-backend-module.zip` / `SETUP.md` for the drop-in app
and the two-line `settings.py` / `urls.py` wiring it needs.

## 1. One required fix to your backend first

Your `config/settings.py` doesn't define `MEDIA_URL` / `MEDIA_ROOT`, but
`config/urls.py` references both to serve uploaded images in DEBUG mode.
Without them, Django falls back to an **empty** `MEDIA_URL`, and
`django.conf.urls.static.static()` raises `ImproperlyConfigured: Empty
static prefix not permitted` — so uploaded logos/images/product photos
won't serve correctly (and depending on your Django version, the server
may refuse to boot at all).

Add this to `config/settings.py` (anywhere below `BASE_DIR = ...`):

```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

Your existing uploaded images currently sit inside `brands/`, `categories/`,
and `products/` (next to your app code) because no `MEDIA_ROOT` was set.
After adding the setting, create a `media/` folder at the project root and
move those existing image files into the matching subfolders
(`media/brands/`, `media/categories/`, `media/products/`) so the paths
already stored in `db.sqlite3` keep resolving.

## 2. Run the backend

```bash
cd Backend
# activate your venv, then:
python manage.py runserver
```

It should be reachable at `http://127.0.0.1:8000/api/`.

## 3. Run this frontend

```bash
npm install
cp .env.example .env      # then edit VITE_API_URL if your API isn't on 127.0.0.1:8000
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

## How the data flow works

- `src/api/axios.js` is the only place the base URL and auth headers are
  configured. Every page just calls `api.get('/products/')`,
  `api.post('/brands/create/')`, etc. — matching your real Django URLs
  one-to-one.
- Login stores `tokens.access` / `tokens.refresh` from
  `POST /api/users/login/`. Every request attaches
  `Authorization: Bearer <access>`. If a request comes back `401`, the app
  calls `POST /api/users/token/refresh/` once and retries automatically —
  you won't get logged out just because 30 minutes passed.
- Brand and category **create/update** endpoints only accept
  `multipart/form-data` (no JSON parser configured on those two views), so
  the frontend always sends `FormData` for them, even for a simple
  active/inactive toggle. Product and user update endpoints accept JSON, so
  those use plain objects.
- The public product list/detail endpoints only return `is_active: true`
  products (that's a filter in your `views.py`, not something the frontend
  chose) — so deactivating a product in the admin panel makes it disappear
  from the storefront **and** from the admin product list itself, since
  there's no admin-only "show everything" endpoint yet. If you want to be
  able to reactivate products after deactivating them, add an
  `is_active`-agnostic admin listing endpoint to `products/views.py`
  (the course notes already show the same pattern for categories, under
  "Optional Improvement").

## Project structure

```
src/
  api/axios.js          — API client, JWT attach + refresh
  context/               — Auth + toast providers
  components/            — Navbar, cards, route guards, modal, etc.
  pages/                 — Public pages (home, catalog, product, auth, profile)
  pages/admin/            — Admin layout + dashboard + brand/category/product/user CRUD
  styles/index.css        — Design system (tokens + components)
```

No Redux, no Tailwind build step — just React Context for auth/toasts and
hand-written CSS, so `npm install` stays small and there's nothing to
configure beyond your API URL.
