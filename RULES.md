# Kova 개발 규칙

이 문서는 Cursor AI가 따라야 할 프로젝트 규칙입니다.

## 코드 스타일

### JavaScript
- ES6+ 문법 사용
- `const` 우선, 필요시 `let` (var 금지)
- 화살표 함수 권장
- 템플릿 리터럴 사용
- async/await 권장

### CSS
- CSS 변수 사용 (`--bg-primary`, `--accent` 등)
- BEM 네이밍 컨벤션은 사용하지 않음
- 클래스명은 kebab-case
- 미디어 쿼리보다 flex/grid 반응형 우선

### HTML
- 시맨틱 태그 사용
- data-* 속성으로 JS 바인딩
- 인라인 스타일 최소화

## 디자인 시스템

### 색상
```css
--bg-primary: #18181b;      /* 배경 */
--bg-surface: #1f1f23;      /* 카드/패널 */
--bg-elevated: #27272a;     /* 높은 요소 */
--accent: #a78bfa;          /* 강조 (보라색) */
--status-running: #f59e0b;  /* 실행 중 (주황) */
--status-done: #22c55e;     /* 완료 (초록) */
```

### 간격
- 4px 단위 사용 (4, 8, 12, 16, 20, 24...)
- 패딩 기본: 12px (작은), 16px (중간), 20px (큰)

### 폰트
- 시스템 폰트 사용 (-apple-system)
- 크기: 10px (작은), 12px (기본), 14px (제목)
- 무게: 400 (일반), 500 (중간), 600 (강조)

### 테두리 반경
- 작은: 4px
- 기본: 6px (--radius-sm)
- 큰: 8px (--radius-md)

## 기능 개발 원칙

1. **API 의존 최소화** - webview로 실제 서비스 UI 사용
2. **자동 저장** - 모든 설정 변경 즉시 localStorage에 저장
3. **반응형** - 창 크기 변경에 대응
4. **접근성** - 키보드 단축키 지원

## 파일 수정 시 주의사항

### electron.html
- 단일 파일에 HTML + CSS + JS 포함
- 수정 후 앱 재시작 필요: `npm start`

### main.js
- IPC 핸들러 추가 시 electron.html에서 `ipcRenderer.invoke()` 호출
- AppleScript 사용 시 따옴표 이스케이프 주의

## 커밋 메시지 규칙

```
feat: 새 기능 추가
fix: 버그 수정
style: UI/CSS 변경
refactor: 코드 리팩토링
docs: 문서 수정
```

## 테스트

### 수동 테스트 체크리스트
- [ ] 레이아웃 전환 동작
- [ ] 목적 변경 시 앱 목록 변경
- [ ] webview 로딩
- [ ] 설정 저장/복원
- [ ] AI to AI 전송

## 금지 사항

- jQuery 사용 금지
- 외부 CSS 프레임워크 금지 (Tailwind 등)
- 불필요한 의존성 추가 금지
- 하드코딩된 색상 금지 (CSS 변수 사용)
