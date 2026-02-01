# 폰트 파일 안내

## Hyundai Sans 폰트

이 폴더에 Hyundai Sans 폰트 파일을 배치하세요.

## 필요한 폰트 파일

다음 폰트 파일들을 준비해주세요:

### Regular (400)
- `HyundaiSans-Regular.woff2` (권장)
- `HyundaiSans-Regular.woff`
- `HyundaiSans-Regular.ttf`

### Medium (500)
- `HyundaiSans-Medium.woff2` (권장)
- `HyundaiSans-Medium.woff`
- `HyundaiSans-Medium.ttf`

### Bold (700)
- `HyundaiSans-Bold.woff2` (권장)
- `HyundaiSans-Bold.woff`
- `HyundaiSans-Bold.ttf`

## 로컬 폰트 사용

로컬 시스템에 Hyundai Sans가 설치되어 있다면, 폰트 파일을 이 폴더에 배치하지 않아도 됩니다.

`app/globals.css`의 `@font-face` 선언에서 `local()`이 우선순위로 설정되어 있어, 시스템 폰트를 먼저 사용합니다.

## 폰트 파일 변환

TTF 파일만 있는 경우, 다음 도구로 웹폰트로 변환할 수 있습니다:

- [Transfonter](https://transfonter.org/)
- [Font Squirrel Webfont Generator](https://www.fontsquirrel.com/tools/webfont-generator)

## 참고

- `.woff2` 형식이 가장 작은 파일 크기와 최고의 성능을 제공합니다.
- 모든 브라우저 호환성을 위해 `.woff`와 `.ttf`도 함께 제공하는 것을 권장합니다.
