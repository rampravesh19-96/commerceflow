'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
export default function Cart() {
  return (
    <Suspense
      fallback={
        <main className="shell">
          <p>Loading cart…</p>
        </main>
      }
    >
      <CartContent />
    </Suspense>
  );
}
function CartContent() {
  const q = useSearchParams(),
    variant = q.get('variant'),
    name = q.get('name'),
    price = q.get('price');
  return (
    <main className="shell" style={{ paddingTop: 40, maxWidth: 760 }}>
      <div className="eyebrow">YOUR CART</div>
      <h1>A considered selection.</h1>
      {variant ? (
        <section className="panel">
          <h3>{name}</h3>
          <p className="muted">Standard · Quantity 1</p>
          <h2>${price}</h2>
          <Link className="button" href={`/checkout?variant=${variant}&name=${name}&price=${price}`}>
            Continue to checkout
          </Link>
        </section>
      ) : (
        <section className="panel">
          <p>Your cart is ready for something useful.</p>
          <Link className="button" href="/catalog">
            Browse catalog
          </Link>
        </section>
      )}
    </main>
  );
}
