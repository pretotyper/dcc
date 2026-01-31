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

// 실행 중인 앱 감지 (macOS)
ipcMain.handle('get-running-apps', async () => {
    return new Promise((resolve) => {
        // AppleScript로 실행 중인 앱 목록 가져오기
        const script = `
            tell application "System Events"
                set appList to name of every process whose background only is false
            end tell
            return appList
        `;
        
        exec(`osascript -e '${script}'`, (error, stdout) => {
            if (error) {
                resolve([]);
                return;
            }
            const apps = stdout.trim().split(', ').filter(Boolean);
            resolve(apps);
        });
    });
});

// Safari 탭 감지
ipcMain.handle('get-safari-tabs', async () => {
    return new Promise((resolve) => {
        const script = `
            tell application "Safari"
                set tabList to {}
                repeat with w in windows
                    repeat with t in tabs of w
                        set end of tabList to {name of t, URL of t}
                    end repeat
                end repeat
                return tabList
            end tell
        `;
        
        exec(`osascript -e '${script}'`, (error, stdout) => {
            if (error) {
                resolve([]);
                return;
            }
            resolve(stdout.trim());
        });
    });
});

// Chrome 탭 감지
ipcMain.handle('get-chrome-tabs', async () => {
    return new Promise((resolve) => {
        const script = `
            tell application "Google Chrome"
                set tabList to {}
                repeat with w in windows
                    repeat with t in tabs of w
                        set end of tabList to {title of t, URL of t}
                    end repeat
                end repeat
                return tabList
            end tell
        `;
        
        exec(`osascript -e '${script}'`, (error, stdout) => {
            if (error) {
                resolve([]);
                return;
            }
            resolve(stdout.trim());
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
