# Paystack → Order Fulfilment Fix — Session Handoff

**Date:** 25 July 2026
**Branch:** `main` (⚠️ **all changes are uncommitted working-tree edits**)
**Status:** Code complete, verified end-to-end in Paystack **test** mode. Live-mode configuration and cleanup outstanding.

---

## 1. The original problem

The client reported two symptoms:

1. Customers paid and received the **Paystack receipt**, but **no Sartorial order confirmation email**.
2. Some payments produced **no order in Sanity at all**.

### Root cause

Order creation *and* the confirmation email lived **only in the browser callback**:

```
react-paystack onSuccess (customer's tab)
  → POST /api/orders/create
    → Sanity write + Resend email
```

Paystack charges the card and sends its own receipt regardless of whether that callback ever runs. It frequently doesn't:

- Customer closes the tab the moment Paystack shows "Successful"
- **Bank transfer / USSD / pay-with-transfer** — payment completes entirely outside the browser session, `onSuccess` never fires
- 3DS/OTP redirects that don't return cleanly
- Flaky mobile data kills the `fetch`

### Why the webhook wasn't a safety net

The webhook existed but could not rescue anything:

1. **It never sent an email.** Resend was only wired into `/api/orders/create`. Any order the webhook rescued was silently emailless — this alone explains symptom #1.
2. **It depended on `metadata.formData` + `metadata.items`.** The entire formik object plus full cart was stuffed into Paystack metadata. When trimmed or dropped, the handler returned **400 with no order created** — symptom #2.
3. **It wrote a degraded order**: no `paymentMethod`, `subtotal`, `shippingCost`, `vat`, `amountDiscount`, `orderNote`, `deliveryType`/`gigPark`, no product name/price/image snapshots, no stock deduction, no coupon redemption.
4. **Both paths raced.** Each did check-then-`create()` with a random `_id`, so a webhook + browser arriving together could produce duplicate orders.

### Secondary issues found

- `/api/orders/create` accepted **any reference string from anyone** and wrote a `paid` order from it. (Guest checkout is intentional and unchanged — the fix is server-side verification, not login.)
- Paystack reference was `${Date.now()}` — two customers paying in the same millisecond collided.

---

## 2. The fix — architecture

**One idempotent `fulfillOrder()` called from three independent paths.** Whichever arrives first wins; the rest no-op.

```
                    ┌─────────────────────────┐
  browser ────────► │  /api/orders/create     │ ──┐
                    └─────────────────────────┘   │
                    ┌─────────────────────────┐   │   ┌──────────────────┐
  Paystack ───────► │  /api/paystack/webhook  │ ──┼──►│  fulfillOrder()  │
                    └─────────────────────────┘   │   └──────────────────┘
                    ┌─────────────────────────┐   │     · create order
  success page ───► │  /api/paystack/verify   │ ──┘     · deduct stock
                    └─────────────────────────┘         · redeem coupon
                                                        · send Resend email
```

### How idempotency actually works

- **Deterministic document ID.** `orderDocIdForReference(ref)` → `order-<sanitised-reference>`. All three paths compute the same ID, so `adminClient.create()` returns **409** for everyone but the first caller. This is a real mutex, not a check-then-write race.
- **Separate email claim.** `confirmationEmailSentAt` is claimed via an optimistic-lock patch (`.ifRevisionId(rev)`). A path that created the order but died before emailing gets picked up by the next path — and nobody receives two emails.
- **Legacy lookup.** Orders written before this change have random `_id`s, so a reference query still runs first to avoid duplicating them.

### Metadata redesign

Paystack metadata went from "entire formik object + full cart" to a compact `metadata.order` payload (`PaystackOrderMetadata` in `src/lib/paystack.ts`). **Both shapes are parsed** — `orderInputFromPaystackTransaction()` handles the legacy `formData`/`items` shape too, so transactions started before a deploy still fulfil.

The webhook also **re-fetches the transaction from Paystack** if the incoming event has no usable metadata.

---

## 3. Files

### Created

| File | Purpose |
|---|---|
| `src/lib/orders/types.ts` | `OrderInput`, `OrderLineInput`, `FulfillResult` — the normalised shape all paths funnel into |
| `src/lib/orders/fulfillOrder.ts` | **The core.** Idempotent create + stock + coupon + email |
| `src/lib/orders/orderEmail.ts` | Confirmation email template, extracted from the route so every path can send it |
| `src/lib/orders/paystackTransaction.ts` | `verifyPaystackTransaction()` + `orderInputFromPaystackTransaction()` (new & legacy metadata shapes) |
| `scripts/replay-paystack-webhook.mjs` | Local signed-webhook replay tool (see §5) |

### Modified

| File | Change |
|---|---|
| `src/app/api/orders/create/route.ts` | Thin wrapper → `fulfillOrder`. Verifies reference with Paystack server-side. Deleted ~290 lines of commented-out dead code |
| `src/app/api/paystack/webhook/route.ts` | Rewritten to use `fulfillOrder` — now sends email, writes full orders, re-verifies when metadata is missing |
| `src/app/api/paystack/verify/route.ts` | Rewritten: confirms with Paystack API, then fulfils from metadata. Recovery path |
| `src/app/(store)/checkout/CheckoutClient.tsx` | Shared `buildOrderLines()`, stable per-attempt reference, `confirmOrder()` fallback chain, never shows "contact support" after successful payment |
| `src/app/(store)/success/page.tsx` | Self-heals — calls `/api/paystack/verify` if it lands without an order number |
| `src/lib/paystack.ts` | Compact metadata type, `generatePaystackReference()` (timestamp + random) |
| `src/sanity/schemaTypes/order.ts` | Added `confirmationEmailSentAt` (readOnly) |
| `package.json` | Added `webhook:replay` script |

---

## 4. Verification evidence

All verified in Paystack **test** mode against real infrastructure.

### Signed replay (`npm run webhook:replay`)

```
← 200 {"message":"Order created successfully","orderNumber":"ORD-1784973926101-PODT7"}
← 200 {"message":"Order already processed","orderNumber":"ORD-1784973926101-PODT7"}
✓ Idempotent: the replay did not create a second order.
```

Proved: HMAC-SHA512 signature verification, order creation, stock deduction, email send, idempotency on retry.

### Real test payment through the tunnel — **the webhook won the race**

```
POST /api/paystack/webhook 200 in 3.8s
 │ mutate 200  ← created the order
 │ mutate 200  ← deducted stock
POST /api/orders/create 200 in 4.0s
 │ mutate 409  ← create rejected, order already existed
 │ query orderNumber  ← adopted the webhook's order number
```

**Exactly one order created, exactly one `api.resend.com` call** across both concurrent paths.

This is the direct proof for the tab-close question: the webhook did the entire job from Paystack's servers before the browser call finished. **If the customer closes the tab, nothing is lost** — they miss only the on-screen success page.

### Confirmed working

| Layer | Status |
|---|---|
| Webhook signature verification | ✅ |
| Order creation / stock / coupon / email | ✅ |
| Idempotency under real concurrency | ✅ |
| Compact metadata survives Paystack round trip | ✅ (`compact order present`) |
| Publicly reachable webhook route | ✅ via tunnel |
| Paystack → handler delivery | ✅ real test payment |
| Resend domain verification | ✅ mail actually landed |

---

## 5. Local testing setup

`.env.local` currently holds **test** keys for `Sartorial limited (1577812)` — `sk_test_62e58e…` / `pk_test_b8eced…`.
⚠️ The partial secret key was exposed in a screenshot; rotate via "Generate new secret key" if desired.

### Method 1 — signed replay, no tunnel (fastest loop)

```bash
npm run webhook:replay -- --email you@example.com
```

Flags: `--product <sanityId>` `--reference <ref>` `--amount <naira>` `--thin` (tests the re-verify path) `--url <url>`.
Auto-picks a product from Sanity if `--product` is omitted. Orders carry note `"Replayed webhook — local test"` and a `local-` reference prefix for easy cleanup.

### Method 2 — verify path, no inbound connectivity needed

`/api/paystack/verify` **calls Paystack** rather than waiting to be called, so it works on plain localhost:

```bash
curl -X POST http://localhost:3000/api/paystack/verify -H "Content-Type: application/json" -d '{"reference":"<test-reference>"}'
```

### Method 3 — full end-to-end with a tunnel

Paystack rejects `localhost` (must be public HTTPS). Paystack keeps **separate webhook URLs for Test and Live mode** — set the *Test* one to a tunnel, leave Live pointing at `sartorial.ng`.

```bash
npx cloudflared tunnel --url http://localhost:3000
```

Then Settings → API Keys & Webhooks (Test mode) → Test Webhook URL:
`https://<random>.trycloudflare.com/api/paystack/webhook`

> The tunnel used in this session (`member-fundamentals-recorder-thank.trycloudflare.com`) was started in the assistant's background shell and **is now dead**. Start a fresh one; the URL changes each restart and must be re-pasted into Paystack.

### Useful checks

Validate key pair mode + validity:

```bash
node --env-file=.env.local -e 'const s=process.env.PAYSTACK_SECRET_KEY,p=process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;console.log("secret:",s.slice(0,8),"public:",p.slice(0,8));fetch("https://api.paystack.co/transaction?perPage=1",{headers:{Authorization:`Bearer ${s}`}}).then(r=>r.json()).then(b=>console.log(b.status?"✓ secret key valid":"✗ "+b.message))'
```

Check the **running** dev server picked up a new secret key (no order created — `charge.failed` passes the signature check then short-circuits):

```bash
node --env-file=.env.local -e 'const c=require("crypto");const b=JSON.stringify({event:"charge.failed",data:{reference:"sigcheck"}});const s=c.createHmac("sha512",process.env.PAYSTACK_SECRET_KEY).update(b).digest("hex");fetch("http://localhost:3000/api/paystack/webhook",{method:"POST",headers:{"Content-Type":"application/json","x-paystack-signature":s},body:b}).then(async r=>console.log(r.status,await r.text(),r.status===200?"✓ new key":"✗ restart dev server"))'
```

---

## 6. Decisions made (do not "fix" these)

- **Guest checkout is intentional.** Users buy without signing up. No auth was added. Server-side Paystack verification — not login — is what prevents forged references.
- **Test orders write to the `production` Sanity dataset by choice.** The script's hard block was downgraded to a warning at the user's explicit request; they clean up orders and stock manually afterwards.
- **`totalPrice` stores the goods total, not the charged amount.** When the customer bears the Paystack fee, the charge is grossed up (₦26,000 → ₦26,497.47 at 1.5% + ₦100). Overwriting `totalPrice` with the charged amount would break `subtotal + shipping + VAT = total`, put the processing fee in the order total, and make the stored figure depend on which path won the race. **Only underpayment is rejected** (402). If fee tracking is wanted, add a separate `amountPaid` field.
- **PayPal is disabled in the UI** ("Coming Soon"), so its path was left as-is — it still trusts the client-supplied reference. Verify server-side before re-enabling.

---

## 7. Outstanding work

### A. Cleanup — test data in the client's **production** dataset

| Order | Note |
|---|---|
| `ORD-1784973926101-PODT7` | replay test — product **The +234** stock `20 → 19` |
| `ORD-1784975230816-9KC38` | test payment |
| `ORD-1784977407689-W6SF5` | test payment — product `897d143d-b425-40a5-9d54-a1214dc236ff` |

Delete the order docs in Studio and restore the stock counts.

### B. Live-mode configuration — **highest priority**

Everything verified so far was test mode. Real customers depend on:

1. **Live webhook URL registered** at `https://sartorial.ng/api/paystack/webhook` (Live tab, not Test). *This is the single point of failure for the tab-close case — if it's wrong, a closed tab means a lost order with nothing to rescue it.*
2. **Production `PAYSTACK_SECRET_KEY` is the `sk_live_…` key**, matching the live public key. A test/live mismatch makes every webhook fail the signature check and 401 — indistinguishable from the webhook not existing.
3. **`sartorial.ng` verified as a sending domain in Resend.** (Test-mode mail landed, so this is likely fine, but confirm for the live key.)

### C. Not yet done

- **Nothing is committed.** All work is uncommitted working-tree edits on `main`.
- **Reconciliation script** — offered but not built. Would list successful Paystack transactions with no matching Sanity order, so already-affected customers can be recovered.
- **Optional:** `amountPaid` field for Paystack fee tracking.
- **Optional:** point local dev at a scratch dataset (`npx sanity dataset create staging` + `npx sanity dataset copy production staging`) so `npm run dev` stops writing to live data.

---

## 8. Quick verification after resuming

```bash
npx tsc --noEmit && npx next build
```

Both were clean at the end of this session.
