import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CommerceService } from './commerce.service';

const money = (value: number) => new Prisma.Decimal(value);
function fixture(quantity = 10) {
  const tx: any = {
    productVariant: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'variant-1',
        sku: 'SKU-1',
        price: money(19.99),
        product: { name: 'Desk Lamp' },
        inventory: { quantity },
      }),
    },
    coupon: { findUnique: jest.fn() },
    order: { create: jest.fn().mockImplementation(({ data }) => ({ id: 'order-1', ...data })) },
    inventory: { update: jest.fn() },
  };
  const db: any = {
    order: { findUnique: jest.fn().mockResolvedValue(null) },
    $transaction: jest.fn((callback) => callback(tx)),
  };
  const redis: any = { del: jest.fn(), getJson: jest.fn(), setJson: jest.fn() };
  return { service: new CommerceService(db, redis), db, tx, redis };
}
describe('CommerceService.checkout', () => {
  it.each([1, 3])(
    'creates an order for quantity %i with server-calculated monetary totals',
    async (quantity) => {
      const { service, tx } = fixture();
      await service.checkout('customer-1', {
        items: [{ variantId: 'variant-1', quantity }],
        idempotencyKey: `key-${quantity}`,
      });
      const data = tx.order.create.mock.calls[0][0].data;
      expect(data.customer).toEqual({ connect: { id: 'customer-1' } });
      expect(data.items.create[0].quantity).toBe(quantity);
      expect(data.subtotal.toString()).toBe((19.99 * quantity).toFixed(2));
      expect(data.total.toString()).toBe((19.99 * quantity).toFixed(2));
      expect(data.payment.create.amount.toString()).toBe((19.99 * quantity).toFixed(2));
    },
  );
  it('calculates a percentage discount in cents', async () => {
    const { service, tx } = fixture();
    tx.coupon.findUnique.mockResolvedValue({
      id: 'coupon-1',
      active: true,
      type: 'PERCENT',
      amount: money(10),
      minimum: null,
      usageLimit: null,
      usedCount: 0,
    });
    tx.coupon.update = jest.fn();
    await service.checkout('customer-1', {
      items: [{ variantId: 'variant-1', quantity: 2 }],
      couponCode: 'WELCOME10',
      idempotencyKey: 'discount-key',
    });
    const data = tx.order.create.mock.calls[0][0].data;
    expect(data.subtotal.toString()).toBe('39.98');
    expect(data.discount.toString()).toBe('3.99');
    expect(data.total.toString()).toBe('35.99');
  });
  it.each([undefined, 0, 1.5])(
    'rejects invalid or missing quantity %p before a transaction',
    async (quantity) => {
      const { service, db } = fixture();
      await expect(
        service.checkout('customer-1', {
          items: [{ variantId: 'variant-1', quantity } as any],
          idempotencyKey: 'invalid',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(db.$transaction).not.toHaveBeenCalled();
    },
  );
  it('rejects insufficient inventory', async () => {
    const { service } = fixture(1);
    await expect(
      service.checkout('customer-1', {
        items: [{ variantId: 'variant-1', quantity: 2 }],
        idempotencyKey: 'stock-key',
      }),
    ).rejects.toThrow('out of stock');
  });
  it('returns the existing order for a duplicate idempotency key', async () => {
    const { service, db } = fixture();
    db.order.findUnique.mockResolvedValue({ id: 'existing-order' });
    await expect(
      service.checkout('customer-1', {
        items: [{ variantId: 'variant-1', quantity: 1 }],
        idempotencyKey: 'duplicate',
      }),
    ).resolves.toEqual({ id: 'existing-order' });
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
