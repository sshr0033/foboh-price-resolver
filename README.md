# FOBOH — Bespoke Pricing Profiles

A full-stack reference implementation of a wholesale food-and-beverage **bespoke pricing** workflow. A pricing manager authors customer-specific pricing profiles through a guided wizard (with a live preview), saves them as Draft or Active, and any caller can **resolve** a `(customer, product)` pair into a single final price — returned alongside a complete, human-readable explanation of *why* that price won.

```
Pricing Manager ──► Wizard ──► Save profile ──► Store
                                                  │
Sales rep / app / API ──► Resolve(customer, product) ──► final price + why
```

**Tech stack**

- **Backend** — Node 20 · Express 4 · TypeScript · Zod · swagger-ui-express · in-memory store
- **Frontend** — Vite · React 18 · TypeScript · Redux Toolkit · RTK Query · React Router 6 · Tailwind 3

---

## Contents

- [Setup](#setup)
- [What it does](#what-it-does)
- [The price resolver in 60 seconds](#the-price-resolver-in-60-seconds)
- [Project structure](#project-structure)
- [Transcripts](#transcripts)
- [Trade-offs](#trade-offs)
- [Known limitations](#known-limitations)
- [What I'd do next](#what-id-do-next)

---

## Setup

The project runs as two processes — an Express API and a Vite dev server. From the repo root:

```bash
# Terminal 1 — backend API (http://localhost:4000)
cd backend  && npm install && npm run dev

# Terminal 2 — frontend SPA (http://localhost:5173)
cd frontend && npm install && npm run dev
```

The frontend expects the API at `http://localhost:4000`; the API allows CORS from `http://localhost:5173`, so the defaults work with no extra configuration. Interactive API docs (Swagger UI) are served at <http://localhost:4000/api/docs>. The store is seeded in memory at startup and **resets on every restart** — no database or migrations to run.

Four `curl` calls that exercise the resolver end-to-end (these correspond to the worked examples in the LLD):

```bash
# Profile C wins — bespoke custom price $95.00
curl 'http://localhost:4000/api/pricing/resolve?customerId=cus_bondi&productId=prd_koybrunv'

# Profile B wins on tie-break — 409.32 − 15 = 394.32
curl 'http://localhost:4000/api/pricing/resolve?customerId=cus_bondi&productId=prd_lacbnat'

# Profile A wins — 279.06 × 0.9 = 251.15
curl 'http://localhost:4000/api/pricing/resolve?customerId=cus_bondi&productId=prd_hgvpin21'

# No match — falls back to base price $58.00
curl 'http://localhost:4000/api/pricing/resolve?customerId=cus_bondi&productId=prd_necsr'
```

---

## What it does

Suppliers don't sell at one flat price — they negotiate different prices with different customers and groups. This app lets a pricing manager **author those deals** as reusable *pricing profiles*, and lets any caller **resolve** the final price for a `(customer, product)` pair.

Two journeys:

1. **Authoring (write path)** — a 3-step wizard: name the profile, pick products and a price adjustment (with a live preview), assign customers, then save as **Draft** or **Activate**.
2. **Resolving (read path)** — send a `customerId` and `productId`; get back the single winning price, the profile that produced it, a one-line reason, and a full matched/rejected breakdown.

---

## The price resolver in 60 seconds

Given a customer and a product, the resolver:

1. **Matches** — keeps only profiles that are `ACTIVE`, whose customer scope covers the customer, and whose product scope covers the product.
2. **Ranks** — sorts matches by **customer-specificity** (Customer > Group > All), then **product-specificity** (List > Rule > All), then **most recently updated**, then `id` as a final deterministic tie-break.
3. **Applies** — takes the winner's price rule (a custom price, or a fixed/% adjustment), clamps negatives to `$0.00`, and rounds half-up to cents.

If nothing matches, it returns the product's **base price**. Either way, the response carries a full audit trail of which profiles matched (with scores) and which were rejected (with reasons).

> **The golden rule:** customer-specificity is checked *before* product-specificity — a deal struck with *this customer* outranks a deal aimed at *this product*, even when the product deal is cheaper. *"We agreed this with you"* is a stronger promise than *"this is our list price."*

The full step-by-step algorithm, the scoring table, and verified worked examples live in the [low-level design doc](architecture/low-level-design/README.md).

---

## Project structure

```
foboh-pr/
├── README.md
├── architecture/
│   ├── high-level-design/        # system architecture, deployment, design decisions (+ PNGs)
│   └── low-level-design/         # domain model, resolve flow, DB schema, the algorithm (+ PNGs)    
├── backend/
│   └── src/
│       ├── index.ts              # app bootstrap (CORS, Swagger, error handler)
│       ├── routes/               # URL → controller wiring
│       ├── controllers/          # parse + validate, shape responses
│       ├── services/
│       │   ├── pricing-resolver.service.ts   # ★ the engine
│       │   ├── preview.service.ts
│       │   ├── profiles.service.ts
│       │   ├── products.service.ts
│       │   └── customers.service.ts
│       ├── schemas/profile.ts    # Zod validation
│       ├── store/index.ts        # in-memory tables
│       ├── data/seed.ts          # seed data
│       ├── types.ts              # shared domain types
│       └── utils/                # round (half-up), HttpError
└── frontend/
    └── src/
        ├── pages/                # PricingListPage, PricingWizardPage
        ├── components/
        │   ├── wizard/           # the 3-step authoring flow
        │   └── resolver/         # ResolverPanel — resolve + breakdown UI
        └── store/                # RTK Query api + wizard slice
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

The full request/response schemas are browsable in Swagger UI at <http://localhost:4000/api/docs>.

---

## Documentation

| Document | What it covers |
|---|---|
| **[High-Level Design](architecture/high-level-design/README.md)** | System architecture, the pricing model, deployment shape, key design decisions |
| **[Low-Level Design](architecture/low-level-design/README.md)** | Domain model, resolve sequence, DB schema, the resolver algorithm in full, worked examples, every edge case |

> The architecture docs embed PNG diagrams that render directly on GitHub.

---

## Transcripts

The AI-assistant working transcripts produced while building this project live in [`transcripts/`](https://drive.google.com/drive/folders/1F7AkD9Ug6nYNiR3SgiWJMJhemoIJ2Uff?usp=sharing). They capture the design conversations and iteration behind the resolver logic, the API surface, and the architecture docs.

---

## Trade-offs

Every notable decision here optimises for **explainability and commercial intent** over raw simplicity or theoretical purity — because in F&B wholesale, *why* a price was charged is as important as the number itself.

| Decision | Choice | Why |
|---|---|---|
| **Precedence** | Customer-specificity beats product-specificity | A per-customer deal is the supplier's primary commercial instrument; *"we agreed this with you"* outranks a product-wide rule, even when the rule is cheaper. |
| **Tie-break** | Most recently updated wins (then `id`) | The newest deal supersedes older ones, and the final `id` step keeps results deterministic. |
| **"All products"** | Wizard saves a **snapshot**; API also accepts a **dynamic** "all" rule | Snapshots are auditable and predictable; dynamic rules auto-cover future SKUs — both are real contract patterns. |
| **Deleted products** | Soft delete; resolver skips silently, `GET /products/:id` returns `410` | Preserves history and intent; a reinstated SKU keeps its old deals rather than losing them to a rewrite. |
| **Rounding** | Half-up to 2dp (`$0.125 → $0.13`) | Banker's rounding is statistically nicer, but a rep arguing a one-cent direction is the worse outcome. |
| **Negative prices** | Clamped to `$0.00`, flagged | A "200% off" adjustment is legal intent (the customer pays nothing); clamp-and-flag beats rejecting it at save time. |
| **Storage** | In-memory store | Fast to run and demo. The store is isolated behind `store/index.ts` so the resolver and API contract are untouched when it's swapped for Postgres. |

---

## Known limitations

These are intentional simplifications for a reference build:

- The in-memory store resets on restart — single process, no concurrency model.
- The wizard collapses a multi-customer selection to a single `CUSTOMER` scope; `RULE` and `ALL` product scopes are created via the API rather than the UI.
- No effective-dating yet — profiles are activated/deactivated manually.
- The per-resolve breakdown is returned to the caller but not persisted.

---

## What I'd do next

The natural next step is **persistence and time-awareness**. Swapping the in-memory store for Postgres — a `products` table with a soft-delete column, a `pricing_profiles` table storing scope/override as `jsonb` for shape flexibility, and an index on `(status, updatedAt)` so the resolver scans only active profiles in tie-break order — turns this from a demo into something that survives a restart, with an optimistic-concurrency version column to make concurrent edits safe.

On top of that I'd add **effective-dating** (`activeFrom` / `activeTo`) so seasonal contracts expire on their own instead of needing a manual deactivation, and a **persisted audit log** of every resolved price keyed by `(customerId, productId, profileId, resolvedAt, finalPrice)` — which finally answers *"why did this customer get charged $X last Tuesday?"* historically rather than only at the moment of resolution. Further out, **contract-level profile bundles** would let a customer's signed contract group several profiles whose status flips together under one audit trail, matching how these deals are actually negotiated.
