'use client';

import React, { useRef, useState, useCallback } from 'react';
import ReactCrop, {
  type Crop,
  type PercentCrop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check } from 'lucide-react';

export interface ImageCropOverlayProps {
  imageSrc: string;
  onApply: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

/** 이미지 요소와 픽셀 크롭으로 잘라낸 영역을 data URL로 반환 */
function getCroppedDataUrl(
  image: HTMLImageElement,
  crop: PixelCrop,
  quality = 0.92
): Promise<string> {
  return new Promise((resolve, reject) => {
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const canvas = document.createElement('canvas');
    const cropWidth = Math.floor(crop.width * scaleX);
    const cropHeight = Math.floor(crop.height * scaleY);

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      Math.floor(crop.x * scaleX),
      Math.floor(crop.y * scaleY),
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    try {
      resolve(canvas.toDataURL('image/jpeg', quality));
    } catch {
      reject(new Error('Failed to export image'));
    }
  });
}

export default function ImageCropOverlay({ imageSrc, onApply, onCancel }: ImageCropOverlayProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop | undefined>(undefined);
  const [completedCrop, setCompletedCrop] = useState<PercentCrop | undefined>(undefined);
  const [imgLoaded, setImgLoaded] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;

    // 초기 크롭: 중앙 80%, 비율 제한 없음
    const initialCrop = centerCrop(
      makeAspectCrop(
        { unit: '%', width: 80 },
        // 원본 이미지 비율에 가깝되 약간 여유를 둔 비율
        width / height,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
    setImgLoaded(true);
  }, []);

  const handleApply = useCallback(async () => {
    const img = imgRef.current;
    if (!img || !img.complete || !completedCrop) {
      onCancel();
      return;
    }
    const pixelCrop = convertToPixelCrop(completedCrop, img.width, img.height);
    if (pixelCrop.width <= 0 || pixelCrop.height <= 0) {
      onCancel();
      return;
    }
    try {
      const dataUrl = await getCroppedDataUrl(img, pixelCrop);
      onApply(dataUrl);
    } catch (err) {
      console.error('Crop failed:', err);
      onCancel();
    }
  }, [completedCrop, onApply, onCancel]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      {/* 상단 바 — PWA 노치 구간 회피, 터치 타겟 44px 이상 */}
      <div className="shrink-0 flex items-center justify-between px-4 h-14 pt-[env(safe-area-inset-top,0px)]">
        <button
          type="button"
          onClick={onCancel}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-white active:bg-white/10 transition-colors -ml-1"
          aria-label="취소"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <p className="text-sm font-medium text-white/80">사진 자르기</p>
        <button
          type="button"
          onClick={handleApply}
          disabled={!completedCrop || !imgLoaded}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-white active:bg-white/10 transition-colors disabled:opacity-30 -mr-1"
          aria-label="적용"
        >
          <Check className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      {/* 크롭 영역 */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-4 pb-4">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => {
            setCrop(percentCrop);
          }}
          onComplete={(_, percentCrop) => setCompletedCrop(percentCrop)}
          keepSelection
          style={{ maxHeight: '100%', maxWidth: '100%' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="크롭할 이미지"
            onLoad={onImageLoad}
            draggable={false}
            style={{
              maxHeight: 'calc(100dvh - 56px - 80px)',
              maxWidth: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </ReactCrop>
      </div>

      {/* 하단 안내 */}
      <div className="shrink-0 pb-8 pt-3 px-5">
        <p className="text-center text-xs text-white/50">
          드래그하여 영역을 조정하세요
        </p>
      </div>
    </div>
  );
}
