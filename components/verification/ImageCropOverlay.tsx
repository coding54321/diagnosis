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

export interface ImageCropOverlayProps {
  imageSrc: string;
  onApply: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

/** 이미지 요소와 픽셀 크롭으로 잘라낸 영역을 data URL로 반환 */
function getCroppedDataUrl(
  image: HTMLImageElement,
  crop: PixelCrop,
  quality = 0.9
): Promise<string> {
  return new Promise((resolve, reject) => {
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = Math.min(2, window.devicePixelRatio ?? 1);

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
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

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height, naturalWidth, naturalHeight } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        { unit: '%', width: 85 },
        naturalWidth / naturalHeight,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
  }, []);

  const handleApply = useCallback(async () => {
    const img = imgRef.current;
    if (!img || !img.complete || !completedCrop) {
      onCancel();
      return;
    }
    const pixelCrop = convertToPixelCrop(completedCrop, img.offsetWidth, img.offsetHeight);
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
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex-1 flex flex-col min-h-0 p-4">
        <p className="text-center text-white text-body-2 mb-2">
          잘라낼 영역을 드래그해서 크기와 위치를 조정하세요
        </p>
        <div className="relative flex-1 min-h-0 rounded-lg overflow-hidden bg-hyundai-gray-900 [&_.ReactCrop]:h-full [&_.ReactCrop__crop-wrapper]:h-full [&_.ReactCrop__media]:max-h-full [&_.ReactCrop__media]:object-contain">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => {
              setCrop(percentCrop);
              setCompletedCrop(percentCrop);
            }}
            onComplete={(_, percentCrop) => setCompletedCrop(percentCrop)}
            aspect={undefined}
            keepSelection
            className="h-full"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="크롭할 이미지"
              className="max-h-full w-auto object-contain"
              style={{ maxHeight: 'min(70vh, 80vw)' }}
              onLoad={onImageLoad}
              draggable={false}
            />
          </ReactCrop>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-white/20 text-white text-body-1 font-medium"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!completedCrop}
            className="flex-1 py-3 rounded-xl bg-hyundai-blue-500 text-white text-body-1 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
