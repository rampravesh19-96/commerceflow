import { api } from '../lib/api';
import Link from 'next/link';
type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  variants: { id: string; price: string; inventory: { quantity: number } }[];
};
export default async function Catalog() {
  let products: Product[] = [];
  try {
    products = await api('/products');
  } catch {}
  return (
    <main className="shell">
      <div className="section-title">
        <div>
          <div className="eyebrow">CATALOG</div>
          <h1>Useful objects, thoughtfully made.</h1>
        </div>
        <span className="muted">{products.length} products</span>
      </div>
      <div className="grid">
        {products.map((p) => (
          <Link className="card" key={p.id} href={`/catalog/${p.id}`}>
            <img src={p.imageUrl} alt="" />
            <div className="card-content">
              <div className="muted">{p.category}</div>
              <b>{p.name}</b>
              <div className="price">${p.variants[0]?.price}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
