'use server';

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface OCRResult {
  success: boolean;
  data?: {
    shopName?: string;
    date?: string;
    registrationNumber?: string; // 차량번호
    vehicleModel?: string; // 차종 (예: "아반떼(AVANTE)")
    mileage?: number; // 주행거리 (km)
    items: Array<{
      name: string;
      partCost?: number;
      laborCost?: number;
      totalCost?: number;
      category?: string;
    }>;
    totalAmount?: number;
    vatIncluded?: boolean;
    vatAmount?: number;
  };
  confidence?: number;
  status?: 'NOT_ESTIMATE' | 'POOR_QUALITY' | 'PARTIAL' | 'COMPLETE';
  warnings?: string[];
  error?: string;
}

/**
 * 블루핸즈 작업목록 데이터 (CSV에서 파싱된 데이터)
 * Server Action에서는 파일 시스템 접근이 제한되므로,
 * 필요시 빌드 시점에 CSV를 파싱하여 상수로 변환하거나,
 * 클라이언트에서만 사용하도록 분리할 수 있습니다.
 * 
 * 현재는 키워드 기반 매칭만 사용하고, 필요시 확장 가능합니다.
 */
const BLUEHANDS_MAINTENANCE_KEYWORDS: Record<string, { category: '기능정비' | '판금도장'; appCategory: string }> = {
  // 엔진 관련
  '엔진오일': { category: '기능정비', appCategory: '엔진' },
  '엔진 오일': { category: '기능정비', appCategory: '엔진' },
  '오일필터': { category: '기능정비', appCategory: '엔진' },
  '에어클리너': { category: '기능정비', appCategory: '엔진' },
  '에어 클리너': { category: '기능정비', appCategory: '엔진' },
  '스파크플러그': { category: '기능정비', appCategory: '엔진' },
  
  // 제동 관련
  '브레이크패드': { category: '기능정비', appCategory: '제동' },
  '브레이크 패드': { category: '기능정비', appCategory: '제동' },
  '브레이크디스크': { category: '기능정비', appCategory: '제동' },
  '브레이크 디스크': { category: '기능정비', appCategory: '제동' },
  
  // 변속기 관련
  '변속기오일': { category: '기능정비', appCategory: '변속기' },
  '미션오일': { category: '기능정비', appCategory: '변속기' },
  '클러치': { category: '기능정비', appCategory: '변속기' },
  
  // 전기 관련
  '배터리': { category: '기능정비', appCategory: '전기' },
  '헤드램프': { category: '기능정비', appCategory: '전기' },
  '전구': { category: '기능정비', appCategory: '전기' },
  
  // 냉각 관련
  '라디에이터': { category: '기능정비', appCategory: '냉각' },
  '워터펌프': { category: '기능정비', appCategory: '냉각' },
  '부동액': { category: '기능정비', appCategory: '냉각' },
  '냉각수': { category: '기능정비', appCategory: '냉각' },
  '증류수': { category: '기능정비', appCategory: '냉각' },
  
  // 배기 관련
  '머플러': { category: '기능정비', appCategory: '배기' },
  '배기': { category: '기능정비', appCategory: '배기' },
};

function loadBluehandsMaintenanceItems(): Array<{ category: '기능정비' | '판금도장'; no: number; name: string }> {
  // 현재는 키워드 기반 매칭만 사용
  // 필요시 CSV 파일을 파싱하여 전체 목록을 로드할 수 있습니다
  return [];
}

/**
 * 작업명 정규화 (매칭을 위해)
 */
function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()]/g, '')
    .replace(/lh|rh/gi, '')
    .replace(/양쪽/gi, '')
    .replace(/어셈블리/gi, '')
    .replace(/교체/gi, '')
    .replace(/수리/gi, '')
    .replace(/도장/gi, '')
    .replace(/판금/gi, '');
}

/**
 * OCR 항목명을 블루핸즈 키워드와 매칭하여 카테고리 추론
 */
function matchToBluehandsKeywords(ocrItemName: string): { category: '기능정비' | '판금도장'; appCategory: string } | null {
  const normalizedOcr = ocrItemName.toLowerCase().replace(/\s+/g, '');
  
  // 키워드 매칭
  for (const [keyword, info] of Object.entries(BLUEHANDS_MAINTENANCE_KEYWORDS)) {
    const normalizedKeyword = keyword.toLowerCase().replace(/\s+/g, '');
    if (normalizedOcr.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedOcr)) {
      return info;
    }
  }

  return null;
}

/**
 * 블루핸즈 카테고리를 우리 앱 카테고리로 매핑
 */
function mapBluehandsCategoryToAppCategory(
  bluehandsCategory: '기능정비' | '판금도장',
  itemName: string
): string {
  // 판금도장은 항상 "기타"로 분류
  if (bluehandsCategory === '판금도장') {
    return '기타';
  }

  // 기능정비는 작업명에서 세부 카테고리 추론
  const name = itemName.toLowerCase();
  
  if (name.includes('엔진') || name.includes('오일') || name.includes('필터') || name.includes('에어클리너') || name.includes('스파크')) {
    return '엔진';
  }
  if (name.includes('브레이크') || name.includes('제동') || name.includes('패드') || name.includes('디스크')) {
    return '제동';
  }
  if (name.includes('변속기') || name.includes('미션') || name.includes('클러치') || name.includes('트랜스')) {
    return '변속기';
  }
  if (name.includes('배터리') || name.includes('전기') || name.includes('라이트') || name.includes('전구') || name.includes('램프')) {
    return '전기';
  }
  if (name.includes('냉각') || name.includes('냉각수') || name.includes('라디에이터') || name.includes('워터펌프') || name.includes('부동액') || name.includes('증류수')) {
    return '냉각';
  }
  if (name.includes('배기') || name.includes('머플러') || name.includes('촉매')) {
    return '배기';
  }
  
  return '기타';
}

/**
 * 정비 항목명에서 카테고리 추론 (블루핸즈 키워드 활용)
 */
function inferCategory(itemName: string): string {
  // 블루핸즈 키워드와 매칭 시도
  const matched = matchToBluehandsKeywords(itemName);
  if (matched) {
    return matched.appCategory;
  }

  // 매칭 실패 시 키워드 기반 추론 (기존 로직)
  const name = itemName.toLowerCase();
  
  if (name.includes('엔진') || name.includes('오일') || name.includes('필터') || name.includes('에어클리너') || name.includes('에어 클리너')) {
    return '엔진';
  }
  if (name.includes('브레이크') || name.includes('제동') || name.includes('패드') || name.includes('디스크')) {
    return '제동';
  }
  if (name.includes('변속기') || name.includes('미션') || name.includes('클러치')) {
    return '변속기';
  }
  if (name.includes('배터리') || name.includes('전기') || name.includes('라이트') || name.includes('전구')) {
    return '전기';
  }
  if (name.includes('냉각') || name.includes('라디에이터') || name.includes('워터펌프')) {
    return '냉각';
  }
  if (name.includes('배기') || name.includes('머플러') || name.includes('촉매')) {
    return '배기';
  }
  
  return '기타';
}

/**
 * OCR 결과를 정규화하여 우리 앱의 데이터 구조에 맞춤
 * - 부품과 작업이 분리된 경우 하나의 항목으로 합치기
 * - 누락된 값 처리 (partCost/laborCost가 없으면 0)
 * - totalCost 계산 (partCost + laborCost)
 * - 블루핸즈 키워드를 활용하여 카테고리 분류
 */
function normalizeOCRItems(rawItems: any[]): Array<{
  name: string;
  partCost: number;
  laborCost: number;
  totalCost: number;
  category: string;
}> {
  const normalized: Array<{
    name: string;
    partCost: number;
    laborCost: number;
    totalCost: number;
    category: string;
  }> = [];

  // 부품과 작업이 분리된 경우를 감지하여 합치기
  const processed = new Set<number>();
  
  for (let i = 0; i < rawItems.length; i++) {
    if (processed.has(i)) continue;
    
    const item = rawItems[i];
    const name = (item.name || '').trim();
    
    // 부품명만 있고 작업명이 따로 있는 경우 찾기
    // 예: "필터-에어 클리너" (부품) + "에어 클리너 필터" (작업)
    let matchedWorkIndex = -1;
    if (item.partCost && (!item.laborCost || item.laborCost === 0)) {
      // 부품만 있는 경우, 다음 항목이 같은 이름의 작업인지 확인
      for (let j = i + 1; j < rawItems.length; j++) {
        const nextItem = rawItems[j];
        const nextName = (nextItem.name || '').trim();
        
        // 이름이 유사하고 작업비만 있는 경우
        if (
          (name.includes(nextName.split(' ')[0]) || nextName.includes(name.split('-')[0])) &&
          nextItem.laborCost &&
          (!nextItem.partCost || nextItem.partCost === 0)
        ) {
          matchedWorkIndex = j;
          break;
        }
      }
    }

    if (matchedWorkIndex > -1) {
      // 부품과 작업을 합치기
      const partItem = item;
      const workItem = rawItems[matchedWorkIndex];
      
      const combinedName = workItem.name || partItem.name || name;
      const partCost = partItem.partCost || 0;
      const laborCost = workItem.laborCost || 0;
      const totalCost = partCost + laborCost;
      
      const category = inferCategory(combinedName);
      
      normalized.push({
        name: combinedName,
        partCost,
        laborCost,
        totalCost,
        category,
      });
      
      processed.add(i);
      processed.add(matchedWorkIndex);
    } else {
      // 일반 항목 (부품비/공임비가 함께 있거나, 하나만 있거나)
      const partCost = item.partCost ?? 0;
      const laborCost = item.laborCost ?? 0;
      const totalCost = item.totalCost ?? (partCost + laborCost);
      
      const category = item.category || inferCategory(name);
      
      normalized.push({
        name: name || '정비 항목',
        partCost,
        laborCost,
        totalCost,
        category,
      });
      
      processed.add(i);
    }
  }

  return normalized;
}

/**
 * OpenAI Vision API로 견적서 이미지 분석
 * @param imageUrl Supabase Storage URL 또는 base64 이미지
 */
export async function analyzeEstimateImage(
  imageUrl: string
): Promise<OCRResult> {
  console.log('[SERVER] analyzeEstimateImage 호출됨');
  console.log('[SERVER] 이미지 URL 타입:', imageUrl.startsWith('data:') ? 'base64' : 'URL');
  console.log('[SERVER] 이미지 데이터 길이:', imageUrl.length);

  if (!process.env.OPENAI_API_KEY) {
    console.log('[SERVER] OPENAI_API_KEY가 설정되지 않음');
    return {
      success: false,
      error: 'OpenAI API 키가 설정되지 않았습니다.',
    };
  }

  console.log('[SERVER] OPENAI_API_KEY 존재함 (앞 10자):', process.env.OPENAI_API_KEY.substring(0, 10) + '...');

  try {
    // 이미지 URL이 base64인지 확인
    const imageContent = imageUrl.startsWith('data:')
      ? imageUrl
      : imageUrl; // Supabase URL인 경우 그대로 사용

    console.log('[SERVER] OpenAI API 요청 시작...');
    const startTime = Date.now();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // 정확도를 위해 gpt-4o 사용
      messages: [
        {
          role: 'system',
          content: `당신은 한국 자동차 정비 문서를 분석하는 OCR 전문가입니다.

## 문서 유형
다음 중 하나라도 해당하면 isEstimate: true로 판정:
- 자동차점검·정비명세서, 견적서, 정비명세서
- 정비 항목과 금액이 포함된 자동차 관련 문서
- 블루핸즈, 오토큐, 공임나라 등 정비소 문서

## 추출할 정보

1. **shopName**: 정비소/업체 이름 (대표자 이름 제외)
2. **date**: 정비 완료일 또는 출고일 (YYYY-MM-DD)
3. **registrationNumber**: 차량번호 (예: 12가3456)
4. **vehicleModel**: 차종 (예: 아반떼, K3, 소나타)
5. **mileage**: 주행거리 (숫자만, 콤마 제거)

6. **items**: 정비 항목 배열
   - name: 작업/부품명
   - partCost: 부품비 (없으면 0)
   - laborCost: 공임비 (없으면 0)
   - totalCost: partCost + laborCost
   - category: 제동/냉각/전기/엔진/변속기/기타

7. **totalAmount**: 최종 합계 금액 (VAT 포함)
8. **vatAmount**: 부가세 금액

## 카테고리 분류
- 제동: 브레이크, 패드, 디스크
- 냉각: 냉각수, 라디에이터, 부동액
- 전기: 배터리, 라이트
- 엔진: 엔진오일, 오일필터, 에어클리너, 점화플러그
- 변속기: 미션오일
- 기타: 위에 해당하지 않는 항목

## 중요
- 문서 양식은 다양할 수 있음 (표 구조가 다를 수 있음)
- 이미지에 보이는 숫자를 정확히 읽어주세요
- 부품비와 공임비가 분리되어 있으면 각각 추출
- 합계만 있으면 totalCost에 넣고 partCost=0, laborCost=0

## JSON 응답 형식
{
  "isEstimate": true,
  "confidence": 0.9,
  "shopName": "정비소명",
  "date": "YYYY-MM-DD",
  "registrationNumber": "차량번호",
  "vehicleModel": "차종",
  "mileage": 숫자,
  "items": [{"name": "항목명", "partCost": 0, "laborCost": 0, "totalCost": 0, "category": "카테고리"}],
  "totalAmount": 숫자,
  "vatIncluded": true,
  "vatAmount": 숫자,
  "quality": {"imageQuality": 0.9, "textRecognitionRate": 0.9},
  "warnings": []
}`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `이 자동차 정비 견적서/명세서 이미지를 분석해주세요.

이미지에서 다음 정보를 추출해주세요:
- 정비소명, 날짜, 차량번호, 차종, 주행거리
- 각 정비 항목의 이름, 부품비, 공임비
- 총 금액과 부가세

문서 양식에 관계없이 이미지에 보이는 내용을 정확히 읽어주세요.
JSON 형식으로만 응답해주세요.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageContent,
                detail: 'high', // 고해상도 분석
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4000, // 상세 분석을 위해 토큰 증가
    });

    const endTime = Date.now();
    console.log('[SERVER] OpenAI API 응답 시간:', endTime - startTime, 'ms');
    console.log('[SERVER] 응답 choices 개수:', response.choices?.length || 0);

    const content = response.choices[0]?.message?.content;
    console.log('[SERVER] 응답 content 존재:', !!content);
    console.log('[SERVER] 응답 content 길이:', content?.length || 0);

    if (!content) {
      console.log('[SERVER] content가 비어있음');
      return {
        success: false,
        error: 'OpenAI API 응답이 비어있습니다.',
      };
    }

    console.log('[SERVER] JSON 파싱 시작...');
    const parsed = JSON.parse(content);
    console.log('[SERVER] JSON 파싱 성공:', JSON.stringify(parsed, null, 2).substring(0, 500) + '...');

    // 에러 케이스 검증 - 더 유연하게 처리
    // isEstimate가 false여도 items가 있으면 유효한 문서로 처리
    const hasValidItems = parsed.items && parsed.items.length > 0;

    if (!parsed.isEstimate && !hasValidItems) {
      return {
        success: false,
        status: 'NOT_ESTIMATE',
        confidence: parsed.confidence || 0,
        warnings: parsed.warnings || [],
        error: '견적서가 아닌 것으로 보입니다.',
      };
    }

    if ((parsed.confidence || 0) < 0.3 && !hasValidItems) {
      return {
        success: false,
        status: 'NOT_ESTIMATE',
        confidence: parsed.confidence || 0,
        warnings: parsed.warnings || [],
        error: '인식 신뢰도가 낮습니다. 더 선명한 이미지로 다시 시도해주세요.',
      };
    }

    if (parsed.quality?.imageQuality < 0.5) {
      return {
        success: false,
        status: 'POOR_QUALITY',
        confidence: parsed.confidence || 0,
        warnings: parsed.warnings || [],
        error: '이미지 품질이 낮아 인식이 어려울 수 있습니다.',
      };
    }

    // 부분 인식 체크
    const hasMissingFields =
      !parsed.shopName ||
      !parsed.items ||
      parsed.items.length === 0 ||
      !parsed.totalAmount;

    const status = hasMissingFields ? 'PARTIAL' : 'COMPLETE';

    // OCR 결과 정규화
    const normalizedItems = normalizeOCRItems(parsed.items || []);

    const result: OCRResult = {
      success: true,
      data: {
        shopName: parsed.shopName,
        date: parsed.date || undefined,
        registrationNumber: parsed.registrationNumber || undefined,
        vehicleModel: parsed.vehicleModel || undefined,
        mileage: parsed.mileage || undefined,
        items: normalizedItems.map((item) => ({
          name: item.name,
          partCost: item.partCost,
          laborCost: item.laborCost,
          totalCost: item.totalCost,
          category: item.category,
        })),
        totalAmount: parsed.totalAmount,
        vatIncluded: parsed.vatIncluded ?? true,
        vatAmount: parsed.vatAmount ?? undefined,
      },
      confidence: parsed.confidence,
      status,
      warnings: parsed.warnings || [],
    };

    console.log('[SERVER] 최종 OCR 결과 반환:', JSON.stringify(result, null, 2).substring(0, 1000) + '...');
    return result;
  } catch (error) {
    console.error('[SERVER] OpenAI Vision API 오류:', error);
    console.error('[SERVER] 오류 타입:', typeof error);
    console.error('[SERVER] 오류 메시지:', error instanceof Error ? error.message : String(error));
    console.error('[SERVER] 오류 스택:', error instanceof Error ? error.stack : '스택 없음');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'OCR 처리 중 오류가 발생했습니다.',
    };
  }
}
