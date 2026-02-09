# Figma에서 와이어프레임 스크립트 실행 방법

`FIGMA_WIREFRAME_SCRIPT.js`는 **Figma 플러그인 환경**에서만 동작합니다.  
일반 Figma 화면의 콘솔(개발자 도구)에는 `figma` 객체가 없어서, **플러그인**을 통해 실행해야 합니다.

---

## 방법 1: 나만의 플러그인으로 실행 (권장)

1. Figma 데스크톱 앱에서 **Plugins → Development → New Plugin…** 선택
2. **"Empty"** 또는 **"Create a new plugin"** 로 새 플러그인 생성
3. 생성된 폴더에서 `code.ts` 또는 `code.js`를 연 뒤, 아래처럼 **한 번만 실행되는 코드**로 바꿉니다.

### code.js 전체를 이렇게 교체

```js
// FIGMA_WIREFRAME_SCRIPT.js 내용 전체를 여기 붙여넣기
// (파일 내용 복사 → code.js 전체 대체)
```

또는 `code.ts`를 사용 중이면:

```ts
// @ts-ignore
(async () => {
  // FIGMA_WIREFRAME_SCRIPT.js 안의 (async () => { ... })() 내용만
  // 여기 안에 붙여넣기
})();
```

4. Figma에서 **Plugins → Development → [방금 만든 플러그인 이름]** 실행
5. 캔버스에 와이어프레임 프레임들이 생성됩니다.

---

## 방법 2: 스크립트 실행 플러그인 사용

Figma Community에서 **"Run script"**, **"Scripter"**, **"Script runner"** 같은 플러그인을 검색해 설치한 뒤,

1. 플러그인 실행
2. 입력창에 `FIGMA_WIREFRAME_SCRIPT.js` **전체 내용** 붙여넣기
3. Run / Execute 버튼 클릭

(플러그인마다 UI가 다르므로, “Figma Plugin API 스크립트 실행”을 지원하는지 확인하세요.)

---

## 방법 3: Figma 브라우저 콘솔 (일반적으로 불가)

Figma **웹/데스크톱**의 개발자 도구 콘솔에는 플러그인 API(`figma`, `figma.currentPage` 등)가 노출되지 **않습니다**.  
그래서 이 스크립트는 **반드시 플러그인** 안에서 실행해야 합니다.

---

## 스크립트가 만드는 것

- **컨테이너 프레임** 1개: 이름 `Wireframes – 진단 앱 (날짜/시간)`
- 그 안에 **모바일 화면 크기(390×844)** 프레임 여러 개, 4열 그리드로 배치
- 각 프레임: 이름 = `페이지명 / 상태명`, 내부는 회색/검정 사각형 + 짧은 라벨로 블록 표시

생성되는 화면 예: 로그인, 회원가입, 홈(비로그인/로그인), 촬영(카메라/촬영완료), 앨범, 직접입력, 리뷰 Step1~4, 검증 결과, 항목 상세, 내 차, 차량 등록, 설정(로그인/비로그인).

더 추가하려면 `FIGMA_WIREFRAME_SCRIPT.js` 안의 `screens` 배열에 `{ title: '...', blocks: [...] }` 를 넣으면 됩니다.
