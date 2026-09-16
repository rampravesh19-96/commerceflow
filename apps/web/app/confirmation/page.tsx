'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
export default function Confirmation() {
  return (
    <Suspense
      fallback={
        <main className="shell">
          <p>Loading confirmation…</p>
        </main>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
function ConfirmationContent() {
  const q = useSearchParams();
  return (
    <main className="shell" style={{ paddingTop: 70, maxWidth: 720 }}>
      <div className="panel">
        <div className="eyebrow">ORDER CONFIRMED</div>
        <h1>It’s on its way.</h1>
        <p>Your demo payment was approved and fulfillment has been queued.</p>
        <h2>{q.get('number')}</h2>
        <Link className="button" href="/dashboard/orders">
          View operations orders
        </Link>
      </div>
    </main>
  );
}
