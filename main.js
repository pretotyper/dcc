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
        trafficLightPosition: { x: 15, y: 15 },
        backgroundColor: '#18181b',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile('electron.html');
}

// 실행 중인 AI 앱 감지
ipcMain.handle('get-running-ai-apps', async () => {
    return new Promise((resolve) => {
        const aiApps = ['Claude', 'ChatGPT', 'Cursor', 'Notion', 'Slack', 'Arc', 'Safari', 'Google Chrome', 'Firefox'];
        const script = `
tell application "System Events"
    set runningApps to name of every process whose background only is false
end tell
return runningApps`;
        
        exec(`osascript -e '${script}'`, (error, stdout) => {
            if (error) {
                // fallback: ps 명령어 사용
                exec(`ps aux`, (err, out) => {
                    const found = aiApps.filter(app => out.includes(app));
                    resolve(found);
                });
                return;
            }
            const running = stdout.trim().split(', ');
            const found = running.filter(app => aiApps.some(ai => app.includes(ai)));
            resolve(found);
        });
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

// 모든 AI 창 캡처
ipcMain.handle('capture-all-windows', async (event, appNames) => {
    const results = {};
    
    for (const appName of appNames) {
        const tmpFile = `/tmp/dcc_${appName.replace(/\s/g, '_')}.jpg`;
        
        try {
            // screencapture로 앱 창 캡처 (더 빠른 jpg 사용)
            execSync(`screencapture -x -o -l $(osascript -e 'tell app "System Events" to tell process "${appName}" to id of window 1' 2>/dev/null || echo 0) ${tmpFile} 2>/dev/null`, { timeout: 2000 });
            
            const fs = require('fs');
            if (fs.existsSync(tmpFile)) {
                const data = fs.readFileSync(tmpFile, { encoding: 'base64' });
                fs.unlinkSync(tmpFile);
                results[appName] = `data:image/jpeg;base64,${data}`;
            }
        } catch (e) {
            // 앱 창 캡처 실패
        }
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
