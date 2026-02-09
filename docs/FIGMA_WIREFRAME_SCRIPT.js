/**
 * Figma 와이어프레임 자동 생성 스크립트
 *
 * 사용 방법:
 * 1. Figma에서 플러그인으로 실행해야 합니다.
 *    - "Run script" 또는 "Scripter" 같은 스크립트 실행 플러그인을 설치한 뒤
 *    - 플러그인 실행 → 코드 입력창에 이 스크립트 전체를 붙여넣고 실행
 * 2. 또는 Figma에서 개발자 모드로 나만의 플러그인을 만들고
 *    manifest.json + code.js 에서 이 로직을 호출하도록 할 수 있습니다.
 *
 * 실행 환경: Figma Plugin API (figma, figma.currentPage 등 사용)
 */

(async () => {
  const W = 390;
  const H = 844;
  const GAP = 40;
  const COLS = 4;
  const FONT_SIZE_TITLE = 10;
  const FONT_SIZE_LABEL = 9;

  const gray = { r: 0.9, g: 0.9, b: 0.9 };
  const dark = { r: 0.2, g: 0.2, b: 0.2 };
  const red = { r: 1, g: 0.9, b: 0.9 };

  let font;
  try {
    font = { family: 'Inter', style: 'Regular' };
    await figma.loadFontAsync(font);
  } catch {
    font = { family: 'Sans Serif', style: 'Regular' };
    await figma.loadFontAsync(font);
  }

  function addRect(parent, x, y, w, h, name, color = gray) {
    const rect = figma.createRectangle();
    rect.name = name || 'Block';
    rect.x = x;
    rect.y = y;
    rect.resize(w, h);
    rect.fills = [{ type: 'SOLID', color }];
    rect.cornerRadius = 4;
    parent.appendChild(rect);
    return rect;
  }

  async function addText(parent, x, y, str, size = FONT_SIZE_LABEL, color = dark) {
    const text = figma.createText();
    await figma.loadFontAsync(font);
    text.characters = str;
    text.fontSize = size;
    text.fills = [{ type: 'SOLID', color }];
    text.x = x;
    text.y = y;
    text.name = str.slice(0, 30);
    parent.appendChild(text);
    return text;
  }

  /** 단일 화면 와이어프레임 프레임 생성 */
  async function createScreen(parent, index, title, blocks) {
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    const frame = figma.createFrame();
    frame.name = title;
    frame.x = col * (W + GAP);
    frame.y = row * (H + GAP);
    frame.resize(W, H);
    frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    frame.cornerRadius = 8;
    frame.clipsContent = false;
    parent.appendChild(frame);

    await addText(frame, 12, 8, title, FONT_SIZE_TITLE, { r: 0.4, g: 0.4, b: 0.4 });

    for (const b of blocks) {
      addRect(frame, b.x, b.y, b.w, b.h, b.name, b.color || gray);
      if (b.label) {
        await addText(frame, b.x + 6, b.y + 4, b.label, 8, { r: 0.5, g: 0.5, b: 0.5 });
      }
    }
    return frame;
  }

  /** 블록 정의: { x, y, w, h, name?, label?, color? } */
  const screens = [
    { title: 'Auth / 로그인 (기본)', blocks: [
      { x: 16, y: 44, w: 40, h: 40, name: 'Back', label: '←' },
      { x: 16, y: 100, w: 200, h: 28, name: 'Title', label: '로그인' },
      { x: 16, y: 140, w: 280, h: 20, name: 'Sub', label: '계정이 없으신가요? 회원가입' },
      { x: 16, y: 200, w: W - 32, h: 44, name: 'Input', label: '이메일' },
      { x: 16, y: 256, w: W - 32, h: 44, name: 'Input', label: '비밀번호' },
      { x: 16, y: 320, w: W - 32, h: 48, name: 'Button', label: '로그인', color: dark },
    ]},
    { title: 'Auth / 회원가입 (기본)', blocks: [
      { x: 16, y: 44, w: 40, h: 40, name: 'Back', label: '←' },
      { x: 16, y: 100, w: 200, h: 28, name: 'Title', label: '회원가입' },
      { x: 16, y: 180, w: W - 32, h: 44, name: 'Input', label: '이름' },
      { x: 16, y: 236, w: W - 32, h: 44, name: 'Input', label: '이메일' },
      { x: 16, y: 292, w: W - 32, h: 44, name: 'Input', label: '비밀번호' },
      { x: 16, y: 348, w: W - 32, h: 44, name: 'Input', label: '비밀번호 확인' },
      { x: 16, y: 420, w: W - 32, h: 48, name: 'Button', label: '회원가입', color: dark },
    ]},
    { title: 'Auth / 회원가입 (완료)', blocks: [
      { x: (W - 80) / 2, y: 280, w: 80, h: 80, name: 'Icon', label: '✓', color: { r: 0.8, g: 1, b: 0.8 } },
      { x: 40, y: 380, w: W - 80, h: 24, name: 'Title', label: '회원가입 완료' },
      { x: 40, y: 412, w: W - 80, h: 20, name: 'Sub', label: '잠시 후 메인으로 이동' },
    ]},
    { title: 'Home / 비로그인', blocks: [
      { x: W - 56, y: 48, w: 40, h: 40, name: 'Profile', label: '👤' },
      { x: 16, y: 100, w: 300, h: 72, name: 'Hero', label: '정비 견적, 적정 가격인지...' },
      { x: 16, y: 200, w: W - 32, h: 120, name: 'CTA', label: '견적서 촬영하기', color: dark },
      { x: 16, y: 332, w: W - 32, h: 48, name: 'Button', label: '직접 입력' },
      { x: 16, y: 396, w: W - 32, h: 72, name: 'Card', label: '로그인하면 검증 이력 저장' },
      { x: 0, y: H - 72, w: W, h: 72, name: 'BottomNav', label: '홈 | 검증 | 내차 | 더보기' },
    ]},
    { title: 'Home / 로그인 (차량 있음)', blocks: [
      { x: W - 56, y: 48, w: 40, h: 40, name: 'Profile', label: '👤' },
      { x: 16, y: 100, w: 300, h: 56, name: 'Hero', label: 'OOO님, 견적서를 검증해볼까요?' },
      { x: 16, y: 180, w: W - 32, h: 120, name: 'CTA', label: '견적서 촬영하기', color: dark },
      { x: 16, y: 316, w: W - 32, h: 56, name: 'Card', label: '내 차량 · 제조사 모델 연식' },
      { x: 16, y: 388, w: 100, h: 20, name: 'Section', label: '최근 검증' },
      { x: 16, y: 416, w: W - 32, h: 64, name: 'Row', label: '항목명 | 날짜 | 뱃지 | 금액' },
      { x: 16, y: 492, w: W - 32, h: 64, name: 'Row', label: '항목명 | 날짜 | 뱃지 | 금액' },
      { x: 0, y: H - 72, w: W, h: 72, name: 'BottomNav', label: '홈 | 검증 | 내차 | 더보기' },
    ]},
    { title: 'Verify / 촬영 (카메라 뷰)', blocks: [
      { x: 16, y: 48, w: 40, h: 40, name: 'Flash', label: '⚡' },
      { x: W - 56, y: 48, w: 40, h: 40, name: 'Close', label: '✕' },
      { x: 24, y: 100, w: W - 48, h: 400, name: 'Camera', label: '라이브 뷰파인더', color: { r: 0.15, g: 0.15, b: 0.15 } },
      { x: 24, y: 100, w: 24, h: 24, name: 'Corner', label: null },
      { x: 16, y: 520, w: W - 32, h: 180, name: 'Panel', label: '견적서 전체가 보이도록...' },
      { x: (W - 64) / 2, y: 560, w: 64, h: 64, name: 'Shutter', label: '●', color: dark },
      { x: 16, y: 648, w: (W - 44) / 2, h: 44, name: 'Btn', label: '앨범에서 선택' },
      { x: (W - 32) / 2 + 6, y: 648, w: (W - 44) / 2, h: 44, name: 'Btn', label: '직접 입력' },
    ]},
    { title: 'Verify / 촬영 (촬영 완료)', blocks: [
      { x: W - 56, y: 48, w: 40, h: 40, name: 'Close', label: '✕' },
      { x: 24, y: 100, w: W - 48, h: 400, name: 'Preview', label: '사진 미리보기', color: { r: 0.2, g: 0.2, b: 0.2 } },
      { x: 16, y: 520, w: W - 32, h: 24, name: 'Text', label: '사진을 확인하고 다음 단계로' },
      { x: 16, y: 556, w: (W - 44) / 3, h: 44, name: 'Btn', label: '재촬영' },
      { x: 16 + (W - 44) / 3 + 6, y: 556, w: (W - 44) / 3, h: 44, name: 'Btn', label: '자르기' },
      { x: 16 + ((W - 44) / 3) * 2 + 12, y: 556, w: (W - 44) / 3, h: 44, name: 'Btn', label: '분석하기', color: dark },
    ]},
    { title: 'Verify / 앨범 (선택 전)', blocks: [
      { x: 16, y: 44, w: 40, h: 40, name: 'Back', label: '←' },
      { x: 16, y: 100, w: 260, h: 28, name: 'Title', label: '앨범에서 선택' },
      { x: 16, y: 136, w: 260, h: 20, name: 'Sub', label: '견적서 사진을 선택해주세요' },
      { x: 16, y: 200, w: W - 32, h: 240, name: 'Card', label: '이미지 아이콘 + 사진 선택하기' },
    ]},
    { title: 'Verify / 직접 입력 (기본)', blocks: [
      { x: 16, y: 44, w: 40, h: 40, name: 'Back', label: '←' },
      { x: 16, y: 100, w: 200, h: 28, name: 'Title', label: '직접 입력' },
      { x: 16, y: 160, w: W - 32, h: 140, name: 'Card', label: '차량 | 번호 입력 | 차량 정보 불러오기' },
      { x: 16, y: 316, w: 80, h: 20, name: 'Section', label: '정비 항목' },
      { x: 16, y: 344, w: W - 32, h: 80, name: 'List', label: '빈 상태 / + 항목 추가' },
      { x: 16, y: H - 140, w: W - 32, h: 80, name: 'Summary', label: '부품+공임, 부가세, 총 금액' },
      { x: 16, y: H - 56, w: W - 32, h: 48, name: 'Button', label: '검증하기', color: dark },
    ]},
    { title: 'Verify / 리뷰 Step1 (성공)', blocks: [
      { x: (W - 80) / 2, y: 220, w: 80, h: 80, name: 'Icon', label: '✓', color: { r: 0.8, g: 1, b: 0.8 } },
      { x: 40, y: 320, w: W - 80, h: 32, name: 'Title', label: '견적서가 입력되었어요' },
      { x: 40, y: 360, w: W - 80, h: 40, name: 'Sub', label: '정확한 견적 검증을 위해...' },
      { x: 40, y: 440, w: W - 80, h: 20, name: 'Loading', label: '잠시만 기다려주세요...' },
    ]},
    { title: 'Verify / 리뷰 Step2 (정비 정보)', blocks: [
      { x: 16, y: 44, w: 40, h: 40, name: 'Back', label: '←' },
      { x: 80, y: 52, w: 160, h: 16, name: 'Steps', label: '● ○ ○' },
      { x: 16, y: 100, w: W - 32, h: 88, name: 'Header', label: 'YYYY.MM.DD에 [정비소] 방문' },
      { x: 16, y: 208, w: W - 32, h: 72, name: 'Card', label: '방문일 | 변경' },
      { x: 16, y: 292, w: W - 32, h: 72, name: 'Card', label: '정비소 | 검색' },
      { x: 16, y: H - 72, w: W - 32, h: 56, name: 'Button', label: '다음', color: dark },
    ]},
    { title: 'Verify / 리뷰 Step3 (차량)', blocks: [
      { x: 16, y: 44, w: 40, h: 40, name: 'Back', label: '←' },
      { x: 80, y: 52, w: 160, h: 16, name: 'Steps', label: '● ● ○' },
      { x: 16, y: 100, w: W - 32, h: 72, name: 'Header', label: '어떤 차량의 견적서인가요?' },
      { x: 16, y: 200, w: W - 32, h: 120, name: 'Card', label: '저장된 내 차 / 또는 차량번호 조회' },
      { x: 16, y: H - 72, w: W - 32, h: 56, name: 'Button', label: '다음', color: dark },
    ]},
    { title: 'Verify / 리뷰 Step4 (견적 목록)', blocks: [
      { x: 16, y: 44, w: 40, h: 40, name: 'Back', label: '←' },
      { x: 80, y: 52, w: 160, h: 16, name: 'Steps', label: '● ● ●' },
      { x: 16, y: 100, w: W - 32, h: 88, name: 'Header', label: '견적 내역을 확인해주세요' },
      { x: 16, y: 200, w: W - 32, h: 100, name: 'Summary', label: '방문일 | 정비소 | 차량' },
      { x: 16, y: 316, w: 80, h: 20, name: 'Section', label: '정비 항목 N건' },
      { x: 16, y: 344, w: W - 32, h: 56, name: 'Row', label: '항목명 | 금액' },
      { x: 16, y: 408, w: W - 32, h: 56, name: 'Row', label: '항목명 | 금액' },
      { x: 16, y: H - 100, w: W - 32, h: 24, name: 'Total', label: '총 금액' },
      { x: 16, y: H - 68, w: W - 32, h: 52, name: 'Button', label: '견적 검증하기', color: dark },
    ]},
    { title: 'Result / 검증 결과 (있음)', blocks: [
      { x: 16, y: 44, w: 40, h: 40, name: 'Back', label: '←' },
      { x: 16, y: 100, w: W - 32, h: 80, name: 'Summary', label: '차량 · 정비소 · 총액 · 적정/확인필요' },
      { x: 16, y: 196, w: 280, h: 32, name: 'Filter', label: '전체 | 부품 | 공임 | 확인필요' },
      { x: 16, y: 244, w: W - 32, h: 72, name: 'Item', label: '항목명 | 사용자금액 | 뱃지' },
      { x: 16, y: 324, w: W - 32, h: 72, name: 'Item', label: '항목명 | 사용자금액 | 뱃지' },
      { x: 16, y: 404, w: W - 32, h: 72, name: 'Item', label: '항목명 | 사용자금액 | 뱃지' },
      { x: 16, y: 500, w: (W - 44) / 2, h: 44, name: 'Btn', label: '공유' },
      { x: (W - 32) / 2 + 6, y: 500, w: (W - 44) / 2, h: 44, name: 'Btn', label: '저장' },
      { x: 0, y: H - 72, w: W, h: 72, name: 'BottomNav', label: '홈 | 검증 | 내차 | 더보기' },
    ]},
    { title: 'Result / 항목 상세', blocks: [
      { x: 16, y: 44, w: 40, h: 40, name: 'Back', label: '←' },
      { x: 16, y: 100, w: W - 32, h: 28, name: 'Title', label: '항목명' },
      { x: 16, y: 136, w: 80, h: 24, name: 'Badge', label: '적정/확인필요' },
      { x: 16, y: 180, w: W - 32, h: 120, name: 'Chart', label: '사용자 vs 평균 가격' },
      { x: 16, y: 316, w: W - 32, h: 80, name: 'Breakdown', label: '부품비 · 공임비' },
      { x: 16, y: 412, w: W - 32, h: 44, name: 'Btn', label: '정비소에 물어보기' },
    ]},
    { title: 'Vehicle / 내 차 (차량 있음)', blocks: [
      { x: 16, y: 80, w: 60, h: 16, name: 'Label', label: '내 차 관리' },
      { x: 16, y: 108, w: 260, h: 28, name: 'Title', label: '제조사 모델 (variant)' },
      { x: 16, y: 140, w: 200, h: 20, name: 'Sub', label: '연식 · 주행거리 · 연료' },
      { x: W - 60, y: 108, w: 44, h: 20, name: 'Link', label: '수정 >' },
      { x: 16, y: 200, w: W - 32, h: 60, name: 'Summary', label: '총 정비 비용 등' },
      { x: 16, y: 276, w: 100, h: 20, name: 'Section', label: '최근 검증' },
      { x: 16, y: 304, w: W - 32, h: 64, name: 'Row', label: '날짜 | 항목 | 뱃지 | 금액' },
      { x: 16, y: 376, w: W - 32, h: 64, name: 'Row', label: '날짜 | 항목 | 뱃지 | 금액' },
      { x: 0, y: H - 72, w: W, h: 72, name: 'BottomNav', label: '홈 | 검증 | 내차 | 더보기' },
    ]},
    { title: 'Vehicle / 차량 등록·수정', blocks: [
      { x: 16, y: 44, w: 40, h: 40, name: 'Back', label: '←' },
      { x: 16, y: 100, w: 200, h: 28, name: 'Title', label: '차량 등록' },
      { x: 16, y: 160, w: W - 32, h: 44, name: 'Input', label: '차량번호' },
      { x: 16, y: 216, w: W - 32, h: 44, name: 'Btn', label: '차량 정보 불러오기' },
      { x: 16, y: 276, w: W - 32, h: 44, name: 'Input', label: '주행거리 (km)' },
      { x: 16, y: 340, w: W - 32, h: 48, name: 'Button', label: '저장', color: dark },
    ]},
    { title: 'Settings / 로그인', blocks: [
      { x: 16, y: 80, w: 60, h: 16, name: 'Label', label: '더보기' },
      { x: 16, y: 108, w: 200, h: 28, name: 'Title', label: 'OOO님' },
      { x: 16, y: 140, w: 260, h: 20, name: 'Sub', label: 'email@example.com' },
      { x: 16, y: 200, w: 80, h: 20, name: 'Section', label: '알림' },
      { x: 16, y: 228, w: W - 32, h: 48, name: 'Row', label: '정비 시기 알림 [토글]' },
      { x: 16, y: 284, w: W - 32, h: 48, name: 'Row', label: '검증 완료 알림 [토글]' },
      { x: 16, y: 340, w: 80, h: 20, name: 'Section', label: '데이터' },
      { x: 16, y: 368, w: W - 32, h: 48, name: 'Row', label: '내 차량 관리 >' },
      { x: 16, y: 424, w: W - 32, h: 48, name: 'Row', label: '로그아웃' },
      { x: 0, y: H - 72, w: W, h: 72, name: 'BottomNav', label: '홈 | 검증 | 내차 | 더보기' },
    ]},
    { title: 'Settings / 비로그인', blocks: [
      { x: 16, y: 80, w: 60, h: 16, name: 'Label', label: '더보기' },
      { x: 16, y: 108, w: 200, h: 28, name: 'Title', label: '로그인해주세요' },
      { x: 16, y: 140, w: 260, h: 20, name: 'Sub', label: '검증 이력과 차량 정보 관리' },
      { x: 16, y: 200, w: W - 32, h: 72, name: 'Card', label: '로그인 / 회원가입' },
      { x: 0, y: H - 72, w: W, h: 72, name: 'BottomNav', label: '홈 | 검증 | 내차 | 더보기' },
    ]},
  ];

  const container = figma.createFrame();
  container.name = 'Wireframes – 진단 앱 (' + new Date().toLocaleString('ko-KR') + ')';
  container.fills = [];
  container.clipsContent = false;
  figma.currentPage.appendChild(container);

  for (let i = 0; i < screens.length; i++) {
    await createScreen(container, i, screens[i].title, screens[i].blocks);
  }

  figma.viewport.scrollAndZoomIntoView([container]);
  figma.notify('와이어프레임 ' + screens.length + '개 생성됨');
})();
