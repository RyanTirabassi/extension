export const credmgrPageHTML = `
<div id="credmgr" class="tab-content">
  <!-- Section 1: Repository Info -->
  <div class="credmgr-section">
    <div class="section-title">📦 Informações do Repositório</div>
    
    <div class="info-box">
      📦 <strong>CredMgr:</strong> Usa credenciais armazenadas automaticamente.<br>
      ✓ Sem tokens necessários • Credenciais solicitadas apenas 1x
    </div>

    <div class="field-group">
      <div class="field-label">
        <span>URL do Repositório</span>
        <span class="field-status" id="credmgr-repo-status">● Não salvo</span>
      </div>
      <input type="url" id="credmgrUrl" placeholder="https://github.com/seu-usuario/seu-repo.git">
      <div class="button-group">
        <button class="btn-primary" onclick="saveCredmgrUrl()">💾 SALVAR URL</button>
        <button class="btn-secondary" onclick="testCredmgrConnection()">⚡ TESTAR CONEXÃO</button>
      </div>
    </div>
  </div>

  <!-- Section 2: File Selector -->
  <div class="credmgr-section">
    <div class="section-title">📁 Seleção de Arquivos para Deploy</div>

    <div class="file-selector">
      <div class="mode-selector">
        <label class="mode-option">
          <input type="radio" name="credmgr-mode" value="include" checked onchange="handleModeChange()">
          <span>● Selecionar arquivos</span>
        </label>
        <label class="mode-option">
          <input type="radio" name="credmgr-mode" value="exclude" onchange="handleModeChange()">
          <span>○ Excluir arquivos</span>
        </label>
      </div>

      <div class="search-box">
        <input type="text" id="credmgr-search" placeholder="🔍 Buscar arquivos..." oninput="filterFileTree()">
      </div>

      <div class="file-tree" id="credmgr-file-tree">
        <div class="tree-loading">📂 Carregando estrutura de arquivos...</div>
      </div>

      <div class="selection-summary" id="credmgr-summary">
        <span>Selecionados: <strong id="selected-count">0 arquivos</strong></span>
        <span>Total: <strong id="selected-size">0 KB</strong></span>
      </div>

      <div class="button-group">
        <button class="btn-secondary" onclick="refreshFileTree()">↻ ATUALIZAR</button>
        <button class="btn-secondary" onclick="selectAllFiles()">☑ MARCAR TUDO</button>
        <button class="btn-secondary" onclick="deselectAllFiles()">☐ DESMARCAR TUDO</button>
      </div>
    </div>
  </div>

  <!-- Section 3: Presets -->
  <div class="credmgr-section">
    <div class="section-title">⚙️ Presets de Seleção</div>
    
    <div class="preset-buttons">
      <button class="preset-btn" onclick="applyPreset('source-only')">🎯 Apenas código-fonte</button>
      <button class="preset-btn" onclick="applyPreset('full-deploy')">📦 Deploy completo</button>
      <button class="preset-btn" onclick="applyPreset('no-deps')">🔧 Sem dependências</button>
      <button class="preset-btn" onclick="saveCurrentPreset()">💾 Salvar preset atual</button>
    </div>
  </div>

  <!-- Section 4: Deploy Settings -->
  <div class="credmgr-section">
    <div class="section-title">⚙️ Configurações de Deploy</div>

    <div class="field-group">
      <div class="field-label">Mensagem de Commit</div>
      <input type="text" id="credmgr-commit-msg" value="deploy: automated commit">
    </div>

    <div class="field-group">
      <div class="field-label">
        <span>Branch de Destino</span>
        <span class="field-status saved" id="credmgr-branch-status">● Detectado</span>
      </div>
      <select id="credmgr-branch">
        <option value="main">main</option>
        <option value="develop">develop</option>
        <option value="staging">staging</option>
      </select>
    </div>

    <div class="checkbox-group">
      <label class="checkbox-option">
        <input type="checkbox" id="credmgr-build" checked>
        <span>Executar build antes do deploy</span>
      </label>
      <label class="checkbox-option">
        <input type="checkbox" id="credmgr-validate" checked>
        <span>Validar arquivos antes de enviar</span>
      </label>
      <label class="checkbox-option">
        <input type="checkbox" id="credmgr-report">
        <span>Gerar relatório de deploy</span>
      </label>
    </div>
  </div>

  <!-- Section 5: Main Actions -->
  <div class="credmgr-section">
    <div class="button-group">
      <button class="btn-primary" onclick="deployCredmgrSelected()">🚀 DEPLOY SELECIONADOS</button>
      <button class="btn-secondary" onclick="previewCredmgrDeploy()">📋 PREVIEW</button>
      <button class="btn-secondary" onclick="clearCredmgrSelection()">🗑️ LIMPAR SELEÇÃO</button>
    </div>
  </div>

  <!-- Section 6: Deploy History -->
  <div class="credmgr-section">
    <div class="section-title">📊 Últimos Deploys</div>
    
    <div class="history-list" id="credmgr-history">
      <div class="history-empty">Nenhum deploy realizado ainda</div>
    </div>
  </div>
</div>
`;

export const credmgrPageStyles = `
/* CredMgr Specific Styles */
.credmgr-section {
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 20px;
}

/* File Selector */
.file-selector {
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 6px;
  padding: 16px;
  margin-top: 12px;
}

.mode-selector {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  font-size: 12px;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #cccccc;
}

.mode-option input[type="radio"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #0066cc;
}

.search-box {
  margin-bottom: 16px;
}

.search-box input {
  width: 100%;
  padding: 10px 12px;
  background: #2d2d30;
  border: 1px solid #555555;
  border-radius: 4px;
  color: #e0e0e0;
  font-size: 12px;
  transition: all 0.2s;
}

.search-box input:focus {
  border-color: #0066cc;
  outline: none;
  box-shadow: 0 0 8px rgba(0, 102, 204, 0.3);
}

.file-tree {
  max-height: 400px;
  overflow-y: auto;
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 12px;
}

.tree-loading {
  text-align: center;
  padding: 40px;
  color: #858585;
  font-size: 12px;
}

.tree-item {
  display: flex;
  align-items: center;
  padding: 8px;
  margin: 2px 0;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 12px;
  user-select: none;
}

.tree-item:hover {
  background: #3e3e42;
}

.tree-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  cursor: pointer;
  accent-color: #0066cc;
}

.tree-item.folder {
  font-weight: 600;
  color: #dcdcaa;
}

.tree-item.file {
  color: #9cdcfe;
  padding-left: 28px;
}

.tree-item.nested {
  padding-left: 48px;
}

.tree-icon {
  margin-right: 6px;
  font-size: 14px;
}

.tree-name {
  flex: 1;
}

.tree-size {
  color: #858585;
  font-size: 10px;
  margin-left: 8px;
}

.tree-count {
  color: #858585;
  font-size: 10px;
  margin-left: 8px;
}

.selection-summary {
  background: #3e3e42;
  border: 1px solid #0066cc;
  border-radius: 4px;
  padding: 12px;
  margin-top: 12px;
  font-size: 11px;
  color: #9cdcfe;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Presets */
.preset-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 12px;
}

.preset-btn {
  padding: 10px;
  background: #3e3e42;
  border: 1px solid #555555;
  border-radius: 4px;
  color: #cccccc;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preset-btn:hover {
  background: #464646;
  border-color: #0066cc;
  transform: translateY(-1px);
}

.preset-btn:active {
  transform: translateY(0);
}

/* Deploy History */
.history-list {
  margin-top: 12px;
}

.history-empty {
  text-align: center;
  padding: 20px;
  color: #858585;
  font-size: 12px;
}

.history-item {
  background: #2d2d30;
  border-left: 3px solid #4ec9b0;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 8px;
  font-size: 11px;
  transition: all 0.2s;
}

.history-item:hover {
  background: #3e3e42;
}

.history-item.error {
  border-left-color: #f48771;
}

.history-item.success {
  border-left-color: #4ec9b0;
}

.history-date {
  color: #858585;
  font-size: 10px;
  margin-bottom: 4px;
}

.history-details {
  color: #9cdcfe;
  margin-top: 4px;
}

.history-status {
  font-weight: 600;
  margin-bottom: 4px;
}

/* Branch Selector */
select {
  width: 100%;
  padding: 10px 12px;
  background: #3e3e42;
  border: 1px solid #555555;
  border-radius: 4px;
  color: #e0e0e0;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

select:focus {
  border-color: #0066cc;
  outline: none;
  box-shadow: 0 0 8px rgba(0, 102, 204, 0.3);
}

select:hover {
  background: #464646;
}

/* Checkbox Options */
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: background 0.2s;
}

.checkbox-option:hover {
  background: #3e3e42;
}

.checkbox-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #0066cc;
}
`;