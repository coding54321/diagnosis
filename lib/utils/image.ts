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

/**
 * 이미지 품질 분석 결과 타입
 * - 모든 값은 0~1 사이의 정규화된 점수
 */
export interface ImageQualityResult {
  sharpness: number; // 0 = 매우 흐림, 1 = 매우 선명
  brightness: number; // 0 = 매우 어두움, 1 = 매우 밝음
  issues: Array<'blurry' | 'too_dark' | 'too_bright'>;
}

/**
 * 간단한 로컬 이미지 품질 분석
 * - Laplacian 대신 인접 픽셀 간 그라디언트(경사)를 이용한 샤프니스 근사
 * - 평균 밝기 기반 노출(너무 어둡거나 너무 밝음) 판단
 *
 * 주의: 이 함수는 클라이언트 전용입니다. (document / canvas 사용)
 */
export async function analyzeImageQuality(imageBase64: string): Promise<ImageQualityResult> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();

      img.onload = () => {
        try {
          // 분석용으로 다운샘플링 (성능 확보용)
          const targetSize = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            const ratio = targetSize / width;
            width = targetSize;
            height = Math.round(height * ratio);
          } else {
            const ratio = targetSize / height;
            height = targetSize;
            width = Math.round(width * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context를 생성할 수 없습니다.'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const { data } = imageData;

          let brightnessSum = 0;
          let pixelCount = 0;

          // 간단한 그라디언트 기반 샤프니스 측정
          let gradientSum = 0;
          let gradientCount = 0;

          // 전체 픽셀을 다 돌면 부담이 크므로 샘플링
          const step = 4; // 4px 간격

          const getLuma = (idx: number) => {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            // 표준 luma 가중치
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
          };

          for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
              const idx = (y * width + x) * 4;
              const luma = getLuma(idx);

              brightnessSum += luma;
              pixelCount += 1;

              // 오른쪽, 아래쪽 이웃 픽셀과의 밝기 차이로 그라디언트 계산
              if (x + step < width) {
                const rightIdx = (y * width + (x + step)) * 4;
                const rightLuma = getLuma(rightIdx);
                gradientSum += Math.abs(luma - rightLuma);
                gradientCount += 1;
              }
              if (y + step < height) {
                const bottomIdx = ((y + step) * width + x) * 4;
                const bottomLuma = getLuma(bottomIdx);
                gradientSum += Math.abs(luma - bottomLuma);
                gradientCount += 1;
              }
            }
          }

          const avgBrightness = pixelCount > 0 ? brightnessSum / pixelCount : 0;
          const avgGradient = gradientCount > 0 ? gradientSum / gradientCount : 0;

          // 0~255 범위를 0~1로 정규화
          const brightnessNorm = Math.min(Math.max(avgBrightness / 255, 0), 1);

          // 그라디언트 값도 경험적으로 0~64 범위 내에 있을 것으로 가정하고 정규화
          const sharpnessNorm = Math.min(Math.max(avgGradient / 64, 0), 1);

          const issues: ImageQualityResult['issues'] = [];

          // 임계값은 경험적 값. 너무 엄격하면 정상 사진도 막히므로 느슨하게 설정
          if (sharpnessNorm < 0.15) {
            issues.push('blurry');
          }
          if (brightnessNorm < 0.12) {
            issues.push('too_dark');
          } else if (brightnessNorm > 0.95) {
            issues.push('too_bright');
          }

          resolve({
            sharpness: sharpnessNorm,
            brightness: brightnessNorm,
            issues,
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('이미지를 로드할 수 없습니다.'));
      };

      img.src = imageBase64;
    } catch (error) {
      reject(error);
    }
  });
}
