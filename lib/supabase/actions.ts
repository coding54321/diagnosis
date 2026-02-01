'use server';

/**
 * Server Actions for Supabase operations
 * 클라이언트 컴포넌트에서 호출 가능한 서버 액션
 */

import {
  getVehicle,
  upsertVehicle,
  getRecentVerificationHistory,
  getVerificationHistoryById,
  saveEstimate,
  updateEstimateImageUrl,
  saveVerificationResult,
  getVerificationResult,
} from './queries';
import { uploadEstimateImage as uploadImage, base64ToFile } from './storage';

import { getCurrentUser } from './auth-server';

/**
 * 차량 정보 조회 (Server Action)
 */
export async function fetchVehicle() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const vehicle = await getVehicle(userId || '');
    return { success: true, data: vehicle };
  } catch (error) {
    console.error('Error in fetchVehicle:', error);
    return { success: false, error: '차량 정보를 불러오는데 실패했습니다.' };
  }
}

/**
 * 차량 정보 저장 (Server Action)
 * 비로그인 사용자도 차량 정보를 저장할 수 있음 (익명으로 저장)
 */
export async function saveVehicle(vehicle: {
  manufacturer: string;
  model: string;
  variant?: string;
  year: number;
  mileage: number;
  fuelType: string;
}) {
  try {
    const user = await getCurrentUser();
    // 비로그인 사용자는 익명으로 저장 (user_id = null)
    const userId = user?.id || null;
    const saved = await upsertVehicle(userId || 'anonymous', {
      manufacturer: vehicle.manufacturer,
      model: vehicle.model,
      variant: vehicle.variant || null,
      year: vehicle.year,
      mileage: vehicle.mileage,
      fuel_type: vehicle.fuelType,
    });
    return { success: true, data: saved };
  } catch (error) {
    console.error('Error in saveVehicle:', error);
    return { success: false, error: '차량 정보를 저장하는데 실패했습니다.' };
  }
}

/**
 * 최근 검증 내역 조회 (Server Action)
 */
export async function fetchRecentHistory(limit: number = 10) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || '';
    const history = await getRecentVerificationHistory(userId, limit);
    return { success: true, data: history };
  } catch (error) {
    console.error('Error in fetchRecentHistory:', error);
    return { success: false, error: '검증 내역을 불러오는데 실패했습니다.' };
  }
}

/**
 * 검증 내역 단건 조회 (소유자만 조회 가능)
 */
export async function fetchHistoryById(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return { success: false, data: null };
    }
    const item = await getVerificationHistoryById(user.id, id);
    return { success: !!item, data: item };
  } catch (error) {
    console.error('Error in fetchHistoryById:', error);
    return { success: false, data: null };
  }
}

/**
 * 견적서 저장 (Server Action)
 */
export async function createEstimate(data: {
  vehicleId: string | null;
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
}) {
  try {
    // 비로그인 사용자도 견적서 생성 가능
    const user = await getCurrentUser();
    const userId = user?.id || null; // null이면 익명 사용자
    // null인 경우 'anonymous'로 전달하여 queries에서 null로 변환
    const result = await saveEstimate(userId ? userId : 'anonymous', data.vehicleId, {
      shopName: data.shopName,
      totalAmount: data.totalAmount,
      imageUrl: data.imageUrl,
      items: data.items,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in createEstimate:', error);
    return { success: false, error: '견적서를 저장하는데 실패했습니다.' };
  }
}

/**
 * 이미지 업로드 (Server Action)
 */
export async function uploadEstimateImageAction(
  base64Image: string,
  estimateId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = base64ToFile(base64Image, `estimate-${estimateId}.jpg`);
    const result = await uploadImage(file, estimateId);
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    
    if (result.url) {
      // 견적서에 이미지 URL 업데이트
      const updateSuccess = await updateEstimateImageUrl(estimateId, result.url);
      if (!updateSuccess) {
        console.warn('Failed to update estimate image URL, but upload succeeded');
      }
    }
    
    return { success: true, url: result.url || undefined };
  } catch (error) {
    console.error('Error in uploadEstimateImageAction:', error);
    return { success: false, error: '이미지 업로드에 실패했습니다.' };
  }
}

/**
 * 검증 결과 저장 (Server Action)
 */
export async function createVerificationResult(data: {
  estimateId: string;
  totalAmount: number;
  status: 'appropriate' | 'review_needed' | 'recheck_recommended';
  confidence: number;
  items: Array<{
    estimateItemId: string;
    status: 'appropriate' | 'review_needed' | 'recheck_recommended';
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
  }>;
}) {
  try {
    // 비로그인 사용자도 검증 결과 생성 가능
    const user = await getCurrentUser();
    const userId = user?.id || null; // null이면 익명 사용자
    // null인 경우 'anonymous'로 전달하여 queries에서 null로 변환
    const result = await saveVerificationResult(userId ? userId : 'anonymous', data.estimateId, {
      totalAmount: data.totalAmount,
      status: data.status,
      confidence: data.confidence,
      items: data.items,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in createVerificationResult:', error);
    return { success: false, error: '검증 결과를 저장하는데 실패했습니다.' };
  }
}

/**
 * 검증 결과 조회 (Server Action)
 */
export async function fetchVerificationResult(estimateId: string) {
  try {
    const result = await getVerificationResult(estimateId);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in fetchVerificationResult:', error);
    return { success: false, error: '검증 결과를 불러오는데 실패했습니다.', data: null };
  }
}
