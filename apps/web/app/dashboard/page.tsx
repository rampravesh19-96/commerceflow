import { api } from '../lib/api';
import { OperationsSidebar } from './operations-sidebar';
export default async function Dashboard() {
  let d: any;
  try {
    d = await api('/dashboard');
  } catch {
    d = {
      revenue: 0,
      orderCount: 0,
      averageOrderValue: 0,
      recentOrders: [],
      lowStock: [],
      ordersByStatus: [],
    };
  }
  const money = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  return (
    <div className="shell dash">
      <OperationsSidebar />
      <main className="main">
        <div className="eyebrow">OPERATIONS / OVERVIEW</div>
        <h1>Good morning, operator.</h1>
        <div className="metrics">
          <div className="metric">
            <span className="muted">Revenue</span>
            <strong>{money(d.revenue)}</strong>
          </div>
          <div className="metric">
            <span className="muted">Orders</span>
            <strong>{d.orderCount}</strong>
          </div>
          <div className="metric">
            <span className="muted">Average order value</span>
            <strong>{money(d.averageOrderValue)}</strong>
          </div>
        </div>
        <div className="dashboard-grid">
          <section className="panel">
            <h3>Recent orders</h3>
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {d.recentOrders.map((o: any) => (
                  <tr key={o.id}>
                    <td>{o.number}</td>
                    <td>{o.customer.name}</td>
                    <td>
                      <span className="badge">{o.status}</span>
                    </td>
                    <td>{money(Number(o.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="panel">
            <h3>Low stock</h3>
            {d.lowStock.map((v: any) => (
              <p key={v.id}>
                <b>{v.product.name}</b>
                <br />
                <span className="muted">
                  {v.inventory.quantity} remaining · reorder at {v.inventory.reorderPoint}
                </span>
              </p>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
