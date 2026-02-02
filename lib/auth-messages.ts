/**
 * Supabase Auth 에러 메시지를 사용자 친화적인 한글 메시지로 변환
 * (보안상 이메일 미존재/비밀번호 오류는 동일한 문구로 표시)
 */

const AUTH_ERROR_MAP: Array<{ match: string | RegExp; message: string }> = [
  // 로그인/계정 인증
  {
    match: /invalid login credentials|invalid_credentials|invalid email or password/i,
    message: '이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.',
  },
  {
    match: /email not confirmed|email_not_confirmed/i,
    message: '이메일 인증이 완료되지 않았습니다. 가입 시 발송된 메일의 링크를 확인해주세요.',
  },
  {
    match: /user not found|user_not_found/i,
    message: '이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.',
  },
  {
    match: /wrong password|incorrect password/i,
    message: '비밀번호가 올바르지 않습니다. 다시 입력해주세요.',
  },
  // API/연결
  {
    match: /invalid api key|invalid_api_key|invalid jwt/i,
    message: '서비스 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.',
  },
  {
    match: /too many requests|rate limit|rate_limit/i,
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  },
  // 회원가입
  {
    match: /user already registered|already registered|email already in use/i,
    message: '이미 가입된 이메일입니다. 로그인해주세요.',
  },
  {
    match: /signup disabled|signup_disabled/i,
    message: '회원가입이 일시적으로 중단되었습니다. 잠시 후 다시 시도해주세요.',
  },
  // 비밀번호
  {
    match: /password is too weak|password_does_not_match_requirements/i,
    message: '비밀번호가 조건에 맞지 않습니다. 6자 이상으로 설정해주세요.',
  },
  {
    match: /password should be at least/i,
    message: '비밀번호는 6자 이상이어야 합니다.',
  },
  // 기타
  {
    match: /invalid request|invalid_request/i,
    message: '입력한 정보를 확인해주세요.',
  },
  {
    match: /session expired|session_expired/i,
    message: '로그인 세션이 만료되었습니다. 다시 로그인해주세요.',
  },
];

const DEFAULT_MESSAGE = '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

/**
 * Supabase Auth 에러 메시지를 한글 사용자 메시지로 변환
 */
export function getAuthErrorMessage(rawMessage: string | null | undefined): string {
  if (!rawMessage || typeof rawMessage !== 'string') {
    return DEFAULT_MESSAGE;
  }

  const normalized = rawMessage.trim();
  if (!normalized) return DEFAULT_MESSAGE;

  for (const { match, message } of AUTH_ERROR_MAP) {
    if (typeof match === 'string') {
      if (normalized.toLowerCase().includes(match.toLowerCase())) return message;
    } else {
      if (match.test(normalized)) return message;
    }
  }

  return DEFAULT_MESSAGE;
}
