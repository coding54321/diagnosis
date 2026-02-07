'use server';

/**
 * Server Actions for Supabase operations
 * 클라이언트 컴포넌트에서 호출 가능한 서버 액션
 */

import {
  getVehicle,
  upsertVehicle,
  getVehicleLookupByRegistrationNumber,
  verifyVehicleOwner,
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
 * 목업: 차량등록번호(번호판)로 차량 정보 조회 (vehicle_lookup_mock)
 * API 미연동 시 프로토타입에서 이 번호들로 조회 가능
 */
export async function fetchVehicleByRegistrationNumber(registrationNumber: string) {
  try {
    const normalized = registrationNumber.replace(/\s|-/g, '').trim();
    if (!normalized) {
      return { success: false, error: '차량번호를 입력해 주세요.', data: null };
    }
    const data = await getVehicleLookupByRegistrationNumber(normalized);
    if (!data) {
      return { success: false, error: '등록된 차량이 없거나 조회되지 않았어요. 직접 입력해 주세요.', data: null };
    }
    return { success: true, data };
  } catch (error) {
    console.error('Error in fetchVehicleByRegistrationNumber:', error);
    return { success: false, error: '차량 정보 조회에 실패했습니다.', data: null };
  }
}

/**
 * 차량 검증 2단계: 소유주명 일치 여부 검증 (DB 기준)
 * 차량번호로 조회된 차량의 소유주와 사용자 입력 소유주명 비교
 */
export async function verifyVehicleOwnerAction(registrationNumber: string, ownerName: string) {
  try {
    const normalizedNum = registrationNumber.replace(/\s|-/g, '').trim();
    if (!normalizedNum || !ownerName.trim()) {
      return { success: false, error: '차량번호와 소유주명을 입력해 주세요.' };
    }
    const result = await verifyVehicleOwner(normalizedNum, ownerName);
    if (result.valid) {
      return { success: true };
    }
    return { success: false, error: result.error ?? '소유주 정보가 일치하지 않아요.' };
  } catch (error) {
    console.error('Error in verifyVehicleOwnerAction:', error);
    return { success: false, error: '소유주 검증 중 오류가 발생했습니다.' };
  }
}

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
    const { data: saved, error: upsertError } = await upsertVehicle(userId || 'anonymous', {
      manufacturer: vehicle.manufacturer,
      model: vehicle.model,
      variant: vehicle.variant || null,
      year: vehicle.year,
      mileage: vehicle.mileage,
      fuel_type: vehicle.fuelType,
    });
    if (upsertError || !saved) {
      console.error('saveVehicle: upsertVehicle failed', upsertError);
      return {
        success: false,
        error: upsertError || '차량 정보를 저장하는데 실패했습니다. 로그인 후 다시 시도해 주세요.',
      };
    }
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
