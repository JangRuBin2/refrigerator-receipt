import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { activateSubscription } from '@/lib/apps-in-toss/server';
import type { IapProductSku } from '@/types/apps-in-toss';

export const runtime = 'nodejs';

// POST: 결제 완료 후 구독 활성화
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
    const { orderId, sku, tossUserKey } = body as {
      orderId: string;
      sku: IapProductSku;
      tossUserKey: string;
    };

    if (!orderId || !sku || !tossUserKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 구독 활성화
    const activated = await activateSubscription({
      userId: user.id,
      orderId,
      sku,
      tossUserKey,
    });

    if (!activated) {
      return NextResponse.json(
        { success: false, error: 'Failed to activate subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        sku,
        activatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('IAP activation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
