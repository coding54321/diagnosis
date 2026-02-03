/**
 * 이미지 압축 및 변환 유틸리티
 * - HEIF/HEIC 등 모든 이미지를 JPEG로 변환
 * - 최대 해상도 제한 (기본 1280px)
 * - 품질 조절을 통한 용량 압축
 */

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

const DEFAULT_OPTIONS: Required<CompressImageOptions> = {
  maxWidth: 3000,
  maxHeight: 3000,
  quality: 0.9, // OCR 정확도를 위해 고품질 유지
};

/**
 * 이미지를 JPEG로 변환하고 압축합니다.
 * @param imageSource base64 문자열 또는 File 객체
 * @param options 압축 옵션
 * @returns Promise<string> 압축된 JPEG base64 문자열
 */
export async function compressImage(
  imageSource: string | File,
  options: CompressImageOptions = {}
): Promise<string> {
  const { maxWidth, maxHeight, quality } = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        // 원본 크기
        let { width, height } = img;

        // 비율 유지하면서 최대 크기 제한
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Canvas에 그리기
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context를 생성할 수 없습니다.'));
          return;
        }

        // 흰색 배경 (투명 PNG를 JPEG로 변환 시 필요)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG로 변환
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);

        console.log(
          `[Image] 압축 완료: ${img.width}x${img.height} → ${width}x${height}, ` +
            `용량: ${Math.round(compressedBase64.length / 1024)}KB`
        );

        resolve(compressedBase64);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('이미지를 로드할 수 없습니다.'));
    };

    // 이미지 소스 설정
    if (typeof imageSource === 'string') {
      // base64 문자열인 경우
      img.src = imageSource;
    } else {
      // File 객체인 경우
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('파일을 읽을 수 없습니다.'));
      };
      reader.readAsDataURL(imageSource);
    }
  });
}

/**
 * File 객체를 압축된 JPEG base64로 변환합니다.
 * @param file 이미지 파일
 * @param options 압축 옵션
 * @returns Promise<string> 압축된 JPEG base64 문자열
 */
export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {}
): Promise<string> {
  return compressImage(file, options);
}
