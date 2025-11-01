// extension/media/main.js
const vscode = acquireVsCodeApi();

const GITHUB_IMG = 'https://cdn.pixabay.com/photo/2022/01/30/13/33/github-6980894_1280.png';
const VERCEL_IMG = 'https://cdn.brandfetch.io/vercel.com/fallback/lettermark/theme/dark/h/256/w/256/icon?c=1bfwsmEH20zzEfSNTed';

const root = document.getElementById('root') || document.body;

/* Inject CSS to ensure logos and file list are displayed correctly and larger checkbox/logo */
const styleEl = document.createElement('style');
styleEl.textContent = `
  :root {
    --bg: #111;
    --panel-bg: #1b1b1b;
    --fg: #e6e6e6;
    --muted: #9a9a9a;
    --accent: #0e639c;
    --secondary: #2d2d2d;
    --border: #2f2f2f;

    --checkbox-size: 22px;
    --logo-size: 28px;
    --opt-gap: 12px;
  }

  body, .panel {
    background: var(--bg);
    color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  }

  .panel { padding: 12px; border-radius: 8px; }

  h2 { margin: 4px 0 12px 0; font-size: 18px; display:flex; align-items:center; gap:8px; color: var(--fg); }

  .row { display:flex; gap:12px; align-items:center; margin-bottom:10px; flex-wrap:wrap; }

  .deploy-options { margin-bottom: 8px; }

  /* label das opções */
  .opt-label {
    display:flex;
    align-items:center;
    gap: var(--opt-gap);
    cursor:pointer;
    user-select:none;
    position:relative;
    padding:6px;
    border-radius:6px;
  }

  /* aumenta visual do checkbox sem distorcer demais */
  .opt-label input[type="checkbox"] {
    width: var(--checkbox-size);
    height: var(--checkbox-size);
    -webkit-appearance: none;
    appearance: none;
    border: 2px solid var(--border);
    border-radius: 4px;
    display:inline-block;
    position: relative;
    background: var(--secondary);
    cursor: pointer;
  }

  /* estilo do check interno */
  .opt-label input[type="checkbox"]:checked {
    background: var(--accent);
    border-color: var(--accent);
  }
  .opt-label input[type="checkbox"]:checked::after {
    content: '';
    position: absolute;
    left: 6px;
    top: 2px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  /* logo maior */
  .logo {
    width: var(--logo-size);
    height: var(--logo-size);
    object-fit: contain;
    display:inline-block;
    vertical-align:middle;
  }
  .sr-only { position: absolute; left: -9999px; top: -9999px; } /* accessible text hidden */

  .token-row { display:flex; gap:12px; }
  .token-group { display:flex; gap:8px; align-items:center; }

  input[type="text"], input[type="password"] {
    padding:6px 8px;
    border-radius:4px;
    border:1px solid var(--border);
    background: var(--secondary);
    color: var(--fg);
  }

  .file-list {
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 8px;
    min-height: 60px;
    max-height: 240px;
    overflow: auto;
    background: var(--panel-bg);
    color: var(--fg);
  }

  .file-row { display:flex; justify-content:space-between; align-items:center; padding:6px 4px; gap:8px; border-bottom:1px solid rgba(255,255,255,0.03); }
  .file-row:last-child { border-bottom: none; }

  .file-row label { display:flex; align-items:center; gap:8px; color:var(--fg); }
  .file-row input[type="checkbox"] { width:14px; height:14px; }

  .preview-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--fg);
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
  }

  .actions { margin-top:10px; gap:8px; }
  button.primary { background: var(--accent); color: #fff; border: none; padding:8px 12px; border-radius:6px; cursor:pointer; }
  button { background: var(--secondary); color: var(--fg); border: 1px solid var(--border); padding:6px 8px; border-radius:6px; cursor:pointer; }

  .progress { height:8px; background: rgba(255,255,255,0.04); border-radius:6px; width:100%; overflow:hidden; }
  #progressFill { width:0%; height:100%; background: var(--accent); transition: width .2s ease; }
  .progress-text { font-size:12px; color:var(--muted); margin-top:6px; }
  .logs { background:#0b0b0b; color:#ddd; padding:8px; height:160px; overflow:auto; border-radius:6px; margin-top:8px; white-space:pre-wrap; }
`;
document.head.appendChild(styleEl);

/* Render HTML (root.innerHTML) */
root.innerHTML = `
  <div class="panel">
    <h2>🚀 Deploy Automático</h2>

    <div class="row deploy-options">
      <label title="Deploy via GitHub" class="opt-label">
        <input id="chk-github" type="checkbox" checked />
        <img class="logo" id="img-github" src="${GITHUB_IMG}" alt="GitHub" />
        <span class="sr-only">GitHub</span>
      </label>

      <label title="Deploy via Vercel" class="opt-label">
        <input id="chk-vercel" type="checkbox" checked />
        <img class="logo" id="img-vercel" src="${VERCEL_IMG}" alt="Vercel" />
        <span class="sr-only">Vercel</span>
      </label>
    </div>

    <div class="row token-row">
      <div class="token-group">
        <input id="githubToken" type="password" placeholder="GitHub token (opcional)" />
        <button id="saveGithub">Save GitHub</button>
        <button id="clearGithub">Clear</button>
      </div>
      <div class="token-group">
        <input id="vercelToken" type="password" placeholder="Vercel token (opcional)" />
        <button id="saveVercel">Save Vercel</button>
        <button id="clearVercel">Clear</button>
      </div>
    </div>

    <div class="row">
      <input id="repoUrl" type="text" placeholder="Repo URL (opcional)" />
      <button id="saveRepoUrlBtn">Save URL</button>
      <input id="description" type="text" placeholder="Descrição do deploy (opcional)" />
    </div>

    <h4>Arquivos modificados</h4>
    <div id="files" class="file-list">Carregando...</div>

    <div class="actions">
      <button id="refresh">Refresh files</button>
      <button id="deploy" class="primary">Iniciar Deploy</button>
    </div>

    <div class="progress-wrap">
      <div id="progressBar" class="progress"><div id="progressFill"></div></div>
      <div id="progressText" class="progress-text">Aguardando...</div>
    </div>

    <h4>Logs</h4>
    <pre id="logs" class="logs"></pre>
  </div>
`;

/* elements */
const filesEl = document.getElementById('files');
const logsEl = document.getElementById('logs');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

function appendLog(t) {
  const text = String(t || '');
  if (!logsEl) return;
  logsEl.textContent += text + '\n';
  logsEl.scrollTop = logsEl.scrollHeight;
}

function setProgress(pct, text) {
  if (!progressFill) return;
  const p = Math.max(0, Math.min(100, pct));
  progressFill.style.width = p + '%';
  if (progressText) progressText.textContent = text || `${p}%`;
}

/* Fallback if images can't be loaded: replace with alt text */
function bindImageFallback(id) {
  const img = document.getElementById(id);
  if (!img) return;
  img.addEventListener('error', () => {
    const parent = img.parentElement;
    if (!parent) return;
    // remove broken image and add a small text fallback
    img.remove();
    const span = document.createElement('span');
    span.textContent = id === 'img-github' ? 'GitHub' : 'Vercel';
    span.style.color = 'var(--fg)';
    span.style.fontSize = '0.95rem';
    parent.appendChild(span);
  });
}
bindImageFallback('img-github');
bindImageFallback('img-vercel');

/* handlers (guard queries in case DOM changed) */
function safeById(id) { return document.getElementById(id); }

const refreshBtn = safeById('refresh');
if (refreshBtn) refreshBtn.addEventListener('click', () => {
  vscode.postMessage({ type: 'requestStatus' });
});

const saveVercelBtn = safeById('saveVercel');
if (saveVercelBtn) saveVercelBtn.addEventListener('click', () => {
  const t = (document.getElementById('vercelToken') || {}).value || '';
  vscode.postMessage({ type: 'saveVercelToken', token: t });
  appendLog('Solicitado salvar token Vercel (local).');
});

const saveGithubBtn = safeById('saveGithub');
if (saveGithubBtn) saveGithubBtn.addEventListener('click', () => {
  const t = (document.getElementById('githubToken') || {}).value || '';
  vscode.postMessage({ type: 'saveGithubToken', token: t });
  appendLog('Solicitado salvar token GitHub (local).');
});

const clearVercelBtn = safeById('clearVercel');
if (clearVercelBtn) clearVercelBtn.addEventListener('click', () => {
  vscode.postMessage({ type: 'clearVercelToken' });
  appendLog('Solicitado remoção token Vercel.');
});

const clearGithubBtn = safeById('clearGithub');
if (clearGithubBtn) clearGithubBtn.addEventListener('click', () => {
  vscode.postMessage({ type: 'clearGithubToken' });
  appendLog('Solicitado remoção token GitHub.');
});

const deployBtn = safeById('deploy');
if (deployBtn) deployBtn.addEventListener('click', () => {
  const chkGithub = document.getElementById('chk-github');
  const chkVercel = document.getElementById('chk-vercel');
  const github = chkGithub && chkGithub.checked;
  const vercel = chkVercel && chkVercel.checked;

  const selectedFiles = Array.from(
    document.querySelectorAll('#files input[type="checkbox"]:checked')
  ).map(ch => ch.value);

  const repoUrl = (document.getElementById('repoUrl') || {}).value || '';
  const message = (document.getElementById('description') || {}).value || '';
  const vercelToken = (document.getElementById('vercelToken') || {}).value || '';
  const ghToken = (document.getElementById('githubToken') || {}).value || '';

  setProgress(2, 'Iniciando deploy...');
  vscode.postMessage({
    type: 'deploy',
    github,
    vercel,
    repoUrl,
    message,
    files: selectedFiles,
    token: vercelToken,
    ghToken
  });

  appendLog(`🚀 Deploy solicitado (GitHub: ${github ? 'Sim' : 'Não'} | Vercel: ${vercel ? 'Sim' : 'Não'})`);
});


/* messages from extension */
window.addEventListener('message', event => {
  const msg = event.data;
  if (!msg || !msg.type) return;

  if (msg.type === 'status') {
    const files = msg.files || [];
    renderFiles(files);
  } else if (msg.type === 'log') {
    appendLog(msg.text || msg.stdout || msg.stderr || JSON.stringify(msg));
  } else if (msg.type === 'progress') {
    setProgress(msg.pct || 0, msg.text || '');
  } else if (msg.type === 'tokenSaved') {
    appendLog('Token salvo com segurança.');
  } else if (msg.type === 'tokenCleared') {
    appendLog('Token removido.');
  } else if (msg.type === 'preview') {
    appendLog(`--- preview ${msg.file} ---\n${msg.text || ''}`);
  }
});

/* render files */
function renderFiles(files) {
  if (!filesEl) return;
  filesEl.innerHTML = '';
  if (!files || files.length === 0) {
    filesEl.textContent = 'Nenhuma modificação detectada.';
    return;
  }

  files.forEach(f => {
    const row = document.createElement('div');
    row.className = 'file-row';

    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.alignItems = 'center';
    left.style.gap = '8px';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = f;
    cb.checked = true;

    const span = document.createElement('span');
    span.textContent = f;
    span.style.color = 'var(--fg)';

    left.appendChild(cb);
    left.appendChild(span);

    const right = document.createElement('div');
    const previewBtn = document.createElement('button');
    previewBtn.className = 'preview-btn';
    previewBtn.textContent = 'Preview';
    previewBtn.dataset.file = f;
    previewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      vscode.postMessage({ type: 'preview', file: f });
    });

    right.appendChild(previewBtn);

    row.appendChild(left);
    row.appendChild(right);
    filesEl.appendChild(row);
  });
}

/* initial request */
vscode.postMessage({ type: 'requestStatus' });
setProgress(0, 'Pronto');
appendLog('Painel carregado — solicitando status...');



/* Save Repo URL button handler */
document.getElementById('saveRepoUrlBtn').addEventListener('click', () => {
  const url = document.getElementById('repoUrl').value.trim();
  if (!url) {
    vscode.postMessage({ type: 'log', message: '⚠️ Campo de URL vazio.' });
    return;
  }

  vscode.postMessage({ type: 'saveRepoUrl', url });
});







