export const credmgrHandlers = `
// ====================================================================
// CREDMGR HANDLERS - Funções JavaScript para a aba CredMgr
// ====================================================================

let fileStructure = [];
let selectedFiles = new Set();
let deployHistory = [];

// ====================================================================
// SEÇÃO 1: GERENCIAMENTO DE URL
// ====================================================================

function saveCredmgrUrl() {
  const url = document.getElementById('credmgrUrl').value.trim();
  
  if (!url) {
    addLog('✗ URL do repositório vazia', 'error');
    return;
  }

  // Validar formato da URL
  if (!url.includes('github.com')) {
    addLog('✗ URL inválida - deve ser um repositório GitHub', 'error');
    return;
  }

  // Salvar no workspace
  vscode.postMessage({ type: 'saveCredmgrUrl', url });
  
  // Atualizar status visual
  const statusEl = document.getElementById('credmgr-repo-status');
  statusEl.textContent = '✓ Salvo';
  statusEl.classList.add('saved');
  
  addLog(\`✓ URL salva: \${url}\`, 'success');
  
  // Carregar estrutura de arquivos automaticamente
  setTimeout(() => {
    loadFileStructure();
  }, 500);
}

function testCredmgrConnection() {
  const url = document.getElementById('credmgrUrl').value.trim();
  
  if (!url) {
    addLog('✗ Preencha a URL do repositório primeiro', 'error');
    return;
  }

  addLog('🔍 Testando conexão com o repositório...', 'info');
  updateStatus('Testando conexão...');
  
  vscode.postMessage({ type: 'testCredmgrConnection', url });
}

// ====================================================================
// SEÇÃO 2: ESTRUTURA DE ARQUIVOS
// ====================================================================

function loadFileStructure() {
  addLog('📂 Carregando estrutura de arquivos do projeto...', 'info');
  updateStatus('Carregando arquivos...');
  
  vscode.postMessage({ type: 'loadFileStructure' });
}

function renderFileTree(structure) {
  const treeContainer = document.getElementById('credmgr-file-tree');
  treeContainer.innerHTML = '';
  
  fileStructure = structure;
  
  structure.forEach(item => {
    renderTreeItem(item, treeContainer, 0);
  });
  
  updateSelectionSummary();
  addLog(\`✓ \${structure.length} itens carregados\`, 'success');
  updateStatus('Pronto');
}

function renderTreeItem(item, container, level) {
  const div = document.createElement('div');
  div.className = \`tree-item \${item.type}\`;
  if (level > 0) div.classList.add('nested');
  div.style.paddingLeft = \`\${level * 20 + 8}px\`;
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = item.selected || false;
  checkbox.setAttribute('data-path', item.path);
  checkbox.setAttribute('data-type', item.type);
  
  // Evento de mudança do checkbox
  checkbox.onchange = (e) => {
    e.stopPropagation();
    toggleFileSelection(item.path, checkbox.checked, item.type);
  };
  
  const icon = document.createElement('span');
  icon.className = 'tree-icon';
  icon.textContent = item.type === 'folder' ? '📂' : '📄';
  
  const name = document.createElement('span');
  name.className = 'tree-name';
  name.textContent = item.name;
  
  const meta = document.createElement('span');
  meta.className = item.type === 'folder' ? 'tree-count' : 'tree-size';
  meta.textContent = item.type === 'folder' 
    ? \`[\${item.count || 0} arquivos]\`
    : formatFileSize(item.size || 0);
  
  div.appendChild(checkbox);
  div.appendChild(icon);
  div.appendChild(name);
  div.appendChild(meta);
  
  // Clique na linha (exceto no checkbox)
  div.onclick = (e) => {
    if (e.target !== checkbox) {
      checkbox.checked = !checkbox.checked;
      toggleFileSelection(item.path, checkbox.checked, item.type);
    }
  };
  
  container.appendChild(div);
  
  // Renderizar filhos (se existir)
  if (item.children && item.children.length > 0) {
    item.children.forEach(child => {
      renderTreeItem(child, container, level + 1);
    });
  }
}

function toggleFileSelection(path, isSelected, type) {
  if (type === 'folder') {
    // Se for pasta, selecionar/desselecionar todos os filhos recursivamente
    toggleFolderAndChildren(path, isSelected);
  } else {
    // Se for arquivo, apenas adicionar/remover do Set
    if (isSelected) {
      selectedFiles.add(path);
    } else {
      selectedFiles.delete(path);
    }
  }
  updateSelectionSummary();
  updateCheckboxStates();
}

function toggleFolderAndChildren(folderPath, isSelected) {
  console.log('toggleFolderAndChildren chamado:', { folderPath, isSelected });
  
  // Adicionar/remover a própria pasta
  if (isSelected) {
    selectedFiles.add(folderPath);
  } else {
    selectedFiles.delete(folderPath);
  }
  
  // Encontrar a pasta na estrutura
  const folderItem = findItemByPath(fileStructure, folderPath);
  console.log('Pasta encontrada:', folderItem);
  
  if (!folderItem) {
    console.log('ERRO: Pasta não encontrada na estrutura!');
    return;
  }
  
  // Função recursiva para processar todos os filhos
  function processChildren(item) {
    console.log('Processando filho:', item.path, item.type);
    
    // Adicionar/remover do Set
    if (isSelected) {
      selectedFiles.add(item.path);
    } else {
      selectedFiles.delete(item.path);
    }
    
    // Se tiver filhos, processar recursivamente
    if (item.children && item.children.length > 0) {
      console.log('  -> Tem', item.children.length, 'filhos');
      item.children.forEach(child => processChildren(child));
    }
  }
  
  // Processar todos os filhos da pasta
  if (folderItem.children && folderItem.children.length > 0) {
    console.log('Iniciando processamento de', folderItem.children.length, 'filhos');
    folderItem.children.forEach(child => processChildren(child));
  } else {
    console.log('AVISO: Pasta não tem filhos ou children é undefined');
  }
  
  console.log('selectedFiles após processamento:', Array.from(selectedFiles));
}

function updateCheckboxStates() {
  // Atualizar visualmente todos os checkboxes baseado no Set selectedFiles
  const checkboxes = document.querySelectorAll('#credmgr-file-tree input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    const path = checkbox.getAttribute('data-path');
    if (path) {
      checkbox.checked = selectedFiles.has(path);
    }
  });
}

function updateSelectionSummary() {
  const count = selectedFiles.size;
  const size = calculateTotalSize();
  
  document.getElementById('selected-count').textContent = \`\${count} arquivo\${count !== 1 ? 's' : ''}\`;
  document.getElementById('selected-size').textContent = formatFileSize(size);
}

function calculateTotalSize() {
  let total = 0;
  selectedFiles.forEach(path => {
    const item = findItemByPath(fileStructure, path);
    if (item && item.size) {
      total += item.size;
    }
  });
  return total;
}

function findItemByPath(structure, targetPath) {
  for (const item of structure) {
    if (item.path === targetPath) return item;
    if (item.children) {
      const found = findItemByPath(item.children, targetPath);
      if (found) return found;
    }
  }
  return null;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ====================================================================
// SEÇÃO 3: AÇÕES DE SELEÇÃO
// ====================================================================

function selectAllFiles() {
  selectedFiles.clear();
  const checkboxes = document.querySelectorAll('#credmgr-file-tree input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
    const path = checkbox.getAttribute('data-path');
    if (path) selectedFiles.add(path);
  });
  updateSelectionSummary();
  addLog('✓ Todos os arquivos selecionados', 'success');
}

function deselectAllFiles() {
  selectedFiles.clear();
  const checkboxes = document.querySelectorAll('#credmgr-file-tree input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  updateSelectionSummary();
  addLog('✓ Seleção limpa', 'success');
}

function getItemFromCheckboxIndex(index) {
  const flatList = flattenFileStructure(fileStructure);
  return flatList[index];
}

function flattenFileStructure(structure) {
  const result = [];
  structure.forEach(item => {
    result.push(item);
    if (item.children) {
      result.push(...flattenFileStructure(item.children));
    }
  });
  return result;
}

function refreshFileTree() {
  addLog('🔄 Atualizando estrutura de arquivos...', 'info');
  loadFileStructure();
}

// ====================================================================
// SEÇÃO 4: FILTRO/BUSCA
// ====================================================================

function filterFileTree() {
  const searchTerm = document.getElementById('credmgr-search').value.toLowerCase();
  const treeItems = document.querySelectorAll('#credmgr-file-tree .tree-item');
  
  let visibleCount = 0;
  
  treeItems.forEach(item => {
    const name = item.querySelector('.tree-name').textContent.toLowerCase();
    if (name.includes(searchTerm)) {
      item.style.display = 'flex';
      visibleCount++;
    } else {
      item.style.display = 'none';
    }
  });
  
  if (searchTerm) {
    addLog(\`🔍 Busca: \${visibleCount} resultado(s) para "\${searchTerm}"\`, 'info');
  }
}

// ====================================================================
// SEÇÃO 5: PRESETS
// ====================================================================

function applyPreset(presetType) {
  deselectAllFiles();
  
  switch(presetType) {
    case 'source-only':
      applySourceOnlyPreset();
      addLog('🎯 Preset aplicado: Apenas código-fonte', 'success');
      break;
    case 'full-deploy':
      selectAllFiles();
      addLog('📦 Preset aplicado: Deploy completo', 'success');
      break;
    case 'no-deps':
      applyNoDepsPreset();
      addLog('🔧 Preset aplicado: Sem dependências', 'success');
      break;
  }
}

function applySourceOnlyPreset() {
  const excludePatterns = ['node_modules', '.git', 'dist', 'build', '.vscode', '.idea'];
  const checkboxes = document.querySelectorAll('#credmgr-file-tree input[type="checkbox"]');
  
  checkboxes.forEach(checkbox => {
    const path = checkbox.getAttribute('data-path');
    if (path) {
      const shouldExclude = excludePatterns.some(pattern => path.includes(pattern));
      checkbox.checked = !shouldExclude;
      if (!shouldExclude) {
        selectedFiles.add(path);
      }
    }
  });
  
  updateSelectionSummary();
}

function applyNoDepsPreset() {
  const includePatterns = ['src/', 'public/', 'package.json', 'README', '.env.example'];
  const checkboxes = document.querySelectorAll('#credmgr-file-tree input[type="checkbox"]');
  
  checkboxes.forEach(checkbox => {
    const path = checkbox.getAttribute('data-path');
    if (path) {
      const shouldInclude = includePatterns.some(pattern => path.includes(pattern));
      checkbox.checked = shouldInclude;
      if (shouldInclude) {
        selectedFiles.add(path);
      }
    }
  });
  
  updateSelectionSummary();
}

function saveCurrentPreset() {
  if (selectedFiles.size === 0) {
    addLog('⚠️ Nenhum arquivo selecionado para salvar', 'warning');
    return;
  }
  
  const presetName = prompt('Nome do preset:', 'Meu Preset');
  if (!presetName) return;
  
  const preset = {
    name: presetName,
    files: Array.from(selectedFiles),
    createdAt: new Date().toISOString()
  };
  
  vscode.postMessage({ type: 'savePreset', preset });
  addLog(\`💾 Preset "\${presetName}" salvo com \${selectedFiles.size} arquivos\`, 'success');
}

// ====================================================================
// SEÇÃO 6: MODO DE SELEÇÃO
// ====================================================================

function handleModeChange() {
  const mode = document.querySelector('input[name="credmgr-mode"]:checked').value;
  addLog(\`📋 Modo alterado para: \${mode === 'include' ? 'Selecionar' : 'Excluir'} arquivos\`, 'info');
}

// ====================================================================
// SEÇÃO 7: DEPLOY
// ====================================================================

function deployCredmgrSelected() {
  const url = document.getElementById('credmgrUrl').value.trim();
  const commitMsg = document.getElementById('credmgr-commit-msg').value.trim();
  const branch = document.getElementById('credmgr-branch').value;
  const runBuild = document.getElementById('credmgr-build').checked;
  const validate = document.getElementById('credmgr-validate').checked;
  const generateReport = document.getElementById('credmgr-report').checked;
  
  if (!url) {
    addLog('✗ Configure a URL do repositório primeiro', 'error');
    return;
  }
  
  if (selectedFiles.size === 0) {
    addLog('✗ Nenhum arquivo selecionado para deploy', 'error');
    return;
  }
  
  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  addLog('🚀 INICIANDO DEPLOY VIA CREDMGR', 'info');
  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  addLog(\`📦 Arquivos: \${selectedFiles.size}\`, 'info');
  addLog(\`📊 Tamanho: \${formatFileSize(calculateTotalSize())}\`, 'info');
  addLog(\`🌿 Branch: \${branch}\`, 'info');
  
  updateStatus('Implantando...');
  
  vscode.postMessage({
    type: 'deployCredmgr',
    url,
    commitMsg,
    branch,
    files: Array.from(selectedFiles),
    options: { runBuild, validate, generateReport }
  });
}

function previewCredmgrDeploy() {
  if (selectedFiles.size === 0) {
    addLog('⚠️ Nenhum arquivo selecionado', 'warning');
    return;
  }
  
  const totalSize = calculateTotalSize();
  
  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  addLog('📋 PREVIEW DO DEPLOY', 'info');
  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  addLog(\`✓ Total de arquivos: \${selectedFiles.size}\`, 'success');
  addLog(\`✓ Tamanho total: \${formatFileSize(totalSize)}\`, 'success');
  addLog(\`✓ Branch: \${document.getElementById('credmgr-branch').value}\`, 'success');
  addLog(\`✓ Commit: "\${document.getElementById('credmgr-commit-msg').value}"\`, 'success');
  
  // Listar primeiros 10 arquivos
  const fileArray = Array.from(selectedFiles).slice(0, 10);
  addLog('\\n📄 Arquivos (primeiros 10):', 'info');
  fileArray.forEach(path => {
    addLog(\`  • \${path}\`, 'info');
  });
  
  if (selectedFiles.size > 10) {
    addLog(\`  ... e mais \${selectedFiles.size - 10} arquivos\`, 'info');
  }
  
  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
}

function clearCredmgrSelection() {
  deselectAllFiles();
  document.getElementById('credmgr-search').value = '';
  filterFileTree();
  addLog('🗑️ Seleção limpa', 'success');
}

// ====================================================================
// SEÇÃO 8: HISTÓRICO
// ====================================================================

function addToHistory(deployData) {
  deployHistory.unshift(deployData);
  if (deployHistory.length > 5) {
    deployHistory.pop();
  }
  renderHistory();
}

function renderHistory() {
  const historyContainer = document.getElementById('credmgr-history');
  
  if (deployHistory.length === 0) {
    historyContainer.innerHTML = '<div class="history-empty">Nenhum deploy realizado ainda</div>';
    return;
  }
  
  historyContainer.innerHTML = '';
  
  deployHistory.forEach(deploy => {
    const item = document.createElement('div');
    item.className = \`history-item \${deploy.status}\`;
    
    const statusIcon = deploy.status === 'success' ? '✓' : '✗';
    const statusText = deploy.status === 'success' ? 'Deploy bem-sucedido' : 'Erro no deploy';
    
    item.innerHTML = \`
      <div class="history-status">\${statusIcon} <strong>\${statusText}</strong></div>
      <div class="history-date">\${deploy.date}</div>
      <div class="history-details">\${deploy.details}</div>
    \`;
    
    historyContainer.appendChild(item);
  });
}

// ====================================================================
// LISTENERS DE MENSAGENS DO BACKEND
// ====================================================================

// Adicionar ao listener global de mensagens
window.addEventListener('message', event => {
  const msg = event.data;
  
  if (msg.type === 'fileStructureLoaded') {
    renderFileTree(msg.structure);
  }
  else if (msg.type === 'credmgrConnectionResult') {
    if (msg.success) {
      addLog('✓ Conexão estabelecida com sucesso', 'success');
    } else {
      addLog(\`✗ Erro de conexão: \${msg.error}\`, 'error');
    }
  }
  else if (msg.type === 'credmgrDeployComplete') {
    const deployData = {
      status: 'success',
      date: new Date().toLocaleString('pt-BR'),
      details: \`\${msg.fileCount} arquivos • \${msg.size} • branch: \${msg.branch}\`
    };
    addToHistory(deployData);
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success');
    addLog('✓ DEPLOY CONCLUÍDO COM SUCESSO ✓', 'success');
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success');
    updateStatus('Pronto');
  }
  else if (msg.type === 'credmgrDeployError') {
    const deployData = {
      status: 'error',
      date: new Date().toLocaleString('pt-BR'),
      details: \`Erro: \${msg.error}\`
    };
    addToHistory(deployData);
    addLog(\`✗ Erro no deploy: \${msg.error}\`, 'error');
    updateStatus('Erro');
  }
});
`;