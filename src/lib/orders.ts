import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { sendOrderPlacedEmail, sendSellerNewOrderEmail } from '@/lib/email/resend';
import { createOrderSchema } from '@/lib/validations';
import { z } from 'zod';

type CreateOrderInput = z.infer<typeof createOrderSchema>;

type CreateOrdersResult =
  | { ok: true; orders: any[] }
  | { ok: false; message: string; code: string; status: number };

export async function createOrdersForCustomer(params: {
  customerId: string;
  customerEmail?: string | null;
  customerName?: string | null;
  data: CreateOrderInput;
}): Promise<CreateOrdersResult> {
  const { customerId, customerEmail, customerName, data } = params;

  const settings = await prisma.adminSettings.findUnique({
    where: { id: 'singleton' },
  });

  const freeMode = settings?.freeMode ?? false;
  const commissionRate = freeMode
    ? new Decimal(0)
    : settings?.globalCommissionRate ?? new Decimal(0.05);

  const productIds = data.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      status: 'ACTIVE',
    },
    include: {
      seller: {
        include: {
          user: {
            select: { email: true, name: true },
          },
        },
      },
    },
  });

  if (products.length !== productIds.length) {
    return {
      ok: false,
      message: 'بعض المنتجات غير متاحة',
      code: 'PRODUCTS_UNAVAILABLE',
      status: 400,
    };
  }

  const sellerOrders = new Map<
    string,
    {
      sellerId: string;
      sellerEmail: string;
      items: {
        product: (typeof products)[0];
        qty: number;
      }[];
    }
  >();

  for (const item of data.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;

    if (product.quantity < item.qty) {
      return {
        ok: false,
        message: `الكمية المطلوبة من "${product.title}" غير متوفرة (المتاح: ${product.quantity})`,
        code: 'INSUFFICIENT_STOCK',
        status: 400,
      };
    }

    const sellerId = product.sellerId;
    if (!sellerOrders.has(sellerId)) {
      sellerOrders.set(sellerId, {
        sellerId,
        sellerEmail: product.seller.user.email,
        items: [],
      });
    }
    sellerOrders.get(sellerId)!.items.push({ product, qty: item.qty });
  }

  const createdOrders = await prisma.$transaction(async (tx) => {
    const orders: any[] = [];

    for (const [sellerId, orderData] of sellerOrders) {
      let subtotal = new Decimal(0);
      let commissionTotal = new Decimal(0);

      const orderItems = orderData.items.map((item) => {
        const lineTotal = item.product.price.mul(item.qty);
        const commission = lineTotal.mul(commissionRate);
        const sellerNet = lineTotal.sub(commission);

        subtotal = subtotal.add(lineTotal);
        commissionTotal = commissionTotal.add(commission);

        return {
          productId: item.product.id,
          titleSnapshot: item.product.titleAr || item.product.title,
          priceSnapshot: item.product.price,
          qty: item.qty,
          lineTotal,
          commissionRateSnapshot: commissionRate,
          commissionAmount: commission,
          sellerNetAmount: sellerNet,
        };
      });

      const total = subtotal;

      const order = await tx.order.create({
        data: {
          customerId,
          sellerId,
          status: 'PENDING',
          paymentMethod: 'CASH',
          subtotal,
          commissionTotal,
          total,
          deliveryMode: data.deliveryMode,
          deliveryAddress: data.deliveryAddress,
          phone: data.phone,
          notes: data.notes,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
          seller: {
            include: {
              user: { select: { email: true, name: true } },
            },
          },
        },
      });

      for (const item of orderData.items) {
        await tx.product.update({
          where: { id: item.product.id },
          data: {
            quantity: { decrement: item.qty },
          },
        });
      }

      orders.push(order);
    }

    return orders;
  });

  const customerUser = customerEmail
    ? { email: customerEmail, name: customerName ?? null }
    : await prisma.user.findUnique({
        where: { id: customerId },
        select: { email: true, name: true },
      });

  for (const order of createdOrders) {
    if (customerUser?.email) {
      sendOrderPlacedEmail(
        customerUser.email,
        order.id,
        `${order.total.toString()} ${order.items[0]?.titleSnapshot ? 'ل.س' : 'SYP'}`,
        order.items.map((item: any) => ({
          title: item.titleSnapshot,
          qty: item.qty,
          price: `${item.lineTotal.toString()} ل.س`,
        }))
      ).catch(console.error);

      prisma.notification
        .create({
          data: {
            userId: customerId,
            type: 'ORDER_PLACED',
            title: 'تم استلام طلبك',
            message: `طلبك رقم #${order.id.slice(-8)} بانتظار تأكيد البائع`,
            link: `/dashboard`,
          },
        })
        .catch(console.error);
    }

    sendSellerNewOrderEmail(
      order.seller.user.email,
      order.id,
      customerUser?.name || 'عميل',
      `${order.total.toString()} ل.س`
    ).catch(console.error);

    const sellerUser = await prisma.user.findFirst({
      where: { sellerProfile: { id: order.sellerId } },
      select: { id: true },
    });

    if (sellerUser) {
      prisma.notification
        .create({
          data: {
            userId: sellerUser.id,
            type: 'NEW_ORDER',
            title: 'طلب جديد!',
            message: `لديك طلب جديد #${order.id.slice(-8)} من ${customerUser?.name || 'عميل'}`,
            link: `/seller/orders`,
          },
        })
        .catch(console.error);
    }
  }

  return { ok: true, orders: createdOrders };
}
