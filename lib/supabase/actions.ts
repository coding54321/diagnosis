'use server';

/**
 * Server Actions for Supabase operations
 * 클라이언트 컴포넌트에서 호출 가능한 서버 액션
 */

import {
  getVehicle,
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle as deleteVehicleQuery,
  getVehicleLookupByRegistrationNumber,
  verifyVehicleOwner,
  getRecentVerificationHistory,
  getRecentVerificationHistoryByVehicleId,
  getVerificationHistoryById,
  deleteVerificationResultById,
  saveEstimate,
  updateEstimateImageUrl,
  updateEstimateVehicleId,
  saveVerificationResult,
  getVerificationResult,
  getUserVehicleByRegistrationNumber,
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
 * 현재 사용자 기준으로, 같은 차량번호가 이미 등록되어 있는지 확인
 * 있으면 해당 Vehicle을 반환
 */
export async function findExistingUserVehicleByRegistrationNumber(
  registrationNumber: string
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return { success: false, data: null, error: '사용자 인증 정보가 없습니다.' };
    }
    const existing = await getUserVehicleByRegistrationNumber(user.id, registrationNumber);
    return { success: true, data: existing, error: null };
  } catch (error) {
    console.error('Error in findExistingUserVehicleByRegistrationNumber:', error);
    return { success: false, data: null, error: '기존 차량 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 현재 로그인 사용자 표시 이름 (소유주명 표시용)
 * user_metadata.name 또는 full_name 반환, 없으면 null
 */
export async function getCurrentUserDisplayName(): Promise<{ success: true; name: string | null } | { success: false; name: null }> {
  try {
    const user = await getCurrentUser();
    if (!user?.user_metadata) {
      return { success: true, name: null };
    }
    const meta = user.user_metadata as Record<string, unknown>;
    const name = typeof meta.name === 'string' && meta.name.trim() ? meta.name.trim() : null;
    const fullName = typeof meta.full_name === 'string' && meta.full_name.trim() ? meta.full_name.trim() : null;
    const displayName = name || fullName || null;
    return { success: true, name: displayName };
  } catch {
    return { success: true, name: null };
  }
}

/**
 * 차량 목록 조회 (Server Action)
 */
export async function fetchVehicles() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return { success: true, data: [] };
    }
    const vehicles = await getVehicles(user.id);
    return { success: true, data: vehicles };
  } catch (error) {
    console.error('Error in fetchVehicles:', error);
    return { success: false, error: '차량 목록을 불러오는데 실패했습니다.', data: [] };
  }
}

/**
 * 차량 단건 조회 (Server Action) — 수정 화면 등
 */
export async function fetchVehicleById(vehicleId: string) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return { success: false, data: null };
    const vehicle = await getVehicleById(vehicleId, user.id);
    return { success: !!vehicle, data: vehicle };
  } catch (error) {
    console.error('Error in fetchVehicleById:', error);
    return { success: false, data: null };
  }
}

/** 최신 차량 1대 (홈 미리보기 등 호환용) */
export async function fetchVehicle() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return { success: true, data: null };
    const vehicle = await getVehicle(user.id);
    return { success: true, data: vehicle };
  } catch (error) {
    console.error('Error in fetchVehicle:', error);
    return { success: false, error: '차량 정보를 불러오는데 실패했습니다.' };
  }
}

/**
 * 차량 저장 (Server Action)
 * vehicleId 있으면 수정, 없으면 새로 추가. registrationNumber/nickname 선택.
 */
export async function saveVehicle(
  vehicle: {
    manufacturer: string;
    model: string;
    variant?: string;
    year: number;
    mileage: number;
    fuelType: string;
  },
  options?: {
    vehicleId?: string;
    registrationNumber?: string;
    nickname?: string;
  }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return { success: false, error: '사용자 인증 정보가 없습니다.' };
    }
    const payload = {
      manufacturer: vehicle.manufacturer,
      model: vehicle.model,
      variant: vehicle.variant || null,
      year: vehicle.year,
      mileage: vehicle.mileage,
      fuel_type: vehicle.fuelType,
      ...(options?.registrationNumber != null && { registration_number: options.registrationNumber }),
      ...(options?.nickname != null && { nickname: options.nickname }),
    };
    if (options?.vehicleId) {
      const { data: saved, error } = await updateVehicle(options.vehicleId, user.id, payload);
      if (error || !saved) {
        return { success: false, error: error || '차량 정보를 수정하는데 실패했습니다.' };
      }
      return { success: true, data: saved };
    }
    const { data: saved, error } = await createVehicle(user.id, payload);
    if (error || !saved) {
      return { success: false, error: error || '차량 정보를 저장하는데 실패했습니다.' };
    }
    return { success: true, data: saved };
  } catch (error) {
    console.error('Error in saveVehicle:', error);
    return { success: false, error: '차량 정보를 저장하는데 실패했습니다.' };
  }
}

/**
 * 차량 삭제 (Server Action)
 */
export async function deleteVehicleAction(vehicleId: string) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return { success: false, error: '사용자 인증 정보가 없습니다.' };
    const { success, error } = await deleteVehicleQuery(vehicleId, user.id);
    return success ? { success: true } : { success: false, error: error || '삭제에 실패했어요.' };
  } catch (error) {
    console.error('Error in deleteVehicleAction:', error);
    return { success: false, error: '삭제 중 오류가 발생했어요.' };
  }
}

/**
 * 최근 검증 내역 조회 (Server Action)
 */
export async function fetchRecentHistory(limit: number = 10) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return { success: true, data: [] };
    }
    const history = await getRecentVerificationHistory(user.id, limit);
    return { success: true, data: history };
  } catch (error) {
    console.error('Error in fetchRecentHistory:', error);
    return { success: false, error: '검증 내역을 불러오는데 실패했습니다.' };
  }
}

/**
 * 특정 차량의 검증 내역 조회 (Server Action)
 */
export async function fetchRecentHistoryByVehicleId(vehicleId: string, limit: number = 100) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return { success: true, data: [] };
    const history = await getRecentVerificationHistoryByVehicleId(user.id, vehicleId, limit);
    return { success: true, data: history };
  } catch (error) {
    console.error('Error in fetchRecentHistoryByVehicleId:', error);
    return { success: false, error: '검증 내역을 불러오는데 실패했습니다.', data: [] };
  }
}

/**
 * 차량 주행거리만 수정 (Server Action)
 */
export async function updateVehicleMileageAction(vehicleId: string, mileage: number) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return { success: false, error: '사용자 인증 정보가 없습니다.' };
    if (mileage < 0) return { success: false, error: '주행거리는 0 이상이어야 해요.' };
    const { data, error } = await updateVehicle(vehicleId, user.id, { mileage });
    if (error || !data) return { success: false, error: error ?? '주행거리 수정에 실패했어요.' };
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateVehicleMileageAction:', error);
    return { success: false, error: '주행거리 수정 중 오류가 발생했어요.' };
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
 * 검증 내역 삭제 (본인 소유만)
 */
export async function deleteVerificationHistory(verificationResultId: string) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return { success: false, error: '사용자 인증 정보가 없습니다.' };
    }
    const deleted = await deleteVerificationResultById(user.id, verificationResultId);
    return deleted ? { success: true } : { success: false, error: '삭제할 수 없거나 이미 삭제된 내역이에요.' };
  } catch (error) {
    console.error('Error in deleteVerificationHistory:', error);
    return { success: false, error: '삭제 중 오류가 발생했어요.' };
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
    masterJobId?: string;
    partCost: number;
    laborCost: number;
    totalCost: number;
    category?: string;
  }>;
}) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return { success: false, error: '사용자 인증 정보가 없습니다.' };
    }
    const result = await saveEstimate(user.id, data.vehicleId, {
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
    const user = await getCurrentUser();
    if (!user?.id) {
      return { success: false, error: '사용자 인증 정보가 없습니다.' };
    }
    const result = await saveVerificationResult(user.id, data.estimateId, {
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

/** 검증 결과 저장 시 사용할 차량 정보 (견적 비교에 사용한 차량) */
export type VehicleInfoForSave = {
  manufacturer: string;
  model: string;
  variant?: string;
  year: number;
  mileage: number;
  fuelType: string;
  registrationNumber?: string;
};

/**
 * 검증 결과를 내 차에 저장 (견적을 차량에 연결 후 내 차 탭에서 보이도록)
 * - 등록된 차량 없음: 견적의 차량 정보로 새 차량 생성 후 연결
 * - 등록된 차량 있음: 이번 견적의 차량과 동일한 차량이 있으면 그 차에 연결, 없으면 새 차량 생성 후 연결
 */
export async function saveVerificationToMyCar(
  estimateId: string,
  vehicleInfo: VehicleInfoForSave
): Promise<{ success: boolean; vehicleId?: string; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return { success: false, error: '로그인한 후 저장할 수 있어요.' };
    }

    const { getVehicles } = await import('./queries');
    const vehicles = await getVehicles(user.id);

    const regNorm = vehicleInfo.registrationNumber?.replace(/\s|-/g, '').trim() || '';

    let targetVehicleId: string;

    if (vehicles.length === 0) {
      const { data: newVehicle, error: createErr } = await createVehicle(user.id, {
        manufacturer: vehicleInfo.manufacturer,
        model: vehicleInfo.model,
        variant: vehicleInfo.variant ?? null,
        year: vehicleInfo.year,
        mileage: vehicleInfo.mileage,
        fuel_type: vehicleInfo.fuelType,
        registration_number: regNorm || null,
      });
      if (createErr || !newVehicle) {
        return { success: false, error: createErr || '차량 등록에 실패했어요.' };
      }
      targetVehicleId = newVehicle.id;
    } else {
      const matched =
        regNorm &&
        vehicles.find(
          (v) => v.registration_number && v.registration_number.replace(/\s|-/g, '') === regNorm
        );
      if (matched) {
        targetVehicleId = matched.id;
      } else {
        const sameCar = vehicles.find(
          (v) =>
            v.model === vehicleInfo.model &&
            String(v.variant ?? '') === String(vehicleInfo.variant ?? '') &&
            v.year === vehicleInfo.year
        );
        if (sameCar) {
          targetVehicleId = sameCar.id;
        } else {
          const { data: newVehicle, error: createErr } = await createVehicle(user.id, {
            manufacturer: vehicleInfo.manufacturer,
            model: vehicleInfo.model,
            variant: vehicleInfo.variant ?? null,
            year: vehicleInfo.year,
            mileage: vehicleInfo.mileage,
            fuel_type: vehicleInfo.fuelType,
            registration_number: regNorm || null,
          });
          if (createErr || !newVehicle) {
            return { success: false, error: createErr || '차량 등록에 실패했어요.' };
          }
          targetVehicleId = newVehicle.id;
        }
      }
    }

    const updateResult = await updateEstimateVehicleId(estimateId, user.id, targetVehicleId);
    if (!updateResult.success) {
      return { success: false, error: updateResult.error ?? '저장에 실패했어요.' };
    }

    return { success: true, vehicleId: targetVehicleId };
  } catch (error) {
    console.error('Error in saveVerificationToMyCar:', error);
    return { success: false, error: '저장 중 오류가 났어요.' };
  }
}
