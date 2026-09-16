import { DiscountType, OrderStatus, PaymentStatus, PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();
const products = [
  ['Orbit Desk Lamp', 'Lighting', 'A warm, dimmable aluminum task lamp.'],
  ['Field Notes Set', 'Stationery', 'Three tactile notebooks for better thinking.'],
  ['Arc Wireless Charger', 'Technology', 'A compact fast-charging pad.'],
  ['Luma Throw', 'Home', 'Soft recycled-cotton throw blanket.'],
  ['Studio Mug', 'Home', 'Hand-finished ceramic coffee mug.'],
  ['Transit Tote', 'Accessories', 'Durable everyday carry tote.'],
  ['Slate Headphones', 'Technology', 'Focused sound, understated form.'],
  ['Grid Planner', 'Stationery', 'Undated weekly planning system.'],
  ['Form Water Bottle', 'Accessories', 'Insulated stainless steel bottle.'],
  ['Nimbus Cushion', 'Home', 'Textural support for thoughtful spaces.'],
  ['Cove Keyboard', 'Technology', 'Quiet mechanical keyboard.'],
  ['Morrow Candle', 'Home', 'Cedar and bergamot, hand-poured.'],
] as const;
const images = ['1494438639946-1ebd1d20bf85', '1513506003901-1e6a229e2d15', '1523275335684-37898b6baf30'];

async function main() {
  await prisma.activity.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.couponRedemption.deleteMany();
  await prisma.coupon.deleteMany();
  const admin = await prisma.user.create({ data: { email: 'ops@commerceflow.demo', role: Role.ADMIN } });
  const customers = await Promise.all(
    ['Avery Quinn', 'Jordan Ellis', 'Morgan Lee', 'Riley Park'].map((name, index) =>
      prisma.customer.create({
        data: { name, user: { create: { email: `customer${index + 1}@commerceflow.demo` } } },
      }),
    ),
  );
  for (const [index, [name, category, description]] of products.entries()) {
    await prisma.product.create({
      data: {
        name,
        slug: name.toLowerCase().replaceAll(' ', '-'),
        category,
        description,
        imageUrl: `https://images.unsplash.com/photo-${images[index % images.length]}?auto=format&fit=crop&w=900&q=80`,
        variants: {
          create: [
            {
              name: 'Standard',
              sku: `CF-${String(index + 1).padStart(3, '0')}-STD`,
              price: 18 + index * 7,
              inventory: { create: { quantity: 5 + ((index * 9) % 42), reorderPoint: 10 } },
            },
          ],
        },
      },
    });
  }
  await prisma.coupon.createMany({
    data: [
      { code: 'WELCOME10', type: DiscountType.PERCENT, amount: 10 },
      { code: 'STUDIO15', type: DiscountType.FIXED, amount: 15, minimum: 75 },
      { code: 'ARCHIVE', type: DiscountType.PERCENT, amount: 20, active: false },
    ],
  });
  const variants = await prisma.productVariant.findMany({ include: { product: true } });
  for (let index = 0; index < 18; index++) {
    const variant = variants[index % variants.length],
      quantity = (index % 3) + 1,
      subtotal = Number(variant.price) * quantity,
      status = [OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PROCESSING, OrderStatus.PAID][
        index % 4
      ];
    await prisma.order.create({
      data: {
        number: `CF-${2401 + index}`,
        customerId: customers[index % customers.length].id,
        status,
        subtotal,
        discount: 0,
        total: subtotal,
        idempotencyKey: `seed-${index}`,
        items: {
          create: {
            variantId: variant.id,
            name: variant.product.name,
            sku: variant.sku,
            unitPrice: variant.price,
            quantity,
          },
        },
        payment: {
          create: {
            provider: 'DEMO',
            reference: `demo_seed_${index}`,
            status: PaymentStatus.SUCCEEDED,
            amount: subtotal,
          },
        },
        activities: {
          create: { type: 'ORDER_CREATED', message: `Order placed and marked ${status.toLowerCase()}.` },
        },
      },
    });
  }
  console.log(`Seeded ${products.length} products and 18 orders. Admin: ${admin.email}`);
}
main().finally(() => prisma.$disconnect());
