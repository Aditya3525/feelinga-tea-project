# Feelinga Tea — E-Commerce Platform

Premium tea e-commerce platform built with Next.js and Express.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **Backend:** Express 4, TypeScript, MongoDB (Mongoose)
- **Auth:** JWT (access + refresh tokens), Google OAuth
- **Email:** Nodemailer (Ethereal in dev, SMTP in prod)
- **Deployment:** Vercel (frontend) + Render (backend)

## Project Structure

```
├── backend/                  Express API server
│   ├── src/
│   │   ├── config/           Database connection
│   │   ├── middleware/       Auth, validation, error handling
│   │   ├── models/           Mongoose schemas (11 models)
│   │   ├── modules/          Feature-sliced route handlers
│   │   │   ├── admin/        Dashboard, users, exports, coupons, testimonials
│   │   │   ├── auth/         Register, login, OAuth, profile, addresses
│   │   │   ├── cart/         Cart CRUD and sync
│   │   │   ├── contact/     Contact form and newsletter
│   │   │   ├── coupons/     Coupon validation
│   │   │   ├── orders/      Order lifecycle, invoices
│   │   │   ├── products/    Product catalog and search
│   │   │   ├── reviews/     Product reviews
│   │   │   ├── testimonials/ Public testimonials
│   │   │   └── upload/      Image upload/delete
│   │   ├── types/            TypeScript declarations
│   │   └── utils/            Logger, cache, email, seeding
│   ├── test/                 Integration tests
│   └── uploads/              Uploaded product images
│
├── next-frontend/            Next.js storefront & admin
│   ├── src/
│   │   ├── app/              App Router pages & layouts
│   │   ├── components/       Shared React components
│   │   ├── context/          Auth, Cart, Theme providers
│   │   ├── hooks/            Custom React hooks
│   │   ├── styles/           CSS design system
│   │   ├── types/            TypeScript interfaces
│   │   └── utils/            API client & helpers
│   └── public/               Static assets (images, robots.txt)
│
├── render.yaml               Render deployment blueprint
└── ROADMAP.md                Improvement roadmap
```

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local instance or Atlas)

### Backend Setup

```bash
cd backend
cp .env.example .env       # Configure environment variables
npm install
npm run seed               # Seed database with sample data
npm run dev                # Start dev server on port 5000
```

### Frontend Setup

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
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `ADMIN_EMAIL` | Primary admin account email |
| `CLIENT_URL` | Frontend URL (CORS & email links) |
| `SMTP_HOST/USER/PASS` | Email delivery config |

**Frontend** (see `next-frontend/.env.example`):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL |

## Available Scripts

### Backend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Start production server |
| `npm run seed` | Seed database with sample data |
| `npm test` | Run tests (Vitest + Supertest) |
| `npm run lint` | Lint source files |

### Frontend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Lint source files |
| `npm run typecheck` | TypeScript type checking |

## API Overview

Base URL: `/api/v1`

| Group | Key Endpoints | Auth |
|-------|--------------|------|
| Auth | Register, Login, Google OAuth, Refresh, Profile | Mixed |
| Products | List, Search, Autocomplete, Detail, CRUD | Public / Admin |
| Orders | Create, List, Detail, Cancel, Invoice PDF | User / Admin |
| Cart | Get, Add, Update, Remove, Sync, Clear | User |
| Reviews | List, Create, Delete | Public / User |
| Coupons | Validate | User |
| Admin | Dashboard, Users, Exports, Coupons, Testimonials | Admin |
| Contact | Submit form, Newsletter subscribe | Public / Admin |
| Upload | Image upload/delete | Admin |
| Health | `/health` status check | Public |

## License

Private — All rights reserved.
