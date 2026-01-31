# Kova 동기화 가이드

다른 기기에서 Kova를 동기화하고 실행하는 방법

## 방법 1: GitHub 사용 (권장)

### 최초 설정 (현재 기기)

```bash
# 프로젝트 폴더로 이동
cd "/Users/jungsoo.kim/Desktop/pretotyper/screen divide"

# Git 초기화
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: Kova AI Screen Orchestrator"

# GitHub에 새 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/kova.git
git branch -M main
git push -u origin main
```

### 다른 기기에서 클론

```bash
# 저장소 클론
git clone https://github.com/YOUR_USERNAME/kova.git
cd kova

# 의존성 설치
npm install

# 앱 실행
npm start
```

### 변경사항 동기화

```bash
# 현재 기기에서 변경 후
git add .
git commit -m "설명"
git push

# 다른 기기에서 받기
git pull
```

---

## 방법 2: iCloud Drive 사용

### 설정

1. 프로젝트 폴더를 iCloud Drive로 이동:
   ```bash
   mv "/Users/jungsoo.kim/Desktop/pretotyper/screen divide" ~/Library/Mobile\ Documents/com~apple~CloudDocs/kova
   ```

2. 다른 Mac에서 접근:
   ```bash
   cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/kova
   npm install
   npm start
   ```

### 주의사항
- `node_modules/`는 각 기기에서 별도 설치 필요
- iCloud 동기화 지연 주의

---

## 방법 3: Dropbox/Google Drive 사용

GitHub와 동일하게 폴더를 해당 클라우드 폴더로 이동 후 사용

---

## 설정 동기화

사용자 설정(언어, 레이아웃, 추가한 앱 등)은 `localStorage`에 저장됩니다.

### 설정 내보내기
브라우저 콘솔에서:
```javascript
console.log(localStorage.getItem('kova-electron'));
```

### 설정 가져오기
```javascript
localStorage.setItem('kova-electron', '여기에_복사한_설정');
location.reload();
```

---

## 트러블슈팅

### npm install 실패
```bash
rm -rf node_modules package-lock.json
npm install
```

### Electron 실행 안됨
```bash
npm cache clean --force
npm install electron --save-dev
```

### macOS 보안 경고
시스템 환경설정 → 보안 및 개인정보 보호 → "확인 없이 열기"
