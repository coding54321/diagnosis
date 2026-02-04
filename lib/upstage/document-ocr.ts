'use server';

/**
 * Upstage Document OCR API로 이미지/문서에서 텍스트 추출.
 * - POST /v1/document-digitization
 * - Body: multipart/form-data (model=ocr, document=파일)
 * - Response: { text, pages, confidence, ... }
 * @see https://console.upstage.ai/docs (Document OCR)
 */

const UPSTAGE_OCR_URL = 'https://api.upstage.ai/v1/document-digitization';

export type UpstageOCRResult =
  | { success: true; text: string; confidence?: number }
  | { success: false; error: string };

/**
 * 이미지(Base64 또는 Buffer)를 Upstage Document OCR에 보내 추출된 텍스트 반환.
 * 반환된 text를 OpenAI 등 LLM에 넘겨 견적서 JSON(블루핸즈 정규화)으로 구조화하는 데 사용.
 */
export async function parseDocumentWithUpstage(
  imageInput: string | Buffer
): Promise<UpstageOCRResult> {
  const apiKey = process.env.UPSTAGE_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'UPSTAGE_API_KEY가 설정되지 않았습니다.' };
  }

  let fileBuffer: Buffer;
  if (typeof imageInput === 'string') {
    const base64 = imageInput.replace(/^data:image\/\w+;base64,/, '');
    fileBuffer = Buffer.from(base64, 'base64');
  } else {
    fileBuffer = imageInput;
  }

  const form = new FormData();
  form.append('model', 'ocr');
  // Buffer를 ArrayBuffer로 변환하여 Blob 타입 호환성 해결
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength
  ) as ArrayBuffer;
  form.append('document', new Blob([arrayBuffer], { type: 'image/jpeg' }), 'estimate.jpg');

  try {
    const response = await fetch(UPSTAGE_OCR_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        error: `Upstage OCR API 오류 (${response.status}): ${errText.slice(0, 200)}`,
      };
    }

    const data = (await response.json()) as {
      text?: string;
      confidence?: number;
      pages?: Array<{ text?: string }>;
    };

    const text =
      typeof data.text === 'string'
        ? data.text
        : Array.isArray(data.pages) && data.pages.length > 0
          ? data.pages.map((p) => (typeof p.text === 'string' ? p.text : '')).join('\n')
          : '';

    if (!text) {
      return {
        success: false,
        error: '응답에 text가 없습니다. 이미지에 텍스트가 없거나 인식되지 않았을 수 있습니다.',
      };
    }

    return {
      success: true,
      text,
      confidence: typeof data.confidence === 'number' ? data.confidence : undefined,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: `Upstage OCR 호출 실패: ${message}` };
  }
}
