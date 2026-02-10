import { createClient } from '@/lib/supabase/client';
import { callEdgeFunction } from './edge';

export async function getNutritionReport(period?: 'week' | 'month') {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  if (period) {
    // Period-based report: query ingredients by purchase date range
    const now = new Date();
    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    const { data: ingredients, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('user_id', user.id)
      .gte('purchase_date', startDate.toISOString().split('T')[0])
      .order('purchase_date', { ascending: false });

    if (error) throw error;
    return { ingredients: ingredients ?? [], period, startDate: startDate.toISOString().split('T')[0], endDate: now.toISOString().split('T')[0] };
  }

  // Current state: all active ingredients
  const { data: ingredients, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;
  return { ingredients: ingredients ?? [] };
}

export async function analyzeNutrition(input?: {
  ingredients?: string[];
  locale?: string;
}) {
  return callEdgeFunction<{ report: unknown }>('nutrition-analyze', {
    body: input || {},
  });
}

export async function analyzePeriodNutrition(period: 'week' | 'month') {
  return callEdgeFunction<{ report: unknown }>('nutrition-analyze', {
    body: { period },
  });
}
