# CommerceFlow

A recruiter-facing commerce operations demo: a customer storefront backed by a NestJS API, PostgreSQL/Prisma data model, transactional checkout, and a populated operations dashboard. All names, orders, and payments are fictional local demo data.

## Quick start

```bash
cp .env.example apps/api/.env
pnpm install
docker compose up -d
pnpm db:migrate -- --name init
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`; the API is at `http://localhost:4000/api`. Demo identities are `ops@commerceflow.demo` and `customer1@commerceflow.demo` (no password—authentication is intentionally demo-oriented in this initial implementation).

## Highlights

- Seeded catalog, inventory, 18 historical orders, coupons, payments, and low-stock signals.
- Server-owned checkout pricing inside a Prisma transaction: validates inventory and coupons, atomically decrements stock, persists order/items/payment/activity, and uses a unique idempotency key.
- Operations overview derives revenue, AOV, statuses, recent orders, and inventory warnings from database records.
- A deterministic `DEMO` payment provider and a duplicate-safe payment-webhook persistence endpoint.
- Redis caches the database-derived dashboard response for 30 seconds and falls back to PostgreSQL if Redis is unavailable. Checkout and order-status mutations invalidate it.

## Stack and structure

`apps/web` is Next.js App Router; `apps/api` is NestJS + Prisma. Docker Compose runs PostgreSQL and Redis. BullMQ is intentionally not included.

See [architecture](docs/architecture.md) and [checkout flow](docs/checkout-flow.md). Commands: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm format:check`.

## Tradeoffs

This is a portfolio demo, not a production payment system. It does not collect card data, use OAuth, or receive real provider webhooks. The API includes the seams for those concerns but should gain cookie sessions/CSRF enforcement, Redis cache invalidation, a queue worker, and a real payment adapter before production use.
