/**
 * Kova - Professional SaaS UI
 * v7 - Clean & Minimal
 */

// i18n
const i18n = {
    ko: {
        all: '전체',
        research: '리서치',
        coding: '코딩',
        creative: '크리에이티브',
        activity: '타임라인',
        current: '현재',
        allScope: '전체',
        transfer: '결과 복사',
        refresh: '새로고침',
        save: '저장',
        settings: '설정',
        language: '언어',
        apps: '앱 관리',
        behavior: '동작',
        notifyComplete: '완료 알림',
        autoFocus: '자동 포커스',
        showProgress: '진행률 표시',
        transferOutput: '결과 전송',
        from: '보내는 곳',
        to: '받는 곳',
        running: '실행 중',
        done: '완료',
        idle: '대기',
        ready: '준비됨',
        allDone: '모든 작업 완료',
        noTasks: '작업 없음'
    },
    en: {
        all: 'All',
        research: 'Research',
        coding: 'Coding',
        creative: 'Creative',
        activity: 'Timeline',
        current: 'Current',
        allScope: 'All',
        transfer: 'Copy Result',
        refresh: 'Refresh',
        save: 'Save',
        settings: 'Settings',
        language: 'Language',
        apps: 'Apps',
        behavior: 'Behavior',
        notifyComplete: 'Notify on complete',
        autoFocus: 'Auto focus',
        showProgress: 'Show progress',
        transferOutput: 'Transfer Output',
        from: 'From',
        to: 'To',
        running: 'Running',
        done: 'Done',
        idle: 'Idle',
        ready: 'Ready',
        allDone: 'All tasks done',
        noTasks: 'No tasks'
    }
};

// State
const state = {
    lang: 'ko',
    currentPurpose: 'research',
    currentLayout: 'split',
    timelineScope: 'purpose', // 'purpose' or 'all'
    focusedWindow: null,
    transfer: { source: null, target: null, recent: [] },
    settings: {
        notifyComplete: true,
        autoFocus: false,
        showProgress: true
    },
    apps: {
        claude: { enabled: true, name: 'Claude', type: 'Desktop', color: 'claude', url: 'https://claude.ai' },
        gpt: { enabled: true, name: 'ChatGPT', type: 'Safari', color: 'gpt', url: 'https://chat.openai.com' },
        cursor: { enabled: true, name: 'Cursor', type: 'Desktop', color: 'cursor', url: 'cursor://open' },
        gemini: { enabled: true, name: 'Gemini', type: 'Safari', color: 'gemini', url: 'https://gemini.google.com' },
        perplexity: { enabled: true, name: 'Perplexity', type: 'Safari', color: 'cursor', url: 'https://perplexity.ai' },
        midjourney: { enabled: true, name: 'Midjourney', type: 'Chrome', color: 'midjourney', url: 'https://midjourney.com' },
        notion: { enabled: true, name: 'Notion AI', type: 'Desktop', color: 'notion', url: 'https://notion.so' }
    },
    purposes: {
        all: {
            name: { ko: '전체', en: 'All' },
            icon: '📋',
            apps: ['claude', 'gpt', 'cursor', 'gemini', 'perplexity', 'midjourney', 'notion']
        },
        research: {
            name: { ko: '리서치', en: 'Research' },
            icon: '🔍',
            apps: ['claude', 'gpt', 'gemini', 'perplexity'],
            prompts: {
                claude: '마케팅 카피 5개 작성해줘',
                gpt: '경쟁사 분석 리포트',
                gemini: '시장 트렌드 분석',
                perplexity: '최신 AI 뉴스'
            }
        },
        coding: {
            name: { ko: '코딩', en: 'Coding' },
            icon: '💻',
            apps: ['cursor', 'claude', 'gpt', 'notion'],
            prompts: {
                cursor: 'API 리팩토링해줘',
                claude: '코드 리뷰해줘',
                gpt: '테스트 케이스 작성',
                notion: '문서 정리'
            }
        },
        creative: {
            name: { ko: '크리에이티브', en: 'Creative' },
            icon: '🎨',
            apps: ['gpt', 'midjourney', 'claude', 'notion'],
            prompts: {
                gpt: '이미지 프롬프트 작성',
                midjourney: 'logo design --ar 1:1',
                claude: '브랜드 스토리',
                notion: '에셋 정리'
            }
        }
    },
    layouts: {
        focus: { count: 1, grid: '1fr', rows: '1fr' },
        split: { count: 2, grid: '1fr 1fr', rows: '1fr' },
        grid: { count: 4, grid: '1fr 1fr', rows: '1fr 1fr' },
        stack: { count: 3, grid: '2fr 1fr', rows: '1fr 1fr' }
    },
    windowStates: {}
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initWindowStates();
    loadSettings();
    render();
    bindEvents();
    startSimulation();
});

function t(key) {
    return i18n[state.lang][key] || key;
}

function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
}

function initWindowStates() {
    // 10개 동시 작업 데모
    const allKeys = Object.keys(state.apps);
    allKeys.forEach((key, i) => {
        // 모든 앱을 processing 상태로 시작 (10개 동시 작업 테스트)
        state.windowStates[key] = {
            status: 'processing',
            progress: Math.floor(Math.random() * 60) + 10 // 10~70% 랜덤 시작
        };
    });
}

function render() {
    applyI18n();
    renderScopeToggle();
    renderTimeline();
    renderAppList();
    renderWorkspace();
    renderStatusQueue();
    updateHeader();
}

// Purpose Dropdown
function updatePurposeDropdown() {
    const purpose = state.purposes[state.currentPurpose];
    document.getElementById('purposeLabel').textContent = purpose.name[state.lang];
    
    // Update active state
    document.querySelectorAll('.purpose-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.purpose === state.currentPurpose);
    });
}

// Scope Toggle
function renderScopeToggle() {
    const container = document.getElementById('scopeToggle');
    const purpose = state.purposes[state.currentPurpose];
    const purposeName = purpose.name[state.lang];
    
    if (state.currentPurpose === 'all') {
        // "전체" 선택 시 토글 숨김
        container.innerHTML = '';
        state.timelineScope = 'all';
        return;
    }
    
    const allLabel = t('allScope');
    
    container.innerHTML = `
        <button class="scope-btn ${state.timelineScope === 'purpose' ? 'active' : ''}" data-scope="purpose">${purposeName}</button>
        <button class="scope-btn ${state.timelineScope === 'all' ? 'active' : ''}" data-scope="all">${allLabel}</button>
    `;
    
    container.querySelectorAll('.scope-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.timelineScope = btn.dataset.scope;
            renderScopeToggle();
            renderTimeline();
            saveSettings();
        });
    });
}

function getVisibleApps() {
    const purpose = state.purposes[state.currentPurpose];
    const layout = state.layouts[state.currentLayout];
    return purpose.apps.filter(k => state.apps[k].enabled).slice(0, layout.count);
}

function getTimelineApps() {
    if (state.timelineScope === 'all') {
        return Object.keys(state.apps).filter(k => state.apps[k].enabled);
    }
    return state.purposes[state.currentPurpose].apps.filter(k => state.apps[k].enabled);
}

function renderTimeline() {
    const container = document.getElementById('timelineList');
    const apps = getTimelineApps();
    const times = ['2분 전', '1분 전', '30초 전', '방금'];
    
    container.innerHTML = apps.map((key, i) => {
        const app = state.apps[key];
        const ws = state.windowStates[key];
        let prompt = '';
        Object.values(state.purposes).forEach(p => {
            if (p.prompts && p.prompts[key]) prompt = p.prompts[key];
        });
        
        const statusClass = ws.status === 'completed' ? 'done' : (ws.status === 'processing' ? 'running' : 'idle');
        
        return `
            <div class="timeline-item ${state.focusedWindow === key ? 'active' : ''}" data-app="${key}">
                <div class="timeline-indicator ${statusClass}"></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <span class="timeline-name">${app.name}</span>
                        <span class="timeline-time">${times[i % times.length]}</span>
                    </div>
                    <div class="timeline-prompt">${ws.status !== 'waiting' ? (prompt || '...').substring(0, 30) : t('idle')}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderAppList() {
    const container = document.getElementById('appList');
    container.innerHTML = Object.entries(state.apps).map(([key, app]) => `
        <div class="app-item ${!app.enabled ? 'disabled' : ''}">
            <div class="app-dot ${app.color}"></div>
            <div class="app-info">
                <div class="app-name">${app.name}</div>
                <div class="app-type">${app.type}</div>
            </div>
            <label class="setting-row" style="padding:0;border:none;">
                <input type="checkbox" ${app.enabled ? 'checked' : ''} data-app="${key}">
                <span class="toggle"></span>
            </label>
        </div>
    `).join('');
}

function renderWorkspace() {
    const workspace = document.getElementById('workspace');
    const layout = state.layouts[state.currentLayout];
    const apps = getVisibleApps();
    
    workspace.style.gridTemplateColumns = layout.grid;
    workspace.style.gridTemplateRows = layout.rows;
    
    workspace.innerHTML = apps.map((key, i) => createCard(key, i)).join('');
    
    // iframe 에러 핸들링
    document.querySelectorAll('.app-iframe').forEach(iframe => {
        iframe.addEventListener('error', () => {
            showFallback(iframe.dataset.app);
        });
        
        // X-Frame-Options 차단 감지 (로드 후 체크)
        iframe.addEventListener('load', () => {
            try {
                // 크로스 오리진 접근 시도 - 차단되면 에러 발생
                const doc = iframe.contentDocument || iframe.contentWindow.document;
            } catch (e) {
                // 접근 불가 = 정상 로드됨 (크로스 오리진)
            }
        });
    });
}

function showFallback(appKey) {
    const card = document.querySelector(`.window-card[data-app="${appKey}"]`);
    if (card) {
        const fallback = card.querySelector('.iframe-fallback');
        if (fallback) fallback.classList.add('show');
    }
}

function createCard(key, index) {
    const app = state.apps[key];
    const span = state.currentLayout === 'stack' && index === 0 ? 'grid-row: span 2;' : '';
    
    return `
        <div class="window-card ${state.focusedWindow === key ? 'focused' : ''}" 
             data-app="${key}" style="${span}">
            <div class="window-header">
                <div class="window-title">
                    <div class="app-dot ${app.color}"></div>
                    <span class="window-name">${app.name}</span>
                </div>
                <div class="window-actions">
                    <button class="open-app-btn" data-app="${key}" title="새 탭에서 열기">↗</button>
                    <button class="reload-btn" data-app="${key}" title="새로고침">⟳</button>
                </div>
            </div>
            <div class="window-body iframe-container">
                <iframe 
                    src="${app.url}" 
                    data-app="${key}"
                    class="app-iframe"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                ></iframe>
                <div class="iframe-fallback">
                    <div class="fallback-icon">${app.name.charAt(0)}</div>
                    <p>${app.name}</p>
                    <span>이 사이트는 iframe 임베드를 지원하지 않습니다</span>
                    <button class="fallback-open-btn" data-app="${key}">새 탭에서 열기</button>
                </div>
            </div>
        </div>
    `;
}

function getContent(key, ws, prompt) {
    if (ws.status === 'waiting') {
        return `<div class="chat-mock" style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-quaternary);font-size:12px;">${t('idle')}</div>`;
    }
    if (ws.status === 'processing') {
        return `<div class="chat-mock"><div class="bubble user">${prompt}</div><div class="typing"><span></span><span></span><span></span></div></div>`;
    }
    if (key === 'cursor') {
        return `<div class="code-mock">// API routes\nexport { getUsers, createUser };</div>`;
    }
    if (key === 'midjourney') {
        return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;height:100%;"><div style="background:var(--bg-elevated);border-radius:6px;"></div><div style="background:var(--bg-active);border-radius:6px;"></div><div style="background:var(--bg-active);border-radius:6px;"></div><div style="background:var(--bg-elevated);border-radius:6px;"></div></div>`;
    }
    return `<div class="chat-mock"><div class="bubble user">${prompt}</div><div class="bubble ai">결과 1: 옵션 A<br>결과 2: 옵션 B</div></div>`;
}

function updateHeader() {
    updatePurposeDropdown();
}

function renderStatusQueue() {
    const container = document.getElementById('statusQueue');
    const wrapper = document.getElementById('statusQueueWrapper');
    if (!container) return;
    
    const allApps = Object.keys(state.apps).filter(k => state.apps[k].enabled);
    const processingApps = allApps.filter(k => state.windowStates[k]?.status === 'processing');
    
    // Idle state - no tasks running
    if (processingApps.length === 0) {
        const idleText = state.lang === 'ko' 
            ? '모든 AI가 대기 중입니다' 
            : 'All AI assistants ready';
        container.innerHTML = `
            <div class="queue-idle">
                <span class="queue-idle-dot"></span>
                <span>${idleText}</span>
            </div>
        `;
        wrapper?.classList.remove('has-overflow');
        return;
    }
    
    let html = '';
    
    // Show all processing apps
    processingApps.forEach(key => {
        const app = state.apps[key];
        const ws = state.windowStates[key];
        html += `
            <div class="queue-item running" data-app="${key}">
                <span class="queue-dot"></span>
                <span class="queue-name">${app.name}</span>
                <span class="queue-progress">${Math.round(ws.progress)}%</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Check overflow for fade effect
    if (wrapper) {
        const hasOverflow = container.scrollWidth > wrapper.clientWidth;
        wrapper.classList.toggle('has-overflow', hasOverflow);
    }
    
    // Click to focus
    container.querySelectorAll('.queue-item').forEach(item => {
        item.addEventListener('click', () => focusWindow(item.dataset.app));
    });
}

// Events
function bindEvents() {
    // Purpose dropdown
    const dropdown = document.getElementById('purposeDropdown');
    const trigger = document.getElementById('purposeTrigger');
    
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });
    
    document.addEventListener('click', () => {
        dropdown.classList.remove('open');
    });
    
    document.querySelectorAll('.purpose-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            state.currentPurpose = opt.dataset.purpose;
            state.timelineScope = 'purpose';
            dropdown.classList.remove('open');
            animateTransition();
            saveSettings();
        });
    });
    
    // Layout buttons
    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.currentLayout = btn.dataset.layout;
            document.querySelectorAll('.layout-btn').forEach(b => b.classList.toggle('active', b === btn));
            animateTransition();
            saveSettings();
        });
    });
    
    // Language
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.lang = btn.dataset.lang;
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b === btn));
            render();
            saveSettings();
        });
    });
    
    // Settings
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('closeSettings').addEventListener('click', closeSettings);
    document.getElementById('settingsOverlay').addEventListener('click', closeSettings);
    
    ['notifyComplete', 'autoFocus', 'showProgress'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', e => {
            state.settings[id] = e.target.checked;
            if (id === 'showProgress') renderWorkspace();
            saveSettings();
        });
    });
    
    // App toggles
    document.getElementById('appList').addEventListener('change', e => {
        if (e.target.dataset.app) {
            const key = e.target.dataset.app;
            state.apps[key].enabled = e.target.checked;
            e.target.closest('.app-item').classList.toggle('disabled', !e.target.checked);
            render();
            saveSettings();
        }
    });
    
    // Transfer
    document.getElementById('transferBtn').addEventListener('click', openTransferModal);
    document.getElementById('transferOverlay').addEventListener('click', closeTransferModal);
    
    // Actions
    document.getElementById('refreshBtn').addEventListener('click', () => {
        toast('↻', t('refresh'));
        renderWorkspace();
    });
    
    // Window clicks
    document.getElementById('workspace').addEventListener('click', e => {
        // 앱 열기 버튼
        const openBtn = e.target.closest('.open-app-btn');
        if (openBtn) {
            e.stopPropagation();
            openApp(openBtn.dataset.app);
            return;
        }
        
        // 새로고침 버튼
        const reloadBtn = e.target.closest('.reload-btn');
        if (reloadBtn) {
            e.stopPropagation();
            const iframe = document.querySelector(`.app-iframe[data-app="${reloadBtn.dataset.app}"]`);
            if (iframe) iframe.src = iframe.src;
            return;
        }
        
        // Fallback 열기 버튼
        const fallbackBtn = e.target.closest('.fallback-open-btn');
        if (fallbackBtn) {
            e.stopPropagation();
            openApp(fallbackBtn.dataset.app);
            return;
        }
        
        const card = e.target.closest('.window-card');
        if (card && !e.target.closest('.iframe-container')) {
            focusWindow(card.dataset.app);
        }
        
        const sendBtn = e.target.closest('.prompt-send-btn');
        if (sendBtn) {
            const appKey = sendBtn.dataset.app;
            const input = document.querySelector(`.prompt-input[data-app="${appKey}"]`);
            if (input && input.value.trim()) {
                sendPrompt(appKey, input.value.trim());
                input.value = '';
            }
        }
    });
    
    document.getElementById('workspace').addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.classList.contains('prompt-input')) {
            const appKey = e.target.dataset.app;
            if (e.target.value.trim()) {
                sendPrompt(appKey, e.target.value.trim());
                e.target.value = '';
            }
        }
    });
    
    document.getElementById('timelineList').addEventListener('click', e => {
        const item = e.target.closest('.timeline-item');
        if (item) focusWindow(item.dataset.app);
    });
    
    // Resize handle
    const sidebar = document.getElementById('sidebar');
    const handle = document.getElementById('resizeHandle');
    let isResizing = false;
    
    handle.addEventListener('mousedown', () => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });
    
    document.addEventListener('mousemove', e => {
        if (!isResizing) return;
        if (e.clientX >= 200 && e.clientX <= 320) {
            sidebar.style.width = e.clientX + 'px';
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
    
    handle.addEventListener('dblclick', () => {
        toggleSidebar();
    });
    
    // Fold/Unfold buttons
    document.getElementById('foldToggle').addEventListener('click', () => toggleSidebar());
    document.getElementById('unfoldToggle').addEventListener('click', () => toggleSidebar());
    
    // Keyboard
    document.addEventListener('keydown', e => {
        if (e.metaKey || e.ctrlKey) {
            if (e.key === 't' || e.key === 'T') {
                e.preventDefault();
                openTransferModal();
            }
            if (e.key === '[') {
                e.preventDefault();
                toggleSidebar();
            }
        }
        if (e.key === 'Escape') {
            closeSettings();
            closeTransferModal();
        }
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const unfoldBtn = document.getElementById('unfoldToggle');
    
    const isCollapsed = sidebar.classList.contains('collapsed');
    
    if (isCollapsed) {
        // Unfold - restore to default width
        sidebar.classList.remove('collapsed');
        sidebar.style.width = '260px';
    } else {
        // Fold - inline style 제거해야 CSS .collapsed가 적용됨
        sidebar.style.width = '';
        sidebar.classList.add('collapsed');
    }
    
    unfoldBtn.classList.toggle('show', !isCollapsed);
}

function animateTransition() {
    const ws = document.getElementById('workspace');
    ws.style.opacity = '0.5';
    setTimeout(() => { render(); ws.style.opacity = '1'; }, 80);
}

function focusWindow(key) {
    state.focusedWindow = key;
    document.querySelectorAll('.window-card').forEach(c => c.classList.toggle('focused', c.dataset.app === key));
    document.querySelectorAll('.timeline-item').forEach(i => i.classList.toggle('active', i.dataset.app === key));
}

function openApp(key) {
    const app = state.apps[key];
    if (app && app.url) {
        window.open(app.url, '_blank');
        toast('↗', `${app.name} 열기`);
    }
}

function openSettings() {
    document.getElementById('settingsPanel').classList.add('show');
    document.getElementById('settingsOverlay').classList.add('show');
}

function closeSettings() {
    document.getElementById('settingsPanel').classList.remove('show');
    document.getElementById('settingsOverlay').classList.remove('show');
}

// Transfer Modal
function openTransferModal() {
    state.transfer.source = null;
    state.transfer.target = null;
    renderTransferModal();
    document.getElementById('transferModal').classList.add('show');
    document.getElementById('transferOverlay').classList.add('show');
}

function closeTransferModal() {
    document.getElementById('transferModal').classList.remove('show');
    document.getElementById('transferOverlay').classList.remove('show');
}

function renderTransferModal() {
    const sourceList = document.getElementById('sourceList');
    const targetList = document.getElementById('targetList');
    const recentDiv = document.getElementById('recentTransfers');
    
    const enabledApps = Object.entries(state.apps).filter(([k, v]) => v.enabled);
    
    sourceList.innerHTML = enabledApps.map(([key, app]) => {
        const ws = state.windowStates[key];
        const isCompleted = ws.status === 'completed';
        return `
            <div class="app-option ${state.transfer.source === key ? 'selected' : ''} ${!isCompleted ? 'disabled' : ''}" data-source="${key}">
                <div class="app-dot ${app.color}"></div>
                <span class="app-option-name">${app.name}</span>
                <span class="app-option-status">${isCompleted ? t('ready') : t(ws.status)}</span>
            </div>
        `;
    }).join('');
    
    targetList.innerHTML = enabledApps.map(([key, app]) => {
        const isSource = state.transfer.source === key;
        return `
            <div class="app-option ${state.transfer.target === key ? 'selected' : ''} ${isSource ? 'disabled' : ''}" data-target="${key}">
                <div class="app-dot ${app.color}"></div>
                <span class="app-option-name">${app.name}</span>
            </div>
        `;
    }).join('');
    
    if (state.transfer.recent.length > 0) {
        recentDiv.innerHTML = `
            <span class="recent-label">Recent:</span>
            ${state.transfer.recent.slice(0, 3).map(r => `
                <div class="recent-chip" data-recent="${r.source}-${r.target}">
                    <span class="chip-dot" style="background:${getColor(r.source)}"></span>
                    ${state.apps[r.source]?.name}
                    →
                    <span class="chip-dot" style="background:${getColor(r.target)}"></span>
                    ${state.apps[r.target]?.name}
                </div>
            `).join('')}
        `;
    } else {
        recentDiv.innerHTML = '';
    }
    
    sourceList.querySelectorAll('.app-option:not(.disabled)').forEach(el => {
        el.addEventListener('click', () => {
            state.transfer.source = el.dataset.source;
            renderTransferModal();
        });
    });
    
    targetList.querySelectorAll('.app-option:not(.disabled)').forEach(el => {
        el.addEventListener('click', () => {
            state.transfer.target = el.dataset.target;
            executeTransfer();
        });
    });
    
    recentDiv.querySelectorAll('.recent-chip').forEach(el => {
        el.addEventListener('click', () => {
            const [src, tgt] = el.dataset.recent.split('-');
            state.transfer.source = src;
            state.transfer.target = tgt;
            executeTransfer();
        });
    });
}

function executeTransfer() {
    if (!state.transfer.source || !state.transfer.target) return;
    
    const src = state.apps[state.transfer.source];
    const tgt = state.apps[state.transfer.target];
    
    const newRecent = { source: state.transfer.source, target: state.transfer.target };
    state.transfer.recent = [newRecent, ...state.transfer.recent.filter(r => 
        !(r.source === newRecent.source && r.target === newRecent.target)
    )].slice(0, 5);
    
    closeTransferModal();
    toast('→', `${src.name} → ${tgt.name}`);
    saveSettings();
}

function getColor(key) {
    const c = { claude: '#a78bfa', gpt: '#10b981', cursor: '#3b82f6', midjourney: '#ec4899', gemini: '#f59e0b', notion: '#9ca3af' };
    return c[key] || '#71717a';
}

function toast(icon, msg) {
    const t = document.getElementById('toast');
    document.getElementById('toastIcon').textContent = icon;
    document.getElementById('toastMsg').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}

// Send Prompt
function sendPrompt(appKey, promptText) {
    const app = state.apps[appKey];
    
    state.windowStates[appKey] = {
        status: 'processing',
        progress: 0,
        currentPrompt: promptText
    };
    
    if (state.purposes[state.currentPurpose].prompts) {
        state.purposes[state.currentPurpose].prompts[appKey] = promptText;
    }
    
    toast('↗', `${app.name}`);
    render();
    focusWindow(appKey);
    
    const duration = 3000 + Math.random() * 5000;
    simulateProgress(appKey, duration);
}

function simulateProgress(appKey, duration) {
    const startTime = Date.now();
    const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        
        state.windowStates[appKey].progress = progress;
        
        const bar = document.querySelector(`[data-app="${appKey}"] .progress-bar`);
        if (bar) bar.style.width = progress + '%';
        
        renderStatusQueue();
        
        if (progress >= 100) {
            clearInterval(interval);
            state.windowStates[appKey].status = 'completed';
            if (state.settings.notifyComplete) {
                toast('✓', `${state.apps[appKey].name}`);
            }
            render();
        }
    }, 100);
}

// Simulation
function startSimulation() {
    setInterval(() => {
        Object.keys(state.windowStates).forEach(key => {
            const ws = state.windowStates[key];
            if (ws.status === 'processing') {
                ws.progress = Math.min(ws.progress + Math.random() * 2, 100);
                if (ws.progress >= 100) {
                    ws.status = 'completed';
                    if (state.settings.notifyComplete) toast('✓', state.apps[key].name);
                    if (state.settings.autoFocus) focusWindow(key);
                    render();
                }
                const bar = document.querySelector(`[data-app="${key}"] .progress-bar`);
                if (bar) bar.style.width = ws.progress + '%';
            }
        });
        renderStatusQueue();
    }, 500);
}

// Persistence - Auto save on every change
function saveSettings() {
    localStorage.setItem('kova', JSON.stringify({
        lang: state.lang,
        currentPurpose: state.currentPurpose,
        currentLayout: state.currentLayout,
        timelineScope: state.timelineScope,
        settings: state.settings,
        apps: Object.fromEntries(Object.entries(state.apps).map(([k, v]) => [k, { enabled: v.enabled }])),
        recentTransfers: state.transfer.recent
    }));
}

function loadSettings() {
    const saved = localStorage.getItem('kova');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            
            // Restore state
            if (data.lang) state.lang = data.lang;
            if (data.currentPurpose) state.currentPurpose = data.currentPurpose;
            if (data.currentLayout) state.currentLayout = data.currentLayout;
            if (data.timelineScope) state.timelineScope = data.timelineScope;
            
            Object.assign(state.settings, data.settings);
            Object.entries(data.apps || {}).forEach(([k, v]) => {
                if (state.apps[k]) state.apps[k].enabled = v.enabled;
            });
            state.transfer.recent = data.recentTransfers || [];
            
            // Apply to UI
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === state.lang));
            document.querySelectorAll('.layout-btn').forEach(b => b.classList.toggle('active', b.dataset.layout === state.currentLayout));
            ['notifyComplete', 'autoFocus', 'showProgress'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.checked = state.settings[id];
            });
        } catch (e) {}
    }
}
