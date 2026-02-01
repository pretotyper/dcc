const { app, BrowserWindow, ipcMain, desktopCapturer, screen } = require('electron');
const path = require('path');
const { exec, execSync } = require('child_process');

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 15, y: 18 },
        backgroundColor: '#18181b',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true
        }
    });

    // 전체화면으로 시작
    win.maximize();
    win.loadFile('electron.html');
}

// 화면 캡처 권한 확인
ipcMain.handle('check-screen-permission', async () => {
    const { systemPreferences } = require('electron');
    return systemPreferences.getMediaAccessStatus('screen');
});

// 창 목록 가져오기 (디버깅용 - 상세 정보)
ipcMain.handle('get-window-list', async () => {
    const { desktopCapturer } = require('electron');
    try {
        const sources = await desktopCapturer.getSources({ 
            types: ['window'],
            thumbnailSize: { width: 1, height: 1 }
        });
        // 창 이름과 ID 반환
        return sources.map(s => ({ name: s.name, id: s.id }));
    } catch (e) {
        return [];
    }
});

// 실행 중인 AI 앱 감지 (데스크탑 앱 + 브라우저 탭)
ipcMain.handle('get-running-ai-apps', async () => {
    return new Promise(async (resolve) => {
        const results = [];
        
        // 1. 데스크탑 AI 앱 감지 - 앱 번들 이름 기반
        const desktopAiApps = [
            // AI 어시스턴트
            'Claude', 'ChatGPT', 'Copilot',
            // 코딩/개발
            'Cursor', 'Antigravity', 'Windsurf', 'Zed', 'VS Code', 'Visual Studio Code', 'Code',
            'Android Studio', 'Xcode', 'IntelliJ', 'WebStorm', 'PyCharm',
            // 생산성/노트
            'Notion', 'Obsidian', 'Craft', 'Bear', 'Roam',
            // 디자인
            'Figma', 'Sketch', 'Framer'
        ];
        
        // 앱 번들 이름으로 실행 중인 앱 가져오기
        const script = `
set appList to {}
tell application "System Events"
    set allProcesses to every process whose background only is false
    repeat with proc in allProcesses
        try
            set appFile to application file of proc
            set appName to name of appFile
            -- .app 확장자 제거
            if appName ends with ".app" then
                set appName to text 1 thru -5 of appName
            end if
            set end of appList to appName
        on error
            -- 앱 파일이 없으면 프로세스 이름 사용
            set end of appList to name of proc
        end try
    end repeat
end tell
return appList`;
        
        try {
            const stdout = await new Promise((res, rej) => {
                exec(`osascript -e '${script}'`, (err, out) => err ? rej(err) : res(out));
            });
            const running = stdout.trim().split(', ');
            
            // 디버깅: 모든 실행 중인 앱 목록을 결과에 추가
            results.push({ name: '__DEBUG_ALL_APPS__', allApps: running });
            
            // 각 앱의 창 제목도 가져오기
            for (const app of running) {
                const appLower = app.toLowerCase();
                const matchedAi = desktopAiApps.find(ai => appLower.includes(ai.toLowerCase()));
                if (matchedAi) {
                    let windowTitle = null;
                    
                    // Claude Desktop은 AppleScript 접근이 안 되므로 건너뛰기
                    const skipAppleScript = ['claude'].some(skip => appLower.includes(skip));
                    
                    if (!skipAppleScript) {
                        try {
                            // 창이 있는지 먼저 확인하고 가져오기
                            const windowScript = `
                                tell application "System Events"
                                    tell process "${app}"
                                        if (count of windows) > 0 then
                                            return name of window 1
                                        else
                                            return ""
                                        end if
                                    end tell
                                end tell
                            `;
                            windowTitle = execSync(`osascript -e '${windowScript}'`, { encoding: 'utf-8', timeout: 2000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
                        } catch (e) {
                            // 오류 무시
                        }
                    }
                    
                    results.push({ 
                        name: app, 
                        type: 'desktop', 
                        browser: null,
                        windowTitle: windowTitle || null
                    });
                }
            }
        } catch (e) {
            console.error('App detection error:', e);
        }
        
        // 2. Chrome AI 탭 감지
        const chromeScript = `
tell application "System Events"
    if exists process "Google Chrome" then
        tell application "Google Chrome"
            set tabResults to {}
            repeat with w in windows
                repeat with t in tabs of w
                    set tabURL to URL of t
                    set tabTitle to title of t
                    -- Research
                    if tabURL contains "claude.ai" then
                        set end of tabResults to "Claude (Chrome)|" & tabURL
                    else if tabURL contains "chat.openai.com" or tabURL contains "chatgpt.com" then
                        set end of tabResults to "ChatGPT (Chrome)|" & tabURL
                    else if tabURL contains "gemini.google.com" then
                        set end of tabResults to "Gemini|" & tabURL
                    else if tabURL contains "perplexity.ai" then
                        set end of tabResults to "Perplexity (Chrome)|" & tabURL
                    else if tabURL contains "grok.x.ai" then
                        set end of tabResults to "Grok (Chrome)|" & tabURL
                    else if tabURL contains "copilot.microsoft.com" then
                        set end of tabResults to "Copilot (Chrome)|" & tabURL
                    else if tabURL contains "poe.com" then
                        set end of tabResults to "Poe (Chrome)|" & tabURL
                    -- Creative - Image
                    else if tabURL contains "midjourney.com" then
                        set end of tabResults to "Midjourney (Chrome)|" & tabURL
                    else if tabURL contains "labs.openai.com" or tabURL contains "dall-e" then
                        set end of tabResults to "DALL-E (Chrome)|" & tabURL
                    else if tabURL contains "leonardo.ai" then
                        set end of tabResults to "Leonardo.ai (Chrome)|" & tabURL
                    else if tabURL contains "ideogram.ai" then
                        set end of tabResults to "Ideogram (Chrome)|" & tabURL
                    else if tabURL contains "firefly.adobe.com" then
                        set end of tabResults to "Adobe Firefly (Chrome)|" & tabURL
                    -- Creative - Video
                    else if tabURL contains "nanobanana" then
                        set end of tabResults to "NanoBanana (Chrome)|" & tabURL
                    else if tabURL contains "runway" or tabURL contains "runwayml" then
                        set end of tabResults to "Runway (Chrome)|" & tabURL
                    else if tabURL contains "pika.art" or tabURL contains "pikalabs" then
                        set end of tabResults to "Pika (Chrome)|" & tabURL
                    else if tabURL contains "sora.com" or tabURL contains "openai.com/sora" then
                        set end of tabResults to "Sora (Chrome)|" & tabURL
                    else if tabURL contains "klingai" or tabURL contains "kling.kuaishou" then
                        set end of tabResults to "Kling (Chrome)|" & tabURL
                    else if tabURL contains "lumalabs" or tabURL contains "luma.ai" then
                        set end of tabResults to "Luma (Chrome)|" & tabURL
                    else if tabURL contains "heygen" then
                        set end of tabResults to "HeyGen (Chrome)|" & tabURL
                    else if tabURL contains "synthesia" then
                        set end of tabResults to "Synthesia (Chrome)|" & tabURL
                    else if tabURL contains "invideo" then
                        set end of tabResults to "InVideo (Chrome)|" & tabURL
                    else if tabURL contains "descript" then
                        set end of tabResults to "Descript (Chrome)|" & tabURL
                    else if tabURL contains "veed.io" then
                        set end of tabResults to "VEED (Chrome)|" & tabURL
                    else if tabURL contains "fliki.ai" then
                        set end of tabResults to "Fliki (Chrome)|" & tabURL
                    -- Creative - Other
                    else if tabURL contains "canva.com" then
                        set end of tabResults to "Canva (Chrome)|" & tabURL
                    else if tabURL contains "figma.com" then
                        set end of tabResults to "Figma (Chrome)|" & tabURL
                    end if
                end repeat
            end repeat
            return tabResults
        end tell
    end if
end tell`;
        
        try {
            const chromeOut = await new Promise((res) => {
                exec(`osascript -e '${chromeScript}'`, (err, out) => res(err ? '' : out));
            });
            if (chromeOut.trim()) {
                const tabs = chromeOut.trim().split(', ');
                tabs.forEach(tab => {
                    const [name, url] = tab.split('|');
                    if (name && !results.find(r => r.name === name)) {
                        results.push({ name: name.trim(), type: 'browser', browser: 'Chrome', url: url?.trim() });
                    }
                });
            }
        } catch (e) {}
        
        // 3. Safari AI 탭 감지
        const safariScript = `
tell application "System Events"
    if exists process "Safari" then
        tell application "Safari"
            set tabResults to {}
            repeat with w in windows
                repeat with t in tabs of w
                    set tabURL to URL of t
                    -- Research
                    if tabURL contains "claude.ai" then
                        set end of tabResults to "Claude (Safari)|" & tabURL
                    else if tabURL contains "chat.openai.com" or tabURL contains "chatgpt.com" then
                        set end of tabResults to "ChatGPT (Safari)|" & tabURL
                    else if tabURL contains "gemini.google.com" then
                        set end of tabResults to "Gemini|" & tabURL
                    else if tabURL contains "perplexity.ai" then
                        set end of tabResults to "Perplexity (Safari)|" & tabURL
                    else if tabURL contains "grok.x.ai" then
                        set end of tabResults to "Grok (Safari)|" & tabURL
                    -- Creative - Video
                    else if tabURL contains "nanobanana" then
                        set end of tabResults to "NanoBanana (Safari)|" & tabURL
                    else if tabURL contains "runway" then
                        set end of tabResults to "Runway (Safari)|" & tabURL
                    else if tabURL contains "pika.art" then
                        set end of tabResults to "Pika (Safari)|" & tabURL
                    else if tabURL contains "klingai" then
                        set end of tabResults to "Kling (Safari)|" & tabURL
                    else if tabURL contains "lumalabs" then
                        set end of tabResults to "Luma (Safari)|" & tabURL
                    -- Creative - Image
                    else if tabURL contains "midjourney.com" then
                        set end of tabResults to "Midjourney (Safari)|" & tabURL
                    else if tabURL contains "leonardo.ai" then
                        set end of tabResults to "Leonardo.ai (Safari)|" & tabURL
                    end if
                end repeat
            end repeat
            return tabResults
        end tell
    end if
end tell`;
        
        try {
            const safariOut = await new Promise((res) => {
                exec(`osascript -e '${safariScript}'`, (err, out) => res(err ? '' : out));
            });
            if (safariOut.trim()) {
                const tabs = safariOut.trim().split(', ');
                tabs.forEach(tab => {
                    const [name, url] = tab.split('|');
                    if (name && !results.find(r => r.name === name)) {
                        results.push({ name: name.trim(), type: 'browser', browser: 'Safari', url: url?.trim() });
                    }
                });
            }
        } catch (e) {}
        
        resolve(results);
    });
});

// 앱 활성화 (창을 앞으로 가져오기)
ipcMain.handle('activate-app', async (event, appName) => {
    return new Promise((resolve) => {
        const script = `tell application "${appName}" to activate`;
        exec(`osascript -e '${script}'`, (error) => {
            resolve(!error);
        });
    });
});

// 창 배치 (Split View 스타일)
ipcMain.handle('arrange-windows', async (event, apps, layout) => {
    return new Promise((resolve) => {
        // Electron screen API로 화면 크기 가져오기 (Finder 호출 불필요)
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
        const menuBarHeight = 25;
        
        let positions = [];
        
        if (layout === 'split' && apps.length >= 2) {
            positions = [
                { x: 0, y: menuBarHeight, w: screenWidth / 2, h: screenHeight - menuBarHeight },
                { x: screenWidth / 2, y: menuBarHeight, w: screenWidth / 2, h: screenHeight - menuBarHeight }
            ];
        } else if (layout === 'grid' && apps.length >= 4) {
            positions = [
                { x: 0, y: menuBarHeight, w: screenWidth / 2, h: (screenHeight - menuBarHeight) / 2 },
                { x: screenWidth / 2, y: menuBarHeight, w: screenWidth / 2, h: (screenHeight - menuBarHeight) / 2 },
                { x: 0, y: menuBarHeight + (screenHeight - menuBarHeight) / 2, w: screenWidth / 2, h: (screenHeight - menuBarHeight) / 2 },
                { x: screenWidth / 2, y: menuBarHeight + (screenHeight - menuBarHeight) / 2, w: screenWidth / 2, h: (screenHeight - menuBarHeight) / 2 }
            ];
        } else if (layout === 'focus' && apps.length >= 1) {
            positions = [
                { x: 100, y: menuBarHeight + 50, w: screenWidth - 200, h: screenHeight - menuBarHeight - 100 }
            ];
        }
        
        // 각 앱 창 위치 조정
        apps.forEach((appName, i) => {
            if (positions[i]) {
                const pos = positions[i];
                const moveScript = `
tell application "System Events"
    tell process "${appName}"
        set position of window 1 to {${pos.x}, ${pos.y}}
        set size of window 1 to {${pos.w}, ${pos.h}}
    end tell
end tell`;
                exec(`osascript -e '${moveScript}'`);
            }
        });
        
        resolve(true);
    });
});

// 창 스크린샷 캡처
ipcMain.handle('capture-window', async (event, appName) => {
    return new Promise((resolve) => {
        // screencapture 명령어로 특정 창 캡처
        const tmpFile = `/tmp/dcc_capture_${Date.now()}.png`;
        
        // 앱의 창 ID 가져오기
        const getWindowScript = `
tell application "System Events"
    tell process "${appName}"
        set windowId to id of window 1
    end tell
end tell
return windowId`;
        
        exec(`osascript -e '${getWindowScript}'`, (err, windowId) => {
            if (err) {
                // fallback: 앱 전체 캡처
                exec(`screencapture -l $(osascript -e 'tell app "${appName}" to id of window 1') ${tmpFile}`, (err2) => {
                    if (err2) {
                        resolve(null);
                        return;
                    }
                    const fs = require('fs');
                    const data = fs.readFileSync(tmpFile, { encoding: 'base64' });
                    fs.unlinkSync(tmpFile);
                    resolve(`data:image/png;base64,${data}`);
                });
                return;
            }
            
            exec(`screencapture -l ${windowId.trim()} ${tmpFile}`, (err2) => {
                if (err2) {
                    resolve(null);
                    return;
                }
                const fs = require('fs');
                try {
                    const data = fs.readFileSync(tmpFile, { encoding: 'base64' });
                    fs.unlinkSync(tmpFile);
                    resolve(`data:image/png;base64,${data}`);
                } catch (e) {
                    resolve(null);
                }
            });
        });
    });
});

// 모든 AI 창 캡처 (desktopCapturer 사용)
ipcMain.handle('capture-all-windows', async (event, appInfos) => {
    const { desktopCapturer, systemPreferences } = require('electron');
    const results = {};
    
    // 화면 녹화 권한 확인
    const hasAccess = systemPreferences.getMediaAccessStatus('screen');
    
    if (hasAccess !== 'granted') {
        return results;
    }
    
    try {
        // 모든 창 소스 가져오기
        const sources = await desktopCapturer.getSources({ 
            types: ['window'],
            thumbnailSize: { width: 1200, height: 800 },
            fetchWindowIcons: false
        });
        
        // DCC 자체 창 제외
        const filteredSources = sources.filter(s => !s.name.includes('DCC'));
        
        // 브라우저 창 미리 찾기
        const chromeWindow = filteredSources.find(s => s.name.includes('Google Chrome') || s.name.includes('Chrome'));
        const safariWindow = filteredSources.find(s => s.name.includes('Safari') && !s.name.includes('Preferences'));
        
        // 이미 매칭된 창 추적 (중복 방지)
        const usedSources = new Set();
        
        // 앱 정보를 정렬: Antigravity를 Cursor보다 먼저 처리 (더 구체적인 것 먼저)
        const sortedAppInfos = [...appInfos].sort((a, b) => {
            const priority = { 'antigravity': 0, 'windsurf': 1, 'cursor': 2 };
            const aKey = a.name.toLowerCase();
            const bKey = b.name.toLowerCase();
            const aPri = Object.entries(priority).find(([k]) => aKey.includes(k))?.[1] ?? 99;
            const bPri = Object.entries(priority).find(([k]) => bKey.includes(k))?.[1] ?? 99;
            return aPri - bPri;
        });
        
        for (const info of sortedAppInfos) {
            const { name, browser, windowTitle } = info;
            const nameLower = name.toLowerCase();
            
            let source = null;
            
            // 0. windowTitle이 있으면 우선 사용 (가장 정확한 매칭)
            if (windowTitle && !browser) {
                source = filteredSources.find(s => {
                    if (usedSources.has(s.id)) return false;
                    return s.name === windowTitle || 
                           s.name.includes(windowTitle) || 
                           windowTitle.includes(s.name);
                });
            }
            
            // 브라우저 탭인 경우
            if (!source && browser) {
                // 1. 먼저 탭 제목으로 직접 찾기
                const searchTerms = [];
                if (nameLower.includes('gemini')) searchTerms.push('gemini');
                else if (nameLower.includes('claude')) searchTerms.push('claude');
                else if (nameLower.includes('chatgpt') || nameLower.includes('gpt')) searchTerms.push('chatgpt', 'gpt');
                else if (nameLower.includes('perplexity')) searchTerms.push('perplexity');
                else if (nameLower.includes('notion')) searchTerms.push('notion');
                
                // 탭 제목으로 찾기
                source = filteredSources.find(s => {
                    if (usedSources.has(s.id)) return false;
                    const sn = s.name.toLowerCase();
                    return searchTerms.some(term => sn.includes(term));
                });
                
                // 2. 못 찾으면 브라우저 창 자체 캡처
                if (!source) {
                    if (browser === 'Chrome' && !usedSources.has(chromeWindow?.id)) {
                        source = chromeWindow;
                    } else if (browser === 'Safari' && !usedSources.has(safariWindow?.id)) {
                        source = safariWindow;
                    }
                }
            } else if (!source) {
                // 데스크탑 앱인 경우 - windowTitle로 못 찾은 경우
                const appNameClean = nameLower.replace(/[\s()]/g, '');
                
                // Antigravity 특별 처리
                if (appNameClean === 'antigravity') {
                    source = filteredSources.find(s => {
                        if (usedSources.has(s.id)) return false;
                        const sn = s.name.toLowerCase();
                        return sn.includes('antigravity') || sn.includes('(anti)') || sn.includes('anti)');
                    });
                    if (!source) {
                        source = filteredSources.find(s => {
                            if (usedSources.has(s.id)) return false;
                            return s.id.toLowerCase().includes('anti');
                        });
                    }
                    if (!source) {
                        const candidates = filteredSources.filter(s => {
                            if (usedSources.has(s.id)) return false;
                            const sn = s.name.toLowerCase();
                            return !s.name.includes(' — ') && s.name.includes(' - ') &&
                                   !sn.includes('chrome') && !sn.includes('safari') && !sn.includes('dcc');
                        });
                        if (candidates.length > 0) source = candidates[0];
                    }
                }
                // Cursor 처리
                else if (appNameClean === 'cursor') {
                    source = filteredSources.find(s => {
                        if (usedSources.has(s.id)) return false;
                        return s.name.toLowerCase().includes('cursor');
                    });
                    if (!source) {
                        source = filteredSources.find(s => {
                            if (usedSources.has(s.id)) return false;
                            return s.name.includes(' — ') && !s.name.includes('DCC');
                        });
                    }
                }
                // Notion 특별 처리
                else if (appNameClean === 'notion') {
                    source = filteredSources.find(s => {
                        if (usedSources.has(s.id)) return false;
                        return s.name.toLowerCase().includes('notion');
                    });
                    if (!source) {
                        try {
                            const notionWindowTitle = execSync(`osascript -e 'tell application "System Events" to tell process "Notion" to get name of window 1'`, { encoding: 'utf-8', timeout: 2000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
                            if (notionWindowTitle) {
                                source = filteredSources.find(s => {
                                    if (usedSources.has(s.id)) return false;
                                    return s.name === notionWindowTitle || s.name.includes(notionWindowTitle);
                                });
                            }
                        } catch (e) {}
                    }
                }
                // Claude Desktop 특별 처리
                else if (appNameClean === 'claude' || nameLower.includes('claude')) {
                    // Claude Desktop 앱 창 찾기
                    source = filteredSources.find(s => {
                        if (usedSources.has(s.id)) return false;
                        const sn = s.name.toLowerCase();
                        // Claude 앱 창은 보통 "Claude" 또는 대화 제목을 포함
                        return sn.includes('claude') || s.name === 'Claude';
                    });
                    // 못 찾으면 electron 앱 특성 활용 (Claude Desktop은 Electron 기반)
                    if (!source) {
                        source = filteredSources.find(s => {
                            if (usedSources.has(s.id)) return false;
                            // Claude Desktop 창 ID 패턴 확인
                            return s.id.toLowerCase().includes('claude');
                        });
                    }
                }
                // 기타 앱
                else {
                    source = filteredSources.find(s => {
                        if (usedSources.has(s.id)) return false;
                        return s.name.toLowerCase().includes(appNameClean);
                    });
                }
            }
            
            if (source && source.thumbnail) {
                usedSources.add(source.id);
                results[name] = source.thumbnail.toDataURL();
            }
        }
    } catch (e) {
        // 캡처 실패
    }
    
    return results;
});

// 브라우저에서 AI 탭 찾기 (안전한 방식 - 앱 자동 실행 방지)
ipcMain.handle('get-browser-ai-tabs', async () => {
    return new Promise((resolve) => {
        const results = [];
        
        // Chrome 탭 확인 - 실행 중인 경우에만
        const chromeScript = `
tell application "System Events"
    if exists process "Google Chrome" then
        tell application "Google Chrome"
            set tabList to {}
            repeat with w in windows
                repeat with t in tabs of w
                    set tabURL to URL of t
                    if tabURL contains "claude.ai" or tabURL contains "chat.openai.com" or tabURL contains "gemini.google.com" or tabURL contains "perplexity.ai" then
                        set end of tabList to {title of t, tabURL}
                    end if
                end repeat
            end repeat
            return tabList
        end tell
    else
        return {}
    end if
end tell`;
        
        exec(`osascript -e '${chromeScript}'`, (err, out) => {
            if (!err && out.trim() && out.trim() !== '{}') {
                results.push({ browser: 'Chrome', tabs: out.trim() });
            }
            
            // Safari도 확인 - 실행 중인 경우에만
            const safariScript = `
tell application "System Events"
    if exists process "Safari" then
        tell application "Safari"
            set tabList to {}
            repeat with w in windows
                repeat with t in tabs of w
                    set tabURL to URL of t
                    if tabURL contains "claude.ai" or tabURL contains "chat.openai.com" or tabURL contains "gemini.google.com" or tabURL contains "perplexity.ai" then
                        set end of tabList to {name of t, tabURL}
                    end if
                end repeat
            end repeat
            return tabList
        end tell
    else
        return {}
    end if
end tell`;
            
            exec(`osascript -e '${safariScript}'`, (err2, out2) => {
                if (!err2 && out2.trim() && out2.trim() !== '{}') {
                    results.push({ browser: 'Safari', tabs: out2.trim() });
                }
                resolve(results);
            });
        });
    });
});

// macOS 알림 DB 읽기 (데스크탑 앱 상태 감지용)
let lastNotificationTime = Date.now();

ipcMain.handle('get-recent-notifications', async () => {
    const fs = require('fs');
    const os = require('os');
    const { execSync } = require('child_process');
    
    const results = [];
    
    try {
        // macOS 알림 DB 경로
        const homeDir = os.homedir();
        const dbPath = `${homeDir}/Library/Group Containers/group.com.apple.usernoted/db2/db`;
        
        // DB 파일 존재 확인
        if (!fs.existsSync(dbPath)) {
            return results;
        }
        
        // sqlite3로 최근 알림 읽기 (마지막 체크 이후)
        const query = `
            SELECT 
                app_id, 
                title, 
                subtitle, 
                body,
                delivered_date
            FROM record 
            WHERE delivered_date > ${(lastNotificationTime / 1000) - 978307200}
            ORDER BY delivered_date DESC
            LIMIT 10;
        `;
        
        const result = execSync(`sqlite3 "${dbPath}" "${query}"`, { 
            encoding: 'utf-8',
            timeout: 5000
        });
        
        if (result && result.trim()) {
            const lines = result.trim().split('\n');
            lines.forEach(line => {
                const parts = line.split('|');
                if (parts.length >= 4) {
                    const appId = parts[0] || '';
                    // AI 관련 앱만 필터링
                    const aiKeywords = ['cursor', 'claude', 'notion', 'copilot', 'chatgpt', 'gemini'];
                    const isAiApp = aiKeywords.some(k => appId.toLowerCase().includes(k));
                    
                    if (isAiApp) {
                        results.push({
                            app: appId,
                            title: parts[1] || '',
                            subtitle: parts[2] || '',
                            body: parts[3] || ''
                        });
                    }
                }
            });
        }
        
        lastNotificationTime = Date.now();
    } catch (e) {
        // 알림 읽기 실패 (권한 문제 등)
    }
    
    return results;
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
