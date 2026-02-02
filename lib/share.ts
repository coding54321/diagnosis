/**
 * 검증 결과 공유 유틸리티
 */

export interface ShareData {
  title: string;
  text: string;
  url?: string;
}

/**
 * Web Share API 사용 (모바일 네이티브 공유)
 */
export async function shareNative(data: ShareData): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title: data.title,
      text: data.text,
      url: data.url || window.location.href,
    });
    return true;
  } catch (error) {
    // 사용자가 공유를 취소한 경우
    if ((error as Error).name === 'AbortError') {
      return false;
    }
    console.error('Share failed:', error);
    return false;
  }
}

/**
 * 카카오톡 공유 (카카오 링크 API 필요, 현재는 링크만)
 */
export function shareKakao(data: ShareData) {
  const text = encodeURIComponent(data.text);
  const url = encodeURIComponent(data.url || window.location.href);
  // 카카오톡 링크: https://developers.kakao.com/docs/latest/ko/kakaotalk-link/rest-api
  // 현재는 간단하게 텍스트만 전달
  window.open(`https://talk.kakao.com/share?text=${text}`, '_blank');
}

/**
 * 문자 메시지 공유
 */
export function shareSMS(data: ShareData) {
  const text = encodeURIComponent(`${data.title}\n${data.text}\n${data.url || window.location.href}`);
  window.location.href = `sms:?body=${text}`;
}

/**
 * 이메일 공유
 */
export function shareEmail(data: ShareData) {
  const subject = encodeURIComponent(data.title);
  const body = encodeURIComponent(`${data.text}\n\n${data.url || window.location.href}`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

/**
 * 링크 복사
 */
export async function copyLink(url?: string): Promise<boolean> {
  const link = url || window.location.href;
  
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(link);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = link;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Copy failed:', error);
    return false;
  }
}

/**
 * 검증 결과를 공유용 텍스트로 변환
 */
export function formatVerificationResultForShare(
  totalAmount: number,
  status: string,
  itemCounts: { appropriate: number; reviewNeeded: number; recheckRecommended: number }
): ShareData {
  const statusText = {
    appropriate: '적정',
    review_needed: '확인 필요',
    recheck_recommended: '재검토 권장',
  }[status] || '검증 완료';

  const summary = [
    `총 견적 금액: ${totalAmount.toLocaleString()}원`,
    `검증 결과: ${statusText}`,
    `- 적정: ${itemCounts.appropriate}건`,
    `- 확인 필요: ${itemCounts.reviewNeeded}건`,
    `- 재검토 권장: ${itemCounts.recheckRecommended}건`,
  ].join('\n');

  return {
    title: '정비 견적 검증 결과',
    text: summary,
    url: window.location.href,
  };
}
