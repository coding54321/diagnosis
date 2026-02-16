import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { title, content } = await req.json();

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[Contact] RESEND_API_KEY not configured. Logging inquiry instead.');
      console.log('[Contact] 제목:', title);
      console.log('[Contact] 내용:', content);
      return NextResponse.json({ success: true });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: 'k2m0071@naver.com',
        subject: `[카비 문의] ${title}`,
        text: `제목: ${title}\n\n${content}\n\n---\n접수 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[Contact] Resend API error:', res.status, body);
      return NextResponse.json({ error: '이메일 전송에 실패했어요.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Contact] Error:', error);
    return NextResponse.json({ error: '문의 접수 중 오류가 발생했어요.' }, { status: 500 });
  }
}
