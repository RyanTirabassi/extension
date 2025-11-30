export const sharedHandlers = `
const vscode = acquireVsCodeApi();

function switchTab(tabName, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
  btn.classList.add('active');
  addLog(\`📂 Aberta aba: \${tabName.toUpperCase()}\`, 'info');
}

function addLog(text, type = 'info') {
  const logsContent = document.getElementById('logsContent');
  const logEntry = document.createElement('div');
  logEntry.className = \`log-entry \${type}\`;
  logEntry.textContent = text;
  logsContent.appendChild(logEntry);
  logsContent.scrollTop = logsContent.scrollHeight;
}

function clearLogs() {
  document.getElementById('logsContent').innerHTML = '';
  addLog('✓ Logs limpos', 'success');
}

function updateStatus(text) {
  document.getElementById('status-text').textContent = text;
}

// Listener para mensagens do backend
window.addEventListener('message', event => {
  const msg = event.data;
  
  if (msg.type === 'log') {
    const text = msg.text || '';
    let type = 'info';
    
    if (text.includes('✓')) type = 'success';
    else if (text.includes('✖') || text.includes('✗')) type = 'error';
    else if (text.includes('⚠️')) type = 'warning';
    
    addLog(text, type);
  }
  else if (msg.type === 'tokenStatus') {
    const statusEl = msg.tokenType === 'github' 
      ? document.getElementById('gh-status') 
      : document.getElementById('vercel-status');
    
    if (msg.isSaved) {
      statusEl.textContent = '✓ Salvo';
      statusEl.classList.add('saved');
    } else {
      statusEl.textContent = '● Não salvo';
      statusEl.classList.remove('saved');
    }
  }
  else if (msg.type === 'testResults') {
    handleTestResults(msg.tests);
  }
  else if (msg.type === 'deployComplete') {
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success');
    addLog('✓ DEPLOY CONCLUÍDO COM SUCESSO ✓', 'success');
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success');
    updateStatus('Pronto');
  }
  else if (msg.type === 'status') {
    updateStatus(msg.text);
  }
});
`;