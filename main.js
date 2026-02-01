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

// 실행 중인 AI 앱 감지 (데스크탑 앱 + 브라우저 탭)
ipcMain.handle('get-running-ai-apps', async () => {
    return new Promise(async (resolve) => {
        const results = [];
        
        // 1. 데스크탑 AI 앱 감지
        const desktopAiApps = ['Claude', 'Cursor', 'Notion'];
        const script = `
tell application "System Events"
    set runningApps to name of every process whose background only is false
end tell
return runningApps`;
        
        try {
            const stdout = await new Promise((res, rej) => {
                exec(`osascript -e '${script}'`, (err, out) => err ? rej(err) : res(out));
            });
            const running = stdout.trim().split(', ');
            running.forEach(app => {
                if (desktopAiApps.some(ai => app.includes(ai))) {
                    results.push({ name: app, type: 'desktop', browser: null });
                }
            });
        } catch (e) {}
        
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
                        set end of tabResults to "Gemini (Chrome)|" & tabURL
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
                        set end of tabResults to "Gemini (Safari)|" & tabURL
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
        // 화면 크기 가져오기
        const screenScript = `
tell application "Finder"
    set screenBounds to bounds of window of desktop
end tell
return screenBounds`;
        
        exec(`osascript -e '${screenScript}'`, (err, screenOut) => {
            // 기본 화면 크기 사용
            const screenWidth = 1920;
            const screenHeight = 1080;
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
        
        for (const info of appInfos) {
            const { name, browser } = info;
            
            // 앱 이름으로 매칭되는 창 찾기
            let targetName = name;
            if (browser) {
                targetName = browser === 'Chrome' ? 'Google Chrome' : browser;
            }
            
            // 창 이름에 앱 이름이 포함된 것 찾기
            const searchTerms = [
                targetName.toLowerCase().replace(/[()]/g, '').trim(),
                browser ? browser.toLowerCase() : null
            ].filter(Boolean);
            
            const source = sources.find(s => {
                const sourceName = s.name.toLowerCase();
                return searchTerms.some(term => sourceName.includes(term));
            });
            
            if (source && source.thumbnail) {
                const dataUrl = source.thumbnail.toDataURL();
                results[name] = dataUrl;
            }
        }
    } catch (e) {
        // 캡처 실패
    }
    
    return results;
});

// 브라우저에서 AI 탭 찾기
ipcMain.handle('get-browser-ai-tabs', async () => {
    return new Promise((resolve) => {
        const results = [];
        
        // Chrome 탭 확인
        const chromeScript = `
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
end tell`;
        
        exec(`osascript -e '${chromeScript}'`, (err, out) => {
            if (!err && out.trim()) {
                results.push({ browser: 'Chrome', tabs: out.trim() });
            }
            
            // Safari도 확인
            const safariScript = `
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
end tell`;
            
            exec(`osascript -e '${safariScript}'`, (err2, out2) => {
                if (!err2 && out2.trim()) {
                    results.push({ browser: 'Safari', tabs: out2.trim() });
                }
                resolve(results);
            });
        });
    });
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
