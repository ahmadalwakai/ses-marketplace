import { NextRequest } from 'next/server';
import { requireCustomer } from '@/lib/rbac';
import { createOrderSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';
import { createOrdersForCustomer } from '@/lib/orders';

export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomer();
    const body = await request.json();
    const data = createOrderSchema.parse(body);

    const result = await createOrdersForCustomer({
      customerId: user.id,
      customerEmail: user.email,
      customerName: user.name,
      data,
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
