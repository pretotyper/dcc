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

## 해결된 문제 (2026-02-01)

### 1. ✅ 앱 자동 감지 타이밍 문제
**증상**: DCC 실행 후 Antigravity를 켜면 감지 안 됨

**해결**:
- 자동 감지 주기를 10초 → 3초로 단축
- `setInterval(autoDetectAI, 3000);`

### 2. ✅ 창 캡처 매칭 문제
**증상**: Cursor 화면이 Antigravity에 표시됨

**해결**:
- 더 정밀한 창 매칭 로직 적용
- 앱별 창 제목 패턴 구분:
  - Cursor: em dash(—) 패턴 사용
  - Antigravity: 이름에 'antigravity' 포함 또는 일반 hyphen(-) 사용
- 이미 매칭된 창 중복 사용 방지 (`usedSources` Set)
- 디버깅 로그 추가 (Console에서 창 매칭 상태 확인 가능)

### 3. ✅ Webview 세션 혼선
**증상**: Claude 로그인 시 Notion 화면도 바뀜

**해결**:
- 서비스별 고유 partition 이름 매핑 (`partitionMap`)
- 예: `claude` → `persist:claude`, `chatgpt` → `persist:chatgpt`
- 브라우저별로도 분리: `claudechrome` → `persist:claude_chrome`
- 새로운 `getPartitionName()` 함수로 안전하게 partition 이름 생성

---

## 업데이트 (2026-02-01 오후)

### 1. 목적별 레이아웃 기억
- 각 목적(전체/리서치/코딩/크리에이티브)별로 마지막 레이아웃 저장
- 목적 전환 시 해당 목적의 저장된 레이아웃으로 자동 변경
- 기본 레이아웃: Focus (1개)

### 2. 목적 전환 시 Webview 유지
- 목적 전환 시 `applyPurposeFilter()`로 CSS만 변경 (webview 재로드 없음)
- 모든 앱을 DOM에 렌더링하고 목적에 따라 표시/숨김 처리

### 3. 봇 감지 방지
- 동일 웹 서비스 최대 2개까지만 허용
- Webview 로딩 시 1.5초 간격으로 순차 로딩
- 앱 이름에서 `(Chrome)`, `(Safari)` 자동 제거

### 4. 앱 상태 저장 개선
- `monitored` 상태 저장/복원 (새로고침해도 마지막 상태 유지)
- 연결된 앱 제거 시 확인 모달 표시

### 5. UI/UX 개선
- 연결된 앱 옆 `+` 버튼으로 앱 추가 (큰 버튼 제거)
- 마지막 결과 복사 버튼 제거 (단축키 `⌘⇧C`로만 동작)
- 비활성화된 앱 더블클릭/드래그로 다시 활성화
- 작업 완료 시 토스트 알림 (프롬프트 미리보기 포함)
- 모든 토스트 메시지 다국어 지원 (한국어/영어)
- 단축키 하단 고정

### 6. 작업 기록 (Activity Timeline)
- 웹 AI 작업 시작/완료 감지
- 프롬프트 요약 표시 (50자까지)
- 상태는 색상으로 표시 (녹색 깜빡임=진행중, 초록=완료)
- 최대 50개 기록 유지

---

## 다음 작업 (추후 개선 사항)

### 기능 개선
1. 창 활성화 이벤트 감지 추가 (`app.on('browser-window-focus')`)
2. webview 캐시 명시적 분리 (필요 시)
3. 더 많은 AI 서비스 지원

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
