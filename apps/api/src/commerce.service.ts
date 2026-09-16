import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DiscountType, OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';
@Injectable()
export class CommerceService {
  constructor(
    private db: PrismaService,
    private redis: RedisService,
  ) {}
  async catalog(q?: string, category?: string) {
    return this.db.product.findMany({
      where: {
        active: true,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(category ? { category } : {}),
      },
      include: { variants: { include: { inventory: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  async dashboard() {
    const cacheKey = 'dashboard:analytics:v1';
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;
    const [orders, low, recent] = await Promise.all([
      this.db.order.findMany({ include: { items: true, payment: true } }),
      this.db.productVariant.findMany({
        where: { inventory: { quantity: { lte: 10 } } },
        include: { product: true, inventory: true },
      }),
      this.db.order.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, items: true },
      }),
    ]);
    const paid = orders.filter((o) => !['CANCELLED'].includes(o.status));
    const revenue = paid.reduce((n, o) => n + Number(o.total), 0);
    const result = {
      revenue,
      orderCount: orders.length,
      averageOrderValue: orders.length ? revenue / orders.length : 0,
      ordersByStatus: Object.entries(
        orders.reduce((a, o) => ({ ...a, [o.status]: (a[o.status] || 0) + 1 }), {} as Record<string, number>),
      ),
      lowStock: low,
      recentOrders: recent,
    };
    await this.redis.setJson(cacheKey, result, 30);
    return result;
  }
  async checkout(
    customerId: string,
    body: { items: { variantId: string; quantity: number }[]; couponCode?: string; idempotencyKey: string },
  ) {
    if (!body.idempotencyKey) throw new BadRequestException('Idempotency key is required');
    if (!Array.isArray(body.items) || body.items.length === 0)
      throw new BadRequestException('At least one checkout item is required');
    for (const item of body.items) {
      if (!item.variantId || !Number.isInteger(item.quantity) || item.quantity < 1)
        throw new BadRequestException('Each item quantity must be a positive integer');
    }
    const existing = await this.db.order.findUnique({ where: { idempotencyKey: body.idempotencyKey } });
    if (existing) return existing;
    if (customerId === 'demo-customer-id') {
      const customer = await this.db.customer.findFirst();
      if (!customer) throw new BadRequestException('Seed demo data first');
      customerId = customer.id;
    }
    const completedOrder = await this.db.$transaction(async (tx) => {
      const variants = await Promise.all(
        body.items.map((i) =>
          tx.productVariant.findUnique({
            where: { id: i.variantId },
            include: { product: true, inventory: true },
          }),
        ),
      );
      if (variants.some((v, i) => !v || !v.inventory || v.inventory.quantity < body.items[i].quantity))
        throw new BadRequestException('One or more items are out of stock');
      const subtotalCents = variants.reduce((sum, variant, index) => {
        const cents = variant!.price.mul(100).toNumber();
        if (!Number.isSafeInteger(cents)) throw new BadRequestException('Invalid product price');
        return sum + cents * body.items[index].quantity;
      }, 0);
      if (!Number.isSafeInteger(subtotalCents)) throw new BadRequestException('Invalid checkout total');
      let discountCents = 0,
        coupon: any;
      if (body.couponCode) {
        coupon = await tx.coupon.findUnique({ where: { code: body.couponCode.toUpperCase() } });
        if (
          !coupon ||
          !coupon.active ||
          (coupon.minimum && subtotalCents < coupon.minimum.mul(100).toNumber()) ||
          (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
        )
          throw new BadRequestException('Coupon is not valid');
        discountCents =
          coupon.type === DiscountType.PERCENT
            ? Math.floor((subtotalCents * coupon.amount.toNumber()) / 100)
            : coupon.amount.mul(100).toNumber();
      }
      const totalCents = Math.max(0, subtotalCents - discountCents);
      if (!Number.isSafeInteger(discountCents) || !Number.isSafeInteger(totalCents))
        throw new BadRequestException('Invalid checkout total');
      const subtotal = new Prisma.Decimal(subtotalCents).div(100);
      const discount = new Prisma.Decimal(discountCents).div(100);
      const total = new Prisma.Decimal(totalCents).div(100),
        number = `CF-${Math.floor(100000 + Math.random() * 899999)}`;
      const order = await tx.order.create({
        data: {
          number,
          customer: { connect: { id: customerId } },
          status: OrderStatus.PAID,
          subtotal,
          discount,
          total,
          idempotencyKey: body.idempotencyKey,
          items: {
            create: variants.map((v, i) => ({
              variantId: v!.id,
              name: v!.product.name,
              sku: v!.sku,
              unitPrice: v!.price,
              quantity: body.items[i].quantity,
            })),
          },
          payment: {
            create: {
              provider: 'DEMO',
              reference: `demo_${crypto.randomUUID().slice(0, 8)}`,
              status: PaymentStatus.SUCCEEDED,
              amount: total,
            },
          },
          activities: {
            create: { type: 'PAYMENT_SUCCEEDED', message: 'Demo payment approved; fulfillment queued.' },
          },
        },
        include: { items: true, payment: true },
      });
      for (const [i, v] of variants.entries())
        await tx.inventory.update({
          where: { variantId: v!.id },
          data: { quantity: { decrement: body.items[i].quantity } },
        });
      if (coupon) await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      return order;
    });
    await this.redis.del('dashboard:analytics:v1');
    return completedOrder;
  }
  async updateOrder(id: string, status: OrderStatus) {
    const order = await this.db.order.update({
      where: { id },
      data: {
        status,
        activities: { create: { type: 'STATUS_CHANGED', message: `Order status changed to ${status}.` } },
      },
      include: {
        customer: true,
        items: { include: { variant: { include: { product: true } } } },
        payment: true,
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });
    await this.redis.del('dashboard:analytics:v1');
    return order;
  }
  async orders() {
    return this.db.order.findMany({
      include: { customer: true, items: true, payment: true },
      orderBy: { createdAt: 'desc' },
    });
  }
  async order(id: string) {
    const o = await this.db.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { variant: { include: { product: true } } } },
        payment: true,
        activities: { orderBy: { createdAt: 'desc' } },
        refunds: true,
      },
    });
    if (!o) throw new NotFoundException();
    return o;
  }
  async webhook(eventId: string, orderId: string) {
    const exists = await this.db.webhookEvent.findUnique({ where: { providerEventId: eventId } });
    if (exists) return { duplicate: true };
    await this.db.webhookEvent.create({
      data: {
        providerEventId: eventId,
        type: 'demo.payment.succeeded',
        payload: { orderId },
        processedAt: new Date(),
      },
    });
    await this.updateOrder(orderId, OrderStatus.PAID);
    return { processed: true };
  }
}
