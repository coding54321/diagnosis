'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Image, X, RotateCcw, Crop } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Card, Button } from '@/components/ui';
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
      <Header title="앨범에서 선택" showBackButton onBack={() => router.back()} />
      
      <main className="min-h-screen bg-hyundai-gray-50 pb-20">
        <Container>
          <div className="py-6 space-y-4">
            {/* 숨겨진 파일 입력 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              capture="environment" // 모바일에서 카메라로 바로 촬영 가능
            />

            {selectedImage ? (
              // 선택된 이미지 미리보기
              <>
                <Card variant="default" padding="md">
                  <div className="relative aspect-[3/4] bg-hyundai-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={selectedImage}
                      alt="선택된 견적서"
                      className="w-full h-full object-contain"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </Card>

                <Card variant="default" padding="md">
                  <div className="space-y-3">
                    <div className="text-center space-y-2 mb-4">
                      <p className="text-body-1 text-hyundai-gray-900 font-medium">
                        이미지가 선택되었습니다
                      </p>
                      <p className="text-body-2 text-hyundai-gray-600">
                        사진을 확인하고 다음 단계로 진행하세요
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={handleRemoveImage}
                        className="flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        다시 선택
                      </Button>
                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => setShowCrop(true)}
                        className="flex items-center justify-center gap-2"
                      >
                        <Crop className="w-4 h-4" />
                        자르기
                      </Button>
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={handleUseImage}
                        className="flex items-center justify-center gap-2"
                      >
                        <Image className="w-4 h-4" />
                        분석하기
                      </Button>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              // 이미지 선택 안내
              <Card variant="default" padding="lg" className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-hyundai-gray-100 flex items-center justify-center">
                  <Image className="w-12 h-12 text-hyundai-gray-600" />
                </div>
                <p className="text-body-1 text-hyundai-gray-700 mb-2">
                  앨범에서 견적서 사진을 선택해주세요
                </p>
                <p className="text-body-2 text-hyundai-gray-500 mb-6">
                  JPG, PNG 형식의 이미지를 선택할 수 있어요
                </p>
                
                {error && (
                  <div className="mb-4 p-3 bg-semantic-error-light border border-semantic-error-main rounded-lg">
                    <p className="text-body-2 text-semantic-error-main">{error}</p>
                  </div>
                )}

                <Button
                  variant="primary"
                  onClick={handleSelectClick}
                  className="flex items-center justify-center gap-2 mx-auto"
                >
                  <Image className="w-4 h-4" />
                  사진 선택하기
                </Button>
              </Card>
            )}
          </div>
        </Container>
      </main>
    </>
  );
};

export default AlbumPage;
