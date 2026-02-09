'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { compressImage } from '@/lib/utils/image';

export default function AlbumPickerCard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    try {
      const compressedImage = await compressImage(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.7,
      });

      // 선택한 이미지를 세션에 저장해두고 앨범 페이지로 이동
      sessionStorage.setItem('capturedEstimateImage', compressedImage);
      router.push('/verify/album');
    } catch {
      alert('이미지를 처리하는 중 오류가 발생했습니다.');
    } finally {
      // 동일 파일 다시 선택 가능하도록 input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
        className="h-[180px] w-full rounded-2xl bg-hyundai-gray-50 p-5 active:bg-hyundai-gray-100 transition-colors flex items-end text-left"
      >
        <p className="text-[22px] font-bold leading-[1.2] tracking-tight text-hyundai-gray-700">
          앨범에서
          <br />
          가져오기
        </p>
      </button>
    </>
  );
}
