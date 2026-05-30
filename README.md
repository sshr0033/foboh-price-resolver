# FOBOH — Pricing Profile

A full-stack reference implementation of a wholesale food-and-beverage **bespoke
pricing** workflow: build customer-specific pricing profiles, preview prices
live, save them, and **resolve** `(customer, product) → final price` against the
full rule set — with a complete, human-readable explanation of every decision.

```
Pricing Manager ──► Wizard ──► Save profile ──► Store
                                                  │
Sales rep / app / API ──► Resolve(customer, product) ──► final price + why
```
---
## Contents
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [What it does](#what-it-does)
- [The price resolver in 60 seconds](#the-price-resolver-in-60-seconds)
- [Documentation](#documentation)
- [Project structure](#project-structure)
- [API reference](#api-reference)
- [Seed data](#seed-data)
- [Design decisions & trade-offs](#design-decisions--trade-offs)
- [Known limitations](#known-limitations)
- [What I'd do next](#what-id-do-next)

---
## Tech stack

- **Backend:** Node 20 · Express 4 · TypeScript · Zod · swagger-ui-express · in-memory store
- **Frontend:** Vite · React 18 · TypeScript · Redux Toolkit · RTK Query · React Router 6 · Tailwind 3
---
## Quick start

```bash
cd backend  && npm install && npm run dev   # http://localhost:4000
cd frontend && npm install && npm run dev   # http://localhost:5173
```

Swagger UI: <http://localhost:4000/api/docs>

Four calls that hit the resolver (these are Examples 1, 2, 3 and 6 in the
resolver guide):

```bash
# Profile C wins — bespoke custom price $95.00
curl 'http://localhost:4000/api/pricing/resolve?customerId=cus_bondi&productId=prd_koybrunv'

# Profile B wins on tie-break — 409.32 - 15 = 394.32
curl 'http://localhost:4000/api/pricing/resolve?customerId=cus_bondi&productId=prd_lacbnat'

# Profile A wins — 279.06 * 0.9 = 251.15
curl 'http://localhost:4000/api/pricing/resolve?customerId=cus_bondi&productId=prd_hgvpin21'

# No match — base price 58.00
curl 'http://localhost:4000/api/pricing/resolve?customerId=cus_bondi&productId=prd_necsr'
```
---

## What it does

Suppliers don't sell at one flat price — they negotiate different prices with
different customers and groups. This app lets a pricing manager **author those
deals** as reusable *pricing profiles*, and lets any caller **resolve** the final
price for a `(customer, product)` pair.

Two journeys:

1. **Authoring (write path)** — a 3-step wizard: name the profile, pick products
   and a price adjustment (with a live preview), assign customers, then save as
   **Draft** or **Activate**.
2. **Resolving (read path)** — send a `customerId` and `productId`; get back the
   single winning price, the profile that produced it, a one-line reason, and a
   full matched/rejected breakdown.
  
---

## The price resolver in 60 seconds

Given a customer and a product, the resolver:

1. **Matches** — keeps only profiles that are `ACTIVE`, whose customer scope
   covers the customer, and whose product scope covers the product.
2. **Ranks** — sorts the matches by, in order: **customer-specificity** (Customer
   > Group > All), then **product-specificity** (List > Rule > All), then **most
   recently updated**, then id as a final deterministic tie-break.
3. **Applies** — takes the winner's price rule (a custom price, or a fixed/%
   adjustment), clamps negatives to \$0.00, and rounds half-up to cents.

If nothing matches, it returns the product's **base price**. Either way, the
response carries a full audit trail of which profiles matched (with scores) and
which were rejected (with reasons).

> **The golden rule:** customer-specificity is checked *before* product-
> specificity — a deal struck with *this customer* outranks a deal aimed at *this
> product*, even when the product deal is cheaper. *"We agreed this with you"* is
> a stronger promise than *"this is our list price."*

A full plain-English walkthrough with worked numbers and every edge case is in
**[`docs/PRICE_RESOLVER_EXPLAINED.md`](docs/PRICE_RESOLVER_EXPLAINED.md)**.

---

## Documentation

| Document | What it covers | Audience |
|---|---|---|
| **[docs/PRICE_RESOLVER_EXPLAINED.md](docs/PRICE_RESOLVER_EXPLAINED.md)** | Plain-English resolver logic, seed data, worked examples, all edge cases | Everyone — start here |
| **[docs/DATA_FLOW_DIAGRAM.md](docs/DATA_FLOW_DIAGRAM.md)** | End-to-end data flow (DFD), from wizard to resolver | Everyone |
| **[docs/HLD.md](docs/HLD.md)** | High-level design — architecture, components, decisions | Product + engineering |
| **[docs/LLD.md](docs/LLD.md)** | Low-level design — modules, types, the resolver algorithm step by step, API surface | Engineering |

> The diagram documents use Mermaid, which renders automatically when viewed on
> GitHub.

---

## Project structure

```
foboh-pricing/
├── README.md
├── docs/
│   ├── PRICE_RESOLVER_EXPLAINED.md   # plain-English logic + examples + edge cases
│   ├── DATA_FLOW_DIAGRAM.md          # DFD: context, detailed, resolver zoom-in
│   ├── HLD.md                        # high-level design
│   └── LLD.md                        # low-level design
├── backend/
│   └── src/
│       ├── index.ts                  # app bootstrap (CORS, Swagger, error handler)
│       ├── routes/                   # URL → controller wiring
│       ├── controllers/              # parse + validate, shape responses
│       ├── services/
│       │   ├── pricing-resolver.service.ts   # ★ the engine
│       │   ├── preview.service.ts
│       │   ├── profiles.service.ts
│       │   ├── products.service.ts
│       │   └── customers.service.ts
│       ├── schemas/profile.ts        # Zod validation
│       ├── store/index.ts            # in-memory tables
│       ├── data/seed.ts              # seed data
│       ├── types.ts                  # shared domain types
│       └── utils/                    # round (half-up), HttpError
└── frontend/
    └── src/
        ├── pages/                    # PricingListPage, PricingWizardPage
        ├── components/
        │   ├── wizard/               # the 3-step authoring flow
        │   └── resolver/            # ResolverPanel — resolve + breakdown UI
        └── store/                    # RTK Query api + wizard slice
```

---

## API reference

| Method & path | Purpose | Errors |
|---|---|---|
| `GET /api/health` | Liveness check | — |
| `GET /api/products` | List products — filters: `q`, `subCategory`, `segment`, `brand`, `includeDeleted` | — |
| `GET /api/products/:id` | Single product | `404`, `410` (deleted) |
| `GET /api/customers` | List customers | — |
| `GET /api/customer-groups` | List customer groups | — |
| `GET /api/pricing-profiles` | List profiles — optional `?status=DRAFT\|ACTIVE` | — |
| `GET /api/pricing-profiles/:id` | Single profile | `404` |
| `POST /api/pricing-profiles` | Create a profile | `400` |
| `PATCH /api/pricing-profiles/:id` | Partial update | `400`, `404` |
| `DELETE /api/pricing-profiles/:id` | Delete a profile | `404` |
| `POST /api/pricing/preview` | Preview prices for `{ productIds, priceOverride }` | `400` |
| `GET /api/pricing/resolve` | **Resolve** a price — `?customerId&productId` | `400`, `404`, `410` |

### Resolve response (shape)

```jsonc
{
  "customerId": "cus_bondi",
  "productId": "prd_lacbnat",
  "basePrice": 409.32,
  "finalPrice": 394.32,
  "source": { "kind": "PROFILE", "profileId": "...", "profileName": "VIP — $15 off Sparkling",
              "level": 5, "label": "Customer Group + Product Group" },
  "explanation": "Profile 'VIP — $15 off Sparkling' selected at Level 5 … −$15.00 applied to base $409.32.",
  "consideredProfiles": [ /* matched (with scores, isWinner) + rejected (with reasons) */ ]
}
```

---

## Seed data

The in-memory store is seeded at startup with three customer groups, five
customers, several products, and three active pricing profiles:

| Profile | Who | Which products | How much |
|---|---|---|---|
| A | Group: Independent Retailers | Rule: segment = Wine | −10% |
| B | Group: VIP | Rule: Wine **and** Sparkling | −\$15 |
| C | Customer: Bondi Cellars | List: Koyama Methode Brut | Custom \$95.00 |

The full seed (with prices and group memberships) is laid out in
[`docs/PRICE_RESOLVER_EXPLAINED.md`](docs/PRICE_RESOLVER_EXPLAINED.md#3-the-seed-data-our-worked-example-world).

---

## Design decisions & trade-offs

**1. Precedence — specificity wins, customer-first.** When two profiles tie,
the most recently updated wins. Customer-specificity beats product-specificity
because in F&B wholesale the per-customer price book is the supplier's primary
commercial instrument: a deal struck with a specific customer is a stronger
expression of intent than a product-wide rule that happens to hit them.

**2. "All products" — snapshot vs dynamic.** A `PRODUCT_LIST` is a snapshot
frozen by the wizard's "select all" at save time (predictable, auditable). A
`RULE { type: 'ALL' }` is dynamic and resolves against the live catalogue, so
new SKUs are auto-covered. The wizard produces snapshots; the API accepts both,
because "everything we sell at 5% off" is a real contract-level pattern that
shouldn't need a re-save per SKU.

**3. Deleted products — soft delete.** Resolver and search exclude them;
`GET /products/:id` on a deleted product returns `410 Gone`. Profiles that still
reference a deleted id in a `PRODUCT_LIST` are left untouched — the id is simply
skipped at resolve time. Rewriting history would lose intent (the SKU might be
reinstated next week).

**4. Rounding — half-up to 2dp.** Banker's rounding is statistically nicer, but
retail intuition expects \$0.125 → \$0.13, and a rep arguing a one-cent rounding
direction is a worse outcome than micro-bias.

**5. Negative prices — clamped to \$0.00.** Saving a 200% decrease on a \$50 item
is legal commercial intent (the customer pays \$0); it's clamped and flagged
rather than rejected at save time.

**6. In-memory store.** Resets on restart, single process, no concurrency model.
With a database this becomes a `products` table (soft-delete column, audit
timestamps); a `pricing_profiles` table storing scope/override as `jsonb` for
shape flexibility; an index on `(status, updatedAt)` so the resolver scans only
active profiles; and an idempotency key plus a version column for optimistic
concurrency on edits.

---

## Known limitations

These are intentional simplifications for a reference build:

- The wizard collapses a multi-customer selection to a single `CUSTOMER` scope;
  a production version would emit one profile per customer or add a
  `CUSTOMER_LIST` scope.
- The wizard only produces `PRODUCT_LIST` (snapshot) product scopes; `RULE` and
  `ALL` scopes are created via the API.
- No effective-dating yet — profiles are activated/deactivated manually.
- The per-resolve breakdown is returned but not persisted.

---

## What I'd do next

- **Effective-dating** profiles (`activeFrom` / `activeTo`) so seasonal contracts
  auto-expire without a manual deactivation step.
- **Persisted audit log** of every resolved price, keyed by
  `(customerId, productId, profileId, resolvedAt, finalPrice)` — closes the
  "why did this customer get charged \$X last Tuesday?" question over time.
- **Contract-level profile bundles** — a customer signs a contract grouping N
  profiles whose status flips together under one audit trail.
