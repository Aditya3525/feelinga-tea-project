# Feelinga Tea — E-Commerce Platform

> Technical Architecture | April 2026

---

## Overview

Premium tea e-commerce platform with:
- **115 files** | **387 nodes** | **555 edges**
- Next.js 16 frontend (Vercel) + Express 4 backend (Render)
- 11 Mongoose models | 10 feature modules
- JWT + Google OAuth authentication

---

## Architecture

```
┌─────────────────────┐
│   Next.js 16 UI     │  Vercel
└──────────┬──────────┘
           │ API
┌──────────▼──────────┐
│   Express 4 API     │  Render
└──────────┬──────────┘
           │ Mongoose
┌──────────▼──────────┐
│   MongoDB Atlas     │
└─────────────────────┘
```

---

## Backend Modules

| Module | Purpose |
|--------|---------|
| admin | Dashboard, users, coupons, exports |
| auth | Login, OAuth, profile, addresses |
| cart | Cart CRUD, sync |
| orders | Order lifecycle, invoices |
| products | Catalog, search |
| reviews | Product reviews |
| contact | Contact form, newsletter |
| testimonials | Public testimonials |
| coupons | Validation |
| upload | Image handling |

---

## Top 10 God Nodes (Most Connected)

| Rank | Function | Edges | Purpose |
|------|----------|-------|---------|
| 1 | `apiRequest()` | 25 | API client |
| 2 | `getErrorMessage()` | 24 | Error handling |
| 3 | `create()` | 20 | Resource creation |
| 4 | `logAdminAction()` | 12 | Audit logging |
| 5 | `hashToken()` | 9 | Token security |
| 6 | `MemoryCache` | 8 | Caching |
| 7 | `register()` | 7 | User registration |
| 8 | `sendEmail()` | 7 | Notifications |
| 9 | `list()` | 6 | Resource listing |
| 10 | `updateStatus()` | 6 | Order updates |

---

## Frontend Structure

```
app/
  (public)/   — Home, Shop, About
  (auth)/     — Login, Register
  (user)/     — Profile, Orders, Cart
  (admin)/    — Dashboard

components/   — Shared UI
context/      — Auth, Cart, Theme
```

---

## Security

- **JWT:** Access (15min) + Refresh (7d)
- **hashToken():** SHA-256 before storage
- **logAdminAction():** Audit trail
- **CORS, sanitization, HTTPS**

---

## Graph Insights

- **85%** EXTRACTED (structural) | **15%** INFERRED
- **61 communities** detected
- **Cross-community bridges:** `fetchProducts()`, `getErrorMessage()`
- **Improvement:** Community 0 (0.06), Community 1 (0.07) cohesion

---

## Roadmap

**Architecture:** Split low-cohesion modules, strengthen types

**Features:** Advanced search, multi-vendor, subscriptions

**Security:** Rate limiting, 2FA, dependency audits

**DevOps:** CI/CD, monitoring, backups

---

## Outputs

```
graphify-out/
  graph.html       — Interactive viz
  graph.json       — Raw data
  GRAPH_REPORT.md  — Full analysis
```

---

*Next.js 16 • React 19 • Express 4 • MongoDB*
