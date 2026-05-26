# API contracts — what the iOS app talks to

Two backends:
1. **Supabase** (project `pwvtjuklkfelpxzxjmsi`) — direct SDK access, RLS-enforced.

   for anything that needs server-side AI keys, PDF rendering, or webhook secrets.

The iOS app authenticates with Supabase; for landing/ calls it sends the
Supabase JWT as `Authorization: Bearer <access_token>` (see
[bearer-auth.md](bearer-auth.md) for the small server change).

---

## Direct Supabase reads (iOS uses `supabase-swift`)

### profiles
```
SELECT * FROM profiles WHERE user_id = auth.uid()
```
Columns: `user_id`, `account_type` (`'freelancer' | 'agency' | 'founder' | 'creator'`),
`country_code`, `business_name`, `onboarded_at`, `created_at`, `updated_at`.

### contracts (list)
```
SELECT id, title, kind, industry, verdict_severity, created_at
FROM contracts
WHERE owner_id = auth.uid()
ORDER BY created_at DESC
LIMIT 50
```

### contracts (single + scan)
```
SELECT c.*, s.taxonomy, s.verdict_md, s.redlines
FROM contracts c
LEFT JOIN scans s ON s.contract_id = c.id
WHERE c.id = $1 AND c.owner_id = auth.uid()
```

### usage_events (this month)
```
SELECT kind, count(*)
FROM usage_events
WHERE user_id = auth.uid()
  AND created_at >= date_trunc('month', now() AT TIME ZONE 'UTC')
GROUP BY kind
```

### subscriptions + credits (quota)
```
SELECT plan, status, current_period_end FROM subscriptions WHERE user_id = auth.uid()
SELECT contracts_remaining, expires_at, source FROM credits
  WHERE user_id = auth.uid() AND expires_at > now()
```

RLS on every table is `auth.uid() = user_id` (or `owner_id`). No service-role
needed from iOS.

---

## landing/ Next.js endpoints (call with Bearer JWT)

### POST `/api/scan`

Scan a contract → verdict.

**Request — file**
```
Content-Type: multipart/form-data
Authorization: Bearer <supabase_access_token>

file: <PDF/DOCX/text, ≤10 MB>
```

**Request — pasted text**
```
Content-Type: application/json
Authorization: Bearer <supabase_access_token>

{ "text": "<≤250,000 chars>" }
```

**Response 200**
```json
{ "contract_id": "uuid", "severity": "green|yellow|orange|red" }
```

iOS then fetches the contract row + scan row from Supabase directly to render
the verdict. Polling not needed — the API call is synchronous (~10–30s; runtime
`maxDuration: 60`).

**Errors**
- `401` — missing/invalid Bearer token
- `402` `{ "error": "quota_exceeded", "paywall_url": "/settings/billing" }` —
  show paywall sheet, route to StoreKit purchase
- `413` — file too large
- `415` — unsupported file type
- `502` `{ "error": "ai_review_failed" }` — Claude/OpenAI failed; rollback already happened on server, safe to retry

### POST `/api/contracts/draft`

Draft a new contract from a brief.

**Request**
```
Content-Type: application/json
Authorization: Bearer <supabase_access_token>

{
  "industry": "freelance" | "software" | "design" | "nda",
  "kind": "service" | "nda" | "msa" | "...",   // optional
  "brief": "<plain-English description, ≤4000 chars>",
  "locale": "en" | "de"                          // optional, default 'en'
}
```

**Response 200**
```json
{ "contract_id": "uuid" }
```

iOS fetches the contract + latest `contract_versions` row from Supabase.

Errors mirror `/api/scan`.

### GET `/api/contracts/[id]/pdf`

Render verdict (or current draft) as PDF.

```
Authorization: Bearer <supabase_access_token>
Accept: application/pdf
```

Response: binary PDF stream. iOS saves to a temp file and opens with `UIDocumentInteractionController` or shares via `ShareLink`.

### POST `/api/billing/apple/webhook`

Submit a StoreKit 2 signed transaction (JWS) for server-side verification.
Server validates with Apple's public key, then writes to `credits` (for
consumable PAYG) or `subscriptions` (for Standard).

**Request**
```
Content-Type: application/json
Authorization: Bearer <supabase_access_token>

{
  "transaction_jws": "<signedTransaction JWS string>",
  "product_id": "gf.payg.credit.1" | "gf.standard.monthly",
  "environment": "Sandbox" | "Production"
}
```

**Response 200**
```json
{ "ok": true, "contracts_remaining": 11, "plan": "standard" }
```

This endpoint is **new** — not yet built. See [`ios/billing-iap.md`](../ios/billing-iap.md)
for the full design.

### POST `/api/billing/apple/notifications`

App Store Server Notifications V2 webhook. Apple posts here; not called by iOS.

---

## Error envelope convention

All landing/ JSON errors:
```json
{ "error": "<machine_code>", "message": "<human-readable, optional>" }
```

Treat 5xx as retriable. Treat 4xx as fatal except 401 (refresh session, retry once)
and 402 (paywall path).

---

## Source of truth

- Plan + quota definitions: `landing/lib/billing/plans.ts`, `landing/lib/billing/quota.ts`
- Schema: `landing/supabase/migrations/*.sql`
- Severity labels: `landing/lib/contracts/severity.ts` (canonical labels in
  [`design/tokens.md`](../design/tokens.md))
