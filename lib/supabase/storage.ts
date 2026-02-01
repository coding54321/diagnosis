/**
 * Supabase Storage 관련 함수
 */

import { supabase } from './client';

/**
 * 견적서 이미지 업로드
 */
export async function uploadEstimateImage(
  file: File,
  estimateId: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${estimateId}-${Date.now()}.${fileExt}`;
    const filePath = `estimates/${fileName}`;

    const { data, error } = await supabase.storage
      .from('estimate-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error);
      return { url: null, error };
    }

    // 공개 URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from('estimate-images').getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (err) {
    console.error('Error in uploadEstimateImage:', err);
    return { url: null, error: err as Error };
  }
}

/**
 * Base64 이미지를 File로 변환
 */
export function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}
