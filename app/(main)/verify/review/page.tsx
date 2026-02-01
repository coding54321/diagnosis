'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Car, Building2, Wrench, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { mockEstimate } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';
import { createEstimate, saveVehicle, uploadEstimateImageAction, createVerificationResult } from '@/lib/supabase/actions';
import { VerificationEngine } from '@/lib/verification/engine';
import type { EstimateItem } from '@/types';

const ReviewPage: React.FC = () => {
  const router = useRouter();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // sessionStorage에서 촬영된 이미지 가져오기
  useEffect(() => {
    const image = sessionStorage.getItem('capturedEstimateImage');
    if (image) {
      setCapturedImage(image);
    }
  }, []);

  // 목업 데이터 사용 (실제로는 OCR 결과)
  const estimate = mockEstimate;

  const handleVerify = async () => {
    setIsSubmitting(true);

    try {
      // 차량 정보 저장/업데이트 (목업 데이터 기준)
      const vehicleResult = await saveVehicle({
        manufacturer: '현대',
        model: '투싼',
        variant: 'NX4',
        year: 2022,
        mileage: 45000,
        fuelType: '가솔린',
      });

      if (!vehicleResult.success || !vehicleResult.data) {
        throw new Error(vehicleResult.error || '차량 정보 저장 실패');
      }

      const vehicleId = vehicleResult.data.id;

      // 견적서 저장 (이미지는 나중에 업로드)
      const estimateResult = await createEstimate({
        vehicleId,
        shopName: estimate.shopName,
        totalAmount: estimate.totalAmount,
        items: estimate.items.map((item) => ({
          name: item.name,
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

      // 이미지 업로드 (있는 경우)
      if (capturedImage) {
        try {
          const uploadResult = await uploadEstimateImageAction(capturedImage, savedEstimateId);
          if (!uploadResult.success) {
            console.warn('Image upload failed:', uploadResult.error);
            // 이미지 업로드 실패해도 계속 진행
          }
        } catch (error) {
          console.error('Image upload failed:', error);
          // 이미지 업로드 실패해도 계속 진행
        }
      }

      // 검증 엔진 실행
      const vehicleInfo = {
        manufacturer: '현대', // TODO: 실제 차량 정보 사용
        model: '투싼',
        year: 2022,
        mileage: 45000,
      };

      const estimateItemsForVerification: EstimateItem[] = savedItems.map((item) => ({
        id: item.id,
        name: item.name,
        partCost: item.part_cost,
        laborCost: item.labor_cost,
        totalCost: item.total_cost,
        category: item.category || '',
      }));

      const verificationResult = await VerificationEngine.verifyEstimate(
        estimateItemsForVerification,
        estimate.totalAmount,
        vehicleInfo
      );

      // 검증 결과 저장
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
        })),
      });

      if (!saveVerificationResult.success) {
        console.error('검증 결과 저장 실패:', saveVerificationResult.error);
        // 검증 결과 저장 실패해도 계속 진행
      }

      // 견적서 ID를 sessionStorage에 저장
      sessionStorage.setItem('currentEstimateId', savedEstimateId);

      // 검증 결과 페이지로 이동
      router.push('/verify/result');
    } catch (error) {
      console.error('Error in handleVerify:', error);
      alert('견적서 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header title="견적서 확인" showBackButton onBack={() => router.back()} />
      
      <main className="min-h-screen bg-hyundai-gray-50 pb-20">
        <Container>
          <div className="py-6 space-y-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-6 h-6 text-hyundai-gray-600" />
                <h2 className="text-h2 text-hyundai-gray-900">
                  인식된 내용을 확인해주세요
                </h2>
              </div>
              <p className="text-body-2 text-hyundai-gray-600">
                잘못된 부분은 탭해서 수정할 수 있어요
              </p>
            </div>

            {/* 촬영된 이미지 표시 */}
            {capturedImage && (
              <Card variant="default" padding="md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-hyundai-gray-600" />
                    <p className="text-body-1 text-hyundai-gray-900 font-medium">
                      촬영된 견적서
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowImage(!showImage)}
                  >
                    {showImage ? '숨기기' : '보기'}
                  </Button>
                </div>
                {showImage && (
                  <div className="rounded-lg overflow-hidden border border-hyundai-gray-200">
                    <img
                      src={capturedImage}
                      alt="촬영된 견적서"
                      className="w-full h-auto object-contain bg-hyundai-gray-50"
                    />
                  </div>
                )}
              </Card>
            )}

            {/* 차량 정보 */}
            <Card variant="default" padding="md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-hyundai-gray-100 flex items-center justify-center">
                    <Car className="w-5 h-5 text-hyundai-gray-600" />
                  </div>
                  <div>
                    <p className="text-caption text-hyundai-gray-600 mb-1">차량 정보</p>
                    <p className="text-body-1 text-hyundai-gray-900">
                      투싼 NX4 · 2022년식 · 45,000km
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  수정
                </Button>
              </div>
            </Card>

            {/* 정비소 정보 */}
            <Card variant="default" padding="md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-hyundai-gray-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-hyundai-gray-600" />
                  </div>
                  <div>
                    <p className="text-caption text-hyundai-gray-600 mb-1">정비소 정보</p>
                    <p className="text-body-1 text-hyundai-gray-900">{estimate.shopName}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  수정
                </Button>
              </div>
            </Card>

            {/* 정비 항목 */}
            <Card variant="default" padding="md">
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-5 h-5 text-hyundai-gray-600" />
                <p className="text-caption text-hyundai-gray-600">정비 항목</p>
              </div>
              <div className="space-y-3">
                {estimate.items.map((item, index) => (
                  <Card key={item.id} variant="outlined" padding="md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-caption text-hyundai-gray-500">
                            {index + 1}.
                          </span>
                          <h4 className="text-body-1 text-hyundai-gray-900 font-medium">
                            {item.name}
                          </h4>
                        </div>
                        <div className="text-body-2 text-hyundai-gray-600 space-y-1">
                          <p>부품비: {formatPrice(item.partCost)}</p>
                          <p>공임비: {formatPrice(item.laborCost)}</p>
                          <p className="font-medium text-hyundai-gray-900">
                            소계: {formatPrice(item.totalCost)}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        수정
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* 총 금액 */}
            <Card variant="highlighted" padding="md">
              <div className="text-center">
                <p className="text-caption text-hyundai-gray-600 mb-1">총 금액</p>
                <p className="text-h2 text-hyundai-blue-600 font-bold">
                  {formatPrice(estimate.totalAmount)}
                </p>
                <p className="text-caption text-hyundai-gray-500 mt-1">
                  (부가세 포함)
                </p>
              </div>
            </Card>

            {/* 검증하기 버튼 */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleVerify}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  저장 중...
                </>
              ) : (
                '검증하기'
              )}
            </Button>
          </div>
        </Container>
      </main>
    </>
  );
};

export default ReviewPage;
