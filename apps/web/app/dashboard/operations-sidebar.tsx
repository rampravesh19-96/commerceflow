'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const navigation = [
  { href: '/dashboard', label: 'Overview', exact: true },
  { href: '/dashboard/orders', label: 'Orders' },
];
export function OperationsSidebar() {
  const pathname = usePathname();
  return (
    <aside className="side">
      {navigation.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link className={active ? 'active' : undefined} href={href} key={href}>
            {label}
          </Link>
        );
      })}
    </aside>
  );
}
