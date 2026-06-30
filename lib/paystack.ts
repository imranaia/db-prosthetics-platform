/**
 * Paystack helpers.
 * All amounts sent to Paystack are in KOBO.
 */

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

export interface InitializePaymentParams {
  email: string;
  amountKobo: number;  // total including ₦1,000 service fee
  reference: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

/** Initialize a Paystack transaction and get the checkout URL. */
export async function initializePayment(
  params: InitializePaymentParams
): Promise<PaystackInitResponse> {
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      metadata: params.metadata,
    }),
  });

  if (!res.ok) {
    throw new Error(`Paystack initialization failed: ${res.statusText}`);
  }

  return res.json();
}

/** Verify a Paystack transaction by its reference. */
export async function verifyPayment(reference: string): Promise<{
  status: boolean;
  paid: boolean;
  amountKobo: number;
  reference: string;
}> {
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Paystack verification failed: ${res.statusText}`);
  }

  const json = await res.json();
  return {
    status: json.status,
    paid: json.data?.status === 'success',
    amountKobo: json.data?.amount ?? 0,
    reference: json.data?.reference ?? reference,
  };
}

/** Generate a unique transaction reference. */
export function generateReference(prefix = 'DBP'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
