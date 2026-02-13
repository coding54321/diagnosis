'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader2, X, ArrowLeft, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Container } from '@/components/layout';
import { Card, BottomSheet, Input } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import { createEstimate, saveVehicle, uploadEstimateImageAction, createVerificationResult, fetchVehicleByRegistrationNumber, verifyVehicleOwnerAction, fetchVehicles } from '@/lib/supabase/actions';
import { VerificationEngine } from '@/lib/verification/engine';
import { classifyShopType } from '@/lib/verification/shop-classifier';
import { analyzeEstimateImage } from '@/lib/openai/vision';
import type { EstimateItem } from '@/types';
import type { OCRResult } from '@/lib/openai/vision';

/** 차량번호 조회로 채워지는 차량 정보 (주행거리 포함) */
type VehicleInfoFromLookup = {
  manufacturer: string;
  model: string;
  variant: string | null;
  year: number;
  mileage: number;
  fuelType: string;
};
import type { BluehandsShop } from '@/lib/data/bluehands-seoul';

/** API 정비소 응답 (위경도·거리 포함 가능) */
type ShopWithLocation = BluehandsShop & { latitude?: number | null; longitude?: number | null; distanceKm?: number | null };

/** 두 위경도 간 거리(km) - Haversine */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

type EditSheetMode = 'vehicle' | 'shop' | 'vat' | 'item' | null;

/** 위자드 스텝 (1~4) */
type WizardStep = 1 | 2 | 3 | 4;

/** 차량 확인 단계 */
type VehicleVerificationStep = 'input' | 'checking' | 'owner' | 'confirming' | 'confirmed';

const ReviewPage: React.FC = () => {
  const router = useRouter();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 위자드 스텝 (1: 성공, 2: 정비정보, 3: 차량정보, 4: 견적목록)
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);

  // Step 1에서 이미지 OCR 실행 중 (카메라에서 이미지만 저장 후 온 경우)
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<{
    type: 'NOT_ESTIMATE' | 'POOR_QUALITY' | 'ERROR';
    message: string;
  } | null>(null);

  // 추가 필드
  const [requestDate, setRequestDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [vatIncluded, setVatIncluded] = useState<boolean>(true);
  const [vatAmount, setVatAmount] = useState<number>(0);

  // 수정 바텀시트
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editSheetMode, setEditSheetMode] = useState<EditSheetMode>(null);

  // 정비소 (전국 표준데이터 검색)
  const [shopName, setShopName] = useState('');
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [shopSearchResults, setShopSearchResults] = useState<ShopWithLocation[]>([]);
  const [shopSearching, setShopSearching] = useState(false);
  const [shopLookupLoading, setShopLookupLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodeCache, setGeocodeCache] = useState<Record<string, { lat: number; lng: number }>>({});
  const geocodeRequestedRef = useRef<Set<string>>(new Set());

  // 정비 항목
  const [items, setItems] = useState<EstimateItem[]>([]);

  // OCR에서 추출한 차량 정보
  const [ocrVehicleModel, setOcrVehicleModel] = useState<string | null>(null);
  const [ocrMileage, setOcrMileage] = useState<number | null>(null);
  const [editItemIndex, setEditItemIndex] = useState<number | null>(null);
  const [editItemForm, setEditItemForm] = useState({ name: '', partCost: 0, laborCost: 0 });

  // 차량 정보 (차량번호 조회로 채워짐)
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfoFromLookup | null>(null);
  const [estimateMileage, setEstimateMileage] = useState<number>(0);
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [vehicleLoading, setVehicleLoading] = useState(false);

  // 저장된 내 차 목록 (다차량)
  const [savedVehicles, setSavedVehicles] = useState<Array<{ id: string; manufacturer: string; model: string; variant: string | null; year: number; mileage: number; fuel_type: string }>>([]);
  const [savedVehicleDismissed, setSavedVehicleDismissed] = useState(false);
  // 검증에 사용할 차량 ID (저장된 차량 중 선택 시 설정, 아니면 saveVehicle 후 반환 id 사용)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // 차량 확인 플로우 (차량번호 → 존재확인 → 소유주 → 확정)
  const [vehicleStep, setVehicleStep] = useState<VehicleVerificationStep>('input');
  const [ownerName, setOwnerName] = useState<string>('');
  const [vehicleCheckError, setVehicleCheckError] = useState<string | null>(null);
  const [ownerVerifying, setOwnerVerifying] = useState(false);

  // 데이트 피커 (iOS 스타일 스크롤)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempYear, setTempYear] = useState<number>(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState<number>(new Date().getMonth() + 1);
  const [tempDay, setTempDay] = useState<number>(new Date().getDate());

  // 데이트 피커 스크롤 ref
  const yearScrollRef = useRef<HTMLDivElement>(null);
  const monthScrollRef = useRef<HTMLDivElement>(null);
  const dayScrollRef = useRef<HTMLDivElement>(null);

  const DATE_PICKER_ITEM_HEIGHT = 48;

  // 날짜 유효성 검사 (오늘 이전만) — 스크롤 동기화에서 사용
  const isDateValidForPicker = useCallback((y: number, m: number, d: number) => {
    const today = new Date();
    const selected = new Date(y, m - 1, d);
    return selected <= today;
  }, []);
  const getDaysInMonthForPicker = useCallback((year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  }, []);

  // 스크롤 시 중앙에 온 항목을 자동 선택
  const syncYearFromScroll = useCallback(() => {
    const el = yearScrollRef.current;
    if (!el) return;
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const index = Math.round(el.scrollTop / DATE_PICKER_ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, years.length - 1));
    setTempYear(years[clamped]);
  }, []);
  const syncMonthFromScroll = useCallback(() => {
    const el = monthScrollRef.current;
    if (!el) return;
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const index = Math.round(el.scrollTop / DATE_PICKER_ITEM_HEIGHT);
    let month = Math.max(1, Math.min(index + 1, 12));
    if (tempYear === currentYear && month > currentMonth) {
      month = currentMonth;
      setTempMonth(month);
      const PADDING_TOP = 72;
      el.scrollTo({ top: PADDING_TOP + (month - 1) * DATE_PICKER_ITEM_HEIGHT - 72, behavior: 'smooth' });
      return;
    }
    setTempMonth(month);
  }, [tempYear]);
  const syncDayFromScroll = useCallback(() => {
    const el = dayScrollRef.current;
    if (!el) return;
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    const daysInMonth = getDaysInMonthForPicker(tempYear, tempMonth);
    const index = Math.round(el.scrollTop / DATE_PICKER_ITEM_HEIGHT);
    let day = Math.max(1, Math.min(index + 1, daysInMonth));
    const maxValidDay =
      tempYear === currentYear && tempMonth === currentMonth ? currentDay : daysInMonth;
    if (day > maxValidDay || !isDateValidForPicker(tempYear, tempMonth, day)) {
      day = maxValidDay;
      setTempDay(day);
      const PADDING_TOP = 72;
      el.scrollTo({
        top: PADDING_TOP + (day - 1) * DATE_PICKER_ITEM_HEIGHT - 72,
        behavior: 'smooth',
      });
      return;
    }
    setTempDay(day);
  }, [tempYear, tempMonth, getDaysInMonthForPicker, isDateValidForPicker]);

  // OCR 결과를 state에 반영 (mount 시 + Step 1에서 OCR 완료 시 공통)
  const applyOcrResultToState = useCallback((ocrResult: OCRResult) => {
    if (!ocrResult.success || !ocrResult.data) return;
    const data = ocrResult.data;
    const ocrShopName = data.shopName?.trim() || '';
    const ocrShopAddress = data.shopAddress?.trim() || '';
    if (ocrShopAddress || ocrShopName) {
      setShopLookupLoading(true);
      const params = new URLSearchParams();
      if (ocrShopName) params.set('q', ocrShopName);
      if (ocrShopAddress) params.set('address', ocrShopAddress);
      fetch(`/api/shops?${params.toString()}`)
        .then((res) => res.json())
        .then((apiData: { shops?: (BluehandsShop & { score?: number })[]; matchedBy?: string }) => {
          if (apiData.shops && apiData.shops.length >= 1) {
            setShopName(apiData.shops[0].업체명);
          }
        })
        .catch(() => {})
        .finally(() => setShopLookupLoading(false));
    }
    if (data.date) {
      const today = new Date();
      const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const dateToSet = data.date > todayYmd ? todayYmd : data.date;
      setRequestDate(dateToSet);
      const [y, m, d] = dateToSet.split('-').map(Number);
      setTempYear(y);
      setTempMonth(m);
      setTempDay(d);
    }
    if (data.items && data.items.length > 0) {
      setItems(
        data.items.map((item, index) => ({
          id: `ocr-item-${index}`,
          name: item.name,
          normalizedName: item.normalizedName,
          masterJobId: item.masterJobId,
          partCost: item.partCost || 0,
          laborCost: item.laborCost || 0,
          totalCost: item.totalCost || (item.partCost || 0) + (item.laborCost || 0),
          category: item.category || '',
        }))
      );
    }
    if (data.registrationNumber) setVehicleNumber(data.registrationNumber);
    if (data.vehicleModel) setOcrVehicleModel(data.vehicleModel);
    if (data.mileage != null) {
      setOcrMileage(data.mileage);
      setEstimateMileage(data.mileage);
    }
    if (data.vatIncluded !== undefined) setVatIncluded(data.vatIncluded);
    if (data.vatAmount != null) setVatAmount(data.vatAmount);
    if (data.registrationNumber) {
      const num = data.registrationNumber.replace(/\s|-/g, '').trim();
      fetchVehicleByRegistrationNumber(num).then((res) => {
        if (res.success && res.data) {
          setVehicleInfo(res.data);
          if (data.mileage != null) setEstimateMileage(data.mileage);
          else if (res.data.mileage > 0) setEstimateMileage(res.data.mileage);
          setSavedVehicleDismissed(true);
        }
      }).catch(() => {});
    }
  }, []);

  // Step 1 자동 전환 (OCR 성공 시에만 — 인식 실패 시에는 사용자가 '다시 촬영' 또는 '직접 입력'을 선택할 때까지 대기)
  useEffect(() => {
    if (wizardStep === 1 && !isOcrLoading && !ocrError) {
      const timer = setTimeout(() => {
        setWizardStep(2);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [wizardStep, isOcrLoading, ocrError]);

  // 데이트 피커 열릴 때 선택된 값으로 스크롤
  useEffect(() => {
    if (showDatePicker) {
      // 약간의 지연 후 스크롤 (BottomSheet 애니메이션 완료 대기)
      const timer = setTimeout(() => {
        const ITEM_HEIGHT = 48; // h-12
        const PADDING_TOP = 72; // 상단 패딩

        // 년도 스크롤 (배열 인덱스 기준)
        const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
        const yearIndex = years.indexOf(tempYear);
        if (yearScrollRef.current && yearIndex >= 0) {
          yearScrollRef.current.scrollTo({
            top: PADDING_TOP + yearIndex * ITEM_HEIGHT - 72,
            behavior: 'instant',
          });
        }

        // 월 스크롤 (1-12월, 인덱스는 0-11)
        if (monthScrollRef.current) {
          monthScrollRef.current.scrollTo({
            top: PADDING_TOP + (tempMonth - 1) * ITEM_HEIGHT - 72,
            behavior: 'instant',
          });
        }

        // 일 스크롤
        if (dayScrollRef.current) {
          dayScrollRef.current.scrollTo({
            top: PADDING_TOP + (tempDay - 1) * ITEM_HEIGHT - 72,
            behavior: 'instant',
          });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDatePicker]); // 피커가 열릴 때만 실행 (값 변경 시는 무시)

  useEffect(() => {
    const image = sessionStorage.getItem('capturedEstimateImage');
    const ocrResultJson = sessionStorage.getItem('ocrResult');
    const pendingOcr = sessionStorage.getItem('pendingOcr');
    const directInput = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('directInput') : null;

    // 직접 입력: 이미지 없이 견적 날짜/방문정비소(Step 2)부터 시작
    if (directInput && !image) {
      sessionStorage.removeItem('directInput');
      setItems([]);
      setWizardStep(2);
      setCapturedImage(null);
      setOcrError(null);
      const loadSavedVehicles = async () => {
        try {
          const res = await fetchVehicles();
          if (res.success && res.data && res.data.length > 0) {
            setSavedVehicles(res.data);
          }
        } catch {
          // 무시
        }
      };
      loadSavedVehicles();
      return;
    }

    if (image) setCapturedImage(image);

    // 카메라에서 이미지만 저장하고 온 경우: Step 1에서 OCR 실행 후 로딩 한 화면으로 표시
    if (image && pendingOcr) {
      sessionStorage.removeItem('pendingOcr');
      setIsOcrLoading(true);
      setOcrError(null);
      analyzeEstimateImage(image)
        .then((ocrResult) => {
          if (!ocrResult.success) {
            if (ocrResult.status === 'NOT_ESTIMATE') {
              setOcrError({
                type: 'NOT_ESTIMATE',
                message: '견적서가 아닌 것으로 보입니다. 정비소에서 받은 견적서를 촬영해 주세요.',
              });
            } else if (ocrResult.status === 'POOR_QUALITY') {
              setOcrError({
                type: 'POOR_QUALITY',
                message: '이미지 품질이 낮아 인식이 어려울 수 있습니다.',
              });
            } else {
              setOcrError({
                type: 'ERROR',
                message: ocrResult.error || '이미지 분석 중 오류가 발생했습니다.',
              });
            }
            return;
          }
          sessionStorage.setItem('ocrResult', JSON.stringify(ocrResult));
          applyOcrResultToState(ocrResult);
          setWizardStep(2);
        })
        .catch(() => {
          setOcrError({
            type: 'ERROR',
            message: '이미지 분석 중 오류가 발생했습니다. 직접 입력으로 진행해주세요.',
          });
        })
        .finally(() => setIsOcrLoading(false));
    }

    // OCR 결과가 이미 있으면 초기 상태 설정 (다른 경로에서 저장된 ocrResult)
    if (ocrResultJson) {
      try {
        const ocrResult: OCRResult = JSON.parse(ocrResultJson);
        applyOcrResultToState(ocrResult);
      } catch (error) {
        console.error('OCR 결과 파싱 오류:', error);
      }
    }

    // 저장된 차량 목록 불러오기
    const loadSavedVehicles = async () => {
      try {
        const res = await fetchVehicles();
        if (res.success && res.data && res.data.length > 0) {
          setSavedVehicles(res.data);
        }
      } catch {
        // 무시
      }
    };
    loadSavedVehicles();
  }, [applyOcrResultToState]);

  // 정비소 검색 (q 비어 있고 location 있으면 가까운 순 기본 목록)
  const searchShops = useCallback(async (q: string, location?: { lat: number; lng: number }) => {
    setShopSearching(true);
    try {
      const url =
        q === '' && location
          ? `/api/shops?lat=${location.lat}&lng=${location.lng}`
          : `/api/shops?q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      const data = await res.json();
      setShopSearchResults(data.shops ?? []);
    } catch {
      setShopSearchResults([]);
    } finally {
      setShopSearching(false);
    }
  }, []);

  // 정비소 시트 열릴 때 사용자 위치 요청 (거리순 정렬·기본 목록용)
  useEffect(() => {
    if (!editSheetOpen || editSheetMode !== 'shop') return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setUserLocation(null);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }, [editSheetOpen, editSheetMode]);

  // 검색어 없을 때 위치 받으면 가까운 순 기본 목록으로 다시 요청
  useEffect(() => {
    if (!userLocation || !editSheetOpen || editSheetMode !== 'shop' || shopSearchQuery !== '') return;
    searchShops('', userLocation);
  }, [userLocation, editSheetOpen, editSheetMode, shopSearchQuery, searchShops]);

  // 사용자 위치 기준 거리순 정렬 (API 좌표 + 지오코딩 캐시 활용, 전체 정비소 거리 표시)
  const sortedShopResults = useMemo((): ShopWithLocation[] => {
    const list = shopSearchResults as ShopWithLocation[];
    if (!userLocation || list.length === 0) return list;
    const withDistance = list.map((shop) => {
      let lat = shop.latitude;
      let lng = shop.longitude;
      const addressKey = [shop.시군구, shop.주소].filter(Boolean).join(' ').trim();
      if ((lat == null || lng == null) && addressKey && geocodeCache[addressKey]) {
        lat = geocodeCache[addressKey].lat;
        lng = geocodeCache[addressKey].lng;
      }
      const distanceKm =
        lat != null && lng != null ? haversineKm(userLocation.lat, userLocation.lng, lat, lng) : null;
      return { ...shop, latitude: lat ?? shop.latitude, longitude: lng ?? shop.longitude, distanceKm };
    });
    return withDistance.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [shopSearchResults, userLocation, geocodeCache]);

  // 좌표가 없는 정비소는 주소로 지오코딩 (1건씩 순차 요청, rate limit 준수)
  useEffect(() => {
    if (!userLocation || shopSearchResults.length === 0 || !editSheetOpen || editSheetMode !== 'shop') return;
    const list = shopSearchResults as ShopWithLocation[];
    const needGeocode = list.filter(
      (s) =>
        (s.latitude == null || s.longitude == null) &&
        (s.주소 || s.시군구) &&
        !geocodeCache[[s.시군구, s.주소].filter(Boolean).join(' ').trim()]
    );
    if (needGeocode.length === 0) return;
    const addressKey = [needGeocode[0].시군구, needGeocode[0].주소].filter(Boolean).join(' ').trim();
    if (geocodeRequestedRef.current.has(addressKey)) return;
    geocodeRequestedRef.current.add(addressKey);
    const timer = setTimeout(() => {
      fetch(`/api/geocode?address=${encodeURIComponent(addressKey)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
            setGeocodeCache((prev) => ({ ...prev, [addressKey]: { lat: data.lat, lng: data.lng } }));
          }
        })
        .catch(() => {})
        .finally(() => {
          geocodeRequestedRef.current.delete(addressKey);
        });
    }, 1200); // Nominatim 1 req/sec
    return () => clearTimeout(timer);
  }, [shopSearchResults, userLocation, editSheetOpen, editSheetMode, geocodeCache]);

  useEffect(() => {
    if (!editSheetOpen || editSheetMode !== 'shop') return;
    const t = setTimeout(() => searchShops(shopSearchQuery), editSheetMode === 'shop' && !shopSearchQuery ? 0 : 300);
    return () => clearTimeout(t);
  }, [editSheetOpen, editSheetMode, shopSearchQuery, searchShops]);

  // 검색 결과가 바뀌면 지오코딩 요청 추적 초기화
  useEffect(() => {
    geocodeRequestedRef.current.clear();
  }, [shopSearchResults]);

  // 총 금액 = 항목 합계 (견적서 화면에서는 항목 금액이 보통 부가세 포함이므로 이 합계가 VAT 포함 총액)
  const totalAmount = items.reduce((sum, i) => sum + i.totalCost, 0);
  // VAT 포함일 때 부가세 = 총액/11 (부가세 포함가 기준: 공급가액×1.1=포함가 → 부가세=포함가/11)
  const computedVatAmount = vatIncluded ? Math.round(totalAmount / 11) : 0;
  const estimate = { shopName, items, totalAmount };

  const openSheet = (mode: EditSheetMode) => {
    setEditSheetMode(mode);
    setEditSheetOpen(true);
  };

  const closeSheet = () => {
    setEditSheetOpen(false);
    setEditSheetMode(null);
    setEditItemIndex(null);
    setShopSearchQuery('');
    setShopSearchResults([]);
  };

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${y}.${m}.${d}`;
  };

  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  })();

  /** 차량번호로 차량 정보 불러오기 */
  const handleCheckVehicle = async () => {
    if (!vehicleNumber.trim()) return;
    setVehicleStep('checking');
    setVehicleCheckError(null);
    try {
      const res = await fetchVehicleByRegistrationNumber(vehicleNumber.replace(/\s|-/g, '').trim());
      if (res.success && res.data) {
        setVehicleInfo(res.data);
        if (ocrMileage) {
          setEstimateMileage(ocrMileage);
        } else if (res.data.mileage > 0) {
          setEstimateMileage(res.data.mileage);
        }
        setVehicleStep('owner');
      } else {
        setVehicleCheckError('등록된 차량을 찾을 수 없어요. 차량번호를 다시 확인해 주세요.');
        setVehicleStep('input');
      }
    } catch {
      setVehicleCheckError('조회 중 오류가 발생했어요. 다시 시도해 주세요.');
      setVehicleStep('input');
    }
  };

  /** 소유주 확인: DB에 등록된 소유주명과 사용자 입력값 일치 여부 검증 */
  const handleConfirmOwner = async () => {
    if (!ownerName.trim()) {
      setVehicleCheckError('소유주 이름을 입력해 주세요.');
      return;
    }
    setVehicleCheckError(null);
    setOwnerVerifying(true);
    try {
      const res = await verifyVehicleOwnerAction(vehicleNumber.replace(/\s|-/g, '').trim(), ownerName.trim());
      if (res.success) {
        setVehicleStep('confirmed');
      } else {
        setVehicleCheckError(res.error ?? '소유주 정보가 일치하지 않아요.');
      }
    } finally {
      setOwnerVerifying(false);
    }
  };

  const handleVerify = async () => {
    if (!vehicleInfo || vehicleStep !== 'confirmed') {
      alert('차량 정보를 먼저 확인해 주세요. 차량번호 조회 후 소유주를 입력해 주세요.');
      return;
    }
    const mileage = estimateMileage > 0 ? estimateMileage : vehicleInfo.mileage;
    if (mileage <= 0) {
      alert('주행거리를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      let vehicleId: string;
      if (selectedVehicleId) {
        vehicleId = selectedVehicleId;
      } else {
        const vehicleResult = await saveVehicle(
          {
            manufacturer: vehicleInfo.manufacturer,
            model: vehicleInfo.model,
            variant: vehicleInfo.variant ?? undefined,
            year: vehicleInfo.year,
            mileage,
            fuelType: vehicleInfo.fuelType,
          },
          {
            registrationNumber: vehicleNumber.replace(/\s|-/g, '').trim() || undefined,
          }
        );
        if (!vehicleResult.success || !vehicleResult.data) {
          throw new Error(vehicleResult.error || '차량 정보 저장 실패');
        }
        vehicleId = vehicleResult.data.id;
      }

      const estimateResult = await createEstimate({
        vehicleId,
        shopName: estimate.shopName,
        totalAmount: estimate.totalAmount,
        items: estimate.items.map((item) => ({
          name: item.name,
          masterJobId: item.masterJobId,
          partCost: item.partCost,
          laborCost: item.laborCost,
          totalCost: item.totalCost,
          category: item.category,
        })),
      });

      if (!estimateResult.success || !estimateResult.data) {
        throw new Error(estimateResult.error || '견적서 저장 실패');
      }

      const savedEstimateId = estimateResult.data.estimateId;
      const savedItems = estimateResult.data.items;

      if (capturedImage) {
        try {
          const uploadResult = await uploadEstimateImageAction(capturedImage, savedEstimateId);
          if (!uploadResult.success) {
            console.warn('Image upload failed:', uploadResult.error);
          }
        } catch (error) {
          console.error('Image upload failed:', error);
        }
      }

      const vehicleInfoForVerification = {
        manufacturer: vehicleInfo.manufacturer,
        model: vehicleInfo.model,
        variant: vehicleInfo.variant ?? undefined,
        year: vehicleInfo.year,
        mileage,
      };

      const estimateItemsForVerification: EstimateItem[] = savedItems.map((item, index) => ({
        id: item.id,
        name: item.name,
        normalizedName: estimate.items[index]?.normalizedName,
        masterJobId: estimate.items[index]?.masterJobId || item.master_job_id || undefined,
        partCost: item.part_cost,
        laborCost: item.labor_cost,
        totalCost: item.total_cost,
        category: item.category || '',
      }));

      const shopType = classifyShopType(estimate.shopName);
      const verificationResult = await VerificationEngine.verifyEstimate(
        estimateItemsForVerification,
        estimate.totalAmount,
        vehicleInfoForVerification,
        shopType
      );

      const saveVerificationResult = await createVerificationResult({
        estimateId: savedEstimateId,
        totalAmount: estimate.totalAmount,
        status: verificationResult.status,
        confidence: verificationResult.confidence,
        items: verificationResult.items.map((item, index) => ({
          estimateItemId: savedItems[index]?.id || '',
          status: item.status,
          userPrice: item.userPrice,
          averagePrice: item.averagePrice,
          minPrice: item.priceRange.min,
          maxPrice: item.priceRange.max,
          medianPrice: item.priceRange.median,
          sampleCount: item.sampleCount,
          partCostUser: item.breakdown.partCost.user,
          partCostAverage: item.breakdown.partCost.average,
          laborCostUser: item.breakdown.laborCost.user,
          laborCostAverage: item.breakdown.laborCost.average,
          partPriceSource: item.breakdown.partCost.partPriceSource ?? null,
        })),
      });

      if (!saveVerificationResult.success) {
        console.error('검증 결과 저장 실패:', saveVerificationResult.error);
      }

      sessionStorage.setItem('currentEstimateId', savedEstimateId);
      if (vehicleNumber.trim()) {
        sessionStorage.setItem('currentVehicleRegistration', vehicleNumber.replace(/\s|-/g, '').trim());
      }
      if (estimate.shopName?.trim()) {
        sessionStorage.setItem('currentShopName', estimate.shopName.trim());
      }
      router.push('/verify/result');
    } catch (error) {
      console.error('Error in handleVerify:', error);
      alert('견적서 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 날짜 유효성 검사 (오늘 이전만)
  const isDateValid = (y: number, m: number, d: number) => {
    const today = new Date();
    const selected = new Date(y, m - 1, d);
    return selected <= today;
  };

  // 해당 월의 일수 계산
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  // 데이트 피커에서 날짜 선택 확정 (오늘 이후는 저장하지 않음)
  const confirmDate = () => {
    const daysInMonth = getDaysInMonth(tempYear, tempMonth);
    const day = Math.min(tempDay, daysInMonth);
    let y = tempYear;
    let m = tempMonth;
    let d = day;
    const today = new Date();
    const selected = new Date(y, m - 1, d);
    if (selected > today) {
      y = today.getFullYear();
      m = today.getMonth() + 1;
      d = today.getDate();
    }
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    setRequestDate(dateStr);
    setShowDatePicker(false);
  };

  // ========== 위자드 스텝별 렌더링 ==========

  // Step 1: 성공 화면 (OCR 로딩 중이면 여기서 로딩, 완료 시 2단계로 / 에러 시 안내)
  const renderStep1 = () => {
    if (ocrError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold text-hyundai-gray-900 text-center mb-2">
            인식에 실패했어요
          </h1>
          <div className="text-sm text-hyundai-gray-500 text-center mb-6 space-y-1">
            {ocrError.type === 'NOT_ESTIMATE' && ocrError.message.includes('.') ? (
              <>
                <p>{ocrError.message.split('.')[0]}.</p>
                <p>{ocrError.message.split('.').slice(1).join('.').trim()}</p>
              </>
            ) : (
              <p>{ocrError.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2.5 w-full max-w-xs">
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('capturedEstimateImage');
                sessionStorage.removeItem('pendingOcr');
                sessionStorage.removeItem('ocrResult');
                router.replace('/verify/camera');
              }}
              className="w-full py-3 rounded-xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 transition-colors"
            >
              다시 촬영하기
            </button>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('capturedEstimateImage');
                sessionStorage.removeItem('pendingOcr');
                sessionStorage.removeItem('ocrResult');
                if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('directInput', 'true');
                setCapturedImage(null);
                setIsOcrLoading(false);
                setOcrError(null);
                setWizardStep(2);
              }}
              className="w-full py-3 rounded-xl border border-hyundai-gray-200 text-hyundai-gray-700 text-sm font-medium active:bg-hyundai-gray-50 transition-colors"
            >
              직접 입력하기
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 animate-in zoom-in duration-300">
          <CheckCircle2 className="w-10 h-10 text-green-500" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold text-hyundai-gray-900 text-center mb-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          견적서가 입력되었어요
        </h1>
        <p className="text-base text-hyundai-gray-500 text-center leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          정확한 견적 검증을 위해<br />
          몇 가지 정보를 확인할게요
        </p>
        <div className="mt-8 flex items-center gap-2 text-sm text-hyundai-gray-400 animate-in fade-in duration-700 delay-500">
          {isOcrLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              잠시만 기다려주세요...
            </>
          ) : (
            <>잠시만 기다려주세요...</>
          )}
        </div>
      </div>
    );
  };

  // Step 2: 정비 정보 (날짜 + 정비소)
  const renderStep2 = () => (
    <div className="px-5">
      {/* 질문 헤더 */}
      <div className="pt-8 pb-6">
        <h1 className="text-[26px] font-bold text-hyundai-gray-900 leading-tight">
          {formatDate(requestDate)}에<br />
          {shopLookupLoading ? (
            <span className="text-hyundai-gray-400">정비소 확인 중...</span>
          ) : shopName ? (
            <span className="text-hyundai-primary">{shopName}</span>
          ) : (
            <span className="text-hyundai-gray-400">정비소</span>
          )}
          을<br />
          방문했어요
        </h1>
        <p className="text-sm text-hyundai-gray-400 mt-3">
          날짜와 정비소 정보가 맞는지 확인해주세요
        </p>
      </div>

      {/* 수정 카드들 */}
      <div className="space-y-3">
        {/* 날짜 수정 */}
        <button
          type="button"
          onClick={() => setShowDatePicker(true)}
          className="w-full flex items-center justify-between p-4 bg-hyundai-gray-50 rounded-2xl active:bg-hyundai-gray-100 transition-colors"
        >
          <div className="text-left">
            <p className="text-xs text-hyundai-gray-400 mb-1">방문일</p>
            <p className="text-base font-medium text-hyundai-gray-900">{formatDate(requestDate)}</p>
          </div>
          <span className="text-sm text-hyundai-primary font-medium">변경</span>
        </button>

        {/* 정비소 수정 */}
        <button
          type="button"
          onClick={() => openSheet('shop')}
          className="w-full flex items-center justify-between p-4 bg-hyundai-gray-50 rounded-2xl active:bg-hyundai-gray-100 transition-colors"
        >
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs text-hyundai-gray-400 mb-1">정비소</p>
            {shopLookupLoading ? (
              <p className="text-sm text-hyundai-gray-500 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" strokeWidth={1.5} />
                전국 등록 업체에서 확인 중...
              </p>
            ) : shopName ? (
              <p className="text-base font-medium text-hyundai-gray-900 truncate">{shopName}</p>
            ) : (
              <p className="text-sm text-hyundai-gray-400">정비소를 선택해주세요</p>
            )}
          </div>
          <span className="text-sm text-hyundai-primary font-medium shrink-0 ml-2">
            {shopName ? '변경' : '검색'}
          </span>
        </button>
      </div>

      {/* 다음 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-hyundai-gray-100 px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <button
          type="button"
          onClick={() => setWizardStep(3)}
          disabled={!shopName || shopLookupLoading}
          className="w-full py-4 rounded-2xl bg-hyundai-gray-900 text-white text-base font-semibold active:bg-hyundai-gray-800 transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          다음
        </button>
      </div>
    </div>
  );

  // Step 3: 차량 정보 (차량번호 + 소유주)
  const renderStep3 = () => (
    <div className="px-5">
      {/* 질문 헤더 */}
      <div className="pt-8 pb-6">
        <h1 className="text-[26px] font-bold text-hyundai-gray-900 leading-tight">
          어떤 차량의<br />
          견적서인가요?
        </h1>
        <p className="text-sm text-hyundai-gray-400 mt-3">
          차량 정보를 확인하면 더 정확한 검증이 가능해요
        </p>
      </div>

      {/* 저장된 내 차 목록이 있고, 아직 차량 정보를 설정하지 않았을 때 */}
      {savedVehicles.length > 0 && !vehicleInfo && !savedVehicleDismissed && vehicleStep === 'input' && (
        <div className="mb-4 space-y-3">
          <p className="text-xs text-hyundai-gray-500">저장된 내 차량</p>
          {savedVehicles.length === 1 ? (
            <div className="p-4 bg-hyundai-gray-50 rounded-2xl">
              <p className="text-base font-medium text-hyundai-gray-900 mb-3">
                {savedVehicles[0].manufacturer} {savedVehicles[0].model}
                {savedVehicles[0].variant ? ` ${savedVehicles[0].variant}` : ''} · {savedVehicles[0].year}년식
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const v = savedVehicles[0];
                    setVehicleInfo({
                      manufacturer: v.manufacturer,
                      model: v.model,
                      variant: v.variant,
                      year: v.year,
                      mileage: v.mileage,
                      fuelType: v.fuel_type,
                    });
                    setEstimateMileage(v.mileage);
                    setSelectedVehicleId(v.id);
                    setSavedVehicleDismissed(true);
                    setVehicleStep('confirmed');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 transition-colors"
                >
                  이 차량 선택
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSavedVehicleDismissed(true);
                    setSelectedVehicleId(null);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-white text-hyundai-gray-500 text-sm font-medium active:bg-hyundai-gray-100 transition-colors border border-hyundai-gray-200"
                >
                  다른 차량
                </button>
              </div>
            </div>
          ) : (
            <>
              {savedVehicles.map((v) => (
                <div key={v.id} className="p-4 bg-hyundai-gray-50 rounded-2xl">
                  <p className="text-base font-medium text-hyundai-gray-900 mb-3">
                    {v.manufacturer} {v.model}
                    {v.variant ? ` ${v.variant}` : ''} · {v.year}년식
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setVehicleInfo({
                        manufacturer: v.manufacturer,
                        model: v.model,
                        variant: v.variant,
                        year: v.year,
                        mileage: v.mileage,
                        fuelType: v.fuel_type,
                      });
                      setEstimateMileage(v.mileage);
                      setSelectedVehicleId(v.id);
                      setSavedVehicleDismissed(true);
                      setVehicleStep('confirmed');
                    }}
                    className="w-full py-2.5 rounded-xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 transition-colors"
                  >
                    이 차량 선택
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setSavedVehicleDismissed(true);
                  setSelectedVehicleId(null);
                }}
                className="w-full py-2.5 rounded-xl border border-hyundai-gray-200 text-hyundai-gray-600 text-sm font-medium active:bg-hyundai-gray-50 transition-colors"
              >
                다른 차량으로 입력
              </button>
            </>
          )}
        </div>
      )}

      {/* 차량 확인 플로우 */}
      {(savedVehicleDismissed || savedVehicles.length === 0) && vehicleStep !== 'confirmed' && (
        <div className="space-y-4">
          {/* Step 3-1: 차량번호 입력 */}
          {vehicleStep === 'input' && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-hyundai-gray-700 mb-2 block">차량번호</span>
                <Input
                  placeholder="예: 12가3456"
                  value={vehicleNumber}
                  onChange={(e) => {
                    setVehicleNumber(e.target.value.trim());
                    setVehicleCheckError(null);
                  }}
                  className="text-base"
                  fullWidth
                />
              </label>
              {vehicleCheckError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {vehicleCheckError}
                </p>
              )}
              <button
                type="button"
                onClick={handleCheckVehicle}
                disabled={!vehicleNumber.trim()}
                className="w-full py-3.5 rounded-xl bg-hyundai-gray-100 text-hyundai-gray-800 text-sm font-medium active:bg-hyundai-gray-200 disabled:opacity-50 disabled:pointer-events-none"
              >
                차량 조회
              </button>
            </div>
          )}

          {/* Step 3-1.5: 조회 중 */}
          {vehicleStep === 'checking' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-hyundai-gray-400 mb-3" />
              <p className="text-sm text-hyundai-gray-500">차량 정보를 조회하고 있어요...</p>
            </div>
          )}

          {/* Step 3-2: 소유주 확인 */}
          {vehicleStep === 'owner' && vehicleInfo && (
            <div className="space-y-4">
              {/* 조회된 차량 정보 */}
              <div className="p-4 bg-green-50 rounded-2xl">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-hyundai-gray-900">
                      {vehicleInfo.manufacturer} {vehicleInfo.model}
                      {vehicleInfo.variant ? ` ${vehicleInfo.variant}` : ''}
                    </p>
                    <p className="text-sm text-hyundai-gray-500 mt-0.5">
                      {vehicleNumber} · {vehicleInfo.year}년식 · {vehicleInfo.fuelType}
                    </p>
                  </div>
                </div>
              </div>

              {/* 소유주 입력 */}
              <label className="block">
                <span className="text-sm font-medium text-hyundai-gray-700 mb-2 block">소유주 이름</span>
                <Input
                  placeholder="차량등록증에 기재된 이름"
                  value={ownerName}
                  onChange={(e) => {
                    setOwnerName(e.target.value);
                    setVehicleCheckError(null);
                  }}
                  className="text-base"
                  fullWidth
                />
                <p className="text-xs text-hyundai-gray-400 mt-1.5">
                  차량등록증에 기재된 소유주명을 입력해주세요
                </p>
              </label>
              {vehicleCheckError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {vehicleCheckError}
                </p>
              )}
              <button
                type="button"
                onClick={handleConfirmOwner}
                disabled={!ownerName.trim() || ownerVerifying}
                className="w-full py-3.5 rounded-xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 disabled:opacity-50 disabled:pointer-events-none"
              >
                {ownerVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline-block mr-2 align-middle" />
                    확인 중...
                  </>
                ) : (
                  '확인'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 확정된 상태 */}
      {vehicleStep === 'confirmed' && vehicleInfo && (
        <div className="space-y-3">
          <div className="p-4 bg-green-50 rounded-2xl">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-base font-medium text-hyundai-gray-900">
                  {vehicleInfo.manufacturer} {vehicleInfo.model}
                  {vehicleInfo.variant ? ` ${vehicleInfo.variant}` : ''}
                </p>
                <p className="text-sm text-hyundai-gray-500 mt-0.5">
                  {vehicleNumber} · {vehicleInfo.year}년식 · {vehicleInfo.fuelType}
                  {estimateMileage > 0 ? ` · ${estimateMileage.toLocaleString()}km` : ''}
                </p>
                {ownerName && (
                  <p className="text-sm text-green-600 mt-1">소유주: {ownerName}</p>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setVehicleStep('input');
              setVehicleInfo(null);
              setOwnerName('');
              setSelectedVehicleId(null);
            }}
            className="text-sm text-hyundai-gray-500 underline"
          >
            다른 차량으로 변경
          </button>
        </div>
      )}

      {/* 다음 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-hyundai-gray-100 px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <button
          type="button"
          onClick={() => setWizardStep(4)}
          disabled={vehicleStep !== 'confirmed'}
          className="w-full py-4 rounded-2xl bg-hyundai-gray-900 text-white text-base font-semibold active:bg-hyundai-gray-800 transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          다음
        </button>
      </div>
    </div>
  );

  // Step 4: 견적 목록 + 검증하기
  const renderStep4 = () => (
    <div className="px-5 pb-36">
      {/* 질문 헤더 */}
      <div className="pt-8 pb-6">
        <h1 className="text-[26px] font-bold text-hyundai-gray-900 leading-tight">
          견적 내역을<br />
          확인해주세요
        </h1>
        <p className="text-sm text-hyundai-gray-400 mt-3">
          인식된 정비 항목과 금액이 맞는지 확인해주세요
        </p>
      </div>

      {/* 요약 정보 */}
      <div className="p-4 bg-hyundai-gray-50 rounded-2xl mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-hyundai-gray-500">방문일</span>
          <span className="font-medium text-hyundai-gray-900">{formatDate(requestDate)}</span>
        </div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-hyundai-gray-500">정비소</span>
          <span className="font-medium text-hyundai-gray-900">{shopName}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-hyundai-gray-500">차량</span>
          <span className="font-medium text-hyundai-gray-900">
            {vehicleInfo?.manufacturer} {vehicleInfo?.model}
          </span>
        </div>
      </div>

      {/* 정비 항목 리스트 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-bold text-hyundai-gray-900">정비 항목</h3>
          <span className="text-sm text-hyundai-gray-400">{items.length}건</span>
        </div>
        {items.length > 0 && (
          <p className="text-xs text-hyundai-gray-400 mb-3">항목을 눌러 수정할 수 있어요</p>
        )}
        <Card variant="default" padding="none">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-hyundai-gray-500 mb-4">등록된 정비 항목이 없어요</p>
              <button
                type="button"
                onClick={() => {
                  setEditItemIndex(null);
                  setEditItemForm({ name: '', partCost: 0, laborCost: 0 });
                  openSheet('item');
                }}
                className="py-3 px-5 rounded-xl border border-hyundai-gray-200 text-sm font-medium text-hyundai-gray-700 active:bg-hyundai-gray-50 transition-colors"
              >
                항목 추가
              </button>
            </div>
          ) : (
            <>
              {items.map((item, index) => (
                <React.Fragment key={item.id}>
                  {index > 0 && <div className="mx-4 border-b border-hyundai-gray-100" />}
                  <button
                    type="button"
                    onClick={() => {
                      setEditItemIndex(index);
                      setEditItemForm({
                        name: item.name,
                        partCost: item.partCost,
                        laborCost: item.laborCost,
                      });
                      openSheet('item');
                    }}
                    className="w-full px-4 py-4 active:bg-hyundai-gray-50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-hyundai-gray-900 truncate">{item.name}</p>
                          <p className="text-sm font-bold text-hyundai-gray-900 shrink-0 ml-3">
                            {formatPrice(item.totalCost)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-hyundai-gray-400">
                          <span>부품 {formatPrice(item.partCost)}</span>
                          <span className="text-hyundai-gray-200">|</span>
                          <span>공임 {formatPrice(item.laborCost)}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-hyundai-gray-300 shrink-0" strokeWidth={1.5} />
                    </div>
                  </button>
                </React.Fragment>
              ))}
              <div className="mx-4 border-t border-hyundai-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditItemIndex(null);
                    setEditItemForm({ name: '', partCost: 0, laborCost: 0 });
                    openSheet('item');
                  }}
                  className="w-full py-3 text-sm text-hyundai-gray-500 active:bg-hyundai-gray-50 transition-colors"
                >
                  + 항목 추가
                </button>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* 하단 고정 바 */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-hyundai-gray-100">
        <div className="max-w-lg mx-auto px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-hyundai-gray-400">총 금액</span>
            <div className="text-right">
              <span className="text-xl font-bold text-hyundai-gray-900">
                {formatPrice(totalAmount)}
              </span>
              <span className="text-xs text-hyundai-gray-400 ml-1">
                {vatIncluded ? '(VAT 포함)' : '(VAT 미포함)'}
              </span>
            </div>
          </div>
          <button
            onClick={handleVerify}
            disabled={isSubmitting || items.length === 0}
            className="w-full py-4 rounded-2xl bg-hyundai-gray-900 text-white text-base font-semibold active:bg-hyundai-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                검증 중...
              </>
            ) : (
              '견적 검증하기'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // iOS 스타일 스크롤 데이트 피커
  const renderDatePicker = () => {
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const daysInCurrentMonth = getDaysInMonth(tempYear, tempMonth);
    const days = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

    return (
      <BottomSheet
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        title="날짜 선택"
      >
        <div className="flex gap-2 h-48 mb-6 relative">
          {/* 선택 영역 하이라이트 */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 bg-hyundai-gray-100 rounded-xl pointer-events-none" />

          {/* 년 */}
          <div
            ref={yearScrollRef}
            onScroll={syncYearFromScroll}
            className="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-hide relative"
          >
            <div className="h-[72px]" /> {/* 상단 패딩 (중앙 정렬용) */}
            {years.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => setTempYear(year)}
                className={`w-full h-12 flex items-center justify-center snap-center transition-colors ${
                  tempYear === year
                    ? 'text-hyundai-gray-900 font-bold text-lg'
                    : 'text-hyundai-gray-400 text-base'
                }`}
              >
                {year}년
              </button>
            ))}
            <div className="h-[72px]" /> {/* 하단 패딩 (중앙 정렬용) */}
          </div>
          {/* 월 — 올해 선택 시 현재 월까지만 선택 가능 */}
          {(() => {
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth() + 1;
            const isMonthDisabled = tempYear === currentYear ? (month: number) => month > currentMonth : () => false;
            return (
              <div
                ref={monthScrollRef}
                onScroll={syncMonthFromScroll}
                className="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-hide relative"
              >
                <div className="h-[72px]" />
                {months.map((month) => {
                  const disabled = isMonthDisabled(month);
                  return (
                    <button
                      key={month}
                      type="button"
                      onClick={() => !disabled && setTempMonth(month)}
                      disabled={disabled}
                      className={`w-full h-12 flex items-center justify-center snap-center transition-colors ${
                        tempMonth === month
                          ? 'text-hyundai-gray-900 font-bold text-lg'
                          : disabled
                          ? 'text-hyundai-gray-200 text-base cursor-not-allowed'
                          : 'text-hyundai-gray-400 text-base'
                      }`}
                    >
                      {month}월
                    </button>
                  );
                })}
                <div className="h-[72px]" />
              </div>
            );
          })()}
          {/* 일 */}
          <div
            ref={dayScrollRef}
            onScroll={syncDayFromScroll}
            className="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-hide relative"
          >
            <div className="h-[72px]" />
            {days.map((day) => {
              const isValidDate = isDateValid(tempYear, tempMonth, day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => isValidDate && setTempDay(day)}
                  disabled={!isValidDate}
                  className={`w-full h-12 flex items-center justify-center snap-center transition-colors ${
                    tempDay === day
                      ? 'text-hyundai-gray-900 font-bold text-lg'
                      : isValidDate
                      ? 'text-hyundai-gray-400 text-base'
                      : 'text-hyundai-gray-200 text-base cursor-not-allowed'
                  }`}
                >
                  {day}일
                </button>
              );
            })}
            <div className="h-[72px]" />
          </div>
        </div>
        <button
          type="button"
          onClick={confirmDate}
          className="w-full py-3.5 rounded-xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 transition-colors"
        >
          선택 완료
        </button>
      </BottomSheet>
    );
  };

  return (
    <>
      <main className="min-h-screen bg-white">
        {/* 뒤로가기 헤더 (Step 1 제외) */}
        {wizardStep > 1 && (
          <div className="flex items-center px-4 pt-[env(safe-area-inset-top,0px)]">
            <button
              type="button"
              onClick={() => {
                if (wizardStep === 2) {
                  router.push('/verify/camera');
                } else {
                  setWizardStep((prev) => (prev > 1 ? (prev - 1) as WizardStep : prev));
                }
              }}
              className="h-14 flex items-center text-hyundai-gray-700"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
            {/* 스텝 인디케이터 */}
            <div className="flex-1 flex justify-center gap-1.5">
              {[2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1 rounded-full transition-all ${
                    wizardStep >= step ? 'w-8 bg-hyundai-gray-900' : 'w-1 bg-hyundai-gray-200'
                  }`}
                />
              ))}
            </div>
            <div className="w-5" /> {/* 좌우 대칭용 */}
          </div>
        )}

        <Container>
          {wizardStep === 1 && renderStep1()}
          {wizardStep === 2 && renderStep2()}
          {wizardStep === 3 && renderStep3()}
          {wizardStep === 4 && renderStep4()}
        </Container>
      </main>

      {/* 데이트 피커 */}
      {renderDatePicker()}

      {/* 수정 바텀시트 */}
      <BottomSheet
        isOpen={editSheetOpen}
        onClose={closeSheet}
        title={
          editSheetMode === 'vehicle' ? '차량 정보'
            : editSheetMode === 'shop' ? '정비소 검색'
            : editSheetMode === 'vat' ? '부가세'
            : editSheetMode === 'item' ? (editItemIndex !== null ? '항목 수정' : '항목 추가')
            : undefined
        }
      >
        {editSheetMode === 'shop' && (
          <div className="h-[55vh] flex flex-col gap-3">
            <p className="text-xs text-hyundai-gray-500 shrink-0">
              전국 등록 정비업체에서 검색해요. 업체명·주소로 찾을 수 있어요.
            </p>
            <Input
              placeholder="업체명, 구·군, 주소로 검색"
              value={shopSearchQuery}
              onChange={(e) => setShopSearchQuery(e.target.value)}
              fullWidth
              className="shrink-0"
            />
            <div className="flex-1 min-h-0 overflow-y-auto -mx-1">
              {shopSearching && (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-hyundai-gray-300" strokeWidth={1.5} />
                </div>
              )}
              {!shopSearching && shopSearchQuery.trim() && shopSearchResults.length === 0 && (
                <p className="text-xs text-hyundai-gray-400 py-6 text-center">검색 결과가 없어요</p>
              )}
              {!shopSearching &&
                sortedShopResults.map((shop, idx) => (
                  <button
                    key={`${shop.업체명}-${shop.주소}-${idx}`}
                    type="button"
                    onClick={() => {
                      setShopName(shop.업체명);
                      closeSheet();
                    }}
                    className="w-full text-left px-3 py-3 rounded-xl active:bg-hyundai-gray-50 transition-colors border-b border-hyundai-gray-50 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-hyundai-gray-900">{shop.업체명}</p>
                        <p className="text-xs text-hyundai-gray-400 mt-0.5">
                          {[shop.시군구, shop.주소].filter(Boolean).join(' · ')}
                        </p>
                        {shop.전화번호 && (
                          <p className="text-xs text-hyundai-gray-500 mt-0.5">{shop.전화번호}</p>
                        )}
                      </div>
                      {shop.distanceKm != null && (
                        <span className="text-xs text-hyundai-gray-500 shrink-0 whitespace-nowrap">
                          약 {shop.distanceKm < 1 ? `${Math.round(shop.distanceKm * 1000)}m` : `${shop.distanceKm.toFixed(1)}km`}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {editSheetMode === 'item' && (
          <div className="space-y-4">
            <Input
              label="항목명"
              placeholder="정비 항목명"
              value={editItemForm.name}
              onChange={(e) => setEditItemForm((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            <Input
              type="number"
              label="부품비 (원)"
              placeholder="0"
              value={editItemForm.partCost > 0 ? String(editItemForm.partCost) : ''}
              onChange={(e) =>
                setEditItemForm((prev) => ({ ...prev, partCost: Number(e.target.value) || 0 }))
              }
              fullWidth
            />
            <Input
              type="number"
              label="공임비 (원)"
              placeholder="0"
              value={editItemForm.laborCost > 0 ? String(editItemForm.laborCost) : ''}
              onChange={(e) =>
                setEditItemForm((prev) => ({ ...prev, laborCost: Number(e.target.value) || 0 }))
              }
              fullWidth
            />
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-hyundai-gray-400">소계</span>
              <span className="text-sm font-bold text-hyundai-gray-900">
                {formatPrice(editItemForm.partCost + editItemForm.laborCost)}
              </span>
            </div>
            <button
              onClick={() => {
                const totalCost = editItemForm.partCost + editItemForm.laborCost;
                if (editItemIndex !== null) {
                  const item = items[editItemIndex];
                  if (!item) return;
                  setItems((prev) =>
                    prev.map((it, i) =>
                      i === editItemIndex
                        ? {
                            ...it,
                            name: editItemForm.name || it.name,
                            partCost: editItemForm.partCost,
                            laborCost: editItemForm.laborCost,
                            totalCost,
                          }
                        : it
                    )
                  );
                } else {
                  setItems((prev) => [
                    ...prev,
                    {
                      id: `manual-${Date.now()}`,
                      name: editItemForm.name || '정비 항목',
                      normalizedName: '',
                      masterJobId: undefined,
                      partCost: editItemForm.partCost,
                      laborCost: editItemForm.laborCost,
                      totalCost,
                      category: '',
                    },
                  ]);
                }
                closeSheet();
              }}
              className="w-full py-3 rounded-xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 transition-colors"
            >
              완료
            </button>
          </div>
        )}
      </BottomSheet>
    </>
  );
};

export default ReviewPage;
