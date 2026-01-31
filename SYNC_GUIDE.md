# DCC 동기화 가이드

다른 기기에서 DCC(Kova)를 동기화하고 실행하는 방법

---

## 🚀 빠른 시작 (다른 기기에서)

```bash
# 1. 저장소 클론
git clone https://github.com/pretotyper/dcc.git

# 2. 폴더 이동
cd dcc

# 3. 의존성 설치
npm install

# 4. 앱 실행
npm start
```

끝! 앱이 실행됩니다.

---

## 🔄 변경사항 동기화

### 최신 버전 받기 (pull)
```bash
cd dcc
git pull
npm install  # 의존성 변경 시
npm start
```

### 변경사항 올리기 (push)
```bash
cd dcc
git add .
git commit -m "변경 내용 설명"
git push
```

### 충돌 발생 시
```bash
git pull --rebase
# 충돌 해결 후
git add .
git rebase --continue
git push
```

---

## 📱 기기별 작업 흐름

### 기기 A에서 작업 후
```bash
git add .
git commit -m "feat: 새 기능 추가"
git push
```

### 기기 B에서 이어서 작업
```bash
git pull
npm start
# 작업...
git add .
git commit -m "fix: 버그 수정"
git push
```

### 기기 A에서 다시 받기
```bash
git pull
npm start
```

---

## 🔐 GitHub 인증

### 처음 push 시
```bash
git push -u origin main
# Username: pretotyper
# Password: Personal Access Token (비밀번호 아님!)
```

### Personal Access Token 발급
1. https://github.com/settings/tokens 접속
2. "Generate new token (classic)" 클릭
3. `repo` 권한 체크
4. 생성된 토큰 복사 → Password에 입력

### 인증 정보 저장 (매번 입력 안하려면)
```bash
git config --global credential.helper osxkeychain
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
