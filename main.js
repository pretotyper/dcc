const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

// GPU 크래시 방지
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

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
            contextIsolation: false,
            webviewTag: true,
            webSecurity: false  // webview CORS 문제 방지
        }
    });

    // 크래시 핸들링
    win.webContents.on('crashed', () => {
        console.log('Renderer crashed, reloading...');
        win.reload();
    });

    win.on('unresponsive', () => {
        console.log('Window unresponsive, reloading...');
        win.reload();
    });

    win.loadFile('electron.html');
}

// 실행 중인 앱 감지 (macOS) - 개선된 버전
ipcMain.handle('get-running-apps', async () => {
    return new Promise((resolve) => {
        // ps 명령어로 실행 중인 앱 확인 (AppleScript 권한 불필요)
        exec(`ps aux | grep -E "(Claude|ChatGPT|Cursor|Notion|Slack)" | grep -v grep`, (error, stdout) => {
            const apps = [];
            if (stdout) {
                if (stdout.includes('Claude')) apps.push('Claude');
                if (stdout.includes('ChatGPT')) apps.push('ChatGPT');
                if (stdout.includes('Cursor')) apps.push('Cursor');
                if (stdout.includes('Notion')) apps.push('Notion');
            }
            resolve(apps);
        });
    });
});

// Chrome 탭 감지 (개선된 버전)
ipcMain.handle('get-chrome-tabs', async () => {
    return new Promise((resolve) => {
        // Chrome이 실행 중인지 먼저 확인
        exec(`pgrep -x "Google Chrome"`, (error, stdout) => {
            if (error || !stdout.trim()) {
                resolve('');
                return;
            }
            
            // Chrome 실행 중이면 AppleScript로 탭 가져오기
            const script = `
tell application "Google Chrome"
    set tabInfo to ""
    repeat with w in windows
        repeat with t in tabs of w
            set tabInfo to tabInfo & URL of t & "\\n"
        end repeat
    end repeat
    return tabInfo
end tell`;
            
            exec(`osascript -e '${script}'`, (err, out) => {
                if (err) {
                    console.log('Chrome AppleScript error:', err.message);
                    resolve('');
                    return;
                }
                resolve(out.trim());
            });
        });
    });
});

// Safari 탭 감지 (개선된 버전)
ipcMain.handle('get-safari-tabs', async () => {
    return new Promise((resolve) => {
        // Safari가 실행 중인지 먼저 확인
        exec(`pgrep -x "Safari"`, (error, stdout) => {
            if (error || !stdout.trim()) {
                resolve('');
                return;
            }
            
            const script = `
tell application "Safari"
    set tabInfo to ""
    repeat with w in windows
        repeat with t in tabs of w
            set tabInfo to tabInfo & URL of t & "\\n"
        end repeat
    end repeat
    return tabInfo
end tell`;
            
            exec(`osascript -e '${script}'`, (err, out) => {
                if (err) {
                    console.log('Safari AppleScript error:', err.message);
                    resolve('');
                    return;
                }
                resolve(out.trim());
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
