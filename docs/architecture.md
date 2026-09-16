# Architecture

```mermaid
flowchart LR
  Browser[Next.js storefront & operations UI] --> API[NestJS REST API]
  API --> Prisma[Prisma ORM]
  Prisma --> PG[(PostgreSQL)]
  API -. cache/queue seam .-> Redis[(Redis)]
```

The relational schema uses UUID primary keys, money decimals, enum lifecycles, unique SKU/order/idempotency/event constraints, and indexed product/order query paths. The dashboard is always computed from persisted orders rather than UI constants.
