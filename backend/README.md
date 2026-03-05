# Serené Tea — Backend API

RESTful API for the Serené Tea e-commerce platform, built with Express, TypeScript, and MongoDB.

## Features

- **Storefront**: Products, Categories, Collections
- **User**: Authentication (JWT + Refresh Tokens), Profile management
- **Cart**: Persistent cart syncing
- **Orders**: Checkout flow, Order history
- **Admin**: Dashboard, Product management, User oversight

## Prerequisites

- Node.js 18+
- MongoDB (Local or Atlas)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env` and fill in the required values.
   ```bash
   cp .env.example .env
   ```

3. **Seed the database (Optional):**
   Populate the database with sample products and an admin user.
   ```bash
   npm run seed
   ```
   *Note: This will clear existing data.*

## Development

```bash
# Run in development mode (with hot-reload)
npm run dev

# Run linting
npm run lint
```

## Production

```bash
# Build the project
npm run build

# Start the production server
npm start
```

## Testing

Run the integration test suite:

```bash
npm test
```
