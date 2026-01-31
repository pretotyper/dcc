# Kova 프로젝트 컨텍스트

이 문서는 AI 어시스턴트가 프로젝트를 이해하기 위한 컨텍스트입니다.

## 프로젝트 개요

**Kova**는 여러 AI 도구(Claude, ChatGPT, Gemini 등)를 한 화면에서 효율적으로 관리하는 macOS 데스크톱 앱입니다.

### 핵심 가치
- AI 작업의 비동기적 특성에 최적화된 화면 분할
- API 없이 실제 서비스 UI를 그대로 임베드 (webview)
- AI 간 결과 전송으로 워크플로우 자동화

## 기술 스택

| 구성요소 | 기술 |
|----------|------|
| 프레임워크 | Electron |
| 프론트엔드 | Vanilla HTML/CSS/JS |
| 임베딩 | Electron webview |
| 시스템 연동 | Node.js child_process, AppleScript |
| 상태 관리 | localStorage |

## 주요 파일

### `main.js`
Electron 메인 프로세스
- 창 생성 및 관리
- IPC 핸들러 (앱 감지, 브라우저 탭 감지)
- AppleScript 실행

### `electron.html`
메인 UI (단일 파일에 HTML + CSS + JS 포함)
- 상태 관리 (`state` 객체)
- 렌더링 함수들 (`render*`)
- 이벤트 핸들링
- AI to AI 전송 로직

### `index.html`, `styles.css`, `app.js`
웹 프로토타입 (브라우저에서 테스트용)
- Electron 없이 목업/디자인 확인 가능

## 상태 구조

```javascript
state = {
    lang: 'ko',                    // 언어
    currentPurpose: 'research',    // 현재 목적
    currentLayout: 'split',        // 레이아웃
    focusedApp: 'claude',          // 포커스된 앱
    lastCopied: null,              // 마지막 복사 결과
    settings: {
        notifyComplete: true,      // 완료 알림
        autoFocus: false,          // 자동 포커스
        showProgress: true         // 진행률 표시
    },
    apps: {                        // 앱 목록
        claude: { name, url, color, status, progress },
        // ...
    },
    purposes: {                    // 목적별 앱 그룹
        research: { apps: [...] },
        coding: { apps: [...] },
        creative: { apps: [...] }
    },
    timeline: [...]                // 작업 기록
}
```

## 주요 기능 구현

### 1. 화면 분할
CSS Grid로 레이아웃 구현
```css
.workspace.layout-split { grid-template-columns: 1fr 1fr; }
.workspace.layout-grid { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
```

### 2. AI 결과 복사 (⌘T)
webview 내부 JS 실행으로 결과 추출
```javascript
webview.executeJavaScript(`
    document.querySelector('.prose').innerText
`)
```

### 3. AI to AI 전송 (⌘⇧V)
복사한 결과를 다른 AI 입력창에 삽입
```javascript
webview.executeJavaScript(`
    document.querySelector('textarea').value = '...'
`)
```

### 4. 앱 자동 감지
AppleScript로 실행 중인 앱/브라우저 탭 확인
```javascript
ipcRenderer.invoke('get-running-apps')
ipcRenderer.invoke('get-safari-tabs')
```

## 디자인 원칙

- **미니멀리즘** - 불필요한 장식 없음
- **다크 테마** - 장시간 작업에 적합
- **보라색 액센트** (`#a78bfa`) - 브랜드 컬러
- **왼쪽 바 포커스 표시** - 선택된 창 강조

## 확장 계획

1. **유료 기능**: API 키 연동으로 Kova 내에서 직접 프롬프트 전송
2. **Windows 지원**: Electron 크로스 플랫폼
3. **팀 동기화**: 클라우드 설정 동기화
4. **단축키 커스터마이징**
5. **플러그인 시스템**

## 참고 서비스

- [Snap It](https://www.producthunt.com/products/snap-it) - 화면 분할 레퍼런스
- [Linear](https://linear.app) - UI/UX 레퍼런스
- [Notion](https://notion.so) - 사이드바 레퍼런스
