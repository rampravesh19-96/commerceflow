import { api } from '../../lib/api';
import { OperationsSidebar } from '../operations-sidebar';
export default async function Orders() {
  let orders: any[] = [];
  try {
    orders = await api('/orders');
  } catch {}
  return (
    <div className="shell dash">
      <OperationsSidebar />
      <main className="main">
        <div className="eyebrow">OPERATIONS / ORDERS</div>
        <h1>Order management</h1>
        <section className="panel">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.number}</td>
                  <td>{o.customer.name}</td>
                  <td>{o.items.length}</td>
                  <td>{o.payment.status}</td>
                  <td>
                    <span className="badge">{o.status}</span>
                  </td>
                  <td>${o.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
