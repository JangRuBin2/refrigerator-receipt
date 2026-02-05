import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrderStatus } from '@/lib/apps-in-toss/server';

export const runtime = 'nodejs';

// POST: 주문 상태 조회
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, tossUserKey } = body as {
      orderId: string;
      tossUserKey: string;
    };

    if (!orderId || !tossUserKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const status = await getOrderStatus(orderId, tossUserKey);

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Failed to get order status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('IAP status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
