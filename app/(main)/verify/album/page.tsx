'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Image, X, RotateCcw, Crop, ArrowLeft, ChevronRight } from 'lucide-react';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui';
import ImageCropOverlay from '@/components/verification/ImageCropOverlay';

const AlbumPage: React.FC = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 선택할 수 있습니다.');
      return;
    }

    // 파일 크기 검증 (10MB 제한)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    setError(null);

    // FileReader를 사용하여 이미지를 base64로 변환
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setSelectedImage(result);
      }
    };
    reader.onerror = () => {
      setError('이미지를 읽는 중 오류가 발생했습니다.');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUseImage = () => {
    if (selectedImage) {
      // sessionStorage에 이미지 저장
      sessionStorage.setItem('capturedEstimateImage', selectedImage);
      router.push('/verify/review');
    }
  };

  return (
    <>
      {showCrop && selectedImage && (
        <ImageCropOverlay
          imageSrc={selectedImage}
          onApply={(cropped) => {
            setSelectedImage(cropped);
            setShowCrop(false);
          }}
          onCancel={() => setShowCrop(false)}
        />
      )}

      <main className="min-h-screen bg-white">
        {/* 뒤로가기 헤더 */}
        <div className="flex items-center px-4 pt-[env(safe-area-inset-top,0px)]">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-12 flex items-center text-hyundai-gray-700"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <Container>
          <div className="px-1 pt-4 pb-6">
            <h1 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
              앨범에서 선택
            </h1>
            <p className="text-sm text-hyundai-gray-400 mt-1.5">
              견적서 사진을 선택해주세요
            </p>
          </div>

          {/* 숨겨진 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            capture="environment"
          />

          {error && (
            <div className="mx-1 mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {selectedImage ? (
            <div className="space-y-4 pb-10">
              {/* 선택된 이미지 미리보기 */}
              <div className="relative aspect-[3/4] bg-hyundai-gray-100 rounded-2xl overflow-hidden">
                <img
                  src={selectedImage}
                  alt="선택된 견적서"
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:bg-black/60 transition-colors"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>

              {/* 액션 버튼 */}
              <p className="text-center text-sm text-hyundai-gray-400">
                사진을 확인하고 다음 단계로 진행하세요
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={handleRemoveImage}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-hyundai-gray-200 text-sm font-medium text-hyundai-gray-700 active:bg-hyundai-gray-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
                  다시 선택
                </button>
                <button
                  onClick={() => setShowCrop(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-hyundai-gray-200 text-sm font-medium text-hyundai-gray-700 active:bg-hyundai-gray-50 transition-colors"
                >
                  <Crop className="w-4 h-4" strokeWidth={1.5} />
                  자르기
                </button>
                <button
                  onClick={handleUseImage}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-hyundai-gray-900 text-sm font-medium text-white active:bg-hyundai-gray-800 transition-colors"
                >
                  분석하기
                  <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ) : (
            <div className="pb-10">
              <Card variant="default" padding="none">
                <div className="text-center px-5 py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-hyundai-gray-50 flex items-center justify-center">
                    <Image className="w-7 h-7 text-hyundai-gray-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-hyundai-gray-700 mb-1">
                    견적서 사진을 선택해주세요
                  </p>
                  <p className="text-xs text-hyundai-gray-400 mb-6">
                    JPG, PNG 형식 · 최대 10MB
                  </p>
                  <button
                    onClick={handleSelectClick}
                    className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-hyundai-gray-900 text-sm font-medium text-white active:bg-hyundai-gray-800 transition-colors"
                  >
                    <Image className="w-4 h-4" strokeWidth={1.5} />
                    사진 선택하기
                  </button>
                </div>
              </Card>
            </div>
          )}
        </Container>
      </main>
    </>
  );
};

export default AlbumPage;
