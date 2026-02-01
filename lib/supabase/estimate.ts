/**
 * 견적서 관련 쿼리 함수
 */

import { createServerClient } from './server';
import type { Database } from '@/types/supabase';

type Estimate = Database['public']['Tables']['estimates']['Row'];
type EstimateItem = Database['public']['Tables']['estimate_items']['Row'];

/**
 * 견적서 및 항목 조회
 */
export async function getEstimateWithItems(
  estimateId: string
): Promise<{
  estimate: Estimate;
  items: EstimateItem[];
} | null> {
  const supabase = await createServerClient();

  const { data: estimateData, error: estimateError } = await supabase
    .from('estimates')
    .select('*')
    .eq('id', estimateId)
    .single();

  if (estimateError || !estimateData) {
    console.error('Error fetching estimate:', estimateError);
    return null;
  }

  const { data: itemsData, error: itemsError } = await supabase
    .from('estimate_items')
    .select('*')
    .eq('estimate_id', estimateId)
    .order('display_order', { ascending: true });

  if (itemsError) {
    console.error('Error fetching estimate items:', itemsError);
    return null;
  }

  return {
    estimate: estimateData,
    items: itemsData || [],
  };
}
