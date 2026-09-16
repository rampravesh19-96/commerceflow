import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
export const metadata: Metadata = {
  title: 'CommerceFlow — Demo commerce operations',
  description: 'Portfolio commerce operations demo',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="shell nav">
          <Link className="brand" href="/">
            Commerce<i>Flow</i>
          </Link>
          <nav className="links">
            <Link href="/catalog">Catalog</Link>
            <Link href="/cart">Cart</Link>
            <Link href="/dashboard">Operations</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
