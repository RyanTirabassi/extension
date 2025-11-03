import * as vscode from 'vscode';

export function createWebviewPanel(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'deployPanel',
        'Deploy Automático',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    const scriptUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'media', 'main.js')
    );
    const styleUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'media', 'style.css')
    );

    panel.webview.html = getWebviewContent(panel.webview, scriptUri.toString(), styleUri.toString(),
        'https://cdn.pixabay.com/photo/2022/01/30/13/33/github-6980894_1280.png',
        'https://s3.typoniels.de/typoniels-strapi/production/vercel_7b7d3ef99c.webp'
    );
    return panel;
}

export function getWebviewContent(webview: vscode.Webview, scriptUri: string, styleUri: string, githubIcon: string, vercelIcon: string) {
  const csp = webview.cspSource;
  return `<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${csp} https: data:; style-src ${csp} 'unsafe-inline'; script-src ${csp} 'unsafe-inline' 'unsafe-eval';">
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Deploy Automático</title>
  <style>
    body { background-color: #1e1e1e; color: #fff; font-family: "Segoe UI", sans-serif; display: flex; flex-direction: column; gap: 1rem; padding: 14px; }
    h2 { color: #e0e0e0; margin: 0 0 6px 0; font-size: 16px; }
    .deploy-top { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }

    .card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #2b2b2b;
      border: 1px solid #3a3a3a;
      border-radius: 12px;
      padding: 10px 12px;
      width: 280px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
      transition: all 0.18s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .card-left { display: flex; align-items: center; gap: 10px; z-index: 1; }
    .card-left img { width: 40px; height: 40px; object-fit: contain; border-radius: 6px; padding: 4px; background: transparent; }
    .card-text strong { font-size: 14px; font-weight: 600; color: #e6e6e6; }
    .card-text .muted { color: #9aa0a6; font-size: 12px; margin-top: 2px; }

    /* invisible full-size checkbox that captures clicks */
    .card input[type="checkbox"] {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      opacity: 0;
      cursor: pointer;
      z-index: 2;
    }

    /* visual small checkbox (fake) */
    .fake-checkbox {
      width: 20px;
      height: 20px;
      border: 2px solid #555;
      border-radius: 6px;
      background: transparent;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
      z-index: 3;
      pointer-events: none; /* deixa o input receber o clique */
      transition: background .12s ease, border-color .12s ease;
    }

    /* PSEUDO-ELEMENT: desenha o ✔ dentro do fake-checkbox quando o card está ativo */
    .fake-checkbox::after {
      content: "";
      display: inline-block;
      font-size: 12px;
      line-height: 1;
      transform: scale(1);
      opacity: 0;
      transition: opacity .12s ease, transform .12s ease;
    }

    .card.active { box-shadow: 0 0 10px #0078ff44; border-color: #0078ff; background: #2f3338; transform: translateY(-1px); }
    .card.active .fake-checkbox { background: #0078ff; border-color: #0078ff; }
    /* mostra o check quando ativo */
    .card.active .fake-checkbox::after {
      content: "✔";
      color: white;
      opacity: 1;
      transform: scale(1);
    }

    .card:hover { transform: translateY(-2px); background: #333; }

    /* painel */
    .section { margin-top:8px; padding:10px; background:#222; border-radius:8px; }
    label.small { font-size:12px; color:#ccc; display:block; margin-bottom:6px; }
    input[type="text"], input[type="password"], input[type="url"] { width:100%; padding:8px; border-radius:6px; border:1px solid #333; background:#2a2a2a; color:#ddd; }
    button { background:#0b6ddf; color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; margin-right:8px; }
    button.secondary { background:#444; color:#fff; }
    #files { max-height:120px; overflow:auto; background:#0c0c0c; padding:8px; border-radius:6px; color:#ddd; }
    #logs { white-space:pre-line; background:#070707; padding:8px; border-radius:6px; height:140px; overflow:auto; color:#9bd; font-size:12px; margin-top:8px; }

    @media (max-width:520px) { .card { width: 100%; } .deploy-top { gap:8px; } }
  </style>
</head>
<body>
  <h2>🚀 Deploy Automático</h2>

  <div class="deploy-top">
    <label class="card" title="Deploy via Vercel">
      <input id="optVercel" type="checkbox" checked>
      <div class="card-left">
        <img src="${vercelIcon}" alt="Vercel">
        <div class="card-text">
          <strong>Vercel</strong>
          <div class="muted">Deploy & Preview</div>
        </div>
      </div>
      <span class="fake-checkbox" aria-hidden="true"></span>
    </label>

    <label class="card" title="Deploy via GitHub">
      <input id="optGithub" type="checkbox" checked>
      <div class="card-left">
        <img src="${githubIcon}" alt="GitHub">
        <div class="card-text">
          <strong>GitHub</strong>
          <div class="muted">Push & Actions</div>
        </div>
      </div>
      <span class="fake-checkbox" aria-hidden="true"></span>
    </label>
  </div>

  <div class="section">
    <label class="small">GitHub Token</label>
    <input id="githubToken" type="text" placeholder="github_pat_..." />
    <div style="margin-top:8px;">
      <button id="saveGithubBtn">Salve GitHub</button>
      <button id="clearGithubBtn" class="secondary">Limpar</button>
    </div>
  </div>

  <div class="section">
    <label class="small">Vercel Token</label>
    <input id="vercelToken" type="text" placeholder="vercel_..." />
    <div style="margin-top:8px;">
      <button id="saveVercelBtn">Salve Vercel</button>
      <button id="clearVercelBtn" class="secondary">Limpar</button>
    </div>
  </div>

  <div class="section">
    <label class="small">Repo URL (ex: https://github.com/user/repo.git)</label>
    <input id="repoUrl" type="url" placeholder="https://github.com/owner/repo.git" />
    <div style="margin-top:8px;">
      <button id="saveRepoUrlBtn">Salve URL</button>
      <button id="clearRepoUrlBtn" class="secondary">Limpar</button>
    </div>
  </div>

  <div class="section">
    <label class="small">Mensagem de commit (opcional)</label>
    <input id="commitMessage" type="text" placeholder="Descrição do deploy (opcional)" />
    <div style="margin-top:8px; display:flex; gap:8px;">
      <button id="refresh">Atualizar arquivos</button>
      <button id="deploy">Iniciar Deploy</button>
      <button id="testDeploy" class="secondary">Testar Deploy</button>
    </div>
  </div>

  <h3 style="color:#eee; margin:8px 0 4px 0; font-size:13px;">Arquivos modificados</h3>
  <div id="files"></div>

  <h3 style="color:#eee; margin-top:8px; font-size:13px;">Logs</h3>
  <div id="logs"></div>

  <script>
    const vscode = acquireVsCodeApi();
    const logs = document.getElementById('logs');
    const addLog = (t) => { logs.innerText += "\\n" + t; logs.scrollTop = logs.scrollHeight; };

    document.querySelectorAll('.card').forEach(card => {
      const checkbox = card.querySelector('input[type="checkbox"]');
      if (!checkbox) return;
      const applyState = () => card.classList.toggle('active', checkbox.checked);
      checkbox.addEventListener('change', applyState);
      applyState();
    });

    document.getElementById('saveGithubBtn').addEventListener('click', () => {
      const token = (document.getElementById('githubToken')).value.trim();
      vscode.postMessage({ type: 'saveGithubToken', token });
      addLog('Solicitado salvar token GitHub (local).');
    });
    document.getElementById('saveVercelBtn').addEventListener('click', () => {
      const token = (document.getElementById('vercelToken')).value.trim();
      vscode.postMessage({ type: 'saveVercelToken', token });
      addLog('Solicitado salvar token Vercel (local).');
    });
    document.getElementById('saveRepoUrlBtn').addEventListener('click', () => {
      const url = (document.getElementById('repoUrl')).value.trim();
      vscode.postMessage({ type: 'saveRepoUrl', url });
      addLog('Solicitado salvar Repo URL (local).');
    });
    document.getElementById('clearGithubBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'clearGithubToken' });
      addLog('Solicitado limpar GitHub token.');
    });
    document.getElementById('clearVercelBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'clearVercelToken' });
      addLog('Solicitado limpar Vercel token.');
    });
    document.getElementById('clearRepoUrlBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'clearRepoUrl' });
      addLog('Solicitado limpar Repo URL.');
    });
    document.getElementById('refresh').addEventListener('click', () => {
      vscode.postMessage({ type: 'requestStatus' });
      addLog('Solicitado refresh de arquivos.');
    });
    document.getElementById('deploy').addEventListener('click', () => {
      const repoUrl = (document.getElementById('repoUrl')).value.trim();
      const message = (document.getElementById('commitMessage')).value.trim();
      const github = document.getElementById('optGithub').checked;
      const vercel = document.getElementById('optVercel').checked;
      const token = (document.getElementById('vercelToken')).value.trim();
      vscode.postMessage({ type: 'deploy', repoUrl, message, github, vercel, token });
      addLog('Solicitado iniciar deploy (git + vercel).');
    });
    document.getElementById('testDeploy').addEventListener('click', () => {
      const repoUrl = (document.getElementById('repoUrl')).value.trim();
      const ghToken = (document.getElementById('githubToken')).value.trim();
      const vercelToken = (document.getElementById('vercelToken')).value.trim();
      vscode.postMessage({ type: 'testDeploy', repoUrl, ghToken, vercelToken });
      addLog('Solicitado Testar Deploy (validação de tokens e acessos).');
    });

    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.type === 'log') addLog(msg.text);
      else if (msg.type === 'status') {
        const filesDiv = document.getElementById('files');
        filesDiv.innerHTML = msg.files.map(f => '<div><input type="checkbox" checked> ' + f + '</div>').join('');
      } else if (msg.type === 'preview') addLog('--- Preview: ' + msg.file + ' ---\\n' + (msg.text || ''));
      else if (msg.type === 'testResult') {
        addLog('\\n=== Resultado do Teste ===');
        const s = msg.summary;
        addLog('git instalado: ' + (s.gitInstalled ? 'Sim' : 'Não'));
        addLog('repo local: ' + (s.localRepo ? 'Sim' : 'Não'));
        addLog('Repo URL: ' + (s.repoUrl || '(vazio)'));
        addLog('GitHub ok: ' + (s.github?.ok ? 'Sim' : 'Não - ' + (s.github?.text || '')) );
        addLog('Vercel ok: ' + (s.vercel?.ok ? 'Sim' : 'Não - ' + (s.vercel?.text || '')) );
        addLog('===========================');
      } else if (msg.type === 'tokenSaveResult') addLog('Token save result: ' + (msg.ok ? 'OK' : msg.text));
      else if (msg.type === 'repoSaveResult') addLog('Repo save result: ' + (msg.ok ? 'OK' : msg.text));
    });

    vscode.postMessage({ type: 'requestStatus' });
  </script>
</body>
</html>`;
}




