# Kova - AI Screen Orchestrator

AI 도구들을 한 화면에서 효율적으로 관리하는 데스크톱 앱

## 주요 기능

- **화면 분할** - Focus, Split, Grid, Stack 레이아웃
- **목적별 분류** - 리서치, 코딩, 크리에이티브
- **실시간 상태 모니터링** - 작업 진행률 표시
- **AI to AI 전송** - 결과를 다른 AI에 바로 전달
- **자동 감지** - 실행 중인 AI 앱/브라우저 탭 자동 인식
- **사용자 정의 앱 추가** - 원하는 AI 서비스 추가

## 설치

```bash
# 저장소 클론
git clone https://github.com/YOUR_USERNAME/kova.git
cd kova

# 의존성 설치
npm install

# 앱 실행
npm start
```

## 요구사항

- macOS 10.15+
- Node.js 18+
- npm 9+

## 단축키

| 단축키 | 기능 |
|--------|------|
| `⌘T` | 현재 창 결과 복사 |
| `⌘⇧V` | 복사한 결과 다른 AI에 붙여넣기 |

## 프로젝트 구조

```
kova/
├── main.js          # Electron 메인 프로세스
├── electron.html    # 메인 UI (HTML + CSS + JS)
├── index.html       # 웹 프로토타입
├── styles.css       # 웹 프로토타입 스타일
├── app.js           # 웹 프로토타입 로직
└── package.json     # 의존성 관리
```

## 개발

```bash
# 개발 모드 실행
npm start

# 빌드 (추후 설정 필요)
npm run build
```

## 라이선스

MIT
