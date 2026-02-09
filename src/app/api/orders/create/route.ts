import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireCustomer } from '@/lib/rbac';
import { createOrderSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';
import { sendOrderPlacedEmail, sendSellerNewOrderEmail } from '@/lib/email/resend';
import { Decimal } from '@prisma/client/runtime/library';

export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomer();
    const body = await request.json();
    const data = createOrderSchema.parse(body);
    
    // Get admin settings for commission rate
    const settings = await prisma.adminSettings.findUnique({
      where: { id: 'singleton' },
    });
    
    const freeMode = settings?.freeMode ?? false;
    const commissionRate = freeMode ? new Decimal(0) : (settings?.globalCommissionRate ?? new Decimal(0.05));
    
    // Validate and get products with their sellers
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
    
    // Validate all products exist and are active
    if (products.length !== productIds.length) {
      return error('بعض المنتجات غير متاحة', 'PRODUCTS_UNAVAILABLE', 400);
    }
    
    // Group items by seller
    const sellerOrders = new Map<string, {
      sellerId: string;
      sellerEmail: string;
      items: {
        product: typeof products[0];
        qty: number;
      }[];
    }>();
    
    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      
      // Check stock
      if (product.quantity < item.qty) {
        return error(
          `الكمية المطلوبة من "${product.title}" غير متوفرة (المتاح: ${product.quantity})`,
          'INSUFFICIENT_STOCK',
          400
        );
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
    
    // Create orders in a transaction
    const createdOrders = await prisma.$transaction(async (tx) => {
      const orders = [];
      
      for (const [sellerId, orderData] of sellerOrders) {
        // Calculate totals
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
        
        // Create order with items
        const order = await tx.order.create({
          data: {
            customerId: user.id,
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
        
        // Decrement stock for each item
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
    
    // Send emails (non-blocking)
    const customerUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, name: true },
    });
    
    for (const order of createdOrders) {
      // Email to customer
      if (customerUser) {
        sendOrderPlacedEmail(
          customerUser.email,
          order.id,
          `${order.total.toString()} ${order.items[0]?.titleSnapshot ? 'ل.س' : 'SYP'}`,
          order.items.map((item) => ({
            title: item.titleSnapshot,
            qty: item.qty,
            price: `${item.lineTotal.toString()} ل.س`,
          }))
        ).catch(console.error);
      }
      
      // Email to seller
      sendSellerNewOrderEmail(
        order.seller.user.email,
        order.id,
        customerUser?.name || 'عميل',
        `${order.total.toString()} ل.س`
      ).catch(console.error);
    }
    
    return success(
      {
        orders: createdOrders.map((order) => ({
          id: order.id,
          sellerId: order.sellerId,
          total: order.total,
          itemCount: order.items.length,
        })),
        message: `تم إنشاء ${createdOrders.length} طلب بنجاح`,
      },
      201
    );
  } catch (err) {
    return handleError(err);
  }
}
