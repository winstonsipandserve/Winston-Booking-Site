---
name: paymongo-integration
description: PayMongo Payment Intent flow, webhook verification, and key handling for this booking platform. Use when building, modifying, or debugging any payment-related code — checkout flow, payment intent creation, webhook handlers, or refunds.
---

# PayMongo Integration

## Core flow
1. Backend creates a Payment Intent (secret key) representing the booking amount in centavos.
2. Frontend collects payment details and creates a Payment Method using the public key — never send card data to our backend.
3. Frontend attaches the Payment Method to the Payment Intent using the client_key.
4. Extra steps depending on method: 3DS redirect for cards, e-wallet app/site redirect, QR Ph code display.
5. PayMongo sends `payment.paid` or `payment.failed` via webhook — this is the source of truth, never the client-side redirect completing.

## Key rules
- Amounts are always in the smallest currency unit (centavos) — PHP 100.00 = 10000.
- Secret key (`sk_`) is server-side only. Public key (`pk_`) is safe client-side, used only to create the Payment Method.
- Use test keys (`sk_test_` / `pk_test_`) until the client's business verification is approved. Switch to live keys via environment variable — never hardcode either key.
- Never mark a booking paid based on `return_url` completing — a customer can close the browser before returning. Only the webhook confirms payment.
- Set the Payment Intent's `description` field to our internal booking ID, for reconciliation in the PayMongo dashboard.

## Webhook handling
- Verify the `Paymongo-Signature` header via HMAC-SHA256 against the webhook secret, using a timing-safe comparison, before parsing the body.
- Disable JSON body-parsing middleware on the webhook route until after signature verification — the raw body is required for the check.
- PayMongo retries failed deliveries up to 12 times; after 3 consecutive events exhaust all retries, the webhook auto-disables and needs manual re-enabling from the dashboard.
- PayMongo does NOT resend missed events. Implement a reconciliation fallback: if our endpoint was down, poll the Payment Intent by ID to check status.

## Booking state machine tie-in
- Booking created → `pending_payment` (slot held, not yet confirmed)
- Webhook `payment.paid` → booking → `confirmed`
- Webhook `payment.failed`, or hold expires → booking → `cancelled`, slot released
- Never flip a booking to `confirmed` from any code path except the verified webhook handler.

## Fee reference (for any UI showing totals or admin payment views)
- Cards: ~3.5% + ₱15 domestic, ~4% + ₱13 + 1% cross-border international
- GCash: ~2.5% · Maya: ~2% · GrabPay: ~2.2% · QR Ph: ~1.5%
- Bank transfer: 0.8% or ₱15, whichever is higher

## Before implementing
Check whether the change touches Payment Intent creation, the webhook handler, or a booking state transition. If yes, apply the rules above, and flag anything that seems to require deviating from them before writing code.