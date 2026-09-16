# Checkout and webhook flow

```mermaid
sequenceDiagram
  participant UI as Checkout UI
  participant API as NestJS
  participant DB as PostgreSQL
  UI->>API: items + coupon + idempotency key
  API->>DB: find existing idempotency key
  API->>DB: transaction: validate inventory/coupon
  API->>DB: decrement inventory, create order/items/payment/activity
  DB-->>API: committed order
  API-->>UI: order confirmation
```

The webhook endpoint persists `providerEventId` under a unique constraint before applying state changes. A retry of the same event returns `duplicate: true`, preventing duplicate processing. A real provider adapter would verify its signature before this boundary.
