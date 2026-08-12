import crypto from 'crypto'

const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1'

interface PaymongoLineItem {
  name: string
  amount: number
  currency: 'PHP'
  quantity: number
  description?: string
}

interface PaymongoBilling {
  name: string
  email: string
  phone: string
}

interface CreateCheckoutSessionInput {
  lineItems: PaymongoLineItem[]
  successUrl: string
  cancelUrl: string
  referenceNumber: string
  metadata: Record<string, string>
  billing: PaymongoBilling
  description: string
  sendEmailReceipt: boolean
}

interface CreateCheckoutSessionResult {
  id: string
  checkoutUrl: string
}

function paymongoAuthHeader(): string {
  const secretKey = process.env.PAYMONGO_SECRET_KEY ?? ''
  const encoded = Buffer.from(`${secretKey}:`).toString('base64')
  return `Basic ${encoded}`
}

export async function createPaymongoCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<CreateCheckoutSessionResult> {
  const res = await fetch(`${PAYMONGO_API_BASE}/checkout_sessions`, {
    method: 'POST',
    headers: {
      Authorization: paymongoAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: input.lineItems.map((item) => ({
            name: item.name,
            amount: item.amount,
            currency: item.currency,
            quantity: item.quantity,
            ...(item.description ? { description: item.description } : {}),
          })),
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          reference_number: input.referenceNumber,
          metadata: input.metadata,
          billing: {
            name: input.billing.name,
            email: input.billing.email,
            phone: input.billing.phone,
          },
          description: input.description,
          send_email_receipt: input.sendEmailReceipt,
          // PayMongo's Checkout Sessions API rejects requests with this field omitted
          // (confirmed live, contrary to docs implying it defaults to the account's
          // enabled methods). All four of card/gcash/grab_pay/paymaya are confirmed
          // live-working for Arjay's personal test account (see CLAUDE.md's Open /
          // Not Yet Decided) — not necessarily final once the client's own PayMongo
          // account exists.
          payment_method_types: ['card', 'gcash', 'grab_pay', 'paymaya'],
        },
      },
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    console.error('PayMongo createCheckoutSession failed', res.status, errorBody)
    throw new Error('PayMongo checkout session creation failed')
  }

  const json = await res.json()
  return {
    id: json.data.id,
    checkoutUrl: json.data.attributes.checkout_url,
  }
}

export async function retrievePaymongoCheckoutSession(
  checkoutSessionId: string,
): Promise<CreateCheckoutSessionResult> {
  const res = await fetch(`${PAYMONGO_API_BASE}/checkout_sessions/${checkoutSessionId}`, {
    method: 'GET',
    headers: {
      Authorization: paymongoAuthHeader(),
    },
  })

  if (!res.ok) {
    const errorBody = await res.text()
    console.error('PayMongo retrieveCheckoutSession failed', checkoutSessionId, res.status, errorBody)
    throw new Error('PayMongo checkout session retrieval failed')
  }

  const json = await res.json()
  return {
    id: json.data.id,
    checkoutUrl: json.data.attributes.checkout_url,
  }
}

export async function expirePaymongoCheckoutSession(checkoutSessionId: string): Promise<void> {
  try {
    const res = await fetch(
      `${PAYMONGO_API_BASE}/checkout_sessions/${checkoutSessionId}/expire`,
      {
        method: 'POST',
        headers: {
          Authorization: paymongoAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    )
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('PayMongo expireCheckoutSession failed', checkoutSessionId, res.status, errorBody)
    }
  } catch (err) {
    console.error('PayMongo expireCheckoutSession threw', checkoutSessionId, err)
  }
}

export function verifyPaymongoWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader) return false

  const parts: Record<string, string> = {}
  for (const segment of signatureHeader.split(',')) {
    const [key, value] = segment.split('=')
    if (key && value) parts[key.trim()] = value.trim()
  }

  const { t, te } = parts
  if (!t || !te) return false

  const signedString = `${t}.${rawBody}`
  const expected = crypto.createHmac('sha256', secret).update(signedString).digest('hex')

  const expectedBuffer = Buffer.from(expected, 'hex')
  const actualBuffer = Buffer.from(te, 'hex')
  if (expectedBuffer.length !== actualBuffer.length) return false

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer)
}
