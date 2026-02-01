# DCC (Dubai Chewy Cookie) 개발 진행 상황

## 프로젝트 개요
AI 도구들을 한 화면에서 관리하고 조작할 수 있는 macOS Electron 앱

---

## 완료된 작업

### 1. 기본 구조
- [x] Electron 앱 기본 세팅
- [x] 레이아웃 시스템 (Focus, Split, Grid, Stack)
- [x] 사이드바 (목적별 필터, 타임라인)
- [x] GNB (상태 큐, 레이아웃 탭)

### 2. 웹 AI 지원 (Webview)
- [x] Claude, ChatGPT, Gemini, Perplexity 등 웹 AI를 webview로 직접 조작
- [x] 앱별 세션 분리 (`partition="persist:앱이름"`)
- [x] DOM 분석으로 상태 감지 (작업 중/완료)

### 3. 데스크탑 앱 지원
- [x] 스크린샷 캡처 + 클릭 시 앱 전환
- [x] 앱 번들 이름 기반 감지 (Electron 앱도 정확히 감지)
- [x] macOS 알림 DB 읽기 (상태 감지용)

### 4. UI/UX
- [x] DCC 로고 (Pretendard 폰트, 둥근 사각형)
- [x] 드래그 앤 드롭으로 창 위치 교환
- [x] 단축키: `⌥1~4` (레이아웃), `⇧1~4` (목적 전환)
- [x] 빈 화면 시 전체 화면 안내 메시지

### 5. 앱 감지 목록
- Claude, ChatGPT, Copilot
- Cursor, Antigravity, Windsurf, Zed, VS Code, Xcode, IntelliJ, WebStorm, PyCharm
- Notion, Obsidian, Craft, Bear
- Figma, Sketch, Framer

---

## 미해결 문제

### 1. 앱 자동 감지 타이밍 문제
**증상**: DCC 실행 후 Antigravity를 켜면 감지 안 됨

**원인 추정**:
- 자동 감지가 10초 간격으로만 실행됨
- 또는 AppleScript 실행 시 권한 문제

**해결 방안**:
```javascript
// 더 짧은 간격으로 감지 (5초)
setInterval(autoDetectAI, 5000);

// 또는 창 활성화 이벤트 감지
app.on('browser-window-focus', () => autoDetectAI());
```

### 2. 창 캡처 매칭 문제
**증상**: Cursor 화면이 Antigravity에 표시됨

**원인**: 
- Cursor와 Antigravity 둘 다 Electron 앱
- 창 제목으로 구분해야 하는데, 정확한 창 제목 패턴을 모름

**디버깅 필요**:
Console에서 `=== ALL WINDOWS ===` 로그 확인하여 각 앱의 정확한 창 제목 확인

**예상 패턴**:
- Cursor: `"파일명 — 폴더명"` (em dash 사용)
- Antigravity: `"파일명 - Antigravity"` 또는 다른 패턴

### 3. Webview 세션 혼선
**증상**: Claude 로그인 시 Notion 화면도 바뀜

**원인 추정**:
- partition이 제대로 적용 안 됨
- 또는 캐시 문제

**확인 필요**:
```javascript
// 각 webview의 partition 확인
partition="persist:claude"
partition="persist:notion"
// 다른 이름으로 완전 분리되어야 함
```

---

## 다음 스레드에서 할 작업

### 우선순위 1: 앱 감지 문제 해결
1. Console에서 `=== ALL WINDOWS ===` 로그 확인
2. Antigravity 창 제목 정확히 파악
3. 창 매칭 로직 수정

### 우선순위 2: 자동 감지 개선
1. 감지 주기 단축 (10초 → 3초)
2. "AI 감지" 버튼 클릭 시 즉시 감지

### 우선순위 3: Webview 세션 문제
1. partition 적용 확인
2. 필요 시 webview 캐시 완전 분리

---

## 파일 구조

```
/Users/jungsoo.kim/Desktop/pretotyper/screen divide/
├── electron.html    # 메인 UI + 렌더러 로직
├── main.js          # Electron 메인 프로세스
├── package.json
├── styles.css       # (현재 미사용, electron.html 내 인라인)
├── README.md
├── SYNC_GUIDE.md
├── CONTEXT.md
├── RULES.md
└── PROGRESS.md      # 이 파일
```

---

## 핵심 코드 위치

### 앱 감지 (main.js)
- 라인 46~: `get-running-ai-apps` IPC 핸들러
- AppleScript로 앱 번들 이름 가져오기

### 창 캡처 (main.js)
- 라인 380~: `capture-all-windows` IPC 핸들러
- desktopCapturer로 창 스크린샷

### 렌더링 (electron.html)
- `renderWorkspace()`: 메인 뷰포트 렌더링
- `autoDetectAI()`: 자동 감지 로직

---

## Git 저장소
https://github.com/pretotyper/dcc.git
