# Feelinga Tea — E-Commerce Platform

Premium tea e-commerce platform built with Next.js and Express.

## Tech Stack

- **Frontend:** Next.js 16.1.6 (App Router), React 19, TypeScript 5.9
- **Backend:** Express 4, TypeScript, MongoDB (Mongoose 8)
- **Auth:** JWT (access 15m + refresh 7d tokens), Google OAuth, MFA (email OTP)
- **Security:** Helmet, express-rate-limit, HIBP password breach checks, disposable email blocking, Hunter email verification
- **Email:** Nodemailer (Ethereal in dev, SMTP in prod)
- **PDF:** PDFKit (order invoices)
- **Validation:** Zod schemas
- **Testing:** Vitest + Supertest + mongodb-memory-server
- **Logging:** Pino + pino-pretty
- **Deployment:** Vercel (frontend) + Render (backend)

## Project Structure

```
├── backend/                    Express API server
│   ├── scripts/
│   │   └── ensure-dist-fresh.mjs   Pre-start dist staleness guard
│   ├── src/
│   │   ├── app.ts              Express app entry point
│   │   ├── config/             Database connection & env config
│   │   ├── middleware/         Auth, validation, error handling
│   │   ├── models/             Mongoose schemas (11 models)
│   │   │   ├── AuditLog.ts
│   │   │   ├── Cart.ts
│   │   │   ├── ContactMessage.ts
│   │   │   ├── Counter.ts
│   │   │   ├── Coupon.ts
│   │   │   ├── NewsletterSubscriber.ts
│   │   │   ├── Order.ts
│   │   │   ├── Product.ts
│   │   │   ├── Review.ts
│   │   │   ├── Testimonial.ts
│   │   │   └── User.ts
│   │   ├── modules/            Feature-sliced route handlers
│   │   │   ├── admin/          Dashboard, users, exports, coupons, testimonials
│   │   │   ├── auth/           Register, login, OAuth, MFA, profile, addresses
│   │   │   ├── cart/           Cart CRUD and sync
│   │   │   ├── contact/        Contact form and newsletter
│   │   │   ├── coupons/        Coupon validation
│   │   │   ├── orders/         Order lifecycle, invoices (PDF)
│   │   │   ├── products/       Product catalog and search
│   │   │   ├── reviews/        Product reviews
│   │   │   ├── testimonials/   Public testimonials
│   │   │   └── upload/         Image upload/delete (Multer)
│   │   ├── types/              TypeScript declarations
│   │   └── utils/              Logger, cache, email, seeding, audit log,
│   │                           cookies, email/password breach checks, sanitize
│   ├── test/                   Integration tests (Vitest + Supertest)
│   └── uploads/                Uploaded product images
│
├── next-frontend/              Next.js storefront & admin
│   ├── scripts/
│   │   └── generate-india-address-data.mjs   India address JSON generator
│   ├── src/
│   │   ├── app/                App Router pages & layouts
│   │   │   ├── page.tsx        Home / landing page
│   │   │   ├── layout.tsx      Root layout
│   │   │   ├── manifest.ts     Web app manifest
│   │   │   ├── sitemap.ts      Dynamic XML sitemap
│   │   │   ├── about/
│   │   │   ├── admin/          Admin dashboard (+ TabSections component)
│   │   │   ├── checkout/
│   │   │   ├── contact/
│   │   │   ├── faq/
│   │   │   ├── gifting/
│   │   │   ├── learn/
│   │   │   ├── order-confirm/
│   │   │   ├── privacy/
│   │   │   ├── product/[slug]/
│   │   │   ├── profile/        User profile & order history
│   │   │   ├── reset-password/
│   │   │   ├── shop/           Product listing page (PLP)
│   │   │   ├── terms/
│   │   │   ├── verify-email/
│   │   │   └── wishlist/
│   │   ├── components/         Shared React components
│   │   │   ├── AddressFormFields.tsx
│   │   │   ├── AppIcon.tsx
│   │   │   ├── AuthModal.tsx
│   │   │   ├── CookieConsent.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Layout.tsx      Global nav, footer, sidebar
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGridSkeleton.tsx
│   │   │   ├── Providers.tsx
│   │   │   ├── SearchOverlay.tsx
│   │   │   ├── SectionHeader.tsx
│   │   │   └── Toast.tsx
│   │   ├── context/            React context providers
│   │   │   ├── AuthContext.tsx
│   │   │   ├── CartContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── data/               Static data assets
│   │   │   └── indiaStateCityDistrictMap.json
│   │   ├── hooks/              Custom React hooks
│   │   │   ├── useCounter.ts
│   │   │   └── useFadeIn.ts
│   │   ├── styles/             CSS design system
│   │   │   ├── styles.css      Global storefront styles
│   │   │   ├── admin.css       Admin dashboard styles
│   │   │   └── profile.css     Profile page styles
│   │   ├── types/              TypeScript interfaces
│   │   │   └── app.ts
│   │   └── utils/              API client & helpers
│   │       ├── api.ts          Typed fetch wrapper
│   │       ├── constants.ts
│   │       ├── email.ts
│   │       ├── emailCheck.ts
│   │       ├── geolocation.ts
│   │       ├── indiaAddress.ts
│   │       ├── password.ts
│   │       ├── phoneCountry.ts
│   │       └── renderStars.ts
│   ├── public/                 Static assets
│   │   ├── images/
│   │   ├── logo.png
│   │   └── robots.txt
│   └── stitch_fetch.mjs        Dev data-stitching helper script
│
├── scripts/                    Monorepo root scripts
│   ├── graphify-refresh.ps1
│   └── graphify-refresh.cmd
├── graphify-out/               Auto-generated code graph output
│   ├── graph.json
│   ├── graph.html
│   └── GRAPH_REPORT.md
├── docs/                       Supporting docs & local artifacts
│   ├── ROADMAP.md
│   ├── presentation.md
│   ├── Graphify_Setup_Guide.txt
│   ├── GRAPHIFY_AGENT_PROMPTS.md
│   └── hello_world.html
├── render.yaml                 Render deployment blueprint
└── vercel.json                 Vercel deployment config
```

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local instance or Atlas)

### Monorepo Quick Start

From the project root, install all dependencies and start both servers with a single command:

```bash
npm run install:all   # Install root + backend + frontend deps
npm run dev           # Start backend (port 5000) & frontend (port 3000) concurrently
```

### Backend Setup (manual)

```bash
cd backend
cp .env.example .env       # Configure environment variables
npm install
npm run seed               # Seed database with sample data
npm run dev                # Start dev server on port 5000
```

### Frontend Setup (manual)

```bash
cd next-frontend
cp .env.example .env.local
npm install
npm run dev                # Start dev server on port 3000
```

### Environment Variables

**Backend** (see `backend/.env.example`):

| Variable | Description |
|----------|-------------|
| `PORT` | API server port (default: 5000) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Access token signing secret |
| `JWT_EXPIRES_IN` | Access token TTL (default: `15m`) |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (default: `7d`) |
| `ADMIN_EMAIL` | Primary admin account email |
| `CLIENT_URL` | Frontend URL (CORS & email links) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `EMAIL_FROM` | Sender address for outgoing emails |
| `SMTP_HOST/PORT/USER/PASS` | SMTP email delivery config |
| `SMTP_SECURE` | TLS flag for SMTP (`true`/`false`) |
| `ENFORCE_HTTPS` | Redirect HTTP → HTTPS in production |
| `COOKIE_SAMESITE` | Cookie SameSite policy (`lax`/`strict`) |
| `ENFORCE_LOGIN_MFA` | Require email OTP on login |
| `MFA_TOKEN_EXPIRES_IN` | MFA code expiry (default: `10m`) |
| `HIBP_ENFORCE` | Block breached passwords via HaveIBeenPwned |
| `EMAIL_VERIFIER_PROVIDER` | Email verification provider (`none`/`hunter`) |
| `HUNTER_API_KEY` | Hunter.io API key for email verification |

**Frontend** (see `next-frontend/.env.example`):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID (browser-side) |

## Available Scripts

### Root (monorepo)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start backend + frontend concurrently |
| `npm run dev:backend` | Start backend only |
| `npm run dev:frontend` | Start frontend only |
| `npm run install:all` | Install deps for root, backend & frontend |

### Backend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Start production server (checks dist freshness) |
| `npm run seed` | Seed database with sample data |
| `npm test` | Run tests once (Vitest + Supertest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint source files |
| `npm run lint:fix` | Lint and auto-fix source files |
| `npm run security:audit` | Run `npm audit` at moderate level |

### Frontend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build (webpack) |
| `npm start` | Start production server |
| `npm run lint` | Lint source files |
| `npm run typecheck` | TypeScript type checking |
| `npm run typecheck:strict` | Strict TypeScript type checking |
| `npm run generate:india-address-data` | Regenerate India address JSON |

## Graphify Refresh (One Command)

From the project root, run one of these commands:

```powershell
.\scripts\graphify-refresh.ps1
```

```cmd
scripts\graphify-refresh.cmd
```

This refreshes the code graph and updates:

- `graphify-out/graph.json`
- `graphify-out/graph.html`
- `graphify-out/GRAPH_REPORT.md`

Requirements:

- `graphify` CLI installed and available in `PATH`
- Run from the repository root (`Tea Project`)

## API Overview

Base URL: `/api/v1`

| Group | Key Endpoints | Auth |
|-------|--------------|------|
| Auth | Register, Login, Google OAuth, MFA verify, Refresh, Profile, Addresses | Mixed |
| Products | List, Search, Autocomplete, Detail, CRUD | Public / Admin |
| Orders | Create, List, Detail, Cancel, Invoice PDF | User / Admin |
| Cart | Get, Add, Update, Remove, Sync, Clear | User |
| Reviews | List, Create, Delete | Public / User |
| Coupons | Validate | User |
| Admin | Dashboard, Users, Exports, Coupons, Testimonials, Audit Logs | Admin |
| Contact | Submit form, Newsletter subscribe | Public / Admin |
| Upload | Image upload/delete | Admin |
| Health | `/health` status check | Public |

## Security Features

- **Helmet** — HTTP security headers
- **Rate limiting** — Per-route limits via `express-rate-limit`
- **MFA** — Email OTP required on login (configurable)
- **HIBP** — HaveIBeenPwned k-anonymity API checks breached passwords
- **Disposable email blocking** — Rejects known throwaway email domains
- **Hunter email verification** — Optional external mailbox validation
- **JWT rotation** — Short-lived access tokens + long-lived refresh tokens stored in HttpOnly cookies
- **Audit logging** — Admin actions recorded in `AuditLog` collection

## License

Private — All rights reserved.
