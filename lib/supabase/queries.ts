/**
 * Supabase 데이터베이스 쿼리 함수
 */

import { createServerClient, createAdminClient } from './server';
import type { Database } from '@/types/supabase';
import { classifyShopType } from '@/lib/verification/shop-classifier';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
type Estimate = Database['public']['Tables']['estimates']['Row'];
type EstimateInsert = Database['public']['Tables']['estimates']['Insert'];
type EstimateItem = Database['public']['Tables']['estimate_items']['Row'];
type EstimateItemInsert = Database['public']['Tables']['estimate_items']['Insert'];
type VerificationResult = Database['public']['Tables']['verification_results']['Row'];
type VerificationResultInsert = Database['public']['Tables']['verification_results']['Insert'];
type ItemVerification = Database['public']['Tables']['item_verifications']['Row'];
type ItemVerificationInsert = Database['public']['Tables']['item_verifications']['Insert'];

/**
 * 차량 정보 조회
 * userId가 비어 있으면 null 반환 (타인 데이터 노출 방지)
 */
export async function getVehicle(userId: string): Promise<Vehicle | null> {
  if (!userId || userId === '') {
    return null;
  }

  const supabase = await createServerClient();

  const query = supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error fetching vehicle:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return null;
  }

  return data;
}

/**
 * 차량 정보 저장/업데이트
 * 실패 시 { data: null, error: 메시지 } 반환 (RLS 정책·제약 등 원인 전달용)
 */
export async function upsertVehicle(
  userId: string,
  vehicle: Omit<VehicleInsert, 'user_id' | 'id'>
): Promise<{ data: Vehicle | null; error: string | null }> {
  const supabase = await createServerClient();

  // 기존 차량 확인 (익명은 user_id=null이라 getVehicle('anonymous')는 항상 null)
  const existing = await getVehicle(userId === 'anonymous' ? '' : userId);

  if (existing) {
    const { data, error } = await supabase
      .from('vehicles')
      .update({
        ...vehicle,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating vehicle:', error);
      return { data: null, error: error.message };
    }
    return { data, error: null };
  }

  // 새로 생성 (익명 사용자는 user_id를 null로 저장)
  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      ...vehicle,
      user_id: userId === 'anonymous' ? null : userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating vehicle:', error);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

/** 목업: 차량등록번호로 조회 시 반환할 Vehicle 형태 */
export interface VehicleLookupResult {
  manufacturer: string;
  model: string;
  variant: string | null;
  year: number;
  mileage: number;
  fuelType: string;
  /** 원본 목업 행 (API 공통항목 전체) */
  raw?: Record<string, unknown>;
}

/** 차량등록번호(번호판) 정규화: 공백·하이픈 제거 */
function normalizeRegistrationNumber(num: string): string {
  return num.replace(/\s|-/g, '').trim();
}

/** 목업: 차량등록번호로 vehicle_lookup_mock 조회 → 앱에서 쓸 Vehicle 형태로 변환 */
export async function getVehicleLookupByRegistrationNumber(
  registrationNumber: string
): Promise<VehicleLookupResult | null> {
  const supabase = await createServerClient();
  const key = normalizeRegistrationNumber(registrationNumber);
  if (!key) return null;

  const { data, error } = await supabase
    .from('vehicle_lookup_mock')
    .select('*')
    .eq('registration_number', key)
    .maybeSingle();

  if (error || !data) return null;

  const year = parseInt(String(data.spec_model_year || data.model_year || '0'), 10) || new Date().getFullYear();
  const manufacturer =
    typeof data.car_name === 'string' && /^(K3|K5|K7|EV6|스포티지|셀토스|소레뉴|카니발|니로|모닝|레이|스팅어)$/.test(data.car_name)
      ? '기아'
      : '현대';

  const mileage =
    data.mileage != null && typeof data.mileage === 'number' ? data.mileage : 0;

  return {
    manufacturer,
    model: String(data.car_name || data.model_type_name || ''),
    variant: data.form_name ? String(data.form_name) : null,
    year: year || new Date().getFullYear(),
    mileage,
    fuelType: String(data.fuel_name || '가솔린'),
    raw: data as Record<string, unknown>,
  };
}

/** 소유주명 비교용 정규화: trim + 연속 공백 하나로 */
function normalizeOwnerName(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

/**
 * 차량 검증 2단계: DB에 등록된 소유주명과 사용자 입력 소유주명 일치 여부 검증
 * 1) 차량은 이미 차량번호로 조회되어 존재함이 확인된 상태
 * 2) 소유주명만 비교 (대소문자 무시, 앞뒤/연속 공백 정규화)
 */
export async function verifyVehicleOwner(
  registrationNumber: string,
  ownerNameInput: string
): Promise<{ valid: boolean; error?: string }> {
  const key = normalizeRegistrationNumber(registrationNumber);
  const inputNormalized = normalizeOwnerName(ownerNameInput);
  if (!key || !inputNormalized) {
    return { valid: false, error: '차량번호와 소유주명을 입력해 주세요.' };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('vehicle_lookup_mock')
    .select('owner_name')
    .eq('registration_number', key)
    .maybeSingle();

  if (error) {
    return { valid: false, error: '검증 중 오류가 발생했습니다.' };
  }
  if (!data) {
    return { valid: false, error: '등록된 차량을 찾을 수 없어요.' };
  }

  const dbOwnerName = (data as { owner_name: string | null }).owner_name;
  if (dbOwnerName == null || dbOwnerName === '') {
    return { valid: false, error: '해당 차량의 소유주 정보가 등록되어 있지 않아요.' };
  }

  const dbNormalized = normalizeOwnerName(dbOwnerName);
  const valid = dbNormalized === inputNormalized;
  return valid ? { valid: true } : { valid: false, error: '소유주 정보가 일치하지 않아요.' };
}

/**
 * 최근 검증 내역 조회
 * userId가 비어 있으면 [] 반환 (타인 데이터 노출 방지)
 */
export async function getRecentVerificationHistory(
  userId: string,
  limit: number = 10
): Promise<Array<{
  id: string;
  estimateId: string | null;
  date: Date;
  items: string;
  totalAmount: number;
  status: string;
  shopName?: string;
}>> {
  if (!userId || userId === '') {
    return [];
  }

  const supabase = await createServerClient();

  const query = supabase
    .from('verification_history')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching verification history:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return [];
  }

  return (data || []).map((item) => ({
    id: item.id || '',
    estimateId: item.estimate_id,
    date: item.date ? new Date(item.date) : new Date(),
    items: item.items_summary || '',
    totalAmount: item.total_amount || 0,
    status: item.status || 'appropriate',
    shopName: item.shop_name || undefined,
  }));
}

/**
 * 검증 내역 단건 조회 (소유자만 조회 가능)
 * userId가 비어 있거나 해당 id가 해당 사용자 소유가 아니면 null
 */
export async function getVerificationHistoryById(
  userId: string,
  id: string
): Promise<{
  id: string;
  estimateId: string | null;
  date: Date;
  items: string;
  totalAmount: number;
  status: string;
} | null> {
  if (!userId || userId === '' || !id) {
    return null;
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('verification_history')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id || '',
    estimateId: data.estimate_id,
    date: data.date ? new Date(data.date) : new Date(),
    items: data.items_summary || '',
    totalAmount: data.total_amount || 0,
    status: data.status || 'appropriate',
  };
}

/**
 * 검증 내역 삭제 (본인 소유만)
 * verification_history 뷰의 id = verification_results.id
 * RLS로 DELETE가 막힐 수 있어 서비스 역할 클라이언트로 삭제 (소유 여부는 .eq('user_id', userId)로 보장)
 */
export async function deleteVerificationResultById(
  userId: string,
  verificationResultId: string
): Promise<boolean> {
  if (!userId || !verificationResultId) {
    return false;
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    // 서비스 역할 키가 없으면 일반 클라이언트로 시도 (RLS 적용)
    supabase = await createServerClient();
  }

  // item_verifications 먼저 삭제 (FK 제약)
  const { error: itemError } = await supabase
    .from('item_verifications')
    .delete()
    .eq('verification_result_id', verificationResultId);

  if (itemError) {
    console.error('Error deleting item_verifications:', itemError);
    return false;
  }

  const { error } = await supabase
    .from('verification_results')
    .delete()
    .eq('id', verificationResultId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting verification_result:', error);
    return false;
  }
  return true;
}

/**
 * 견적서 저장
 */
export async function saveEstimate(
  userId: string,
  vehicleId: string | null,
  estimate: {
    shopName: string;
    totalAmount: number;
    imageUrl?: string;
    items: Array<{
      name: string;
      partCost: number;
      laborCost: number;
      totalCost: number;
      category?: string;
    }>;
  }
): Promise<{ estimateId: string; items: EstimateItem[] } | null> {
  const supabase = await createServerClient();

  // 견적서 저장 (익명 사용자는 user_id를 null로 저장), 정비소 유형 분류 후 shop_type 저장
  const shopType = classifyShopType(estimate.shopName);
  const { data: estimateData, error: estimateError } = await supabase
    .from('estimates')
    .insert({
      user_id: userId === 'anonymous' ? null : userId,
      vehicle_id: vehicleId,
      shop_name: estimate.shopName,
      shop_type: shopType,
      total_amount: estimate.totalAmount,
      image_url: estimate.imageUrl || null,
    })
    .select()
    .single();

  if (estimateError || !estimateData) {
    console.error('Error saving estimate:', estimateError);
    return null;
  }

  // 견적 항목 저장
  const itemsToInsert: EstimateItemInsert[] = estimate.items.map((item, index) => ({
    estimate_id: estimateData.id,
    name: item.name,
    part_cost: item.partCost,
    labor_cost: item.laborCost,
    total_cost: item.totalCost,
    category: item.category || null,
    display_order: index,
  }));

  const { data: itemsData, error: itemsError } = await supabase
    .from('estimate_items')
    .insert(itemsToInsert)
    .select();

  if (itemsError) {
    console.error('Error saving estimate items:', itemsError);
    return null;
  }

  return {
    estimateId: estimateData.id,
    items: itemsData || [],
  };
}

/**
 * 견적서 이미지 URL 업데이트
 */
export async function updateEstimateImageUrl(
  estimateId: string,
  imageUrl: string
): Promise<boolean> {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('estimates')
    .update({ image_url: imageUrl })
    .eq('id', estimateId);

  if (error) {
    console.error('Error updating estimate image URL:', error);
    return false;
  }

  return true;
}

/**
 * 검증 결과 저장
 */
export async function saveVerificationResult(
  userId: string,
  estimateId: string,
  result: {
    totalAmount: number;
    status: 'appropriate' | 'review_needed';
    confidence: number;
    items: Array<{
      estimateItemId: string;
      status: 'appropriate' | 'review_needed';
      userPrice: number;
      averagePrice: number;
      minPrice: number;
      maxPrice: number;
      medianPrice: number;
      sampleCount: number;
      partCostUser: number;
      partCostAverage: number;
      laborCostUser: number;
      laborCostAverage: number;
      partPriceSource?: 'wpc' | 'market' | null;
    }>;
  }
): Promise<{ verificationResultId: string; itemVerifications: ItemVerification[] } | null> {
  const supabase = await createServerClient();

  // 검증 결과 저장 (익명 사용자는 user_id를 null로 저장)
  const { data: verificationData, error: verificationError } = await supabase
    .from('verification_results')
    .insert({
      user_id: userId === 'anonymous' ? null : userId,
      estimate_id: estimateId,
      total_amount: result.totalAmount,
      status: result.status,
      confidence: result.confidence,
    })
    .select()
    .single();

  if (verificationError || !verificationData) {
    console.error('Error saving verification result:', verificationError);
    return null;
  }

  // 항목별 검증 결과 저장
  const itemVerificationsToInsert: ItemVerificationInsert[] = result.items.map((item) => ({
    verification_result_id: verificationData.id,
    estimate_item_id: item.estimateItemId,
    status: item.status,
    user_price: item.userPrice,
    average_price: item.averagePrice,
    min_price: item.minPrice,
    max_price: item.maxPrice,
    median_price: item.medianPrice,
    sample_count: item.sampleCount,
    part_cost_user: item.partCostUser,
    part_cost_average: item.partCostAverage,
    labor_cost_user: item.laborCostUser,
    labor_cost_average: item.laborCostAverage,
    part_price_source: item.partPriceSource ?? null,
  }));

  const { data: itemVerificationsData, error: itemVerificationsError } = await supabase
    .from('item_verifications')
    .insert(itemVerificationsToInsert)
    .select();

  if (itemVerificationsError) {
    console.error('Error saving item verifications:', itemVerificationsError);
    return null;
  }

  return {
    verificationResultId: verificationData.id,
    itemVerifications: itemVerificationsData || [],
  };
}

/**
 * 검증 결과 조회
 */
export async function getVerificationResult(
  estimateId: string
): Promise<{
  result: VerificationResult;
  items: Array<ItemVerification & { estimateItem: EstimateItem }>;
  estimate?: {
    shop_name?: string;
    shop_type?: string | null;
    vehicle?: {
      model: string;
      variant?: string;
      mileage: number;
      manufacturer?: string;
      year?: number;
      fuel_type?: string;
    };
  };
} | null> {
  const supabase = await createServerClient();

  const { data: resultData, error: resultError } = await supabase
    .from('verification_results')
    .select('*')
    .eq('estimate_id', estimateId)
    .single();

  if (resultError || !resultData) {
    console.error('Error fetching verification result:', resultError);
    return null;
  }

  const { data: itemsData, error: itemsError } = await supabase
    .from('item_verifications')
    .select(`
      *,
      estimate_items (*)
    `)
    .eq('verification_result_id', resultData.id);

  if (itemsError) {
    console.error('Error fetching item verifications:', itemsError);
    return null;
  }

  // 견적서와 연결된 차량 정보·정비소명 가져오기 (주행거리 수정·재검증·정비소 유형 분류용)
  const { data: estimateData } = await supabase
    .from('estimates')
    .select(`
      vehicle_id,
      shop_name,
      shop_type,
      vehicles (
        model,
        variant,
        mileage,
        manufacturer,
        year,
        fuel_type
      )
    `)
    .eq('id', estimateId)
    .single();

  const vehicle = estimateData?.vehicles as Record<string, unknown> | null;
  return {
    result: resultData,
    items: (itemsData || []).map((item: any) => ({
      ...item,
      estimateItem: item.estimate_items,
    })),
    estimate: estimateData ? {
      shop_name: estimateData.shop_name ?? undefined,
      shop_type: estimateData.shop_type ?? undefined,
      vehicle: vehicle ? {
        model: String(vehicle.model ?? ''),
        variant: vehicle.variant != null ? String(vehicle.variant) : undefined,
        mileage: Number(vehicle.mileage ?? 0),
        manufacturer: String(vehicle.manufacturer ?? ''),
        year: Number(vehicle.year ?? new Date().getFullYear()),
        fuel_type: String(vehicle.fuel_type ?? ''),
      } : undefined,
    } : undefined,
  };
}
