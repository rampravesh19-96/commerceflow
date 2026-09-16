import { api } from '../../lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let p: any;
  try {
    p = (await api<any[]>('/products')).find((x) => x.id === id);
  } catch {}
  if (!p) return notFound();
  const v = p.variants[0];
  return (
    <main className="shell" style={{ paddingTop: 40 }}>
      <div className="hero">
        <img
          style={{ width: '100%', borderRadius: 12, aspectRatio: '1', objectFit: 'cover' }}
          src={p.imageUrl}
          alt=""
        />
        <div>
          <div className="eyebrow">{p.category}</div>
          <h1>{p.name}</h1>
          <p>{p.description}</p>
          <h2>${v.price}</h2>
          <p className="muted">
            {v.inventory.quantity} available · SKU {v.sku}
          </p>
          <Link
            className="button"
            href={`/cart?variant=${v.id}&name=${encodeURIComponent(p.name)}&price=${v.price}`}
          >
            Add to cart
          </Link>
        </div>
      </div>
    </main>
  );
}
