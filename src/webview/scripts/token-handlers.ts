export const tokenHandlers = `
function saveGhToken() {
  const token = document.getElementById('ghToken').value.trim();
  if (!token) {
    addLog('✖ Token GitHub vazio', 'error');
    return;
  }
  document.getElementById('gh-status').textContent = '✓ Salvo';
  document.getElementById('gh-status').classList.add('saved');
  addLog(\`✓ GitHub token salvo com segurança\`, 'success');
  vscode.postMessage({ type: 'saveGithubToken', token });
}

function clearGhToken() {
  document.getElementById('ghToken').value = '';
  document.getElementById('gh-status').textContent = '● Não salvo';
  document.getElementById('gh-status').classList.remove('saved');
  addLog('✓ GitHub token removido', 'success');
  vscode.postMessage({ type: 'clearGithubToken' });
}

function saveVercelToken() {
  const token = document.getElementById('vercelToken').value.trim();
  if (!token) {
    addLog('✖ Token Vercel vazio', 'error');
    return;
  }
  document.getElementById('vercel-status').textContent = '✓ Salvo';
  document.getElementById('vercel-status').classList.add('saved');
  addLog(\`✓ Vercel token salvo com segurança\`, 'success');
  vscode.postMessage({ type: 'saveVercelToken', token });
}

function clearVercelToken() {
  document.getElementById('vercelToken').value = '';
  document.getElementById('vercel-status').textContent = '● Não salvo';
  document.getElementById('vercel-status').classList.remove('saved');
  addLog('✓ Vercel token removido', 'success');
  vscode.postMessage({ type: 'clearVercelToken' });
}

function saveRepoUrl() {
  const url = document.getElementById('repoUrl').value.trim();
  if (!url) {
    addLog('✖ Repo URL vazia', 'error');
    return;
  }
  addLog(\`✓ Repo URL salva: \${url}\`, 'success');
  vscode.postMessage({ type: 'saveRepoUrl', url });
}

function testGithubAccess() {
  const repoUrl = document.getElementById('repoUrl').value.trim();
  const ghToken = document.getElementById('ghToken').value.trim();
  
  if (!repoUrl) {
    addLog('✖ Preencha a Repo URL', 'error');
    return;
  }

  addLog('🔍 Testando acesso ao GitHub...', 'info');
  updateStatus('Testando...');
  vscode.postMessage({ type: 'testGithubAccess', repoUrl, ghToken });
}

function deploy() {
  const repoUrl = document.getElementById('repoUrl').value.trim();
  const ghToken = document.getElementById('ghToken').value.trim();
  const commitMsg = document.getElementById('commitMsg').value.trim();
  
  if (!repoUrl || !ghToken) {
    addLog('✖ Preencha Repo URL e GitHub Token', 'error');
    return;
  }

  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  addLog('🚀 INICIANDO DEPLOY', 'info');
  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  updateStatus('Implantando...');
  vscode.postMessage({ type: 'deploy', repoUrl, ghToken, commitMsg, authMethod: 'token', deployVercel: false });
}

function deployVercel() {
  const repoUrl = document.getElementById('repoUrl').value.trim();
  const ghToken = document.getElementById('ghToken').value.trim();
  const vercelToken = document.getElementById('vercelToken').value.trim();
  
  if (!repoUrl || !ghToken || !vercelToken) {
    addLog('✖ Preencha Repo URL, GitHub Token e Vercel Token', 'error');
    return;
  }

  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  addLog('⚡ INICIANDO DEPLOY + VERCEL', 'info');
  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  updateStatus('Implantando em Vercel...');
  vscode.postMessage({ type: 'deploy', repoUrl, ghToken, vercelToken, authMethod: 'token', deployVercel: true });
}
`;