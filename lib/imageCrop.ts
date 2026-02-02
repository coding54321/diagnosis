/**
 * 이미지에서 영역 잘라내기 (비율 0~1)
 * @param dataUrl base64 이미지
 * @param rect { x, y, width, height } 이미지 대비 비율 (0~1)
 */
export function cropImageRect(
  dataUrl: string,
  rect: { x: number; y: number; width: number; height: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const x = Math.max(0, Math.min(1, rect.x));
      const y = Math.max(0, Math.min(1, rect.y));
      const rw = Math.max(0.01, Math.min(1 - x, rect.width));
      const rh = Math.max(0.01, Math.min(1 - y, rect.height));
      const sx = x * w;
      const sy = y * h;
      const sw = rw * w;
      const sh = rh * h;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(sw);
      canvas.height = Math.round(sh);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      try {
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch {
        reject(new Error('Failed to export image'));
      }
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = dataUrl;
  });
}

/** 컨테이너 내 박스 위치(%) → 이미지 내 비율 rect */
export function containerRectToImageRect(
  boxLeft: number,
  boxTop: number,
  boxWidth: number,
  boxHeight: number,
  containerW: number,
  containerH: number,
  imgNaturalW: number,
  imgNaturalH: number
): { x: number; y: number; width: number; height: number } {
  const scale = Math.min(containerW / imgNaturalW, containerH / imgNaturalH);
  const displayW = imgNaturalW * scale;
  const displayH = imgNaturalH * scale;
  const offsetX = (containerW - displayW) / 2;
  const offsetY = (containerH - displayH) / 2;
  const sx = (boxLeft * containerW - offsetX) / scale / imgNaturalW;
  const sy = (boxTop * containerH - offsetY) / scale / imgNaturalH;
  const sw = (boxWidth * containerW) / scale / imgNaturalW;
  const sh = (boxHeight * containerH) / scale / imgNaturalH;
  return {
    x: Math.max(0, Math.min(1, sx)),
    y: Math.max(0, Math.min(1, sy)),
    width: Math.max(0.01, Math.min(1, sw)),
    height: Math.max(0.01, Math.min(1, sh)),
  };
}
