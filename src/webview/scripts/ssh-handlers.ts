export const sshHandlers = `
// ============================================
// ESTADO GLOBAL SSH
// ============================================
let sshState = {
  selectedKey: null,
  selectedAlgo: 'ed25519',
  sshKeys: [],
  deployHistory: [],
  generatedKey: null,
  isValidUrl: false
};

// ============================================
// SEÇÃO 1: DETECÇÃO E GERENCIAMENTO DE CHAVES
// ============================================

function refreshKeys() {
  const btn = document.getElementById('btnRefreshKeys');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="loading-spinner"></span> CARREGANDO...';
  btn.disabled = true;

  addLog('🔄 Buscando chaves SSH no sistema...', 'info');
  showConsole('keyTestConsole');
  addConsoleLog('keyTestConsole', '📂 Escaneando diretório ~/.ssh/', 'info');

  // Envia mensagem para o backend
  vscode.postMessage({ type: 'scanSSHKeys' });

  // Timeout de segurança
  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }, 5000);
}

function handleSSHKeysScanned(keys) {
  const btn = document.getElementById('btnRefreshKeys');
  btn.innerHTML = '↻ RECARREGAR CHAVES';
  btn.disabled = false;

  sshState.sshKeys = keys;

  const detectionBox = document.getElementById('keyDetectionBox');
  const keysList = document.getElementById('sshKeysList');

  if (keys.length === 0) {
    detectionBox.className = 'warning-box';
    detectionBox.innerHTML = '⚠ <strong>Nenhuma chave SSH detectada</strong><br>Use o gerador abaixo para criar uma nova chave.';
    
    keysList.innerHTML = \`
      <div class="empty-state">
        <div class="empty-icon">🔑</div>
        <div>Nenhuma chave SSH encontrada</div>
      </div>
    \`;

    addConsoleLog('keyTestConsole', '⚠ Nenhuma chave encontrada', 'warning');
    updateGuideStep(1, 'active');
  } else {
    detectionBox.className = 'success-box';
    detectionBox.innerHTML = \`✓ <strong>\${keys.length} chave\${keys.length > 1 ? 's' : ''} SSH detectada\${keys.length > 1 ? 's' : ''}</strong><br>✓ Sistema pronto para usar SSH\`;

    keysList.innerHTML = '';
    keys.forEach((key, index) => {
      const keyItem = document.createElement('div');
      keyItem.className = \`ssh-key-item \${index === 0 ? 'selected' : ''}\`;
      keyItem.setAttribute('data-key', key.id);
      keyItem.onclick = () => selectKey(key.id);

      keyItem.innerHTML = \`
        <div class="ssh-key-info">
          <div class="ssh-key-name">🔑 \${key.name} \${key.recommended ? '(recomendado)' : ''}</div>
          <div class="ssh-key-path">\${key.path}</div>
        </div>
        <div>
          <span class="ssh-key-type">\${key.type}</span>
          <span class="ssh-key-status" id="status-\${key.id}">● Não testada</span>
        </div>
      \`;

      keysList.appendChild(keyItem);

      addConsoleLog('keyTestConsole', \`✓ Encontrada: \${key.name} (\${key.type})\`, 'success');
    });

    // Seleciona a primeira chave automaticamente
    if (keys.length > 0) {
      sshState.selectedKey = keys[0].id;
      document.getElementById('btnTestKey').disabled = false;
      updateGuideStep(1, 'completed');
      updateGuideStep(2, 'active');
      updateStep1Description(keys[0].name);
    }
  }

  addLog(\`✓ \${keys.length} chave(s) SSH encontrada(s)\`, keys.length > 0 ? 'success' : 'warning');
}

function selectKey(keyId) {
  sshState.selectedKey = keyId;

  document.querySelectorAll('.ssh-key-item').forEach(item => {
    item.classList.remove('selected');
  });

  const selectedItem = document.querySelector(\`[data-key="\${keyId}"]\`);
  if (selectedItem) {
    selectedItem.classList.add('selected');
  }

  const selectedKeyData = sshState.sshKeys.find(k => k.id === keyId);
  if (selectedKeyData) {
    updateStep1Description(selectedKeyData.name);
    addLog(\`🔑 Chave selecionada: \${selectedKeyData.name}\`, 'info');
  }

  document.getElementById('btnTestKey').disabled = false;
  document.getElementById('btnCopyPublic').disabled = false;
}

function testSelectedKey() {
  if (!sshState.selectedKey) {
    addLog('⚠ Selecione uma chave primeiro', 'warning');
    return;
  }

  const selectedKeyData = sshState.sshKeys.find(k => k.id === sshState.selectedKey);
  const btn = document.getElementById('btnTestKey');
  const statusEl = document.getElementById(\`status-\${sshState.selectedKey}\`);
  const keyItem = document.querySelector(\`[data-key="\${sshState.selectedKey}"]\`);

  btn.innerHTML = '<span class="loading-spinner"></span> TESTANDO...';
  btn.disabled = true;

  statusEl.className = 'ssh-key-status testing';
  statusEl.textContent = '⏳ Testando...';

  keyItem.classList.add('testing');

  showConsole('keyTestConsole');
  clearConsole('keyTestConsole');
  addConsoleLog('keyTestConsole', \`🔍 Testando chave: \${selectedKeyData.name}\`, 'info');
  addConsoleLog('keyTestConsole', \`📍 Caminho: \${selectedKeyData.path}\`, 'info');

  addLog(\`⚡ Testando chave SSH: \${selectedKeyData.name}...\`, 'info');

  // Envia mensagem para o backend
  vscode.postMessage({ 
    type: 'testSSHKey', 
    keyId: sshState.selectedKey,
    keyPath: selectedKeyData.path 
  });
}

function handleSSHKeyTestResult(result) {
  const btn = document.getElementById('btnTestKey');
  btn.innerHTML = '⚡ TESTAR CHAVE';
  btn.disabled = false;

  const statusEl = document.getElementById(\`status-\${result.keyId}\`);
  const keyItem = document.querySelector(\`[data-key="\${result.keyId}"]\`);

  keyItem.classList.remove('testing');

  if (result.success) {
    statusEl.className = 'ssh-key-status verified';
    statusEl.textContent = '✓ Verificada';

    addConsoleLog('keyTestConsole', '✓ Conexão SSH bem-sucedida!', 'success');
    addConsoleLog('keyTestConsole', result.output || 'Autenticado com GitHub', 'success');
    addLog('✓ Chave SSH verificada com sucesso!', 'success');

    updateGuideStep(2, 'completed');
    updateGuideStep(3, 'active');
  } else {
    statusEl.className = 'ssh-key-status failed';
    statusEl.textContent = '✗ Falha';

    addConsoleLog('keyTestConsole', '✗ Teste falhou', 'error');
    addConsoleLog('keyTestConsole', result.error || 'Erro desconhecido', 'error');
    addLog('✗ Teste de chave SSH falhou', 'error');
  }
}

// ============================================
// SEÇÃO 2: GERAÇÃO DE CHAVES SSH
// ============================================

function selectAlgo(algo) {
  sshState.selectedAlgo = algo;

  document.querySelectorAll('.algo-option').forEach(el => {
    el.classList.remove('selected');
  });

  document.querySelector(\`[data-algo="\${algo}"]\`).classList.add('selected');
  addLog(\`🔧 Algoritmo selecionado: \${algo.toUpperCase()}\`, 'info');
}

function generateKey() {
  const keyName = document.getElementById('keyName').value.trim();
  const email = document.getElementById('keyEmail').value.trim();
  const algo = sshState.selectedAlgo;

  if (!keyName) {
    addLog('⚠ Informe um nome para a chave', 'warning');
    return;
  }

  const btn = document.getElementById('btnGenerateKey');
  btn.innerHTML = '<span class="loading-spinner"></span> GERANDO...';
  btn.disabled = true;

  showConsole('keyGenConsole');
  clearConsole('keyGenConsole');
  addConsoleLog('keyGenConsole', '🔨 Iniciando geração de chave SSH...', 'info');
  addConsoleLog('keyGenConsole', \`📋 Algoritmo: \${algo.toUpperCase()}\`, 'info');
  addConsoleLog('keyGenConsole', \`📝 Nome: \${keyName}\`, 'info');
  if (email) {
    addConsoleLog('keyGenConsole', \`📧 Email: \${email}\`, 'info');
  }

  addLog(\`✨ Gerando chave SSH \${algo.toUpperCase()}...\`, 'info');

  // Envia mensagem para o backend
  vscode.postMessage({ 
    type: 'generateSSHKey', 
    algo,
    keyName,
    email
  });
}

function handleSSHKeyGenerated(result) {
  const btn = document.getElementById('btnGenerateKey');
  btn.innerHTML = '✨ GERAR NOVA CHAVE SSH';
  btn.disabled = false;

  if (result.success) {
    addConsoleLog('keyGenConsole', '✓ Chave gerada com sucesso!', 'success');
    addConsoleLog('keyGenConsole', \`📁 Chave privada: \${result.privatePath}\`, 'success');
    addConsoleLog('keyGenConsole', \`🔑 Chave pública: \${result.publicPath}\`, 'success');

    sshState.generatedKey = result.publicKey;

    const preview = document.getElementById('keyPreview');
    const content = document.getElementById('keyPreviewContent');
    content.textContent = result.publicKey;
    preview.classList.add('show');

    addLog('✓ Chave SSH gerada com sucesso!', 'success');

    // Atualiza lista de chaves
    setTimeout(() => {
      refreshKeys();
    }, 1000);

  } else {
    addConsoleLog('keyGenConsole', '✗ Erro ao gerar chave', 'error');
    addConsoleLog('keyGenConsole', result.error || 'Erro desconhecido', 'error');
    addLog('✗ Erro ao gerar chave SSH', 'error');
  }
}

function copyGeneratedKey() {
  if (!sshState.generatedKey) {
    addLog('⚠ Nenhuma chave gerada para copiar', 'warning');
    return;
  }

  // Envia mensagem para o backend copiar para clipboard
  vscode.postMessage({ 
    type: 'copyToClipboard', 
    text: sshState.generatedKey 
  });

  addLog('📋 Chave pública copiada!', 'success');
  updateGuideStep(2, 'completed');
  updateGuideStep(3, 'active');
}

// ============================================
// SEÇÃO 3: GUIA DE CONFIGURAÇÃO
// ============================================

function updateGuideStep(stepNum, status) {
  const stepEl = document.getElementById(\`step\${stepNum}\`);
  stepEl.className = 'step-number';
  
  if (status === 'completed') {
    stepEl.classList.add('completed');
  } else if (status === 'active') {
    stepEl.classList.add('active');
  }
}

function updateStep1Description(keyName) {
  const desc = document.getElementById('step1Desc');
  desc.innerHTML = \`Chave selecionada: <strong>\${keyName}</strong>\`;
}

function copyPublicKey() {
  if (!sshState.selectedKey) {
    addLog('⚠ Selecione uma chave primeiro', 'warning');
    return;
  }

  const selectedKeyData = sshState.sshKeys.find(k => k.id === sshState.selectedKey);
  
  addLog('📋 Copiando chave pública...', 'info');

  // Envia mensagem para o backend
  vscode.postMessage({ 
    type: 'copySSHPublicKey', 
    keyPath: selectedKeyData.path 
  });
}

function handlePublicKeyCopied(result) {
  if (result.success) {
    addLog('✓ Chave pública copiada para área de transferência!', 'success');

    const preview = document.getElementById('publicKeyPreview');
    const content = document.createElement('div');
    content.className = 'key-preview-content';
    content.textContent = result.publicKey;

    preview.innerHTML = '';
    preview.appendChild(document.createElement('div'));
    preview.firstChild.className = 'key-preview-title';
    preview.firstChild.textContent = '🔑 Chave Pública:';
    preview.appendChild(content);
    preview.classList.add('show');

    updateGuideStep(2, 'completed');
    updateGuideStep(3, 'active');
  } else {
    addLog('✗ Erro ao copiar chave pública', 'error');
  }
}

function openGithubSettings() {
  addLog('🔗 Abrindo GitHub Settings...', 'info');
  vscode.postMessage({ type: 'openURL', url: 'https://github.com/settings/keys' });
  
  updateGuideStep(3, 'completed');
  updateGuideStep(4, 'active');
}

function testSSHConnection() {
  const btn = document.getElementById('btnTestConnection');
  btn.innerHTML = '<span class="loading-spinner"></span> TESTANDO...';
  btn.disabled = true;

  showConsole('sshTestConsole');
  clearConsole('sshTestConsole');
  addConsoleLog('sshTestConsole', '🔍 Testando conexão SSH com GitHub...', 'info');
  addConsoleLog('sshTestConsole', '⏳ Isso pode levar alguns segundos...', 'info');

  addLog('⚡ Testando conexão SSH com GitHub...', 'info');

  // Envia mensagem para o backend
  vscode.postMessage({ type: 'testSSHConnection' });
}

function handleSSHConnectionTestResult(result) {
  const btn = document.getElementById('btnTestConnection');
  btn.innerHTML = '⚡ TESTAR CONEXÃO';
  btn.disabled = false;

  if (result.success) {
    addConsoleLog('sshTestConsole', '✓ Conexão SSH estabelecida com sucesso!', 'success');
    addConsoleLog('sshTestConsole', result.output || 'Autenticado com GitHub', 'success');
    addLog('✓ Conexão SSH com GitHub verificada!', 'success');

    updateGuideStep(4, 'completed');

    // Habilita botões de deploy
    document.getElementById('btnTestSSH').disabled = false;
    document.getElementById('btnDeploySsh').disabled = false;
  } else {
    addConsoleLog('sshTestConsole', '✗ Falha na conexão SSH', 'error');
    addConsoleLog('sshTestConsole', result.error || 'Erro desconhecido', 'error');
    addConsoleLog('sshTestConsole', '', 'info');
    addConsoleLog('sshTestConsole', '💡 Dicas:', 'warning');
    addConsoleLog('sshTestConsole', '1. Verifique se adicionou a chave pública no GitHub', 'warning');
    addConsoleLog('sshTestConsole', '2. Aguarde alguns minutos após adicionar a chave', 'warning');
    addConsoleLog('sshTestConsole', '3. Verifique sua conexão com a internet', 'warning');
    addLog('✗ Falha ao conectar com GitHub via SSH', 'error');
  }
}

// ============================================
// SEÇÃO 4: CONFIGURAÇÃO DO REPOSITÓRIO
// ============================================

function validateSSHUrl(input) {
  const value = input.value.trim();
  const urlStatus = document.getElementById('urlStatus');
  const urlValidation = document.getElementById('urlValidation');

  if (!value) {
    input.classList.remove('valid', 'invalid');
    urlValidation.style.display = 'none';
    urlStatus.className = 'field-status';
    urlStatus.textContent = '● Não validado';
    sshState.isValidUrl = false;
    document.getElementById('btnTestSSH').disabled = true;
    document.getElementById('btnDeploySsh').disabled = true;
    return;
  }

  const sshPattern = /^git@github\\.com:[a-zA-Z0-9_-]+\\/[a-zA-Z0-9_-]+\\.git$/;
  const isValid = sshPattern.test(value);

  sshState.isValidUrl = isValid;

  if (isValid) {
    input.classList.remove('invalid');
    input.classList.add('valid');
    
    urlStatus.className = 'field-status detected';
    urlStatus.textContent = '✓ Formato válido';

    urlValidation.className = 'validation-indicator valid';
    urlValidation.textContent = '✓ URL SSH válida detectada';
    urlValidation.style.display = 'inline-flex';

    // Habilita botões apenas se houver chave selecionada
    if (sshState.selectedKey) {
      document.getElementById('btnTestSSH').disabled = false;
      document.getElementById('btnDeploySsh').disabled = false;
    }
  } else {
    input.classList.remove('valid');
    input.classList.add('invalid');
    
    urlStatus.className = 'field-status';
    urlStatus.textContent = '✗ Formato inválido';

    urlValidation.className = 'validation-indicator invalid';
    urlValidation.textContent = '✗ Use o formato: git@github.com:usuario/repo.git';
    urlValidation.style.display = 'inline-flex';

    document.getElementById('btnTestSSH').disabled = true;
    document.getElementById('btnDeploySsh').disabled = true;
  }
}

function testSSH() {
  const sshUrl = document.getElementById('sshUrl').value.trim();

  if (!sshState.isValidUrl) {
    addLog('✗ URL SSH inválida', 'error');
    return;
  }

  const btn = document.getElementById('btnTestSSH');
  btn.innerHTML = '<span class="loading-spinner"></span> TESTANDO...';
  btn.disabled = true;

  showConsole('deployConsole');
  clearConsole('deployConsole');
  addConsoleLog('deployConsole', '🔍 Testando acesso SSH ao repositório...', 'info');
  addConsoleLog('deployConsole', \`📍 URL: \${sshUrl}\`, 'info');

  addLog(\`⚡ Testando SSH: \${sshUrl}...\`, 'info');

  vscode.postMessage({ type: 'testSSH', sshUrl });
}

function handleSSHTestResult(result) {
  const btn = document.getElementById('btnTestSSH');
  btn.innerHTML = '⚡ TESTAR SSH';
  btn.disabled = false;

  if (result.success) {
    addConsoleLog('deployConsole', '✓ Repositório acessível via SSH!', 'success');
    addConsoleLog('deployConsole', result.output || 'Acesso confirmado', 'success');
    addLog('✓ Repositório acessível via SSH!', 'success');

    document.getElementById('btnDeploySsh').disabled = false;
  } else {
    addConsoleLog('deployConsole', '✗ Erro ao acessar repositório', 'error');
    addConsoleLog('deployConsole', result.error || 'Acesso negado', 'error');
    addLog('✗ Erro ao testar SSH', 'error');
  }
}

function deploySsh() {
  const sshUrl = document.getElementById('sshUrl').value.trim();
  const commitMsg = document.getElementById('commitMsg').value.trim();
  const branch = document.getElementById('branchSelect').value;

  if (!sshState.isValidUrl) {
    addLog('✗ URL SSH inválida', 'error');
    return;
  }

  if (!commitMsg) {
    addLog('⚠ Informe uma mensagem de commit', 'warning');
    return;
  }

  const btn = document.getElementById('btnDeploySsh');
  btn.innerHTML = '<span class="loading-spinner"></span> DEPLOYANDO...';
  btn.disabled = true;

  showConsole('deployConsole');
  clearConsole('deployConsole');
  addConsoleLog('deployConsole', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  addConsoleLog('deployConsole', '🚀 INICIANDO DEPLOY VIA SSH', 'info');
  addConsoleLog('deployConsole', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  addConsoleLog('deployConsole', \`📍 URL: \${sshUrl}\`, 'info');
  addConsoleLog('deployConsole', \`🌿 Branch: \${branch}\`, 'info');
  addConsoleLog('deployConsole', \`💬 Commit: \${commitMsg}\`, 'info');

  addLog('🚀 Iniciando deploy SSH...', 'info');

  vscode.postMessage({ 
    type: 'deploySsh', 
    sshUrl,
    commitMsg,
    branch
  });
}

function handleSSHDeployResult(result) {
  const btn = document.getElementById('btnDeploySsh');
  btn.innerHTML = '🚀 DEPLOY SSH';
  btn.disabled = false;

  if (result.success) {
    addConsoleLog('deployConsole', '✓ Deploy concluído com sucesso!', 'success');
    addConsoleLog('deployConsole', result.output || 'Deploy finalizado', 'success');
    addConsoleLog('deployConsole', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success');
    addLog('✓ Deploy SSH concluído com sucesso!', 'success');

    // Adiciona ao histórico
    addToDeployHistory({
      status: 'success',
      date: new Date().toLocaleString('pt-BR'),
      branch: document.getElementById('branchSelect').value,
      commit: document.getElementById('commitMsg').value
    });
  } else {
    addConsoleLog('deployConsole', '✗ Deploy falhou', 'error');
    addConsoleLog('deployConsole', result.error || 'Erro desconhecido', 'error');
    addConsoleLog('deployConsole', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
    addLog('✗ Deploy SSH falhou', 'error');

    // Adiciona ao histórico
    addToDeployHistory({
      status: 'error',
      date: new Date().toLocaleString('pt-BR'),
      error: result.error || 'Erro desconhecido'
    });
  }
}

// ============================================
// SEÇÃO 5: HISTÓRICO DE DEPLOYS
// ============================================

function addToDeployHistory(deploy) {
  sshState.deployHistory.unshift(deploy);

  if (sshState.deployHistory.length > 10) {
    sshState.deployHistory.pop();
  }

  renderDeployHistory();
}

function renderDeployHistory() {
  const historyContainer = document.getElementById('deployHistory');
  const clearBtn = document.getElementById('btnClearHistory');

  if (sshState.deployHistory.length === 0) {
    historyContainer.innerHTML = \`
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div>Nenhum deploy realizado ainda</div>
      </div>
    \`;
    clearBtn.style.display = 'none';
    return;
  }

  historyContainer.innerHTML = '';
  clearBtn.style.display = 'block';

  sshState.deployHistory.forEach(deploy => {
    const item = document.createElement('div');
    item.className = \`history-item \${deploy.status}\`;

    const statusIcon = deploy.status === 'success' ? '✓' : '✗';
    const statusText = deploy.status === 'success' ? 'Deploy bem-sucedido' : 'Deploy falhou';

    if (deploy.status === 'success') {
      item.innerHTML = \`
        <div class="history-header">
          <span class="history-status">\${statusIcon} \${statusText}</span>
          <span class="history-date">\${deploy.date}</span>
        </div>
        <div class="history-details">
          Branch: \${deploy.branch} • Commit: \${deploy.commit}
        </div>
      \`;
    } else {
      item.innerHTML = \`
        <div class="history-header">
          <span class="history-status error">\${statusIcon} \${statusText}</span>
          <span class="history-date">\${deploy.date}</span>
        </div>
        <div class="history-details">
          Erro: \${deploy.error}
        </div>
      \`;
    }

    historyContainer.appendChild(item);
  });
}

function clearHistory() {
  if (confirm('Tem certeza que deseja limpar o histórico de deploys?')) {
    sshState.deployHistory = [];
    renderDeployHistory();
    addLog('🗑️ Histórico de deploys limpo', 'success');
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function showConsole(consoleId) {
  const console = document.getElementById(consoleId);
  console.classList.add('show');
}

function clearConsole(consoleId) {
  const console = document.getElementById(consoleId);
  console.innerHTML = '';
}

function addConsoleLog(consoleId, text, type = 'info') {
  const console = document.getElementById(consoleId);
  const line = document.createElement('div');
  line.className = \`console-line \${type}\`;
  line.textContent = text;
  console.appendChild(line);
  console.scrollTop = console.scrollHeight;
}

// ============================================
// INICIALIZAÇÃO
// ============================================

// Auto-carrega chaves ao abrir a página SSH
if (typeof refreshKeys === 'function') {
  setTimeout(() => {
    refreshKeys();
  }, 500);
}
`;