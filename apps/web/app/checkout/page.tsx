'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API } from '../lib/api';
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="shell">
          <p>Loading checkout…</p>
        </main>
      }
    >
      <CheckoutForm />
    </Suspense>
  );
}
function CheckoutForm() {
  const query = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const coupon = (event.currentTarget.elements.namedItem('coupon') as HTMLInputElement).value;
      const response = await fetch(`${API}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ variantId: query.get('variant'), quantity: 1 }],
          couponCode: coupon,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Checkout failed');
      const order = await response.json();
      router.push(`/confirmation?number=${order.number}`);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="shell" style={{ paddingTop: 40, maxWidth: 720 }}>
      <div className="eyebrow">SECURE DEMO CHECKOUT</div>
      <h1>Almost there.</h1>
      <form className="panel" onSubmit={submit}>
        <p>
          <b>{query.get('name')}</b>
          <span style={{ float: 'right' }}>${query.get('price')}</span>
        </p>
        <hr />
        <label>
          Email
          <br />
          <input
            required
            defaultValue="customer1@commerceflow.demo"
            style={{ width: '100%', padding: 10, margin: '6px 0 14px' }}
          />
        </label>
        <label>
          Shipping address
          <br />
          <input
            required
            placeholder="123 Market Street"
            style={{ width: '100%', padding: 10, margin: '6px 0 14px' }}
          />
        </label>
        <label>
          Coupon code
          <br />
          <input
            name="coupon"
            placeholder="WELCOME10"
            style={{ width: '100%', padding: 10, margin: '6px 0 18px' }}
          />
        </label>
        {error && <p style={{ color: '#a33' }}>{error}</p>}
        <button className="button" disabled={loading}>
          {loading ? 'Processing…' : 'Pay with Demo Payment'}
        </button>
        <p className="muted">
          No real payment data is collected. Server-side totals, inventory and idempotency are enforced.
        </p>
      </form>
    </main>
  );
}
