import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { createOrderSchema } from '@/lib/validations';
import { createOrdersForCustomer } from '@/lib/orders';
import { success, error, handleError } from '@/lib/api-response';

const guestOrderSchema = createOrderSchema.extend({
  email: z.string().email(),
  name: z.string().min(2).max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = guestOrderSchema.parse(body);

    const email = data.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, status: true, name: true, email: true },
    });

    if (existingUser && existingUser.status !== 'ACTIVE') {
      const message =
        existingUser.status === 'SUSPENDED'
          ? 'حسابك موقوف مؤقتاً'
          : existingUser.status === 'BANNED'
          ? 'حسابك محظور'
          : 'حسابك غير مفعل';
      return error(message, 'ACCOUNT_INACTIVE', 403);
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: data.name || existingUser?.name || null,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
      create: {
        email,
        name: data.name || null,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
      select: { id: true, email: true, name: true },
    });

    const { email: _email, name: _name, ...orderData } = data;

    const result = await createOrdersForCustomer({
      customerId: user.id,
      customerEmail: user.email,
      customerName: _name || user.name,
      data: orderData,
    });

    if (!result.ok) {
      return error(result.message, result.code, result.status);
    }

    return success(
      {
        orders: result.orders.map((order) => ({
          id: order.id,
          sellerId: order.sellerId,
          total: order.total,
          itemCount: order.items.length,
        })),
        message: `تم إنشاء ${result.orders.length} طلب بنجاح`,
      },
      201
    );
  } catch (err) {
    return handleError(err);
  }
}
