import Link from 'next/link';
import { api } from './lib/api';
type Product = {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  variants: { price: string }[];
};
export default async function Home() {
  let products: Product[] = [];
  try {
    products = await api<Product[]>('/products');
  } catch {}
  return (
    <main className="shell">
      <section className="hero">
        <div>
          <div className="eyebrow">DEMO COMMERCE OPERATIONS</div>
          <h1>Commerce that runs with clarity.</h1>
          <p>
            A polished demo storefront paired with the operational tooling teams need to fulfill every order
            with confidence.
          </p>
          <Link className="button" href="/catalog">
            Explore the collection
          </Link>
        </div>
        <div className="hero-card">
          <span>
            12 considered products
            <br />
            <b>Inventory-aware checkout</b>
          </span>
        </div>
      </section>
      <div className="section-title">
        <div>
          <div className="eyebrow">THE COLLECTION</div>
          <h2>Made for the everyday system</h2>
        </div>
        <Link href="/catalog">View all →</Link>
      </div>
      <section className="grid">
        {products.slice(0, 4).map((product) => (
          <Link className="card" key={product.id} href={`/catalog/${product.id}`}>
            <img src={product.imageUrl} alt="" />
            <div className="card-content">
              <div className="muted">{product.category}</div>
              <b>{product.name}</b>
              <div className="price">${product.variants[0]?.price}</div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
