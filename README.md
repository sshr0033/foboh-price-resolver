# FOBOH — Pricing Profile

A full-stack reference implementation for a wholesale F&B "bespoke pricing" workflow: build customer-specific pricing profiles, preview new prices, save, and resolve `(customer, product) → finalPrice` against the rule set.

- **Backend:** Node 20 + Express 4 + TypeScript + Zod + swagger-ui-express, in-memory store.
- **Frontend:** Vite + React 18 + TypeScript + Redux Toolkit + RTK Query + React Router 6 + Tailwind 3.

## Setup

```
cd backend  && npm install && npm run dev   # :4000
cd frontend && npm install && npm run dev   # :5173
```

Swagger UI: <http://localhost:4000/api/docs>

Three example calls hitting the resolver (matches the §7 expected outputs):

```bash
# Profile C wins — bespoke custom price 95.00
curl 'http://localhost:4000/api/pricing/resolve?customerId=cus_bondi&productId=prd_koybrunv'

# Profile B wins — 409.32 - 15 = 394.32
curl 'http://localhost:4000/api/pricing/resolve?customerId=cus_bondi&productId=prd_lacbnat'

# Profile A wins — 279.06 * 0.9 = 251.15
curl 'http://localhost:4000/api/pricing/resolve?customerId=cus_bondi&productId=prd_hgvpin21'

# No match — base price 279.06 from BASE_PRICE
curl 'http://localhost:4000/api/pricing/resolve?customerId=cus_mercato&productId=prd_hgvpin21'
```

## Trade-offs

### 1. Precedence rule

> **"Specificity wins. When two profiles tie, the most recently updated profile wins."**
>
> A profile *matches* a `(customer, product)` pair when **all three** are true:
> 1. The profile is `ACTIVE`.
> 2. Its `customerScope` covers the customer: `CUSTOMER` matching by ID, `GROUP` where the customer belongs to that group, or `ALL`.
> 3. Its `productScope` covers the product: `PRODUCT_LIST` containing the ID, `RULE` whose every supplied filter equals the product's matching attribute, or `ALL`. Soft-deleted products never match.
>
> Each matching profile gets a **specificity tuple** `(customerScore, productScore)`:
>
> | Customer scope         | customerScore |
> |------------------------|---------------|
> | `CUSTOMER` (specific)  | 3             |
> | `GROUP`                | 2             |
> | `ALL`                  | 1             |
>
> | Product scope         | productScore |
> |-----------------------|--------------|
> | `PRODUCT_LIST`        | 3            |
> | `RULE`                | 2            |
> | `ALL`                 | 1            |
>
> **Sort matched profiles by, in order:**
> 1. `customerScore` DESC
> 2. `productScore` DESC
> 3. `updatedAt` DESC (latest negotiation wins)
> 4. `id` ASC (deterministic final tie-break — should never be reached in practice)
>
> The first profile after sorting is the **winner**. If no profile matches, return `basePrice` with `source = "BASE_PRICE"`.

**Why customer-specificity beats product-specificity:**

> *In F&B wholesale the per-customer price book is the supplier's primary commercial instrument. A deal struck with a specific customer — even a category-wide one — is a stronger expression of intent than a product-wide rule that happens to hit them. Tying customer-first reflects how a sales rep would defend the price to that customer: "we agreed this with you," not "this is our list price for that product."*

### 2. `All Products` semantics

Two shapes exist: `PRODUCT_LIST` is a **snapshot** built by the UI's "select all" — frozen at save time. `RULE { type: 'ALL' }` is **dynamic** and resolves against the live product set, so newly-added products are auto-covered. The wizard only produces snapshots (predictable, auditable). The API accepts both because contract-level "everything we sell at 5% off" is a real commercial pattern that shouldn't need a re-save every time a new SKU lands.

### 3. Deleted products

Soft delete via `isDeleted: true`. Resolver and search exclude them. `GET /api/products/:id` on a deleted product returns 410 Gone. Existing profiles that reference a deleted product in `PRODUCT_LIST` are left untouched — the deleted id is silently skipped at resolve time. Rewriting historical profiles to remove dead refs would lose intent (e.g. the SKU was reinstated next week).

### 4. Rounding

Half-up to 2dp via `Math.round((n + Number.EPSILON) * 100) / 100`. Banker's rounding (round-half-to-even) is statistically nicer over millions of operations but retail intuition expects `$0.125 → $0.13`, and a sales rep arguing over a 1-cent rounding direction with a customer is a worse outcome than micro-bias.

### 5. Negative prices

Clamped to `$0.00` with an explanation flag (`clamped to zero`), not rejected at save time. Saving a 200% decrease against a $50 item is a legal commercial intent — what the customer actually pays is $0 — and rejecting it pushes that conversation into the wizard for no benefit.

### 6. In-memory store

Resets on restart, single-process, no concurrency model. With a DB this becomes: a `products` table (soft-delete column, audit timestamps); a `pricing_profiles` table with the scope/override as `jsonb` for shape flexibility; an index on `(status, updatedAt)` so the resolver can scan only active profiles; and an `idempotency_key` on writes plus a `version` column for optimistic concurrency on edits.

### 7. Tie-breaks

`updatedAt` DESC wins ties over "best price for customer" because the latter is an interpretation, while latest-wins is a mechanism a salesperson can explain: "the most recently negotiated deal supersedes the previous one." Picking best-for-customer would mean a sales rep could be surprised by a half-forgotten old promotion. `id` ASC is the deterministic final fallback — never expected to fire.

## What I'd do next

- **Effective-dating** profiles (`activeFrom` / `activeTo`) so seasonal contracts auto-expire without a manual deactivation step.
- **Audit log** of every resolved price, keyed by `(customerId, productId, profileId, resolvedAt, finalPrice)` — closes the "why did the customer get charged $X last Tuesday" question.
- **Contract-level profile bundles** — a customer signs a contract that groups N profiles; status flips together; one audit trail.

## AI usage

> _Candidate to fill in: transcripts of AI sessions are included under `/transcripts/`. Note what was accepted as-is, what was edited or rejected, and where the judgement calls were yours — particularly around the precedence rule, the deleted-product behaviour, and the snapshot-vs-dynamic split for "All Products"._
