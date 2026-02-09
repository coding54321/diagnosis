'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/utils/image';

export default function AlbumPickerCard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage =
      file.type.startsWith('image/') ||
      /\.(jpg|jpeg|png|gif|webp|heif|heic)$/i.test(file.name);
    if (!isImage) {
      alert('이미지 파일만 선택할 수 있습니다.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('파일 크기는 20MB 이하여야 합니다.');
      return;
    }

    setIsProcessing(true);
    try {
      const compressedImage = await compressImage(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.7,
      });
      sessionStorage.setItem('capturedEstimateImage', compressedImage);
      sessionStorage.setItem('pendingOcr', '1');
      router.push('/verify/review');
    } catch {
      alert('이미지를 처리하는 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isProcessing}
        className="h-[180px] w-full rounded-2xl bg-hyundai-gray-50 p-5 active:bg-hyundai-gray-100 transition-colors flex items-end text-left disabled:opacity-70"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-hyundai-gray-400" />
            <p className="text-sm text-hyundai-gray-400">처리 중...</p>
          </div>
        ) : (
          <p className="text-[22px] font-bold leading-[1.2] tracking-tight text-hyundai-gray-700">
            앨범에서
            <br />
            가져오기
          </p>
        )}
      </button>
    </>
  );
}
