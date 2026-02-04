'use server';

/**
 * 네이버 CLOVA OCR (General) API로 이미지/문서에서 텍스트 추출.
 * Upstage와 동일한 반환 타입을 사용해 vision.ts에서 교체 가능.
 *
 * @see https://api-fin.ncloud-docs.com/docs/ai-application-service-ocr
 * @see docs/네이버_Clova_OCR_이용방법.md
 */

export type ClovaOCRResult =
  | { success: true; text: string; confidence?: number }
  | { success: false; error: string };

/** Clova General OCR 응답 이미지 항목 (필드 구조는 문서 참고) */
type ClovaImageResult = {
  uid?: string;
  name?: string;
  inferResult?: string;
  message?: string;
  fields?: Array<{ name?: string; inferText?: string; inferConfidence?: number }>;
};

/** Clova OCR 응답 본문 */
type ClovaOCRResponse = {
  images?: ClovaImageResult[];
  [key: string]: unknown;
};

/**
 * 이미지(Base64 또는 Buffer)를 CLOVA General OCR에 보내 추출된 텍스트 반환.
 * 반환된 text를 OpenAI 등 LLM에 넘겨 견적서 JSON으로 구조화하는 데 사용.
 */
export async function parseDocumentWithClova(
  imageInput: string | Buffer
): Promise<ClovaOCRResult> {
  const invokeUrl = process.env.CLOVA_OCR_INVOKE_URL;
  const secret = process.env.CLOVA_OCR_SECRET;

  if (!invokeUrl || !secret) {
    return {
      success: false,
      error: 'CLOVA_OCR_INVOKE_URL 또는 CLOVA_OCR_SECRET이 설정되지 않았습니다.',
    };
  }

  let base64String: string;
  let format = 'jpg';

  if (typeof imageInput === 'string') {
    const match = imageInput.match(/^data:image\/(\w+);base64,(.+)$/);
    if (match) {
      format = match[1].toLowerCase() === 'png' ? 'png' : 'jpg';
      base64String = match[2];
    } else {
      base64String = imageInput.replace(/^data:image\/\w+;base64,/, '');
    }
  } else {
    base64String = imageInput.toString('base64');
  }

  const body: {
    version: string;
    requestId: string;
    timestamp: number;
    lang: string;
    images: Array<{ format: string; name: string; data: string }>;
  } = {
    version: 'V2',
    requestId: crypto.randomUUID(),
    timestamp: Date.now(),
    lang: 'ko',
    images: [{ format, name: 'estimate', data: base64String }],
  };

  try {
    const response = await fetch(invokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OCR-SECRET': secret,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        error: `Clova OCR API 오류 (${response.status}): ${errText.slice(0, 300)}`,
      };
    }

    const data = (await response.json()) as ClovaOCRResponse;
    const text = extractTextFromClovaResponse(data);

    if (!text || !text.trim()) {
      return {
        success: false,
        error:
          '응답에 텍스트가 없습니다. 이미지에 텍스트가 없거나 인식되지 않았을 수 있습니다.',
      };
    }

    return { success: true, text: text.trim() };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: `Clova OCR 호출 실패: ${message}` };
  }
}

/**
 * Clova General OCR 응답에서 전체 텍스트 추출.
 * images[].fields[].inferText를 순서대로 이어 붙임.
 */
function extractTextFromClovaResponse(data: ClovaOCRResponse): string {
  const images = data?.images;
  if (!Array.isArray(images) || images.length === 0) return '';

  const lines: string[] = [];
  for (const img of images) {
    if (img.inferResult && img.inferResult !== 'SUCCESS') continue;
    const fields = img.fields;
    if (!Array.isArray(fields)) continue;
    for (const f of fields) {
      if (typeof f.inferText === 'string' && f.inferText.trim()) {
        lines.push(f.inferText.trim());
      }
    }
  }
  return lines.join('\n');
}
